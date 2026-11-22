// Client minimal pour l'API web de Zotero (v3)
import crypto from "crypto";
import type { PdfAnnotation } from "../extraction/pdfExtract";
import { htmlToText } from "../extraction/attachmentExtract";
import { workflowConfig } from "../../config";
import { splitCodes } from "../analysis/codebook";

const API = "https://api.zotero.org";

// types d'annotation du lecteur Zotero → types PDF utilisés dans le reste du projet
const ANNOTATION_TYPES: Record<string, string> = {
  highlight: "Highlight",
  underline: "Underline",
  note: "Text",
  text: "FreeText",
  image: "Image",
  ink: "Ink",
};

// noms des marqueurs d'un item Zotero (type 1 = marqueur automatique)
export function tagNames(data: any): string[] {
  return (data?.tags ?? [])
    .filter((t: any) => workflowConfig.zotero.automaticTags || t.type !== 1)
    .map((t: any) => String(t.tag).trim())
    .filter(Boolean);
}

// bibliothèque Zotero : celle d'un groupe si ZOTERO_GROUP_ID est défini (annotations de plusieurs juges),
// sinon la bibliothèque personnelle de ZOTERO_USER_ID
export function zoteroLibraryPath(): string {
  const groupId = process.env.ZOTERO_GROUP_ID;
  return groupId ? `groups/${groupId}` : `users/${process.env.ZOTERO_USER_ID}`;
}

// URL web d'un élément de la bibliothèque (ex. "items/ABCD1234", "collections/EFGH5678")
export function zoteroWebUrl(path: string): string {
  return `https://www.zotero.org/${zoteroLibraryPath()}/${path}`;
}

// auteur d'une annotation ou d'une note : nom saisi dans l'annotation (PDF importé), sinon utilisateur Zotero qui l'a créée
export function authorOf(item: any): string | undefined {
  const d = item.data ?? {};
  const u = item.meta?.createdByUser;
  return d.annotationAuthorName || u?.username || u?.name || undefined;
}

export class Zotero {
  private headers: Record<string, string>;
  private prefix: string;

  constructor(userId: string, apiKey: string, groupId = process.env.ZOTERO_GROUP_ID) {
    this.headers = { "Zotero-API-Version": "3", Authorization: `Bearer ${apiKey}` };
    this.prefix = groupId ? `${API}/groups/${groupId}` : `${API}/users/${userId}`;
  }

