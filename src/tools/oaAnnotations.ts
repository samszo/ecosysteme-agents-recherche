// Stockage des annotations PDF dans Omeka S sous forme d'items oa:Annotation (W3C Web Annotation)
// nécessite le vocabulaire "oa" (http://www.w3.org/ns/oa#) dans l'instance Omeka S
import type { Omk } from "./omk";
import type { PdfAnnotation } from "./pdfExtract";
import { getConceptIndex } from "./conceptIndex";
import { normalizeId } from "./cleanGraph";
import { positionForColor } from "./annotationPositions";
import { workflowConfig } from "../config";

const OA_NS = "http://www.w3.org/ns/oa#";

// motivation W3C correspondant au type d'annotation PDF
const MOTIVATIONS: Record<string, string> = {
  Highlight: "highlighting",
  Underline: "highlighting",
  Squiggly: "highlighting",
  StrikeOut: "editing",
  Text: "commenting",
  FreeText: "commenting",
  Note: "commenting", // note Zotero rattachée à la notice
};

let warned = false;

// vérifie que la classe oa:Annotation est disponible dans l'instance Omeka S
export function hasOaSupport(omk: Omk): boolean {
  const ok = !!omk.getClassByTerm("oa:Annotation") && !!omk.getPropByTerm("oa:hasTarget");
  if (!ok && !warned) {
    console.warn("⚠️ [OMEKA] Vocabulaire 'oa' absent de l'instance Omeka S : les annotations ne seront pas stockées.");
    warned = true;
  }
  return ok;
}

// crée un item oa:Annotation par annotation, ciblant l'item de l'article
export async function saveAnnotations(omk: Omk, targetItemId: number, annotations: PdfAnnotation[], articleTitle: string) {
  if (!annotations.length || !hasOaSupport(omk)) return [];

  const created: number[] = [];
  for (const ann of annotations) {
    const motivation = MOTIVATIONS[ann.type] ?? "highlighting";
    const label = ann.phrase || ann.note;
    const data: Record<string, any> = {
      "o:resource_class": "oa:Annotation",
      "dcterms:title": `${ann.page ? `p.${ann.page}` : "Note"} · ${label.length > 80 ? label.slice(0, 80) + "…" : label}`,
      "dcterms:type": ann.type,
      "oa:hasTarget": { rid: targetItemId },
      "oa:motivatedBy": { u: OA_NS + motivation, l: motivation },
    };
    // FragmentSelector PDF (RFC 3778) ; une note Zotero n'a pas de page
    if (ann.page) data["oa:hasSelector"] = `page=${ann.page}`;
    // marqueurs Zotero de la note ou de l'annotation : liens vers les items concepts
    if (ann.tags?.length) {
      const index = await getConceptIndex(omk);
      const links: ({ rid: number } | string)[] = [];
      for (const tag of ann.tags) {
        try {
          links.push({ rid: await index.getOrCreate({ id: normalizeId(tag), label: tag, category: workflowConfig.tagCategory }) });
        } catch (e) {
          console.warn(`⚠️ [OMEKA] Concept du marqueur "${tag}" non créé, conservé en texte :`, (e as Error).message);
          links.push(tag);
        }
      }
      data["curation:tag"] = links;
    }
    // positionnement du chercheur déduit de la couleur
    const position = positionForColor(ann.color?.hex);
    if (position) data["curation:category"] = position.position;
    // code de la grille d'annotation et juge qui l'a attribué (accord inter-juges)
    if (ann.code) data[workflowConfig.omeka.codeTerm] = ann.code;
    if (ann.author) data[workflowConfig.omeka.authorTerm] = ann.author;
    if (ann.phrase) data["oa:exact"] = ann.phrase;
    if (ann.note) data["oa:bodyValue"] = ann.note;
    if (ann.color) data["oa:styleClass"] = ann.color.hex;

    // on ignore les propriétés oa absentes de l'instance plutôt que d'échouer
    for (const term of Object.keys(data)) {
      if (!term.startsWith("o:") && !omk.getPropByTerm(term)) delete data[term];
    }

    try {
      const item = await omk.createItem(data);
      created.push(item["o:id"]);
    } catch (e) {
      console.warn(`⚠️ [OMEKA] Échec de la création de l'annotation p.${ann.page} de ${articleTitle} :`, (e as Error).message);
    }
  }
  console.log(`🖍️ [OMEKA] ${created.length}/${annotations.length} annotation(s) oa:Annotation créée(s)`);
  return created;
}

// relit les annotations oa:Annotation qui ciblent l'item d'un article
export async function loadAnnotations(omk: Omk, targetItemId: number): Promise<PdfAnnotation[]> {
  if (!hasOaSupport(omk)) return [];
  const cl = omk.getClassByTerm("oa:Annotation");
  const items = await omk.searchItemsByProp("oa:hasTarget", targetItemId, `resource_class_id[]=${cl["o:id"]}&per_page=1000`, "res");
  const val = (item: any, term: string) => item[term]?.[0]?.["@value"] ?? "";

  return items
    .map((item: any): PdfAnnotation => {
      const hex = val(item, "oa:styleClass");
      const rgb = /^#[0-9a-f]{6}$/i.test(hex) ? [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) : null;
      return {
        page: Number(val(item, "oa:hasSelector").replace("page=", "")) || 0,
        type: val(item, "dcterms:type") || "Highlight",
        phrase: val(item, "oa:exact"),
        color: rgb ? { css: `rgb(${rgb.join(", ")})`, hex } : null,
        note: val(item, "oa:bodyValue"),
        // un marqueur est un lien vers un concept (display_title) ou, à défaut, un texte
        tags: (item["curation:tag"] ?? []).map((v: any) => v.display_title ?? v["@value"]).filter(Boolean),
        ...(val(item, workflowConfig.omeka.codeTerm) ? { code: val(item, workflowConfig.omeka.codeTerm) } : {}),
        ...(val(item, workflowConfig.omeka.authorTerm) ? { author: val(item, workflowConfig.omeka.authorTerm) } : {}),
      };
    })
    .sort((a: PdfAnnotation, b: PdfAnnotation) => a.page - b.page);
}
