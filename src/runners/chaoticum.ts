// Génération d'une partition chaoticumSeminario (npm run chaoticum, ou depuis l'application cliente)
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { chaoticumWorkflow } from "../workflow/chaoticumWorkflow";
import { chaoticumConfig as c, PARTITIONS_DIR } from "../config/chaoticum";
import { buildChaoticumReport } from "../workflow/reports/chaoticumReport";
import { saveWorkflowConfig, updateWorkflowStatus } from "../workflow/runs/saveWorkflowConfig";
import { attachDocuments, type SynthesisDocument } from "../workflow/runs/importSynthesis";
import { usageSummary } from "../lib/metrics/usage";
import { estimateImpact, fmtCo2, fmtEnergy, fmtMoney } from "../lib/metrics/impact";
import { newSeed } from "../lib/chaoticum/random";
import type { Partition } from "../lib/chaoticum/partition";

async function main() {
  console.log(`🚀 chaoticumSeminario : partition « ${c.title} »...`);
  const seed = c.seed || newSeed();
  const input = { zoteroCollection: c.citations.scope === "collection" ? c.citations.collection : "", seed };

  const run = await chaoticumWorkflow.createRun();
  let configItemId: number | null = null;
  try {
    configItemId = await saveWorkflowConfig(run.runId, input, { workflowId: c.workflowId, config: { ...c, seed } });
  } catch (e) {
    console.warn("⚠️ Configuration non enregistrée dans Omeka S :", (e as Error).message);
  }

  const startedAt = new Date();
  const runResult: any = await run.start({ inputData: { seed } });
  const endedAt = new Date();
  if (runResult.status === "failed") console.error("❌ Le workflow a échoué :", runResult.error);

  const steps = runResult.steps ?? {};
  const screens = steps["compose"]?.output?.screens ?? steps["material"]?.output?.screens ?? [];
  const theme = steps["material"]?.output?.theme;
  const dir = path.resolve(process.cwd(), c.outputDir, PARTITIONS_DIR, run.runId);
  await fs.mkdir(dir, { recursive: true });

  const usage = usageSummary();
  const impact = estimateImpact(usage);
  console.log(`🔢 Tokens : ${usage.totalTokens.toLocaleString("fr-FR")} · ⚡ ${fmtEnergy(impact.energyWh)}, ${fmtCo2(impact.co2g)}, équivalent API ${fmtMoney(impact.apiCost, impact.currency)}`);

  const partition: Partition & Record<string, any> = {
    runId: run.runId, workflowId: c.workflowId, title: c.title, description: c.description, programUrl: c.programUrl,
    selection: c.selection.byTheme && theme && (theme.description || theme.program || theme.title !== "Chaoticum Seminario") ? "theme" : "hasard",
    createdAt: startedAt.toISOString(), seed,
    durationSeconds: screens.reduce((s: number, x: any) => s + x.duration, 0) || c.durationMinutes * 60,
    timer: c.timer, grist: c.grist, siteUrl: c.slides.siteUrl,
    citationsScope: { scope: c.citations.scope, collection: c.citations.collection },
    screens,
    status: runResult.status, configItemId,
    tokens: { calls: usage.calls, input: usage.inputTokens, output: usage.outputTokens, total: usage.totalTokens },
    impact: { energyWh: impact.energyWh, co2g: impact.co2g, electricityCost: impact.electricityCost, apiCost: impact.apiCost, currency: impact.currency },
  };
  await fs.writeFile(path.join(dir, "partition.json"), JSON.stringify(partition, null, 2));
  await fs.writeFile(path.join(dir, "rapport_chaoticum.md"), buildChaoticumReport({
    partition, status: runResult.status, startedAt, endedAt, usage, impact,
    ...(runResult.status === "failed" ? { error: String(runResult.error?.message ?? runResult.error) } : {}),
  }));
  console.log(`📋 Partition écrite dans './${path.relative(process.cwd(), dir)}/'`);

  // Omeka S : statut, consommation, partition, rapport et copies d'écran dans l'item de configuration
  if (configItemId) {
    await updateWorkflowStatus(configItemId, runResult.status, usage, partition.impact)
      .catch(e => console.warn("⚠️ Statut non enregistré dans Omeka S :", (e as Error).message));
    const documents: SynthesisDocument[] = [
      { filePath: path.join(dir, "partition.json"), title: "Partition chaoticumSeminario (données)", type: "application/json" },
      { filePath: path.join(dir, "rapport_chaoticum.md"), title: "Rapport de la partition" },
      ...screens.filter((s: any) => s.diapo?.screenshot).map((s: any) => ({ filePath: path.join(dir, s.diapo.screenshot), title: `Diapo ${s.diapo.name} ${s.diapo.diapo} (écran ${s.index + 1})`, type: "image/png" })),
    ];
    console.log(`\n📤 [OMEKA] Import de la partition dans la configuration de l'exécution (Item ID ${configItemId})...`);
    await attachDocuments(configItemId, documents, run.runId, null).catch(e => console.warn("⚠️ Documents non importés :", (e as Error).message));
  }
  console.log(runResult.status === "success" ? "✅ Partition prête : à jouer depuis l'onglet Partitions." : `Partition terminée avec le statut ${runResult.status}.`);
}

main().catch(console.error);
