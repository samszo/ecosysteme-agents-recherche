// Recherche des concepts (skos:Concept) dans Omeka S avant création : évite de recréer un concept
// de même identifiant ou de même titre. Aucun chargement global (les bases peuvent contenir des dizaines
// de milliers de concepts) : chaque concept est cherché à la demande, puis mémorisé pour la durée du run.
import type { Omk } from "./omk";
import { normalizeId } from "./cleanGraph";
import { workflowConfig } from "../config";

const { conceptClass } = workflowConfig.omeka;

export interface ConceptInput {
  id: string;
  label: string;
  category: string;
}

export class ConceptIndex {
  // clé normalisée (identifiant ou titre) → item Omeka, pour les concepts déjà rencontrés pendant ce run
  private byKey = new Map<string, number>();
  // recherches en cours, pour ne pas lancer deux fois la même requête ni créer deux fois le même concept
  private pending = new Map<string, Promise<number>>();
  created = 0;

  constructor(private omk: Omk) {}

  private keys(concept: { id?: string | undefined; label?: string | undefined }): string[] {
    return [...new Set([concept.id, concept.label].map(k => (k ? normalizeId(k) : "")).filter(Boolean))];
  }

  private register(omekaId: number, ...values: (string | undefined)[]) {
    for (const key of this.keys({ id: values[0], label: values[1] })) {
      if (!this.byKey.has(key)) this.byKey.set(key, omekaId);
    }
  }

  // recherche dans Omeka S : dcterms:identifier = id OU dcterms:title = libellé (une seule requête)
  async find(concept: { id?: string | undefined; label?: string | undefined }): Promise<number | undefined> {
    const keys = this.keys(concept);
    for (const key of keys) {
      const known = this.byKey.get(key);
      if (known) return known;
    }

    const params = new URLSearchParams();
    let i = 0;
    for (const [term, text] of [["dcterms:identifier", concept.id], ["dcterms:title", concept.label], ["skos:prefLabel", concept.label]] as const) {
      if (!text || !this.omk.getPropByTerm(term)) continue;
      params.set(`property[${i}][joiner]`, i === 0 ? "and" : "or");
      params.set(`property[${i}][property]`, term);
      params.set(`property[${i}][type]`, "eq");
      params.set(`property[${i}][text]`, text);
      i++;
    }
    if (!i) return undefined;
    const cl = this.omk.getClassByTerm(conceptClass);
    if (cl) params.set("resource_class_id[]", String(cl["o:id"]));
    params.set("per_page", "10");

    const items: any[] = await this.omk.searchItems(params.toString());
    // la recherche "eq" d'Omeka dépend de la collation MySQL : on confirme la correspondance côté client
    // (sans casse ni accents) et on privilégie l'identifiant sur le titre
    const match =
      items.find(it => it["dcterms:identifier"]?.some((v: any) => keys.includes(normalizeId(v["@value"] ?? "")))) ??
      items.find(it => keys.includes(normalizeId(it["o:title"] ?? "")));
    if (!match) return undefined;

    this.register(match["o:id"], match["dcterms:identifier"]?.[0]?.["@value"], match["o:title"]);
    this.register(match["o:id"], concept.id, concept.label);
    return match["o:id"];
  }

  // renvoie l'item Omeka du concept, en le créant s'il n'existe ni par identifiant ni par titre
  getOrCreate(concept: ConceptInput): Promise<number> {
    const key = this.keys(concept)[0] ?? concept.id;
    const running = this.pending.get(key);
    if (running) return running;

    const p = (async () => {
      const found = await this.find(concept);
      if (found) return found;

      const hasClass = !!this.omk.getClassByTerm(conceptClass);
      const item = await this.omk.createItem({
        ...(hasClass ? { "o:resource_class": conceptClass } : {}),
        "dcterms:title": concept.label,
        "dcterms:type": concept.category,
        "dcterms:identifier": concept.id,
        ...(this.omk.getPropByTerm("skos:prefLabel") ? { "skos:prefLabel": concept.label } : {}),
      });
      this.register(item["o:id"], concept.id, concept.label);
      this.created++;
      console.log(`   ✅ Concept créé : ${concept.label} (Omeka ID: ${item["o:id"]})`);
      return item["o:id"] as number;
    })();

    this.pending.set(key, p);
    p.finally(() => this.pending.delete(key)).catch(() => {});
    return p;
  }
}

// index partagé par l'enregistrement des annotations et l'export du graphe
let instance: ConceptIndex | null = null;
export async function getConceptIndex(omk: Omk): Promise<ConceptIndex> {
  if (!instance) instance = new ConceptIndex(omk);
  return instance;
}
