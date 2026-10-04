// Indexation RAG de chaoticumSeminario : npm run chaoticum:index -- [diapos|bibliotheque|tout]
import "dotenv/config";
import { chaoticumConfig as c } from "../config/chaoticum";
import { indexSlides } from "../lib/chaoticum/index/slidesIndex";
import { indexZotero } from "../lib/chaoticum/index/zoteroIndex";
import { usageSummary } from "../lib/metrics/usage";
import { estimateImpact, fmtCo2, fmtEnergy, fmtMoney } from "../lib/metrics/impact";

async function main() {
  const what = process.argv[2] ?? "tout";
  if (!["diapos", "bibliotheque", "tout"].includes(what)) throw new Error(`Index inconnu : ${what} (diapos, bibliotheque ou tout)`);
  console.log(`🚀 chaoticumSeminario : indexation RAG (${what})...`);
  const started = Date.now();
  let failed = false;
  if (what !== "diapos") {
    try { await indexZotero(c); } catch (e) { failed = true; console.error("❌ Indexation de la bibliothèque impossible :", (e as Error).message); }
  }
  if (what !== "bibliotheque") {
    try { await indexSlides(c); } catch (e) { failed = true; console.error("❌ Indexation des diapos impossible :", (e as Error).message); }
  }
  const usage = usageSummary(), impact = estimateImpact(usage);
  console.log(`🔢 Tokens : ${usage.totalTokens.toLocaleString("fr-FR")} · ⚡ ${fmtEnergy(impact.energyWh)}, ${fmtCo2(impact.co2g)}, équivalent API ${fmtMoney(impact.apiCost, impact.currency)} · ${Math.round((Date.now() - started) / 1000)} s`);
  if (failed) console.error("❌ Le workflow a échoué : voir les messages ci-dessus.");
  else console.log("✅ Indexation terminée.");
}

main().catch(e => { console.error("❌ Le workflow a échoué :", e); process.exitCode = 1; });
