import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { aapAnalystAgent, writerAgent, epistemologistAgent } from "./agents";
import { fetchZoteroData, buildLLMWiki, exportToOpenKnowledge } from "./tools";

// 1. Analyse cognitive (Agent)
const analyzeCfpStep = createStep({
  id: "analyze-cfp",
  execute: async ({ inputData }) => {
    console.log("🧠 Agent : Analyse de l'appel à propositions...");
    const res = await aapAnalystAgent.generate(inputData.cfpText);
    return { cfpAnalysis: res.text };
  }
});

// 2. Tuyauterie pure (Exécution directe de l'outil Zotero, sans LLM)
const fetchLiteratureStep = createStep({
  id: "fetch-literature",
  execute: async ({ inputData }) => {
    console.log("⚙️ Outil : Connexion Zotero...");
    // On appelle la fonction métier de l'outil directement !
    const result = await fetchZoteroData.execute({ 
      data: { collectionId: inputData.zoteroCollection } 
    });
    
    // On propage le vrai tableau d'articles bruts, pas un résumé LLM
    return { articles: result.articles };
  }
});

// 3. Extraction Map-Reduce (Exécution directe de l'outil Wiki)
const buildWikiStep = createStep({
  id: "build-wiki",
  execute: async ({ inputData }) => {
    const articles = inputData["fetch-literature"]?.articles;
    const cfpAnalysis = inputData["analyze-cfp"]?.cfpAnalysis;
    
    if (!articles || articles.length === 0) {
       console.warn("⚠️ Aucun article trouvé dans Zotero. Le graphe sera vide.");
       return { conceptGraph: null, cfpAnalysis };
    }

    console.log("⚙️ Outil : Construction du Graphe et Map-Reduce...");
    const wikiResult = await buildLLMWiki.execute({
       data: { articles: articles }
    });

    return { 
      conceptGraph: wikiResult.conceptGraph,
      cfpAnalysis: cfpAnalysis
    }; 
  }
});

// 4. Ingestion Omeka (Exécution directe de l'outil OKF)
const normalizeOkfStep = createStep({
  id: "normalize-okf",
  execute: async ({ inputData }) => {
    const graph = inputData["build-wiki"]?.conceptGraph;
    
    if (graph && graph.nodes && graph.nodes.length > 0) {
       console.log("⚙️ Outil : Envoi vers Omeka S...");
       await exportToOpenKnowledge.execute({ data: { conceptGraph: graph } });
    } else {
       console.log("⚠️ Graphe vide, on ignore l'export Omeka S.");
    }

    return { 
      conceptGraph: graph, 
      cfpAnalysis: inputData["build-wiki"]?.cfpAnalysis 
    };
  }
});

// 5. Rédaction cognitive (Agent)
const draftPaperStep = createStep({
  id: "draft-paper",
  execute: async ({ inputData }) => {
    const cfp = inputData["normalize-okf"]?.cfpAnalysis;
    const graph = inputData["normalize-okf"]?.conceptGraph;
    
    console.log("🧠 Agent : Rédaction du brouillon...");
    // On stringify le graphe pour que le LLM rédacteur puisse le lire dans son prompt
    const contextStr = JSON.stringify(graph, null, 2);
    const res = await writerAgent.generate(`Rédige l'article. Plan attendu : ${cfp}. Graphe de connaissances pour le contexte : ${contextStr}`);
    
    return { draft: res.text, cfpAnalysis: cfp, conceptGraph: graph };
  }
});

// 6. Critique (Agent)
const reviewPaperStep = createStep({
  id: "review-paper",
  execute: async ({ inputData }) => {
    console.log("🧠 Agent : Relecture épistémologique...");
    const res = await epistemologistAgent.generate(`Critique ce brouillon : ${inputData.draft} par rapport à cet AAP : ${inputData.cfpAnalysis}`);
    
    return { 
      finalReview: res.text, 
      conceptGraph: inputData.conceptGraph // On sort le graphe final pour Mermaid !
    };
  }
});

// Assemblage
export const paperProductionWorkflow = createWorkflow({
  id: "academic-paper-factory",
  inputSchema: z.object({ cfpText: z.string(), zoteroCollection: z.string() })
})
  .parallel([analyzeCfpStep, fetchLiteratureStep])
  .then(buildWikiStep)
  .then(normalizeOkfStep)
  .then(draftPaperStep)
  .then(reviewPaperStep)
  .commit();