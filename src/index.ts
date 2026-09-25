// src/index.ts
import "dotenv/config";
import fs from "fs/promises";
import { paperProductionWorkflow } from "./workflow";
import { generateMermaid } from "./mermaidUtils";
import { verifyRecentOmekaItems } from "./omekaVerify";

async function main() {
  console.log("🚀 Lancement de l'écosystème de production scientifique...");

  const run = await paperProductionWorkflow.createRun();

  const runResult = await run.start({
    inputData: {
      cfpText: "Appel à propositions sur l'éthique des écosystèmes d'information numérique...",
      zoteroCollection: "KPWPDCJ3"
    }
  });
  
  if (runResult.status === "success" && runResult.results) {
    console.log("✅ Processus terminé.");
    
    // 1. Sauvegarde du brouillon
    await fs.writeFile('./brouillon_article.md', runResult.results.finalReview);
    
    // 2. Récupération du graphe (suppose que l'étape 'normalize-okf' le renvoie dans ses outputs)
    const conceptGraph = runResult.results.conceptGraph; 
    
    if (conceptGraph) {
      // Génération du code Mermaid
      const mermaidCode = generateMermaid(conceptGraph);
      await fs.writeFile('./visualisation_graphe.md', mermaidCode);
      console.log("📈 Diagramme Mermaid généré dans './visualisation_graphe.md'");
    }

    // 3. Audit optionnel d'Omeka S
    await verifyRecentOmekaItems(5);
    
  } else if (runResult.status === "failed") {
    console.error("❌ Le workflow a échoué :", runResult.error);
  }
}

main().catch(console.error);