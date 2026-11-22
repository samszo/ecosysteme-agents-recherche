// Rapport d'une exécution de mailbot (markdown) : boîte mail, archivage, Zotero, RAG, brouillons, mail envoyé, coût
import type { UsageSummary } from "../../lib/metrics/usage";
import type { ImpactSummary } from "../../lib/metrics/impact";
import { usageReport } from "./paperReport";

const cell = (s: unknown) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

export function buildMailbotReport(ctx: {
  runId: string; status: string; startedAt: Date; endedAt: Date; correspondent: string; compose: boolean;
  steps: Record<string, any>; usage?: UsageSummary; impact?: ImpactSummary; error?: string;
}): string {
  const out = (id: string) => ctx.steps[id]?.output ?? null;
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);
  push(
    `# mailbot – historique de ${cell(ctx.correspondent || "chercheur")} et échanges du mailbot`,
    "",
    `Exécution \`${ctx.runId}\` · ${ctx.startedAt.toLocaleString("fr-FR")} · ${ctx.compose ? "synchronisation et envoi" : "synchronisation"} · statut **${ctx.status}** · durée ${Math.round((ctx.endedAt.getTime() - ctx.startedAt.getTime()) / 1000)} s`,
    ""
  );
  if (ctx.error) push(`> ❌ ${cell(ctx.error)}`, "");

  const f = out("fetch-mails");
  const o = out("archive-omeka");
  const z = out("zotero-attachments");
  const r = out("mail-rag-index");
  push(
    "## Archivage",
    "",
    "| Élément | Résultat |",
    "|---|---|",
    `| Boîtes mail | ${f ? `${f.newIds?.length ?? 0} nouveau(x) message(s) (historique ${f.history ?? 0}, mailbot ${f.bot ?? 0}), ${f.attachments ?? 0} pièce(s) jointe(s) ; ${f.total ?? 0} message(s) archivé(s) au total` : "—"} |`,
    `| Omeka S | ${o ? `${o.archived} item(s) créé(s), ${o.existing} déjà présent(s), ${o.media} média(s)` : "—"} |`,
    `| Zotero | ${z ? `${z.collections?.length ? `collection(s) ${z.collections.map((c: any) => `\`${c.key}\` (${c.profile ?? "mailbot"})`).join(", ")} : ` : ""}${z.items} notice(s) courriel, ${z.files} fichier(s)` : "—"} |`,
    `| RAG Albert | ${r ? `${r.collections?.length ? `${r.collections.map((c: any) => `« ${cell(c.name)} »`).join(", ")} : ` : ""}${r.messages} message(s), ${r.attachments} pièce(s) jointe(s) indexé(s), ${r.present} déjà présent(s), ${r.withoutText} sans texte` : "—"} |`,
    ""
  );
  const errors = [...(f?.errors ?? []), ...(o?.errors ?? []), ...(z?.errors ?? []), ...(r?.errors ?? [])];
  if (errors.length) push("### Avertissements", "", ...errors.map((e: string) => `- ${cell(e)}`), "");

  const d = out("draft-replies");
  push("## Réponses", "");
  if (d?.drafts?.length) push(`${d.drafts.length} brouillon(s) de réponse contradictoire en attente de validation :`, "", ...d.drafts.map((x: any) => `- « ${cell(x.subject)} » (\`${x.id}\`)`), "");
  else push("Aucun nouveau mail d'une adresse autorisée à traiter.", "");
  if (d?.errors?.length) push(...d.errors.map((e: string) => `- ⚠️ ${cell(e)}`), "");

  const c = out("compose-mail");
  if (ctx.compose) {
    push("## Mail au groupe", "");
    push(c?.draft ? `« ${cell(c.draft.subject)} » : **${c.draft.status}** (\`${c.draft.id}\`)` : "Aucun mail rédigé.", "");
  }

  push(...usageReport(ctx.usage, ctx.impact));
  return lines.join("\n") + "\n";
}
