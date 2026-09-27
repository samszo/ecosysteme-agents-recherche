// Rapport de traitement (markdown) construit à partir des résultats des étapes du workflow
import { workflowConfig } from "../config";
import type { Omk } from "../tools/omk";
import { positionForColor } from "../tools/annotationPositions";
import type { UsageSummary } from "../usage";

const STEP_LABELS: Record<string, string> = {
  "analyze-cfp": "Appel à propositions et attendus (AttenduAPP)",
  "fetch-literature": "Récupération Zotero et enregistrement Omeka",
  "build-wiki": "Extraction sémantique et graphe",
  "kappa-analysis": "Accord inter-juges (kappa)",
  "normalize-okf": "Export des concepts dans Omeka",
  "draft-paper": "Proposition d'article (PropAPP)",
  "review-paper": "Relecture épistémologique",
};

const STATUS_LABELS: Record<string, string> = {
  success: "✅ réussi",
  failed: "❌ échec",
  suspended: "⏸️ suspendu",
  running: "⏳ en cours",
  canceled: "⏹️ annulé",
};
const statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

export interface ReportContext {
  runId: string;
  runResult: any;
  startedAt: Date;
  endedAt: Date;
  configItemId: number | null;
  documents: { filePath: string; title: string }[];
  omk: Omk | null;
  usage?: UsageSummary;
}

const fmtDate = (d: Date | number) => new Date(d).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
const fmtDuration = (ms: number) => (ms < 1000 ? `${ms} ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`);
const cell = (s: unknown) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

