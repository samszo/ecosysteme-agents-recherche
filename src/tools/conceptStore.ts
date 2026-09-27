// Relecture dans Omeka S des concepts déjà extraits pour des pièces jointes (dcterms:subject → skos:Concept)
import type { Omk } from "./omk";
import type { Graph, GraphNode } from "./cleanGraph";
import { workflowConfig } from "../config";

const { subjectTerm, relationTerm } = workflowConfig.omeka;

const val = (item: any, term: string) => item[term]?.[0]?.["@value"] ?? "";

// articles : { zoteroKey, omekaItemId } des pièces jointes dont l'extraction est déjà faite
export async function loadConceptGraph(omk: Omk, articles: { zoteroKey: string; omekaItemId: number }[]): Promise<Graph> {
  const nodesByOmekaId = new Map<number, GraphNode>();
  const conceptItems = new Map<number, any>();

  for (const article of articles) {
    const item = await omk.getItem(article.omekaItemId);
    const rids: number[] = (item[subjectTerm] ?? []).map((v: any) => v.value_resource_id).filter(Boolean);

    for (const rid of rids) {
      const existing = nodesByOmekaId.get(rid);
      if (existing) {
        if (!existing.sources!.includes(article.zoteroKey)) existing.sources!.push(article.zoteroKey);
        continue;
      }
      try {
        const concept = await omk.getItem(rid);
        conceptItems.set(rid, concept);
        nodesByOmekaId.set(rid, {
          id: val(concept, "dcterms:identifier") || `omeka_${rid}`,
          label: val(concept, "dcterms:title") || concept["o:title"] || `Concept ${rid}`,
          category: val(concept, "dcterms:type") || "concept",
          omekaId: rid,
          sources: [article.zoteroKey],
        });
      } catch (e) {
        console.warn(`   ⚠️ Concept Omeka ${rid} illisible :`, (e as Error).message);
      }
    }
  }

  // relations entre concepts rechargés
  const edges = [];
  for (const [rid, concept] of conceptItems) {
    const source = nodesByOmekaId.get(rid)!;
    for (const v of concept[relationTerm] ?? []) {
      const target = nodesByOmekaId.get(v.value_resource_id);
      if (target) edges.push({ source: source.id, target: target.id, relation: "relation" });
    }
  }

  return { nodes: [...nodesByOmekaId.values()], edges };
}
