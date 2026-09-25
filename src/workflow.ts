import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { 
  aapAnalystAgent, 
  librarianAgent, 
  wikiArchitectAgent, 
  ontologistAgent,
  writerAgent, 
  epistemologistAgent 
} from "./agents";

const analyzeCfpStep = createStep({
  id: "analyze-cfp",
  execute: async ({ inputData }) => {
    const res = await aapAnalystAgent.generate(inputData.cfpText);
    return { cfpAnalysis: res.text };
  }
});

const fetchLiteratureStep = createStep({
  id: "fetch-literature",
  execute: async ({ inputData }) => {
    const res = await librarianAgent.generate(`Récupère la collection Zotero: ${inputData.zoteroCollection}`);
    return { literature: res.text };
  }
});

const buildWikiStep = createStep({
  id: "build-wiki",
  execute: async ({ inputData }) => {
    const cfp = inputData["analyze-cfp"]?.cfpAnalysis;
    const lit = inputData["fetch-literature"]?.literature;
    
    // Appel de l'agent qui déclenche l'outil buildLLMWiki
    const res = await wikiArchitectAgent.generate(`Construis le wiki basé sur les thèmes: ${cfp} et les articles: ${lit}`);
    
    // 💡 CORRECTION 1 : Extraction du graphe depuis les résultats de l'outil
    let extractedGraph = null;
    if (res.toolResults && res.toolResults.length > 0) {
      const wikiToolOutput = res.toolResults.find(t => t.toolName === 'build-llm-wiki');
      if (wikiToolOutput && wikiToolOutput.result) {
        extractedGraph = wikiToolOutput.result.conceptGraph;
      }
    }

    return { 
      wiki: res.text, 
      cfpAnalysis: cfp,
      conceptGraph: extractedGraph // On propage la donnée brute
    }; 
  }
});

const normalizeOkfStep = createStep({
  id: "normalize-okf",
  execute: async ({ inputData }) => {
    // 💡 CORRECTION 2 : On passe le JSON au LLM et on le force à utiliser l'outil
    const prompt = `Voici le graphe conceptuel extrait : ${JSON.stringify(inputData.conceptGraph)}.
    Appelle IMPÉRATIVEMENT ton outil 'export-okf' avec ce 'conceptGraph' exact pour l'envoyer à Omeka S.`;
    
    const res = await ontologistAgent.generate(prompt);
    
    return { 
      okf: res.text, 
      wiki: inputData.wiki, 
      cfpAnalysis: inputData.cfpAnalysis,
      conceptGraph: inputData.conceptGraph // On continue de propager
    };
  }
});

const draftPaperStep = createStep({
  id: "draft-paper",
  execute: async ({ inputData }) => {
    const res = await writerAgent.generate(`Rédige l'article. Plan : ${inputData.cfpAnalysis}. Contexte : ${inputData.wiki}`);
    return { 
      draft: res.text, 
      cfpAnalysis: inputData.cfpAnalysis, 
      okf: inputData.okf,
      conceptGraph: inputData.conceptGraph // On continue de propager
    };
  }
});

const reviewPaperStep = createStep({
  id: "review-paper",
  execute: async ({ inputData }) => {
    const res = await epistemologistAgent.generate(`Critique ce brouillon : ${inputData.draft} par rapport à cet AAP : ${inputData.cfpAnalysis}`);
    return { 
      finalReview: res.text, 
      draft: inputData.draft,
      okf: inputData.okf,
      conceptGraph: inputData.conceptGraph // 💡 CORRECTION 3 : Le graphe arrive enfin au bout du workflow
    };
  }
});

// Création et assemblage du workflow
export const paperProductionWorkflow = createWorkflow({
  id: "academic-paper-factory",
  inputSchema: z.object({
    cfpText: z.string(),
    zoteroCollection: z.string()
  })
})
  .parallel([analyzeCfpStep, fetchLiteratureStep])
  .then(buildWikiStep)
  .then(normalizeOkfStep)
  .then(draftPaperStep)
  .then(reviewPaperStep)
  .commit();