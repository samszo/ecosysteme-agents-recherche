// Rapport de génération d'une partition chaoticumSeminario (markdown)
import type { UsageSummary } from "../../lib/metrics/usage";
import type { ImpactSummary } from "../../lib/metrics/impact";
import type { Partition } from "../../lib/chaoticum/partition";
import { usageReport } from "./paperReport";

const cell = (s: unknown) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const TYPE_LABELS: Record<string, string> = { citation: "Citation", diapo: "Diapo", question: "Question", contribution: "Contributions", diagramme: "Diagramme" };

export function buildChaoticumReport(ctx: { partition: Partition; status: string; startedAt: Date; endedAt: Date; usage?: UsageSummary; impact?: ImpactSummary; error?: string }) {
  const p = ctx.partition;
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);
  push(
    `# Partition – ${cell(p.title)}`,
    "",
    `Exécution \`${p.runId}\` · ${ctx.startedAt.toLocaleString("fr-FR")} · statut **${ctx.status}** · génération en ${Math.round((ctx.endedAt.getTime() - ctx.startedAt.getTime()) / 1000)} s · graine \`${p.seed}\``,
    "",
    ...(p.description ? [p.description, ""] : []),
    ...(p.programUrl ? [`Programme des conférences : ${p.programUrl}`, ""] : []),
    `Choix des citations et des diapos : ${p.selection === "theme" ? "orienté par le thème de la conférence" : "au hasard"}`,
    "",
    `**${p.screens.length}** écrans pour **${mmss(p.durationSeconds)}** min · citations : ${p.citationsScope.scope === "collection" ? `collection \`${p.citationsScope.collection}\`` : "bibliothèque Zotero"} · contributions : [formulaire Grist](${p.grist.formUrl})`,
    ""
  );
  if (ctx.error) push(`> ❌ ${cell(ctx.error)}`, "");
  push("## Déroulé", "", "| # | Début | Durée | Type | Contenu |", "|---|---|---|---|---|");
  for (const s of p.screens) {
    const content =
      s.citation ? `« ${s.citation.text.slice(0, 160)}${s.citation.text.length > 160 ? "…" : ""} » — ${[s.citation.source.creators, s.citation.source.year, s.citation.source.title].filter(Boolean).join(", ")}` :
      s.diapo ? `[${s.diapo.name}, diapo ${s.diapo.diapo}/${s.diapo.max}](${s.diapo.url})${s.diapo.description ? ` : ${s.diapo.description.slice(0, 160)}…` : ""}` :
      s.question ? `**${s.question.text}**` :
      s.diagramme ? s.diagramme.title :
      s.type === "contribution" ? "URL proposées par le public (formulaire Grist)" : "(non généré)";
    push(`| ${s.index + 1} | ${mmss(s.start)} | ${mmss(s.duration)} | ${TYPE_LABELS[s.type] ?? s.type} | ${cell(content)} |`);
  }
  push("");
  const withDiagram = p.screens.filter(s => s.diagramme);
  if (withDiagram.length) {
    push("## Diagrammes", "");
    for (const s of withDiagram) push(`### Écran ${s.index + 1} : ${cell(s.diagramme!.title)}`, "", "```mermaid", s.diagramme!.mermaid, "```", "");
  }
  push(...usageReport(ctx.usage, ctx.impact));
  return lines.join("\n");
}
