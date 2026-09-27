// src/index.ts
import "dotenv/config";
import fs from "fs/promises";
import { existsSync } from "fs";
import { paperProductionWorkflow } from "./workflow";
import { generateGraphHtml, toGraphologyJSON } from "./graphViz";
import { verifyRecentOmekaItems } from "./omekaVerify";
import { workflowConfig } from "./config";
import { saveWorkflowConfig, updateWorkflowStatus } from "./workflow/saveWorkflowConfig";
import { importSynthesis, type SynthesisDocument } from "./workflow/importSynthesis";
import { buildProcessingReport } from "./workflow/processingReport";
import { getOmk } from "./tools/omk";

async function main() {
  console.log("🚀 Lancement de l'écosystème de production scientifique...");

  const run = await paperProductionWorkflow.createRun();
  const inputData = workflowConfig.input;

  // Enregistrement de la configuration de cette exécution dans Omeka S
  let configItemId: number | null = null;
  try {
    configItemId = await saveWorkflowConfig(run.runId, inputData);
  } catch (e) {
    console.warn("⚠️ Configuration du workflow non enregistrée dans Omeka S :", (e as Error).message);
  }

  const startedAt = new Date();
  const runResult = await run.start({ inputData });
  const endedAt = new Date();

  if (configItemId) {
    await updateWorkflowStatus(configItemId, runResult.status).catch(e =>
      console.warn("⚠️ Statut du workflow non enregistré dans Omeka S :", (e as Error).message)
    );
  }
  
  const synthesis: SynthesisDocument[] = [];

  if (runResult.status === "success" && runResult.result) {
    console.log("✅ Processus terminé.");

    // 1. Sauvegarde de la relecture (AttenduAPP et PropAPP sont enregistrés par leurs étapes, dans l'item de l'appel)
    await fs.writeFile('./relecture_article.md', runResult.result.finalReview);
    synthesis.push({ filePath: './relecture_article.md', title: "Relecture épistémologique" });

    // 2. Audit optionnel d'Omeka S
    await verifyRecentOmekaItems(5);

  } else if (runResult.status === "failed") {
    console.error("❌ Le workflow a échoué :", runResult.error);
  }

  // Visualisation du graphe de concepts avec sigma.js (produite dès que le graphe existe, même si la rédaction a échoué)
  const steps: any = (runResult as any).steps ?? {};
  const conceptGraph = (runResult as any).result?.conceptGraph ?? steps["normalize-okf"]?.output?.conceptGraph ?? steps["build-wiki"]?.output?.conceptGraph;
  if (conceptGraph?.nodes?.length) {
    const omk = await getOmk().catch(() => null);
    const omekaIds = steps["normalize-okf"]?.output?.exportResult?.omekaIds ?? {};
    await fs.writeFile('./visualisation_graphe.html', generateGraphHtml(conceptGraph, {
      title: `Graphe de concepts – collection ${inputData.zoteroCollection}`,
      omekaIds,
      ...(omk ? { omekaAdminUrl: omk.api.replace("/api/", "/admin/item/") } : {}),
    }));
    await fs.writeFile('./visualisation_graphe.json', JSON.stringify(toGraphologyJSON(conceptGraph, omekaIds), null, 2));
    console.log("📈 Graphe de concepts (sigma.js) généré dans './visualisation_graphe.html'");
    synthesis.push(
      { filePath: './visualisation_graphe.html', title: "Graphe de concepts (sigma.js)", type: "text/html" },
      { filePath: './visualisation_graphe.json', title: "Graphe de concepts (graphology JSON)", type: "application/json" },
    );
  }

  // CSV des désaccords entre juges (produit même si la suite du workflow a échoué)
  const kappaCsv = (runResult as any).steps?.["kappa-analysis"]?.output?.kappa?.csvPath;
  if (kappaCsv) synthesis.push({ filePath: kappaCsv, title: "Désaccords d'annotation entre juges", type: "text/csv" });

  // 4. Rapport de traitement (produit aussi en cas d'échec)
  const report = buildProcessingReport({
    runId: run.runId,
    runResult,
    startedAt,
    endedAt,
    configItemId,
    documents: [
      ...[workflowConfig.proposal.expectationsFile, workflowConfig.proposal.proposalFile, workflowConfig.proposal.bibtexFile]
        .filter(f => existsSync(f)).map(f => ({ filePath: `./${f}`, title: `${f} (item de l'appel à propositions)` })),
      ...synthesis,
    ],
    omk: await getOmk().catch(() => null),
  });
  await fs.writeFile('./rapport_traitement.md', report);
  console.log("📋 Rapport de traitement généré dans './rapport_traitement.md'");
  synthesis.push({ filePath: './rapport_traitement.md', title: "Rapport de traitement" });

  // 5. Import des documents de synthèse et du rapport dans l'item de la collection Zotero
  await importSynthesis(inputData.zoteroCollection, synthesis, run.runId, configItemId).catch(e =>
    console.warn("⚠️ Documents de synthèse non importés dans Omeka S :", (e as Error).message)
  );
}

main().catch(console.error);