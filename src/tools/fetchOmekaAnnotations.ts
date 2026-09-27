import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import { getOmk } from "./omk";
import { loadAnnotations } from "./oaAnnotations";
import { normalizeId } from "./cleanGraph";
import { workflowConfig } from "../config";

const { unitSimilarity } = workflowConfig.kappa;

// types d'items rattachés à une collection qui ne sont pas des documents annotés
const NON_DOCUMENT_TYPES = new Set(["Configuration de workflow", "Collection Zotero"]);

const FetchSchema = z.object({
  // item Omeka de la collection Zotero : ses documents (dcterms:isPartOf) sont analysés
  collectionItemId: z.number().optional(),
  // ou liste explicite d'items Omeka de documents
  articleItemIds: z.array(z.number()).optional(),
});

export const CodedAnnotationSchema = z.object({
  itemId: z.string().describe("Unité d'annotation (phrase d'un document) commune aux juges"),
  documentId: z.number(),
  documentTitle: z.string(),
  phrase: z.string(),
  annotatorId: z.string(),
  code: z.string(),
});
export type CodedAnnotation = z.infer<typeof CodedAnnotationSchema>;

// mots d'une phrase, pour rapprocher les surlignages d'une même phrase par des juges différents
const words = (s: string) => new Set(normalizeId(s).split("_").filter(w => w.length > 1));
function jaccard(a: Set<string>, b: Set<string>) {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

export const fetchOmekaAnnotations = new Tool({
  name: "fetch-omeka-annotations",
  description: "Extrait d'Omeka S les annotations (oa:Annotation) codées selon la grille des positionnements argumentatifs : juge (dcterms:creator), code (curation:type) et phrase annotée. Regroupe les annotations des différents juges par phrase.",
  schema: FetchSchema,
  execute: async ({ data }) => {
    const { collectionItemId, articleItemIds = [] } = data as z.infer<typeof FetchSchema>;
    const omk = await getOmk();

    // documents à analyser
    const documents: { id: number; title: string }[] = [];
    if (collectionItemId) {
      const items = await omk.getAllItems(
        `property[0][property]=dcterms:isPartOf&property[0][type]=res&property[0][text]=${collectionItemId}`
      );
      for (const it of items) {
        if (it["dcterms:type"]?.some((v: any) => NON_DOCUMENT_TYPES.has(v["@value"]))) continue;
        documents.push({ id: it["o:id"], title: it["o:title"] ?? `Item ${it["o:id"]}` });
      }
    }
    for (const id of articleItemIds) {
      if (!documents.some(d => d.id === id)) documents.push({ id, title: (await omk.getItem(id))["o:title"] ?? `Item ${id}` });
    }
    console.log(`\n⚖️ [OMEKA] Recherche des annotations codées dans ${documents.length} document(s)...`);

    const annotations: CodedAnnotation[] = [];
    let ignored = 0;
    for (const doc of documents) {
      // unités (phrases) du document, rapprochées par similarité des mots
      const units: { key: string; phrase: string; words: Set<string> }[] = [];
      const byUnitAndJudge = new Map<string, CodedAnnotation>();

      for (const ann of await loadAnnotations(omk, doc.id)) {
        if (!ann.code || !ann.author) {
          if (ann.code || ann.author) ignored++;
          continue;
        }
        const phrase = ann.phrase || ann.note;
        const w = words(phrase);
        let unit = units.find(u => jaccard(u.words, w) >= unitSimilarity);
        if (!unit) {
          unit = { key: `${doc.id}#${units.length + 1}`, phrase, words: w };
          units.push(unit);
        }
        // un juge ne compte qu'une fois par phrase (dernier code retenu)
        byUnitAndJudge.set(`${unit.key}|${ann.author}`, {
          itemId: unit.key,
          documentId: doc.id,
          documentTitle: doc.title,
          phrase: unit.phrase,
          annotatorId: ann.author,
          code: ann.code,
        });
      }
      annotations.push(...byUnitAndJudge.values());
    }

    const annotators = new Set(annotations.map(a => a.annotatorId));
    console.log(`⚖️ ${annotations.length} annotation(s) codée(s), ${new Set(annotations.map(a => a.itemId)).size} phrase(s), ${annotators.size} juge(s)` +
      (ignored ? ` (${ignored} ignorée(s) : code ou juge manquant)` : ""));

    return {
      annotations,
      stats: { documents: documents.length, annotations: annotations.length, annotators: annotators.size, ignored },
    };
  },
});
