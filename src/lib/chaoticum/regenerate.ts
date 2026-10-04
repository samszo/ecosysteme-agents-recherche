// Nouvelle proposition de question ou de diagramme pour un écran d'une partition (éditeur d'écran), à partir de la
// matière de son cycle (citations, descriptions des diapos) et du thème de la conférence
import { z } from "zod";
import { seminarioAgent } from "../../agents/seminarioAgent";
import { askAgent } from "../../agents/ask";
import { workflowConfig } from "../../config";
import { estimateImpact } from "../metrics/impact";
import type { UsageEntry, UsageSummary } from "../metrics/usage";
import { cycleMaterial, type Partition } from "./partition";
import { buildMermaid } from "./mermaid";
import { diagramFields, shortenQuestion } from "./generation";
import type { ChaoticumConfig } from "../../config/chaoticum";

export async function regenerate(p: Partition, index: number, what: "question" | "diagramme", c: ChaoticumConfig, hint = "") {
  const s = p.screens[index];
  if (!s) throw new Error(`Écran ${index + 1} introuvable`);
  const { citations, diapos } = cycleMaterial(p.screens, s.cycle);
  if (!citations.length && !diapos.length) throw new Error("Pas de citation ni de diapo dans ce cycle ou les précédents");
  const schema = what === "question"
    ? z.object({ question: z.string().describe("question ouverte posée au public : une seule phrase courte, 15 mots au plus"), intention: z.string().describe("en une phrase : ce que la question met en tension") })
    : z.object(diagramFields);
  const current = what === "question" ? s.question?.text : s.diagramme?.title;
  const { object, usage } = await askAgent(seminarioAgent, {
    model: c.models.analytics, source: `Éditeur : ${what} (seminarioAgent)`, schema: schema as z.ZodTypeAny,
    prompt: `Séquence de la conférence « ${p.title} ».${p.description ? `\nDescription : ${p.description}` : ""}
${what === "question" ? "Propose une autre question et son intention, à partir des éléments ci-dessous et du thème." : "Décris un autre diagramme (nœuds et liens) qui relie les idées des éléments ci-dessous au thème."}
${current ? `Proposition actuelle, à renouveler : ${current}\n` : ""}${hint ? `Consigne de l'animateur : ${hint}\n` : ""}
<citations>
${citations.map((ci, i) => `[C${i + 1}] « ${ci.text} » — ${[ci.source.creators, ci.source.year, ci.source.title].filter(Boolean).join(", ")}`).join("\n") || "(aucune)"}
</citations>

<diapos>
${diapos.map((d, i) => `[D${i + 1}] ${d.name}, diapo ${d.diapo} : ${d.description || "(description indisponible)"}`).join("\n") || "(aucune)"}
</diapos>`,
  });
  // coût de la proposition (estimé avec les hypothèses de la configuration)
  const entry: UsageEntry = { source: `Éditeur : ${what}`, model: c.models.analytics, calls: 1, inputTokens: Number(usage?.inputTokens) || 0, outputTokens: Number(usage?.outputTokens) || 0, reasoningTokens: 0, totalTokens: Number(usage?.totalTokens) || 0, unknown: usage ? 0 : 1 };
  const summary: UsageSummary = { entries: [entry], calls: 1, inputTokens: entry.inputTokens, outputTokens: entry.outputTokens, reasoningTokens: 0, totalTokens: entry.totalTokens, unknown: entry.unknown };
  const impact = estimateImpact(summary, workflowConfig.costs);
  const o = object as any;
  return what === "question"
    ? { question: { text: await shortenQuestion(String(o.question).trim(), c.models.vision), intention: String(o.intention ?? "").trim() }, tokens: summary.totalTokens, impact }
    : { diagramme: { title: String(o.diagramTitle ?? "").trim(), mermaid: buildMermaid(o.nodes ?? [], o.edges ?? []) }, tokens: summary.totalTokens, impact };
}
