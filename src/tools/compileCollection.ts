import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import { Zotero } from "./zotero";
import { normalizeId } from "./cleanGraph";
import { positionForColor } from "./annotationPositions";
import { workflowConfig } from "../config";

const { maxKeywords, ignoredTags, citationStyle, authors: extraAuthors } = workflowConfig.proposal;

const CompileSchema = z.object({
  collectionKey: z.string(),
  // articles produits par fetch-literature (annotations, notes, marqueurs, notice parente)
  articles: z.array(z.any()),
  // graphe de concepts nettoyé (pour la compilation des mots-clés)
  conceptGraph: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }).nullable().optional(),
});

export interface Reference {
  parentKey: string;
  citeKey: string;
  title: string;
  citation: string;
  bibtex: string;
}
export interface Citation {
  citeKey: string;
  reference: string;
  page: number;
  // repère de la citation dans le texte source quand ce n'est pas une page (ex. « § 15 »)
  locator: string;
  kind: "passage" | "note";
  text: string;
  comment: string;
  author: string | null;
  position: string | null;
}
export interface Keyword {
  label: string;
  count: number;
  origin: "marqueur" | "concept";
}

// une note de citation contient souvent le passage entre guillemets suivi d'un repère : "…" § 15, « … » (p. 12)
function splitQuote(text: string): { text: string; locator: string } {
  const m = /^\s*["«“]\s*([\s\S]+?)\s*["»”]\s*[,.]?\s*(\(?(?:§|p\.|pp\.|chap\.|l\.)\s*[\w\s,.-]*\)?)?\s*$/.exec(text);
  if (!m) return { text, locator: "" };
  return { text: m[1]!.trim(), locator: (m[2] ?? "").replace(/^\(|\)$/g, "").trim() };
}

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();

export const compileCollection = new Tool({
  name: "compile-collection",
  description: "Compile les matériaux d'une collection Zotero pour une proposition d'article : références BibTeX (clés de citation), citations (passages annotés et notes), mots-clés (marqueurs et concepts du graphe) et auteurs (annotateurs).",
  schema: CompileSchema,
  execute: async ({ data }) => {
    const { collectionKey, articles, conceptGraph } = data as z.infer<typeof CompileSchema>;
    const zotero = new Zotero(process.env.ZOTERO_USER_ID ?? "", process.env.ZOTERO_API_KEY ?? "");

    // ==========================================
    // Références : BibTeX et citation formatée des notices de la collection
    // ==========================================
    const references: Reference[] = [];
    for (const it of await zotero.collectionTopItems(collectionKey, citationStyle)) {
      const bibtex = String(it.bibtex ?? "").trim();
      const citeKey = /@\w+\s*\{\s*([^,\s]+)\s*,/.exec(bibtex)?.[1];
      if (!citeKey) continue; // notes et pièces jointes isolées : pas de référence
      references.push({ parentKey: it.key, citeKey, title: it.data?.title ?? citeKey, citation: stripHtml(String(it.citation ?? "")), bibtex });
    }
    const byParent = new Map(references.map(r => [r.parentKey, r]));

    // ==========================================
    // Citations : passages annotés et notes, dédoublonnés par référence
    // ==========================================
    const citations: Citation[] = [];
    const seen = new Set<string>();
    const authorCounts = new Map<string, number>();
    for (const a of articles) {
      const ref = a.parentKey ? byParent.get(a.parentKey) : undefined;
      for (const ann of a.annotations ?? []) {
        const kind = ann.phrase ? "passage" : "note";
        const raw = (ann.phrase || ann.note || "").trim();
        if (!raw || raw === "(texte non détecté)") continue;
        const { text, locator } = kind === "note" ? splitQuote(raw) : { text: raw, locator: "" };
        if (ann.author) authorCounts.set(ann.author, (authorCounts.get(ann.author) ?? 0) + 1);
        const key = `${ref?.citeKey ?? a.zoteroKey}|${normalizeId(text)}`;
        if (seen.has(key)) continue; // une note de notice est reprise sur chaque pièce jointe
        seen.add(key);
        citations.push({
          citeKey: ref?.citeKey ?? "",
          reference: ref?.citation || a.title,
          page: ann.page ?? 0,
          locator,
          kind,
          text,
          comment: kind === "passage" ? (ann.note ?? "").trim() : "",
          author: ann.author ?? null,
          position: positionForColor(ann.color?.hex)?.position ?? null,
        });
      }
    }
    citations.sort((x, y) => x.reference.localeCompare(y.reference) || x.page - y.page);

    // ==========================================
    // Mots-clés : marqueurs Zotero (par nombre de documents), puis concepts du graphe (par nombre de relations)
    // ==========================================
    const ignored = new Set(ignoredTags.map(t => normalizeId(t)));
    const markers = new Map<string, Keyword>();
    for (const a of articles) {
      const tags = new Set<string>([...(a.tags ?? []), ...(a.annotations ?? []).flatMap((x: any) => x.tags ?? [])]);
      for (const tag of tags) {
        const id = normalizeId(tag);
        if (!id || ignored.has(id)) continue;
        const k = markers.get(id) ?? { label: tag, count: 0, origin: "marqueur" as const };
        k.count++;
        markers.set(id, k);
      }
    }
    const degree = new Map<string, number>();
    for (const e of conceptGraph?.edges ?? []) for (const id of [e.source, e.target]) degree.set(id, (degree.get(id) ?? 0) + 1);
    const concepts: Keyword[] = (conceptGraph?.nodes ?? [])
      .filter((n: any) => !ignored.has(normalizeId(n.label)) && !markers.has(normalizeId(n.label)) && n.category !== "auteur")
      .map((n: any) => ({ label: n.label, count: degree.get(n.id) ?? 0, origin: "concept" as const }))
      .filter((k: Keyword) => k.count > 0)
      .sort((x: Keyword, y: Keyword) => y.count - x.count);
    const keywords = [...[...markers.values()].sort((x, y) => y.count - x.count), ...concepts].slice(0, maxKeywords);

    // ==========================================
    // Auteurs : annotateurs (par nombre d'annotations) et auteurs ajoutés dans la configuration
    // ==========================================
    const authors: { name: string; role: "annotateur" | "auteur"; annotations: number }[] = [
      ...[...authorCounts].sort((x, y) => y[1] - x[1]).map(([name, n]) => ({ name, role: "annotateur" as const, annotations: n })),
      ...extraAuthors.filter(name => !authorCounts.has(name)).map(name => ({ name, role: "auteur" as const, annotations: 0 })),
    ];

    console.log(`📚 Compilation : ${references.length} référence(s), ${citations.length} citation(s), ${keywords.length} mot(s)-clé(s), ${authors.length} auteur(s)`);
    return {
      references,
      citations,
      keywords,
      authors,
      bibtex: references.map(r => r.bibtex).join("\n\n") + "\n",
    };
  },
});
