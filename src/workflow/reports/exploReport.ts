// Rapport de l'exploration d'une annotation collective (markdown)
import type { UsageSummary } from "../../lib/metrics/usage";
import type { ImpactSummary } from "../../lib/metrics/impact";
import { usageReport } from "./paperReport";
import { exploConfig } from "../../config/explo";

const pct = (x: number | null | undefined) => (x === null || x === undefined ? "—" : `${Math.round(x * 100)} %`);
const cell = (s: unknown) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const date = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

export function buildExploReport(ctx: {
  runId: string; status: string; startedAt: Date; endedAt: Date; collectionName: string;
  participation: any; collaboration: any; themes: string; usage?: UsageSummary; impact?: ImpactSummary; error?: string;
}): string {
  const { participation: p, collaboration: c } = ctx;
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);
  const grid = exploConfig.grid.positions;

  push(
    `# Annotation collective – ${cell(ctx.collectionName)}`,
    "",
    `Exécution \`${ctx.runId}\` · ${ctx.startedAt.toLocaleString("fr-FR")} · statut **${ctx.status}** · durée ${Math.round((ctx.endedAt.getTime() - ctx.startedAt.getTime()) / 1000)} s`,
    ""
  );
  if (ctx.error) push(`> ❌ ${cell(ctx.error)}`, "");

  if (p?.totals) {
    const t = p.totals;
    push(
      "## Participation",
      "",
      `**${t.collaborators}** collaborateur(s), **${t.annotations}** surlignage(s) et **${t.notes}** note(s) sur **${t.annotatedDocuments}** document(s) annoté(s) (sur ${t.documents}).` +
        (t.offGrid ? ` ${t.offGrid} surlignage(s) d'une couleur hors grille.` : ""),
      "",
      `| Collaborateur | Surlignages | Notes | Commentaires | Documents | Part | Jours actifs | Période | ${grid.map(g => g.position).join(" | ")} |`,
      `|---|---|---|---|---|---|---|---|${grid.map(() => "---").join("|")}|`,
      ...p.collaborators.map((x: any) =>
        `| ${cell(x.name)} | ${x.annotations} | ${x.notes} | ${x.comments} | ${x.documents} | ${pct(x.share)} | ${x.activeDays} | ${date(x.firstDate)} – ${date(x.lastDate)} | ${grid.map(g => x.positions[g.position] ?? 0).join(" | ")} |`
      ),
      "",
      "### Documents les plus annotés",
      "",
      "| Document | Surlignages | Notes | Collaborateurs |",
      "|---|---|---|---|",
      ...p.documents.slice(0, 15).map((d: any) => `| ${cell(d.title)} | ${d.annotations} | ${d.notes} | ${cell(d.collaborators.map((x: any) => `${x.name} (${x.count})`).join(", "))} |`),
      ""
    );
    const silent = p.documents.filter((d: any) => !d.annotations && !d.notes);
    if (silent.length) push(`Documents sans annotation : ${silent.map((d: any) => cell(d.title)).join(" ; ")}.`, "");
  }

  if (c?.passages) {
    push(
      "## Collaborations",
      "",
      `${c.passages.shared} passage(s) annoté(s) par au moins deux personnes : **${c.passages.convergent} convergent(s)** (même signification) et **${c.passages.divergent} divergent(s)**.`,
      "",
      `Accord sur la signification des couleurs : kappa de Fleiss **${c.kappa.fleiss ?? "—"}**${c.kappa.cohen !== null ? `, de Cohen **${c.kappa.cohen}**` : ""} (${c.kappa.interpretation}, ${c.kappa.passages} passage(s)).`,
      "",
      "| Paire | Documents en commun | Passages en commun | Même signification | Accord |",
      "|---|---|---|---|---|",
      ...c.pairs.map((x: any) => `| ${cell(x.a)} – ${cell(x.b)} | ${x.sharedDocuments} | ${x.sharedPassages} | ${x.samePosition} | ${pct(x.agreement)} |`),
      ""
    );
    if (c.divergent.length) {
      push("### Passages aux lectures divergentes", "");
      for (const u of c.divergent.slice(0, 15)) {
        push(`> « ${cell(u.phrase)} » — *${cell(u.document)}*`, ">", `> ${u.annotations.map((a: any) => `${cell(a.author)} : **${a.position ?? "hors grille"}**${a.note ? ` (« ${cell(a.note)} »)` : ""}`).join(" · ")}`, "");
      }
    }
  }

  if (ctx.themes) push("## Thèmes de discussion", "", ctx.themes.replace(/^#\s.*\n+/, ""), "");
  push(...usageReport(ctx.usage, ctx.impact));
  return lines.join("\n");
}
