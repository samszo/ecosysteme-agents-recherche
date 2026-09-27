// Items Omeka S représentant les collections Zotero (un item Zotero peut appartenir à plusieurs collections)
import { getOmk, type Omk } from "./omk";
import { Zotero, zoteroWebUrl } from "./zotero";

const COLLECTION_TYPE = "Collection Zotero";

export class ZoteroCollections {
  private cache = new Map<string, Promise<number>>();

  constructor(private omk: Omk, private zotero: Zotero, private userId: string) {}

  collectionUrl(key: string) {
    return zoteroWebUrl(`collections/${key}`);
  }

  // item Omeka de la collection (créé au premier appel, puis réutilisé)
  itemId(key: string): Promise<number> {
    if (!this.cache.has(key)) {
      const p = this.findOrCreate(key);
      // en cas d'échec, on retentera au prochain appel
      p.catch(() => this.cache.delete(key));
      this.cache.set(key, p);
    }
    return this.cache.get(key)!;
  }

  private async findOrCreate(key: string): Promise<number> {
    const existing = await this.omk.searchItemsByProp("dcterms:identifier", key);
    const found = existing.find((it: any) => it["dcterms:type"]?.some((v: any) => v["@value"] === COLLECTION_TYPE));
    if (found) return found["o:id"];

    const collection = await this.zotero.collection(key);
    const name: string = collection.data?.name ?? key;
    // sous-collection : lien vers la collection parente
    const parentKey = collection.data?.parentCollection;
    const parentId = parentKey ? await this.itemId(parentKey).catch(() => null) : null;

    const item = await this.omk.createItem({
      ...(this.omk.getClassByTerm("bibo:Collection") ? { "o:resource_class": "bibo:Collection" } : {}),
      "dcterms:title": name,
      "dcterms:identifier": key,
      "dcterms:type": COLLECTION_TYPE,
      "dcterms:source": { u: this.collectionUrl(key), l: `Collection Zotero ${name}` },
      ...(parentId ? { "dcterms:isPartOf": { rid: parentId } } : {}),
    });
    console.log(`🗃️ [OMEKA] Collection Zotero "${name}" créée (Item ID ${item["o:id"]})`);
    return item["o:id"];
  }
}

let instance: ZoteroCollections | null = null;
export async function getZoteroCollections(): Promise<ZoteroCollections> {
  if (!instance) {
    const userId = process.env.ZOTERO_USER_ID;
    const apiKey = process.env.ZOTERO_API_KEY;
    if (!userId || !apiKey) throw new Error("Identifiants Zotero manquants dans le .env");
    instance = new ZoteroCollections(await getOmk(), new Zotero(userId, apiKey), userId);
  }
  return instance;
}
