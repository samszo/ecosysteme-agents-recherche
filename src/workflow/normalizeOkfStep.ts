import { createStep } from "@mastra/core/workflows";
import { exportToOpenKnowledge } from "../tools/exportToOpenKnowledge";

// 4. Ingestion Omeka (Exécution directe de l'outil OKF)
export const normalizeOkfStep = createStep({
  id: "normalize-okf",
  execute: async ({ inputData }) => {
    // après un .parallel(), inputData regroupe les sorties par id : on reprend celle de build-wiki
    // (le résultat de kappa-analysis est lu dans le rapport de traitement)
    const wiki = inputData["build-wiki"] ?? {};
    const graph = wiki.conceptGraph;
    // résultat de l'export, repris dans le rapport de traitement
    let exportResult: any = null;
    
    if (graph && graph.nodes && graph.nodes.length > 0) {
       console.log("⚙️ Outil : Envoi vers Omeka S...");
       exportResult = await exportToOpenKnowledge.execute({ data: { conceptGraph: graph, articles: wiki.articles, extractedKeys: wiki.extractedKeys } });
    } else {
       console.log("⚠️ Graphe vide, on ignore l'export Omeka S.");
    }

    return { 
      conceptGraph: graph, 
      cfpAnalysis: wiki.cfpAnalysis,
      exportResult
    };
  }
});