  private async get(url: string) {
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`Zotero ${res.status} sur ${url.replace(API, "")}`);
    return res;
  }

  // parcourt toutes les pages d'une requête (100 résultats maximum par page)
  private async getAll(endpoint: string): Promise<any[]> {
    const items: any[] = [];
    let start = 0, total = Infinity;
    while (start < total) {
      const sep = endpoint.includes("?") ? "&" : "?";
      const res = await this.get(`${this.prefix}${endpoint}${sep}format=json&limit=100&start=${start}`);
      total = Number(res.headers.get("Total-Results") ?? 0);
      const page = await res.json();
      if (!page.length) break;
      items.push(...page);
      start += page.length;
    }
    return items;
  }

  // une page de résultats et le nombre total (tirage aléatoire dans une grande bibliothèque sans tout charger)
  async page(endpoint: string, start = 0, limit = 1): Promise<{ items: any[]; total: number }> {
    const sep = endpoint.includes("?") ? "&" : "?";
    const res = await this.get(`${this.prefix}${endpoint}${sep}format=json&limit=${limit}&start=${start}`);
    return { items: await res.json(), total: Number(res.headers.get("Total-Results") ?? 0) };
  }

  // tous les items d'une requête sur la bibliothèque (ex. "itemType=annotation", "top")
  itemsWhere(query: string) {
    return this.getAll(`/items?${query}`);
  }
  topItems() {
    return this.getAll(`/items/top`);
  }

  // items enfants d'un item (annotations d'une pièce jointe, notes d'une notice)
  children(key: string, itemType: string) {
    return this.getAll(`/items/${key}/children?itemType=${itemType}`);
  }

  collectionItems(collectionId: string) {
    return this.getAll(`/collections/${collectionId}/items`);
  }

  async item(key: string) {
    return (await this.get(`${this.prefix}/items/${key}?format=json`)).json();
  }

  // notices de premier niveau d'une collection, avec leur BibTeX et leur citation formatée (style CSL)
  collectionTopItems(collectionKey: string, style = "apa") {
    return this.getAll(`/collections/${collectionKey}/items/top?include=data,bibtex,citation&style=${encodeURIComponent(style)}&locale=fr-FR`);
  }

  // toutes les collections de la bibliothèque
  collections() {
    return this.getAll(`/collections`);
  }

  async collection(key: string) {
    return (await this.get(`${this.prefix}/collections/${key}?format=json`)).json();
  }

  async file(key: string): Promise<Buffer> {
    const res = await this.get(`${this.prefix}/items/${key}/file`);
    return Buffer.from(await res.arrayBuffer());
  }

  // ==========================================
  // Écriture (clé API avec droit d'écriture) : collections, notices, fichiers joints
  // ==========================================

  private async write(endpoint: string, body: unknown): Promise<any> {
    const res = await fetch(`${this.prefix}${endpoint}`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json", "Zotero-Write-Token": crypto.randomBytes(16).toString("hex") },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Zotero ${res.status} sur ${endpoint} : ${(await res.text()).slice(0, 300)}`);
    const data: any = await res.json();
    const failed = Object.values(data.failed ?? {}) as any[];
    if (failed.length) throw new Error(`Zotero a refusé l'écriture : ${failed.map(f => f.message).join(" ; ")}`);
    return data;
  }

  // crée une collection et renvoie sa clé
  async createCollection(name: string, parentCollection?: string): Promise<string> {
    const data = await this.write("/collections", [{ name, ...(parentCollection ? { parentCollection } : {}) }]);
    return data.successful["0"].key;
  }

  // crée des notices (50 au plus par requête) et renvoie leurs clés dans l'ordre
  async createItems(items: any[]): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < items.length; i += 50) {
      const data = await this.write("/items", items.slice(i, i + 50));
      const ok = data.successful ?? {};
      keys.push(...items.slice(i, i + 50).map((_, j) => ok[String(j)]?.key ?? ""));
    }
    return keys;
  }

  // pièce jointe (fichier importé) : notice « attachment » puis dépôt du fichier (protocole d'upload de l'API v3)
  async uploadAttachment(o: { buffer: Buffer; fileName: string; contentType: string; parentItem?: string; collection?: string; tags?: string[]; title?: string }): Promise<string> {
    const [key] = await this.createItems([{
      itemType: "attachment", linkMode: "imported_file", title: o.title ?? o.fileName, contentType: o.contentType, filename: o.fileName, charset: "",
      tags: (o.tags ?? []).map(tag => ({ tag })),
      ...(o.parentItem ? { parentItem: o.parentItem } : o.collection ? { collections: [o.collection] } : {}),
    }]);
    if (!key) throw new Error(`Zotero : notice de la pièce jointe ${o.fileName} non créée`);
    const form = { ...this.headers, "Content-Type": "application/x-www-form-urlencoded", "If-None-Match": "*" };
    const md5 = crypto.createHash("md5").update(o.buffer).digest("hex");
    const auth = await fetch(`${this.prefix}/items/${key}/file`, {
      method: "POST", headers: form,
      body: new URLSearchParams({ md5, filename: o.fileName, filesize: String(o.buffer.length), mtime: String(Date.now()) }),
    });
    if (!auth.ok) throw new Error(`Zotero ${auth.status} (autorisation du dépôt de ${o.fileName}) : ${(await auth.text()).slice(0, 300)}`);
    const a: any = await auth.json();
    if (a.exists) return key;
    const up = await fetch(a.url, { method: "POST", headers: { "Content-Type": a.contentType }, body: Buffer.concat([Buffer.from(a.prefix), o.buffer, Buffer.from(a.suffix)]) });
    if (!up.ok) throw new Error(`Zotero : dépôt du fichier ${o.fileName} refusé (${up.status})`);
    const reg = await fetch(`${this.prefix}/items/${key}/file`, { method: "POST", headers: form, body: new URLSearchParams({ upload: a.uploadKey }) });
    if (!reg.ok) throw new Error(`Zotero ${reg.status} (enregistrement du fichier ${o.fileName}) : ${(await reg.text()).slice(0, 300)}`);
    return key;
  }

  // notes enfants d'un item Zotero, converties en annotations (type "Note")
  async notes(parentKey: string): Promise<PdfAnnotation[]> {
    const children = await this.getAll(`/items/${parentKey}/children?itemType=note`);
    return children
      .map(c => {
        const { code, tags } = splitCodes(tagNames(c.data));
        const author = authorOf(c);
        return {
          page: 0, type: "Note", phrase: "", color: null, note: htmlToText(c.data.note ?? ""), tags,
          ...(code ? { code } : {}),
          ...(author ? { author } : {}),
          ...(c.data.dateAdded ? { date: c.data.dateAdded } : {}),
        };
      })
      .filter(n => n.note);
  }

  // annotations faites dans le lecteur Zotero (PDF, EPUB, snapshots) : ce sont des items enfants de la pièce jointe
  async annotations(attachmentKey: string): Promise<PdfAnnotation[]> {
    const children = await this.getAll(`/items/${attachmentKey}/children?itemType=annotation`);
    return children
      .filter(c => c.data.annotationText || c.data.annotationComment)
      .map(c => {
        const d = c.data;
        // un marqueur de la grille (ACC-S, DES-F…) est le code attribué par le juge, les autres sont des concepts
        const { code, tags } = splitCodes(tagNames(d));
        const author = authorOf(c);
        const hex: string = d.annotationColor ?? "";
        const rgb = /^#[0-9a-f]{6}$/i.test(hex) ? [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) : null;
        return {
          page: parseInt(d.annotationPageLabel, 10) || 0,
          type: ANNOTATION_TYPES[d.annotationType] ?? "Highlight",
          phrase: (d.annotationText ?? "").trim(),
          color: rgb ? { css: `rgb(${rgb.join(", ")})`, hex: hex.toLowerCase() } : null,
          note: (d.annotationComment ?? "").trim(),
          tags,
          ...(code ? { code } : {}),
          ...(author ? { author } : {}),
          ...(d.dateAdded ? { date: d.dateAdded } : {}),
        };
      });
  }
}

// une collection et toutes ses sous-collections (à tous les niveaux) ; la collection seule si la liste est indisponible
export async function collectionWithDescendants(zotero: Zotero, key: string): Promise<Set<string>> {
  const keys = new Set([key]);
  try {
    const children = new Map<string, string[]>();
    for (const c of await zotero.collections()) {
      const parent = c.data?.parentCollection;
      if (parent) children.set(parent, [...(children.get(parent) ?? []), c.key]);
    }
    const stack = [key];
    while (stack.length) for (const k of children.get(stack.pop()!) ?? []) if (!keys.has(k)) { keys.add(k); stack.push(k); }
  } catch { /* liste des collections indisponible : collection seule */ }
  return keys;
}
