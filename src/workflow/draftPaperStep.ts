import { createStep } from "@mastra/core/workflows";
import fs from "fs/promises";
import { writerAgent } from "../agents/writerAgent";
import { compileCollection, type Citation, type Keyword, type Reference } from "../tools/compileCollection";
import { attachDocuments } from "./importSynthesis";
import { workflowConfig } from "../config";
import { recordUsage } from "../usage";

const { plan, maxCitations, proposalFile, bibtexFile } = workflowConfig.proposal;

const yamlString = (s: string) => JSON.stringify(s);

// repère dans la source : page (annotation PDF) ou repère extrait de la note (§ 15…)
const where = (c: Citation) => (c.page ? `p. ${c.page}` : c.locator);

// citation au format Pandoc : [@cle, p. 12] ou (référence, p. 12) sans clé BibTeX
const cite = (c: Citation) => c.citeKey ? `[@${c.citeKey}${where(c) ? `, ${where(c)}` : ""}]` : `(${c.reference}${where(c) ? `, ${where(c)}` : ""})`;

function formatCitation(c: Citation): string {
  const ref = cite(c);
  const meta = [c.position && `positionnement : ${c.position}`, c.author && `annoté par ${c.author}`].filter(Boolean).join(" ; ");
  return `> « ${c.text} » ${ref}${c.comment ? `\n>\n> *Commentaire : ${c.comment}*` : ""}${meta ? `\n>\n> <small>${meta}</small>` : ""}`;
}

// résumé du graphe pour le prompt : concepts les plus reliés et leurs relations
function graphSummary(graph: any, maxNodes = 60) {
  if (!graph?.nodes?.length) return "(graphe indisponible)";
  const degree = new Map<string, number>();
  for (const e of graph.edges ?? []) for (const id of [e.source, e.target]) degree.set(id, (degree.get(id) ?? 0) + 1);
  const top = [...graph.nodes].sort((a: any, b: any) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0)).slice(0, maxNodes);
  const ids = new Set(top.map((n: any) => n.id));
  const label = new Map(graph.nodes.map((n: any) => [n.id, n.label]));
  const edges = (graph.edges ?? []).filter((e: any) => ids.has(e.source) && ids.has(e.target));
  return `Concepts : ${top.map((n: any) => `${n.label} (${n.category})`).join(" ; ")}\nRelations :\n${edges.map((e: any) => `- ${label.get(e.source)} —${e.relation}→ ${label.get(e.target)}`).join("\n")}`;
}

