import { createStep } from "@mastra/core/workflows";
import { buildLLMWiki } from "../tools/buildLLMWiki";

// 3. Extraction Map-Reduce (Exécution directe de l'outil Wiki)
export const buildWikiStep = createStep({
  id: "build-wiki",
  execute: async ({ inputData }) => {
    // après un .parallel(), inputData regroupe les sorties des étapes par id
    const articles = inputData["fetch-literature"]?.articles;
    const cfpAnalysis = inputData["analyze-cfp"]?.cfpAnalysis;
    
    if (!articles || articles.length === 0) {
       console.warn("⚠️ Aucun article trouvé dans Zotero. Le graphe sera vide.");
       return { conceptGraph: null, cfpAnalysis, articles: [], extractedKeys: [] };
    }

    console.log("⚙️ Outil : Construction du Graphe et Map-Reduce...");
    const wikiResult = await buildLLMWiki.execute({
       data: { articles: articles }
    });

    return { 
      conceptGraph: wikiResult.conceptGraph,
      cfpAnalysis: cfpAnalysis,
      // transmis à l'export Omeka : liens pièces jointes → concepts et date d'extraction
      articles: articles.map((a: any) => ({ zoteroKey: a.zoteroKey, omekaItemId: a.omekaItemId })),
      extractedKeys: wikiResult.extractedKeys,
      // statistiques pour le rapport de traitement
      wikiMetadata: wikiResult.metadata
    }; 
  }
});
