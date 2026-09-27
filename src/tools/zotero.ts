// Client minimal pour l'API web de Zotero (v3)
import type { PdfAnnotation } from "./pdfExtract";
import { htmlToText } from "./attachmentExtract";
import { workflowConfig } from "../config";
import { splitCodes } from "./codebook";

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
function authorOf(item: any): string | undefined {
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
        };
      });
  }
}
