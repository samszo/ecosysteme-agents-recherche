// Lancement du workflow mailbot (npm run mailbot [-- envoi], ou depuis l'application cliente et sa planification)
//   sans argument : synchronisation (archivage Omeka S, Zotero, RAG, brouillons de réponse)
//   envoi : synchronisation puis mail rédigé à l'initiative de mailbot
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { mailbotWorkflow } from "../workflow/mailbotWorkflow";
import { mailbotConfig, RUNS_DIR } from "../config/mailbot";
import { buildMailbotReport } from "../workflow/reports/mailbotReport";
import { saveWorkflowConfig, updateWorkflowStatus } from "../workflow/runs/saveWorkflowConfig";
import { attachDocuments, type SynthesisDocument } from "../workflow/runs/importSynthesis";
import { appendUsageHistory } from "../lib/metrics/usageHistory";
import { usageSummary } from "../lib/metrics/usage";
import { estimateImpact, fmtCo2, fmtEnergy, fmtMoney } from "../lib/metrics/impact";
import { readDraft } from "../lib/mail/store";

async function main() {
  const compose = process.argv.slice(2).includes("envoi");
  // chercheurs des profils (rapport, journal)
  const correspondent = mailbotConfig.profiles.map(p => p.researcher.name || p.researcher.email || p.id).join(", ");
  console.log(`🚀 mailbot : ${compose ? "synchronisation et mail au groupe" : "synchronisation"} (historique de ${correspondent}, boîte du mailbot)...`);
  // pas de collection Zotero en entrée : la configuration n'est pas rattachée à un item de collection
  const input = { zoteroCollection: "", compose };
  const outDir = path.resolve(process.cwd(), mailbotConfig.outputDir);
  await fs.mkdir(outDir, { recursive: true });
  const out = (name: string) => path.join(outDir, name);

  const run = await mailbotWorkflow.createRun();
  let configItemId: number | null = null;
  try {
    configItemId = await saveWorkflowConfig(run.runId, input, { workflowId: mailbotConfig.workflowId, config: mailbotConfig });
  } catch (e) {
    console.warn("⚠️ Configuration non enregistrée dans Omeka S :", (e as Error).message);
  }

  const startedAt = new Date();
  const runResult: any = await run.start({ inputData: { compose } });
  const endedAt = new Date();
  // chaîne exacte lue par src/ui/server.ts pour marquer l'exécution en échec
  if (runResult.status === "failed") console.error("❌ Le workflow a échoué :", runResult.error?.message ?? runResult.error);
  const steps = runResult.steps ?? {};

  const usage = usageSummary();
  appendUsageHistory("mailbot", usage, compose ? "envoi" : null);
  const impact = estimateImpact(usage);
  console.log(`🔢 Tokens : ${usage.totalTokens.toLocaleString("fr-FR")} · ⚡ ${fmtEnergy(impact.energyWh)}, ${fmtCo2(impact.co2g)}, équivalent API ${fmtMoney(impact.apiCost, impact.currency)}`);

  // brouillons et mail de cette exécution (archivés avec le rapport)
  const ids = [...(steps["draft-replies"]?.output?.drafts ?? []).map((d: any) => d.id), steps["compose-mail"]?.output?.draft?.id].filter(Boolean);
  const drafts = ids.map((id: string) => readDraft(mailbotConfig, id)).filter(Boolean);
  const documents: SynthesisDocument[] = [];
  if (drafts.length) {
    await fs.writeFile(out("brouillons.json"), JSON.stringify(drafts, null, 2));
    documents.push({ filePath: out("brouillons.json"), title: "Brouillons et mails rédigés (données)", type: "application/json" });
  }
  await fs.writeFile(out("rapport_mailbot.md"), buildMailbotReport({
    runId: run.runId, status: runResult.status, startedAt, endedAt, correspondent, compose, steps, usage, impact,
    ...(runResult.status === "failed" ? { error: String(runResult.error?.message ?? runResult.error) } : {}),
  }));
  documents.push({ filePath: out("rapport_mailbot.md"), title: "Rapport mailbot" });

  // archive locale de l'exécution (onglet Exécutions)
  try {
    const archive = path.join(outDir, RUNS_DIR, run.runId);
    await fs.mkdir(archive, { recursive: true });
    for (const d of documents) await fs.copyFile(d.filePath, path.join(archive, path.basename(d.filePath)));
    if (!drafts.length) await fs.rm(out("brouillons.json"), { force: true });
    await fs.writeFile(path.join(archive, "execution.json"), JSON.stringify({
      runId: run.runId, workflowId: mailbotConfig.workflowId, status: runResult.status, task: compose ? "envoi" : null,
      startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(), configItemId,
      profiles: mailbotConfig.profiles.map(p => ({ id: p.id, email: p.researcher.email })),
      totals: {
        newMessages: steps["fetch-mails"]?.output?.newIds?.length ?? 0,
        history: steps["fetch-mails"]?.output?.history ?? 0,
        bot: steps["fetch-mails"]?.output?.bot ?? 0,
        messages: steps["fetch-mails"]?.output?.total ?? 0,
        drafts: drafts.length,
        sent: drafts.filter((d: any) => d.status === "envoyé").length,
      },
      tokens: { calls: usage.calls, input: usage.inputTokens, output: usage.outputTokens, total: usage.totalTokens },
      impact: { energyWh: impact.energyWh, co2g: impact.co2g, electricityCost: impact.electricityCost, apiCost: impact.apiCost, currency: impact.currency },
    }, null, 2));
  } catch (e) {
    console.warn("⚠️ Archive locale non écrite :", (e as Error).message);
  }

  if (configItemId) {
    const imp = { energyWh: impact.energyWh, co2g: impact.co2g, electricityCost: impact.electricityCost, apiCost: impact.apiCost, currency: impact.currency };
    await updateWorkflowStatus(configItemId, runResult.status, usage, imp).catch(e => console.warn("⚠️ Statut non enregistré dans Omeka S :", (e as Error).message));
    console.log(`\n📤 [OMEKA] Import des résultats dans la configuration de l'exécution (Item ID ${configItemId})...`);
    await attachDocuments(configItemId, documents, run.runId, null).catch(e => console.warn("⚠️ Documents non importés :", (e as Error).message));
  }
  console.log(runResult.status === "success" ? "✅ mailbot terminé." : `mailbot terminé avec le statut ${runResult.status}.`);
}

main().catch(e => {
  console.error("❌ Le workflow a échoué :", (e as Error).message);
  process.exitCode = 1;
});