export function buildProcessingReport(ctx: ReportContext): string {
  const { runResult, omk } = ctx;
  const steps = runResult.steps ?? {};
  const out = (id: string) => steps[id]?.output ?? {};
  const itemLink = (id: number | null | undefined, label?: string) =>
    id ? (omk ? `[${label ?? `#${id}`}](${omk.getAdminLink(null, id, "o:Item")})` : label ?? `#${id}`) : "—";

  const fetch = out("fetch-literature");
  const wiki = out("build-wiki");
  const exp = out("normalize-okf").exportResult;
  const articles: any[] = fetch.articles ?? [];
  const meta = wiki.wikiMetadata ?? {};
  const extracted = new Set<string>(wiki.extractedKeys ?? []);
  const reused = new Set<string>(meta.reusedKeys ?? []);
  const empty = new Set<string>(meta.emptyKeys ?? []);
  const failed = new Set<string>(meta.failedKeys ?? []);
  const graph = out("review-paper").conceptGraph ?? out("normalize-okf").conceptGraph ?? wiki.conceptGraph;

  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);

  // ==========================================
  // En-tête
  // ==========================================
  push(
    `# Rapport de traitement – ${workflowConfig.workflowId}`,
    "",
    `| | |`,
    `|---|---|`,
    `| Exécution | \`${ctx.runId}\` |`,
    `| Statut | **${statusLabel(runResult.status)}** |`,
    `| Début | ${fmtDate(ctx.startedAt)} |`,
    `| Fin | ${fmtDate(ctx.endedAt)} |`,
    `| Durée | ${fmtDuration(ctx.endedAt.getTime() - ctx.startedAt.getTime())} |`,
    `| Collection Zotero | \`${workflowConfig.input.zoteroCollection}\` – ${itemLink(fetch.collectionItemId, "item Omeka")} |`,
    `| Configuration | ${itemLink(ctx.configItemId, "item Omeka")} |`,
    `| Modèles | analytique \`${workflowConfig.models.analytics}\`, rapide \`${workflowConfig.models.fast}\` |`,
    ""
  );
  if (runResult.status === "failed") {
    push(`> ❌ **Échec du workflow** : ${cell(runResult.error?.message ?? runResult.error)}`, "");
  }

  // ==========================================
  // Appel à propositions et proposition d'article
  // ==========================================
  const cfp = out("analyze-cfp");
  const prop = out("draft-paper").proposal;
  if (cfp.aapItemId || prop) {
    push("## Appel à propositions", "", "| | |", "|---|---|");
    if (cfp.aapTitle) push(`| Appel | ${cell(cfp.aapTitle)} |`);
    if (cfp.aapUrl) push(`| Source | <${cfp.aapUrl}> |`);
    push(`| Item Omeka de l'appel | ${itemLink(cfp.aapItemId, "AttenduAPP et PropAPP")} |`);
    if (prop) {
      push(
        `| Proposition | ${cell(prop.title)} |`,
        `| Auteurs | ${cell(prop.authors.map((a: any) => `${a.name} (${a.role})`).join(", "))} |`,
        `| Références | ${prop.references} (BibTeX : \`${workflowConfig.proposal.bibtexFile}\`) |`,
        `| Citations | ${prop.citations} |`,
        `| Mots-clés | ${cell(prop.keywords.map((k: any) => k.label).join(" ; "))} |`
      );
    }
    push("");
  }

  // ==========================================
  // Étapes
  // ==========================================
  push("## Étapes", "", "| Étape | Statut | Durée | Détail |", "|---|---|---|---|");
  for (const id of workflowConfig.steps) {
    const s = steps[id];
    if (!s) {
      push(`| ${STEP_LABELS[id] ?? id} | non exécutée | — | |`);
      continue;
    }
    const duration = s.startedAt && s.endedAt ? fmtDuration(s.endedAt - s.startedAt) : "—";
    const detail = s.status === "failed" ? cell(s.error?.message ?? s.error) : "";
    push(`| ${STEP_LABELS[id] ?? id} | ${statusLabel(s.status)} | ${duration} | ${detail} |`);
  }
  push("");

  // ==========================================
  // Documents traités
  // ==========================================
  if (articles.length) {
    push(
      `## Documents traités (${articles.length})`,
      "",
      "| Document | Format | Texte | Annotations | Notes | Marqueurs | Images | Extraction | Omeka |",
      "|---|---|---|---|---|---|---|---|---|"
    );
    for (const a of articles) {
      const anns: any[] = a.annotations ?? [];
      const notes = anns.filter(x => x.type === "Note").length;
      const status = extracted.has(a.zoteroKey)
        ? `✅ faite (${meta.chunksByKey?.[a.zoteroKey] ?? "?"} extrait(s))`
        : reused.has(a.zoteroKey)
          ? `♻️ reprise (${a.accessed})`
          : failed.has(a.zoteroKey)
            ? "⚠️ partielle, à relancer"
            : empty.has(a.zoteroKey)
              ? "— pas de texte"
              : "—";
      push(
        `| ${cell(a.title)} | ${a.format} | ${(a.text?.length ?? 0).toLocaleString("fr-FR")} car. | ${anns.length - notes} | ${notes} | ${cell((a.tags ?? []).join(", "))} | ${a.images?.length ?? 0} | ${status} | ${itemLink(a.omekaItemId)} |`
      );
    }
    push("");

    // positionnements déduits des couleurs
    const positions = new Map<string, number>();
    for (const a of articles) {
      for (const ann of a.annotations ?? []) {
        const p = positionForColor(ann.color?.hex)?.position ?? (ann.type === "Note" ? "Note Zotero" : "Sans positionnement");
        positions.set(p, (positions.get(p) ?? 0) + 1);
      }
    }
    if (positions.size) {
      push("### Annotations par positionnement", "", "| Positionnement | Annotations |", "|---|---|");
      for (const [p, n] of [...positions].sort((x, y) => y[1] - x[1])) push(`| ${p} | ${n} |`);
      push("");
    }
  }

  // ==========================================
  // Graphe de concepts
  // ==========================================
  if (meta.totalArticlesProcessed !== undefined || graph) {
    push("## Graphe de concepts", "");
    if (meta.rawConcepts !== undefined) push(`- Graphe brut : ${meta.rawConcepts} concepts, ${meta.rawRelations} relations (${meta.totalChunksProcessed} extrait(s) analysé(s))`);
    if (graph) push(`- Graphe nettoyé : ${graph.nodes?.length ?? 0} concepts, ${graph.edges?.length ?? 0} relations`);
    if (exp?.stats) {
      const st = exp.stats;
      push(
        `- Export Omeka : ${st.concepts} concepts (${st.created} créés, ${st.concepts - st.created} existants réutilisés), ${st.relations} relations`,
        `- ${st.linkedArticles} document(s) reliés à leurs concepts (dcterms:subject), ${st.marked} marqué(s) extrait(s) (${workflowConfig.omeka.accessTerm} = ${st.accessDate})`
      );
    }
    if (graph?.nodes?.length) {
      const byCategory = new Map<string, number>();
      for (const n of graph.nodes) byCategory.set(n.category, (byCategory.get(n.category) ?? 0) + 1);
      push("", "| Catégorie | Concepts |", "|---|---|");
      for (const [c, n] of [...byCategory].sort((x, y) => y[1] - x[1])) push(`| ${cell(c)} | ${n} |`);

      // concepts les plus connectés
      const degree = new Map<string, number>();
      for (const e of graph.edges ?? []) for (const id of [e.source, e.target]) degree.set(id, (degree.get(id) ?? 0) + 1);
      const labels = new Map(graph.nodes.map((n: any) => [n.id, n.label]));
      const top = [...degree].sort((x, y) => y[1] - x[1]).slice(0, 15);
      if (top.length) {
        push("", "### Concepts les plus reliés", "", "| Concept | Relations |", "|---|---|");
        for (const [id, n] of top) push(`| ${cell(labels.get(id) ?? id)} | ${n} |`);
      }
    }
    push("");
  }

  // ==========================================
  // Accord inter-juges
  // ==========================================
  const kappaStep = out("kappa-analysis");
  if (steps["kappa-analysis"]) {
    push("## Accord inter-juges", "");
    const k = kappaStep.kappa;
    const fs = kappaStep.fetchStats;
    if (!k) {
      push("Aucune annotation codée selon la grille (marqueur ACC-S, DES-F…) avec un juge identifié : accord non calculé.", "");
    } else {
      push(
        "| | |",
        "|---|---|",
        `| Kappa de Fleiss | **${k.kappa}** |`,
        ...(k.cohenKappa !== null ? [`| Kappa de Cohen (2 juges) | **${k.cohenKappa}** |`] : []),
        `| Interprétation | ${k.interpretation} |`,
        `| Validation du corpus (κ ≥ ${k.targetKappa}) | ${k.validated ? "✅ atteinte" : "❌ non atteinte"} |`,
        `| Juges | ${k.totalRaters} |`,
        `| Phrases codées par au moins deux juges | ${k.ratedUnits} / ${k.totalUnits} (${k.meanRatersPerUnit} juges en moyenne) |`,
        `| Phrases en désaccord | ${k.conflicts} |`,
        ...(fs?.ignored ? [`| Annotations ignorées (code ou juge manquant) | ${fs.ignored} |`] : []),
        `| Détail des désaccords | \`${k.csvPath}\` |`,
        ""
      );
      if (k.categories?.length) {
        push("| Code | Libellé | Annotations |", "|---|---|---|");
        for (const c of [...k.categories].sort((a: any, b: any) => b.count - a.count)) push(`| ${c.code} | ${cell(c.label)} | ${c.count} |`);
        push("");
      }
      if (kappaStep.confusions?.length) {
        push("### Codes les plus souvent confondus", "", "| Codes | Phrases |", "|---|---|");
        for (const c of kappaStep.confusions) push(`| ${c.pair} | ${c.count} |`);
        push("");
      }
      if (kappaStep.summary) push("### Bilan de l'analyste", "", kappaStep.summary, "");
    }
  }

  // ==========================================
  // Consommation de tokens
  // ==========================================
  if (ctx.usage?.calls) {
    const u = ctx.usage;
    const n = (x: number) => x.toLocaleString("fr-FR");
    push(
      "## Consommation de tokens",
      "",
      `**${n(u.totalTokens)} tokens** au total pour ${u.calls} appel(s) aux modèles : ${n(u.inputTokens)} en entrée, ${n(u.outputTokens)} en sortie` +
        (u.reasoningTokens ? ` (dont ${n(u.reasoningTokens)} de raisonnement)` : "") + ".",
      "",
      "| Traitement | Modèle | Appels | Entrée | Sortie | Total |",
      "|---|---|---|---|---|---|"
    );
    for (const e of [...u.entries].sort((a, b) => b.totalTokens - a.totalTokens)) {
      push(`| ${cell(e.source)} | \`${e.model}\` | ${e.calls} | ${n(e.inputTokens)} | ${n(e.outputTokens)} | ${n(e.totalTokens)} |`);
    }
    // total par modèle
    const byModel = new Map<string, number>();
    for (const e of u.entries) byModel.set(e.model, (byModel.get(e.model) ?? 0) + e.totalTokens);
    for (const [model, total] of byModel) push(`| **Total** | \`${model}\` | | | | **${n(total)}** |`);
    push("");
    if (u.unknown) push(`> ${u.unknown} appel(s) sans consommation renvoyée par l'API, non comptés.`, "");
  }

  // ==========================================
  // Documents de synthèse
  // ==========================================
  if (ctx.documents.length) {
    push("## Documents de synthèse", "");
    for (const d of ctx.documents) push(`- ${d.title} : \`${d.filePath.replace(/^\.\//, "")}\``);
    push("");
  }

  return lines.join("\n");
}
