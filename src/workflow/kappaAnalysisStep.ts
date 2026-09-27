import { createStep } from "@mastra/core/workflows";
import { kappaAnalystAgent } from "../agents/kappaAnalystAgent";
import { fetchOmekaAnnotations, type CodedAnnotation } from "../tools/fetchOmekaAnnotations";
import { calculateFleissKappa } from "../tools/calculateFleissKappa";
import { recordUsage } from "../usage";
import { workflowConfig } from "../config";

// codes les plus souvent confondus sur une même phrase
function confusions(annotations: CodedAnnotation[]) {
  const byUnit = new Map<string, Set<string>>();
  for (const a of annotations) {
    if (!byUnit.has(a.itemId)) byUnit.set(a.itemId, new Set());
    byUnit.get(a.itemId)!.add(a.code);
  }
  const pairs = new Map<string, number>();
  for (const codes of byUnit.values()) {
    const list = [...codes].sort();
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const key = `${list[i]} / ${list[j]}`;
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
  }
  return [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([pair, count]) => ({ pair, count }));
}

// Accord inter-juges (outils exécutés directement, bilan rédigé par l'agent)
export const kappaAnalysisStep = createStep({
  id: "kappa-analysis",
  execute: async ({ inputData }) => {
    // après un .parallel(), inputData regroupe les sorties des étapes par id
    const collectionItemId = inputData["fetch-literature"]?.collectionItemId;
    const articleItemIds = (inputData["fetch-literature"]?.articles ?? []).map((a: any) => a.omekaItemId).filter(Boolean);

    console.log("⚙️ Outil : Accord inter-juges...");
    const fetched = await fetchOmekaAnnotations.execute({ data: { collectionItemId, articleItemIds } });
    if (!fetched.annotations.length) {
      console.log("⚠️ Aucune annotation codée par un juge (marqueur de la grille), accord inter-juges non calculé.");
      return { kappa: null, fetchStats: fetched.stats, confusions: [], summary: "" };
    }

    const kappa = await calculateFleissKappa.execute({ data: { annotations: fetched.annotations } });
    const topConfusions = confusions(fetched.annotations);

    let summary = "";
    if (kappa.ratedUnits > 0) {
      console.log("🧠 Agent : Bilan de l'accord inter-juges...");
      const res = await kappaAnalystAgent.generate(
        `Les outils ont déjà été exécutés, n'appelle pas d'outil. Rédige le bilan à partir de ces résultats.
        Statistiques : ${JSON.stringify(kappa)}
        Codes les plus souvent confondus sur une même phrase : ${JSON.stringify(topConfusions)}`
      );
      recordUsage("Bilan kappa (kappaAnalystAgent)", workflowConfig.models.analytics, (res as any).totalUsage ?? res.usage);
      summary = res.text;
    }

    return { kappa, fetchStats: fetched.stats, confusions: topConfusions, summary };
  }
});
