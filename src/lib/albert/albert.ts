// Client minimal de l'API Albert pour le RAG : collections, documents, recherche, complétions
// https://guides.ia.numerique.gouv.fr/albert-api/guides/rag (spécification : <provider>/../openapi.json)
import { containerUrl, networkError } from "../omeka/omk";

export interface AlbertCollection {
  id: number;
  name: string;
  description?: string | null;
  visibility?: "private" | "public" | null;
  documents?: number;
  size?: number;
}

export interface AlbertDocument {
  id: number;
  name: string;
  collection_id?: number;
  chunks?: number;
  created?: number;
}

// consommation renvoyée par Albert (recherche, complétion) : tokens, coût et impacts déclarés par la plateforme
export interface AlbertUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
  impacts?: { kWh?: number; kgCO2eq?: number };
}

export interface AlbertSearchResult {
  method: string;
  score: number;
  chunk: { id: number; collection_id: number; document_id: number; content: string; metadata?: Record<string, string | number | boolean> | null };
}

// métadonnées d'un document (recopiées sur chaque extrait) : 10 clés au plus, valeurs de 255 caractères au plus
export function chunkMetadata(values: Record<string, string | number | boolean | null | undefined>) {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === null || v === undefined || v === "") continue;
    if (Object.keys(out).length >= 10) break;
    out[k.slice(0, 255)] = typeof v === "string" ? v.slice(0, 255) : v;
  }
  return out;
}

export class Albert {
  private base: string;

  // base : URL de l'API avec /v1 (config.models.provider)
  constructor(base: string, private apiKey: string) {
    if (!apiKey) throw new Error("Clé de l'API Albert manquante (ALBERT_API_KEY)");
    this.base = base.replace(/\/+$/, "");
  }

  private async request(endpoint: string, init: RequestInit = {}): Promise<any> {
    const url = containerUrl(`${this.base}${endpoint}`);
    let res: Response;
    try {
      res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${this.apiKey}`, ...(init.headers ?? {}) } });
    } catch (e) {
      throw networkError(url, e);
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`Albert ${res.status} sur ${endpoint.replace(/\?.*$/, "")} : ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
  }

  private json(endpoint: string, method: string, body: unknown) {
    return this.request(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  // ==========================================
  // Collections
  // ==========================================

  async collections(query: { name?: string; visibility?: "private" | "public" } = {}): Promise<AlbertCollection[]> {
    const all: AlbertCollection[] = [];
    for (let offset = 0; ; offset += 100) {
      const qs = new URLSearchParams({ offset: String(offset), limit: "100", ...(query.name ? { name: query.name } : {}), ...(query.visibility ? { visibility: query.visibility } : {}) });
      const page = (await this.request(`/collections?${qs}`))?.data ?? [];
      all.push(...page);
      if (page.length < 100) return all;
    }
  }

  async createCollection(name: string, description = ""): Promise<number> {
    const res = await this.json("/collections", "POST", { name, description, visibility: "private" });
    return res.id;
  }

  // collection privée de ce nom (la plus ancienne si plusieurs portent le même nom), créée au besoin
  async ensureCollection(name: string, description = ""): Promise<{ collection: AlbertCollection; created: boolean }> {
    const existing = (await this.collections({ name, visibility: "private" })).filter(c => c.name === name).sort((a, b) => a.id - b.id);
    if (existing.length) return { collection: existing[0]!, created: false };
    const id = await this.createCollection(name, description);
    return { collection: { id, name, description, visibility: "private", documents: 0 }, created: true };
  }

  // ==========================================
  // Documents
  // ==========================================

  async documents(collectionId: number): Promise<AlbertDocument[]> {
    const all: AlbertDocument[] = [];
    for (let offset = 0; ; offset += 100) {
      const qs = new URLSearchParams({ collection_id: String(collectionId), offset: String(offset), limit: "100" });
      const page = (await this.request(`/documents?${qs}`))?.data ?? [];
      all.push(...page);
      if (page.length < 100) return all;
    }
  }

  // dépôt d'un fichier (PDF, TXT, HTML, Markdown ; 20 Mo au plus) : extraction, découpage, vectorisation
  async createDocument(options: {
    collectionId: number;
    content: string | Buffer;
    fileName: string;
    type?: string;
    name?: string;
    metadata?: Record<string, string | number | boolean>;
    chunkSize?: number;
    chunkOverlap?: number;
    presetSeparators?: string;
  }): Promise<number> {
    const fd = new FormData();
    const bytes = typeof options.content === "string" ? Buffer.from(options.content, "utf-8") : options.content;
    fd.append("file", new Blob([new Uint8Array(bytes)], { type: options.type ?? "text/markdown" }), options.fileName);
    fd.append("collection_id", String(options.collectionId));
    if (options.name) fd.append("name", options.name);
    if (options.chunkSize) fd.append("chunk_size", String(options.chunkSize));
    if (options.chunkOverlap !== undefined) fd.append("chunk_overlap", String(options.chunkOverlap));
    if (options.presetSeparators) fd.append("preset_separators", options.presetSeparators);
    if (options.metadata && Object.keys(options.metadata).length) fd.append("metadata", JSON.stringify(options.metadata));
    const res = await this.request("/documents", { method: "POST", body: fd });
    return res.id;
  }

  async deleteDocument(id: number) {
    await this.request(`/documents/${id}`, { method: "DELETE" });
  }

  // ==========================================
  // Recherche et complétion
  // ==========================================

  async search(options: { collectionIds: number[]; query: string; limit?: number; method?: "hybrid" | "semantic" | "lexical"; scoreThreshold?: number }): Promise<{ data: AlbertSearchResult[]; usage: AlbertUsage | null }> {
    const res = await this.json("/search", "POST", {
      collection_ids: options.collectionIds,
      query: options.query,
      limit: options.limit ?? 10,
      method: options.method ?? "hybrid",
      // le seuil ne s'applique qu'à la recherche sémantique
      ...(options.method === "semantic" && options.scoreThreshold ? { score_threshold: options.scoreThreshold } : {}),
    });
    return { data: res?.data ?? [], usage: res?.usage ?? null };
  }

  async chat(options: { model: string; messages: { role: "system" | "user" | "assistant"; content: string }[]; temperature?: number }): Promise<{ text: string; usage: AlbertUsage | null; model: string }> {
    const res = await this.json("/chat/completions", "POST", {
      model: options.model,
      messages: options.messages,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    });
    return { text: res?.choices?.[0]?.message?.content ?? "", usage: res?.usage ?? null, model: res?.model ?? options.model };
  }
}
