// Citations tirées au hasard de la bibliothèque Zotero ou d'une collection : passages surlignés (annotations) et notes
import { Zotero, authorOf, collectionWithDescendants, zoteroWebUrl } from "../zotero/zotero";
import { htmlToText } from "../extraction/attachmentExtract";
import type { ChaoticumConfig } from "../../config/chaoticum";
import type { Rng } from "./random";

export interface Citation {
  key: string;
  kind: "annotation" | "note";
  text: string;
  comment: string;
  page: string;
  color: string | null;
  author: string | null;
  date: string | null;
  // notice Zotero d'où vient la citation
  source: { key: string | null; title: string; creators: string; year: string; url: string | null };
}

type CitationsConfig = ChaoticumConfig["citations"];

// texte de la citation, raccourci à la fin d'une phrase si besoin
function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return (end > max * 0.5 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "")) + " […]";
}

const textOf = (it: any) => (it.data.itemType === "annotation" ? String(it.data.annotationText ?? "") : htmlToText(String(it.data.note ?? "")));

export class CitationPicker {
  private zotero: Zotero;
  private items = new Map<string, Promise<any>>();

  constructor(private c: CitationsConfig, private rng: Rng) {
    this.zotero = new Zotero(process.env.ZOTERO_USER_ID ?? "", process.env.ZOTERO_API_KEY ?? "");
  }

  private item(key: string) {
    if (!this.items.has(key)) this.items.set(key, this.zotero.item(key).catch(() => null));
    return this.items.get(key)!;
  }

  // notice d'une annotation (annotation → pièce jointe → notice) ou d'une note (note → notice)
  private async source(it: any): Promise<Citation["source"]> {
    let parent = it.data.parentItem ? await this.item(it.data.parentItem) : null;
    if (parent?.data?.itemType === "attachment" && parent.data.parentItem) parent = (await this.item(parent.data.parentItem)) ?? parent;
    const d = parent?.data ?? {};
    const names = (d.creators ?? []).map((c: any) => c.lastName || c.name).filter(Boolean);
    return {
      key: parent?.key ?? null,
      title: d.title || "(sans titre)",
      creators: names.length > 3 ? `${names.slice(0, 3).join(", ")} et al.` : names.join(", "),
      year: /\b(1[5-9]|20)\d{2}\b/.exec(d.date ?? "")?.[0] ?? "",
      url: parent?.key ? zoteroWebUrl(`items/${parent.key}`) : null,
    };
  }

  private async toCitation(it: any): Promise<Citation> {
    const d = it.data;
    return {
      key: it.key,
      kind: d.itemType === "annotation" ? "annotation" : "note",
      text: clip(textOf(it), this.c.maxLength),
      comment: String(d.annotationComment ?? "").trim(),
      page: String(d.annotationPageLabel ?? ""),
      color: d.annotationColor ?? null,
      author: authorOf(it) ?? null,
      date: d.dateAdded ?? null,
      source: await this.source(it),
    };
  }

  private acceptable = (it: any) => textOf(it).replace(/\s+/g, " ").trim().length >= this.c.minLength;

  // n citations distinctes ; chooser (facultatif) retient les plus pertinentes parmi `candidates` tirées au hasard
  async pick(n: number, chooser?: (texts: string[], n: number) => Promise<number[]>, candidates = n): Promise<Citation[]> {
    const want = Math.max(n, chooser ? candidates : n);
    let pool = this.c.scope === "collection" ? this.sample(await this.collectionPool(), want) : await this.fromLibrary(want);
    // collection sans citation exploitable : toute la bibliothèque plutôt qu'un échec
    if (!pool.length) {
      console.warn(`⚠️ [ZOTERO] Aucune annotation ni note d'au moins ${this.c.minLength} caractères dans la collection ${this.c.collection} et ses sous-collections : citations tirées de toute la bibliothèque.`);
      pool = await this.fromLibrary(want);
    }
    let chosen: any[] = [];
    if (chooser && pool.length > n) {
      const order = await chooser(pool.map(it => clip(textOf(it), 300)), n);
      chosen = order.map(i => pool[i]);
      if (chosen.length) console.log(`🎯 ${chosen.length} citation(s) retenue(s) pour leur proximité avec le thème, parmi ${pool.length}`);
    }
    // complément au hasard (choix par thème absent ou incomplet)
    const rest = pool.filter(it => !chosen.includes(it));
    while (chosen.length < n && rest.length) chosen.push(rest.splice(Math.floor(this.rng() * rest.length), 1)[0]);
    // moins de citations que d'écrans : on réutilise
    while (chosen.length < n) chosen.push(pool[Math.floor(this.rng() * pool.length)]);
    return Promise.all(chosen.map(it => this.toCitation(it)));
  }

  // tirage sans remise de k éléments
  private sample<T>(list: T[], k: number): T[] {
    const left = [...list], out: T[] = [];
    while (out.length < k && left.length) out.push(left.splice(Math.floor(this.rng() * left.length), 1)[0]!);
    return out;
  }

  // collection et ses sous-collections : toutes les annotations de leurs pièces jointes et leurs notes
  private async collectionPool() {
    if (!this.c.collection) throw new Error("Collection Zotero des citations non choisie");
    const keys = await collectionWithDescendants(this.zotero, this.c.collection);
    const items: any[] = [];
    // un document de plusieurs sous-collections n'est compté qu'une fois
    const byKey = new Map<string, any>();
    for (const k of keys) for (const it of await this.zotero.collectionItems(k)) byKey.set(it.key, it);
    items.push(...byKey.values());
    const pool: any[] = [];
    for (const att of items.filter(it => it.data.itemType === "attachment")) {
      pool.push(...(await this.zotero.children(att.key, "annotation").catch(() => [])));
    }
    if (this.c.includeNotes) pool.push(...items.filter(it => it.data.itemType === "note"));
    const candidates = pool.filter(this.acceptable);
    console.log(`📚 [ZOTERO] ${candidates.length} citation(s) possible(s) dans la collection ${this.c.collection}${keys.size > 1 ? ` et ses ${keys.size - 1} sous-collection(s)` : ""}`);
    return candidates;
  }

  // bibliothèque : tirage d'un rang au hasard parmi toutes les annotations (et notes), un item par requête
  private async fromLibrary(n: number) {
    const kinds = ["annotation", ...(this.c.includeNotes ? ["note"] : [])];
    const totals = await Promise.all(kinds.map(async k => ({ k, total: (await this.zotero.page(`/items?itemType=${k}`, 0, 1)).total })));
    const sum = totals.reduce((s, t) => s + t.total, 0);
    console.log(`📚 [ZOTERO] Bibliothèque : ${totals.map(t => `${t.total} ${t.k}(s)`).join(", ")}`);
    if (!sum) throw new Error("Aucune annotation ni note dans la bibliothèque Zotero");
    const out: any[] = [], seen = new Set<string>();
    for (let attempt = 0; out.length < n && attempt < n * 6; attempt++) {
      let r = Math.floor(this.rng() * sum);
      const t = totals.find(x => (r < x.total ? true : ((r -= x.total), false)))!;
      const it = (await this.zotero.page(`/items?itemType=${t.k}&sort=dateAdded`, r, 1)).items[0];
      if (!it || seen.has(it.key) || !this.acceptable(it)) continue;
      seen.add(it.key);
      out.push(it);
    }
    if (!out.length) throw new Error("Aucune citation exploitable trouvée dans la bibliothèque");
    return out;
  }
}