// 5. Proposition d'article (PropAPP) : attendus de l'appel + matériaux de la collection Zotero, selon le plan configuré
export const draftPaperStep = createStep({
  id: "draft-paper",
  execute: async ({ inputData, getStepResult, runId }) => {
    // inputData est la sortie de normalize-okf ; l'appel et la collection sont lus dans les étapes d'origine
    const cfpStep: any = getStepResult("analyze-cfp") ?? {};
    const literature: any = getStepResult("fetch-literature") ?? {};
    const expectations: string = cfpStep.cfpAnalysis ?? inputData.cfpAnalysis ?? "";
    const graph = inputData.conceptGraph;

    console.log("📚 Outil : Compilation des références, citations, mots-clés et auteurs...");
    const material: { references: Reference[]; citations: Citation[]; keywords: Keyword[]; authors: { name: string; role: string }[]; bibtex: string } =
      (await compileCollection.execute({ data: { collectionKey: workflowConfig.input.zoteroCollection, articles: literature.articles ?? [], conceptGraph: graph } })) as any;

    console.log("🧠 Agent : Rédaction de la proposition d'article (PropAPP)...");
    // citations prioritaires : celles qui portent un positionnement ou un commentaire du chercheur
    const promptCitations = [...material.citations]
      .sort((a, b) => Number(!!b.position || !!b.comment) - Number(!!a.position || !!a.comment))
      .slice(0, maxCitations);
    // chaque document est délimité par des balises pour ne pas confondre ses titres avec ceux du prompt
    const res = await writerAgent.generate(`Rédige la proposition d'article à partir des éléments suivants.

<attendus_de_l_appel>
${expectations}
</attendus_de_l_appel>

<plan>
${plan}
</plan>

<mots_cles>
${material.keywords.map(k => k.label).join(", ")}
</mots_cles>

<references description="clé de citation — référence — titre">
${material.references.map(r => `- @${r.citeKey} — ${r.citation} — ${r.title}`).join("\n") || "(aucune)"}
</references>

<citations description="passages annotés et notes du chercheur, à citer avec leur référence">
${promptCitations.map(c => `- ${cite(c)} « ${c.text} »${c.comment ? ` (commentaire : ${c.comment})` : ""}${c.position ? ` [positionnement : ${c.position}]` : ""}`).join("\n") || "(aucune)"}
</citations>

<graphe_de_concepts>
${graphSummary(graph)}
</graphe_de_concepts>`);

    // titre : premier titre de niveau 1 produit par le rédacteur
    recordUsage("Rédaction PropAPP (writerAgent)", workflowConfig.models.analytics, (res as any).totalUsage ?? res.usage);
    let body = res.text.trim().replace(/^```(?:markdown)?\s*|\s*```$/g, "");
    const titleMatch = /^#\s+(.+)$/m.exec(body);
    const title = titleMatch?.[1]?.trim() ?? cfpStep.aapTitle ?? "Proposition d'article";
    if (titleMatch) body = body.replace(titleMatch[0], "").trim();

    // ==========================================
    // Assemblage de PropAPP : métadonnées, texte, mots-clés, annexe des citations, références BibTeX
    // ==========================================
    const authors = material.authors.length ? material.authors : [{ name: "Auteur à compléter", role: "auteur" }];
    const byReference = new Map<string, Citation[]>();
    for (const c of material.citations) {
      const k = c.citeKey ? `${c.reference} [@${c.citeKey}]` : c.reference;
      if (!byReference.has(k)) byReference.set(k, []);
      byReference.get(k)!.push(c);
    }
    const proposal = [
      "---",
      `title: ${yamlString(title)}`,
      "author:",
      ...authors.map(a => `  - name: ${yamlString(a.name)}\n    role: ${a.role}`),
      `keywords: [${material.keywords.map(k => yamlString(k.label)).join(", ")}]`,
      `date: ${new Date().toISOString().slice(0, 10)}`,
      `bibliography: ${bibtexFile}`,
      `lang: fr`,
      ...(cfpStep.aapTitle ? [`appel: ${yamlString(cfpStep.aapTitle)}`] : []),
      ...(cfpStep.aapUrl ? [`appel-url: ${cfpStep.aapUrl}`] : []),
      "---",
      "",
      `# ${title}`,
      "",
      `**Auteurs** : ${authors.map(a => a.name).join(", ")}`,
      "",
      `**Mots-clés** : ${material.keywords.map(k => k.label).join(" ; ")}`,
      "",
      body,
      "",
      "## Annexe : citations mobilisables",
      "",
      ...(material.citations.length
        ? [...byReference].flatMap(([ref, cits]) => [`### ${ref}`, "", ...cits.map(c => formatCitation(c) + "\n")])
        : ["Aucune citation annotée dans la collection.", ""]),
      "## Références",
      "",
      "::: {#refs}",
      ":::",
      "",
      "### Notices BibTeX",
      "",
      "```bibtex",
      material.bibtex.trim(),
      "```",
      "",
    ].join("\n");

    await fs.writeFile(proposalFile, proposal);
    await fs.writeFile(bibtexFile, material.bibtex);
    console.log(`📝 Proposition d'article enregistrée dans './${proposalFile}' (références : './${bibtexFile}')`);

    // PropAPP et ses références dans l'item Omeka de l'appel
    if (cfpStep.aapItemId) {
      await attachDocuments(cfpStep.aapItemId, [
        { filePath: `./${proposalFile}`, title: "PropAPP – Proposition d'article" },
        { filePath: `./${bibtexFile}`, title: "PropAPP – Références BibTeX", type: "application/x-bibtex" },
      ], runId, null).catch(e => console.warn("⚠️ PropAPP non importée dans Omeka S :", (e as Error).message));
    }

    return {
      draft: proposal,
      cfpAnalysis: expectations,
      conceptGraph: graph,
      proposal: {
        title,
        authors,
        keywords: material.keywords,
        references: material.references.length,
        citations: material.citations.length,
        aapItemId: cfpStep.aapItemId ?? null,
      },
    };
  }
});
