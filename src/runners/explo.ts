// Lancement du workflow exploZoteroAnno (npm run explo, ou depuis l'application cliente /explo)
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { exploWorkflow } from "../workflow/exploWorkflow";
import { exploConfig } from "../config/explo";
import { buildGuide } from "../workflow/reports/annotationGuide";
import { buildExploReport } from "../workflow/reports/exploReport";
import { saveWorkflowConfig, updateWorkflowStatus } from "../workflow/runs/saveWorkflowConfig";
import { attachDocuments, type SynthesisDocument } from "../workflow/runs/importSynthesis";
import { generateGraphHtml } from "../lib/visualization/graphViz";
import { usageSummary } from "../lib/metrics/usage";
import { estimateImpact, fmtCo2, fmtEnergy, fmtMoney } from "../lib/metrics/impact";
import { getOmk } from "../lib/omeka/omk";
import { Zotero } from "../lib/zotero/zotero";

async function main() {
  console.log("🚀 exploZoteroAnno : exploration de l'annotation collective...");
  const input = { zoteroCollection: exploConfig.input.zoteroCollection };
  const outDir = path.resolve(process.cwd(), exploConfig.outputDir);
  await fs.mkdir(outDir, { recursive: true });
  const out = (name: string) => path.join(outDir, name);

  // nom de la collection (rapport, guide)
  const collectionName = await new Zotero(process.env.ZOTERO_USER_ID ?? "", process.env.ZOTERO_API_KEY ?? "")
    .collection(input.zoteroCollection).then((c: any) => c.data?.name ?? input.zoteroCollection).catch(() => input.zoteroCollection);

  // guide d'annotation à partager avec les collaborateurs
  await fs.writeFile(out("guide_annotation.md"), buildGuide(exploConfig, collectionName));

  const run = await exploWorkflow.createRun();
  let configItemId: number | null = null;
  try {
    configItemId = await saveWorkflowConfig(run.runId, input, { workflowId: exploConfig.workflowId, config: exploConfig });
  } catch (e) {
    console.warn("⚠️ Configuration non enregistrée dans Omeka S :", (e as Error).message);
  }

  const startedAt = new Date();
  const runResult: any = await run.start({ inputData: input });
  const endedAt = new Date();
  if (runResult.status === "failed") console.error("❌ Le workflow a échoué :", runResult.error);

  const steps = runResult.steps ?? {};
  const participation = steps["participation"]?.output ?? null;
  const collaboration = steps["collaboration"]?.output ?? null;
  const themes: string = steps["themes"]?.output?.themes ?? "";

  const usage = usageSummary();
  const impact = estimateImpact(usage);
  console.log(`🔢 Tokens : ${usage.totalTokens.toLocaleString("fr-FR")} · ⚡ ${fmtEnergy(impact.energyWh)}, ${fmtCo2(impact.co2g)}, équivalent API ${fmtMoney(impact.apiCost, impact.currency)}`);

  // fichiers produits (lus par l'application cliente et déposés dans Omeka S)
  const documents: SynthesisDocument[] = [{ filePath: out("guide_annotation.md"), title: "Guide d'annotation collective" }];
  if (participation) {
    await fs.writeFile(out("participation.json"), JSON.stringify(participation, null, 2));
    documents.push({ filePath: out("participation.json"), title: "Participation des collaborateurs (données)", type: "application/json" });
  }
  if (collaboration) {
    const { graph, ...rest } = collaboration;
    await fs.writeFile(out("collaborations.json"), JSON.stringify(rest, null, 2));
    documents.push({ filePath: out("collaborations.json"), title: "Collaborations (données)", type: "application/json" });
    if (graph?.nodes?.length) {
      const omk = await getOmk().catch(() => null);
      await fs.writeFile(out("reseau_collaborations.html"), generateGraphHtml(graph, {
        title: `Collaborations – ${collectionName}`,
        ...(omk ? { omekaAdminUrl: omk.publicApi.replace("/api/", "/admin/item/") } : {}),
      }));
      documents.push({ filePath: out("reseau_collaborations.html"), title: "Réseau des collaborations (sigma.js)", type: "text/html" });
    }
  }
  if (themes) {
    await fs.writeFile(out("themes_discussion.md"), `# Thèmes de discussion – ${collectionName}\n\n${themes.replace(/^#\s.*\n+/, "")}\n`);
    documents.push({ filePath: out("themes_discussion.md"), title: "Thèmes de discussion" });
  }
  await fs.writeFile(out("rapport_explo.md"), buildExploReport({
    runId: run.runId, status: runResult.status, startedAt, endedAt, collectionName,
    participation, collaboration, themes, usage, impact,
    ...(runResult.status === "failed" ? { error: String(runResult.error?.message ?? runResult.error) } : {}),
  }));
  documents.push({ filePath: out("rapport_explo.md"), title: "Rapport de l'annotation collective" });
  console.log(`📋 Résultats écrits dans './${exploConfig.outputDir}/'`);

  // enregistrement dans Omeka S : statut, consommation et documents dans l'item de configuration
  if (configItemId) {
    await updateWorkflowStatus(configItemId, runResult.status, usage, { energyWh: impact.energyWh, co2g: impact.co2g, electricityCost: impact.electricityCost, apiCost: impact.apiCost, currency: impact.currency })
      .catch(e => console.warn("⚠️ Statut non enregistré dans Omeka S :", (e as Error).message));
    console.log(`\n📤 [OMEKA] Import des résultats dans la configuration de l'exécution (Item ID ${configItemId})...`);
    await attachDocuments(configItemId, documents, run.runId, null).catch(e => console.warn("⚠️ Documents non importés :", (e as Error).message));
  }
  console.log(runResult.status === "success" ? "✅ Exploration terminée." : `Exploration terminée avec le statut ${runResult.status}.`);
}

main().catch(console.error);
