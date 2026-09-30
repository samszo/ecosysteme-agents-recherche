// Client pour l'API REST d'Omeka S
// inspiré de exploDeleuze/modules/omk.js, adapté à Node.js (fetch asynchrone, sans DOM ni loader)

import { workflowConfig } from "../../config";

// Dans le conteneur Docker (RUNNING_IN_DOCKER=1), "localhost" désigne le conteneur lui-même :
// les requêtes vers un service de la machine hôte passent par host.docker.internal.
// Les liens affichés à l'utilisateur gardent l'URL d'origine.
export function containerUrl(url: string): string {
  if (process.env.RUNNING_IN_DOCKER !== "1") return url;
  return url.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/i, "$1host.docker.internal");
}

// message explicite pour une erreur réseau ("fetch failed" n'indique pas la cause)
export function networkError(url: string, e: unknown): Error {
  const err = e as any;
  const code = err?.cause?.code ?? err?.cause?.errors?.[0]?.code ?? "";
  const target = url.split("?")[0];
  const hints: Record<string, string> = {
    ECONNREFUSED: "le serveur refuse la connexion (service arrêté ou mauvais port)",
    ENOTFOUND: "nom de serveur introuvable",
    EAI_AGAIN: "résolution DNS impossible",
    ETIMEDOUT: "délai de connexion dépassé",
    ECONNRESET: "connexion interrompue",
    CERT_HAS_EXPIRED: "certificat HTTPS expiré",
    DEPTH_ZERO_SELF_SIGNED_CERT: "certificat HTTPS auto-signé",
  };
  let message = `${target} injoignable : ${hints[code] ?? (code || err?.cause?.message || err?.message)}`;
  if (process.env.RUNNING_IN_DOCKER === "1" && /host\.docker\.internal/.test(target)) {
    message += ". Depuis Docker, vérifier que le serveur web de la machine hôte est démarré (sous Linux, il ne doit pas écouter uniquement sur 127.0.0.1).";
  }
  return new Error(message);
}

export type OmkResourceType = "items" | "media" | "item_sets";
export type OmkMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OmkParams {
  api: string;
  ident?: string;
  key?: string;
  mail?: string;
  vocabs?: string[];
}

// Valeurs acceptées par formatData :
// - une chaîne ou un nombre → literal
// - { rid } → lien vers une ressource Omeka
// - { u, l } → URI avec label
// - tout autre objet → literal JSON
export type OmkValue = string | number | { rid: number } | { u: string; l?: string } | Record<string, any>;
export type OmkData = Record<string, OmkValue | OmkValue[] | any>;

const types: Record<OmkResourceType, string> = { items: "o:Item", media: "o:Media", item_sets: "o:ItemSet" };

export class Omk {
  api: string;
  // URL de l'API telle que saisie (liens affichés), api pouvant être adaptée au conteneur Docker
  publicApi: string;
  ident: string | false;
  key: string | false;
  mail: string | false;
  vocabs: string[];
  user: any = false;
  props: any[] = [];
  class: any[] = [];
  rts: any[] = [];
  items = new Map<number, any>();
  medias = new Map<number, any>();
  owners = new Map<number, any>();
  resources = new Map<string, any>();
  perPage = 100;
  private initPromise: Promise<void> | null = null;

  constructor(params: OmkParams) {
    // on normalise l'URL de l'API pour qu'elle se termine par "/"
    const api = params.api.endsWith("/") ? params.api : params.api + "/";
    // URL affichée dans les liens (admin, médias) et URL utilisée pour les requêtes (adaptée au conteneur)
    this.publicApi = api;
    this.api = containerUrl(api);
    this.ident = params.ident ?? false;
    this.key = params.key ?? false;
    this.mail = params.mail ?? false;
    this.vocabs = params.vocabs ?? ["dcterms", "ma", "oa", "jdc", "bibo", "skos", "foaf", "bio"];
  }

  // récupère les propriétés, les classes et les modèles de ressource (une seule fois)
  init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        await Promise.all(this.vocabs.flatMap(v => [this.getProps(v), this.getClass(v)]));
        await this.setRT();
      })();
    }
    return this.initPromise;
  }

  // ==========================================
  // UTILITAIRES HTTP
  // ==========================================

  // construit l'URL d'un endpoint avec la requête et les clés d'authentification
  url(endpoint: string, query: string | Record<string, string | number> = "", auth = true): string {
    const params = new URLSearchParams(typeof query === "string" ? query : Object.entries(query).map(([k, v]) => [k, String(v)]));
    if (auth && this.ident && this.key) {
      params.set("key_identity", this.ident);
      params.set("key_credential", this.key);
    }
    const qs = params.toString();
    return this.api + endpoint + (qs ? "?" + qs : "");
  }

  async request(url: string, method: OmkMethod = "GET", data?: any, file?: { buffer: Buffer; fileName: string; type?: string }): Promise<any> {
    const options: RequestInit = { method };
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      if (file) {
        const fd = new FormData();
        fd.append("data", JSON.stringify(data));
        fd.append("file[0]", new Blob([file.buffer], { type: file.type ?? "application/octet-stream" }), file.fileName);
        options.body = fd;
      } else {
        options.body = JSON.stringify(data);
        options.headers = { "Content-Type": "application/json" };
      }
    }
    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (e) {
      throw networkError(url, e);
    }
    if (!response.ok) {
      throw new Error(`Omeka S ${method} ${url.split("?")[0]} : ${response.status} ${await response.text()}`);
    }
    return method === "DELETE" ? true : response.json();
  }

  // ==========================================
  // VOCABULAIRES, CLASSES, MODÈLES
  // ==========================================

  async setRT() {
    this.rts = await this.request(this.url("resource_templates", { per_page: 1000 }));
    return this.rts;
  }
  getRt(label: string) {
    return this.rts.find(rt => rt["o:label"] == label);
  }
  getRtById(id: number) {
    return this.rts.find(rt => rt["o:id"] == id);
  }
  getRtId(label: string) {
    return this.getRt(label)?.["o:id"];
  }

  async getProps(prefix: string) {
    const data = await this.request(this.url("properties", { per_page: 1000, vocabulary_prefix: prefix }));
    this.props.push(...data);
    return data;
  }
  getPropByTerm(t: string) {
    return this.props.find(prp => prp["o:term"] == t);
  }
  getPropId(t: string) {
    return this.getPropByTerm(t)?.["o:id"];
  }

  async getClass(prefix: string) {
    const data = await this.request(this.url("resource_classes", { per_page: 1000, vocabulary_prefix: prefix }));
    this.class.push(...data);
    return data;
  }
  getClassByName(cl: string) {
    return this.class.find(c => c["o:label"].toLowerCase() == cl.toLowerCase());
  }
  getClassByTerm(cl: string) {
    return this.class.find(c => c["o:term"].toLowerCase() == cl.toLowerCase());
  }

  // ==========================================
  // LECTURE
  // ==========================================

  async getResource(url: string) {
    if (this.resources.has(url)) return this.resources.get(url);
    const rs = await this.request(url);
    this.resources.set(url, rs);
    return rs;
  }
  getResourceType(id: number, type: OmkResourceType = "items") {
    return this.getResource(this.url(`${type}/${id}`));
  }

  async getItem(id: number) {
    if (this.items.has(id)) return this.items.get(id);
    const rs = await this.request(this.url(`items/${id}`));
    this.items.set(id, rs);
    return rs;
  }

  async getMedia(id: number) {
    if (this.medias.has(id)) return this.medias.get(id);
    const rs = await this.request(this.url(`media/${id}`));
    this.medias.set(id, rs);
    return rs;
  }

  async getOwner(id: number) {
    if (this.owners.has(id)) return this.owners.get(id);
    const rs = await this.request(this.url(`users/${id}`));
    this.owners.set(id, rs);
    return rs;
  }

  async getUser() {
    const data = await this.request(this.url("users", { email: this.mail || "" }));
    this.user = data.length ? data[0] : false;
    return this.user;
  }

  // ajoute à l'item la liste de ses médias (et éventuellement ceux des items liés par la propriété linkMedia)
  async getMedias(p: any, linkMedia = "") {
    p.medias = await Promise.all((p["o:media"] ?? []).map((m: any) => this.request(m["@id"])));
    if (linkMedia && p[linkMedia]) await this.getLinkMedias(p, linkMedia);
    return p.medias;
  }
  async getLinkMedias(p: any, linkMedia: string) {
    p.medias = p.medias ?? [];
    for (const i of p[linkMedia]) {
      const item = await this.request(i["@id"]);
      p.medias.push(...(await this.getMedias(item)));
    }
    return p.medias;
  }

  async getRandomItemByClass(cl: string) {
    const c = this.getClassByName(cl);
    if (!c) throw new Error(`Classe inconnue : ${cl}`);
    const rs = await this.request(this.url("items", { resource_class_id: c["o:id"] }));
    return rs[Math.floor(Math.random() * rs.length)];
  }

  searchItems(query: string | Record<string, string | number>) {
    return this.request(this.url("items", query));
  }

  // recherche des items dont une propriété correspond à une valeur
  // type : "eq" (valeur égale), "res" (lien vers la ressource d'id value), "in" (contient)…
  searchItemsByProp(term: string, value: string | number, extra = "", type = "eq") {
    const query = `property[0][joiner]=and&property[0][property]=${encodeURIComponent(term)}&property[0][type]=${type}&property[0][text]=${encodeURIComponent(value)}` + (extra ? "&" + extra : "");
    return this.searchItems(query);
  }

  // parcourt toutes les pages d'un type de ressource
  async getAll(type: OmkResourceType, query = "") {
    let rs: any[] = [], page = 1, data: any[];
    do {
      data = await this.request(this.url(type, `per_page=${this.perPage}&page=${page}` + (query ? "&" + query : "")));
      rs = rs.concat(data);
      page++;
    } while (data.length);
    return rs;
  }
  getAllItems(query = "") {
    return this.getAll("items", query);
  }
  getAllMedias(query = "") {
    return this.getAll("media", query);
  }

  // ==========================================
  // ÉCRITURE
  // ==========================================

  // crée un item ; si verifDoublons est fourni, renvoie le premier item correspondant à cette requête s'il existe
  async createItem(data: OmkData, verifDoublons?: string) {
    if (verifDoublons) {
      const items = await this.searchItems(verifDoublons);
      if (items.length) return items[0];
    }
    const rs = await this.request(this.url("items"), "POST", this.formatData(data));
    this.items.set(rs["o:id"], rs);
    return rs;
  }

  // upload d'un fichier en tant que média d'un item existant
  async uploadMedia(itemId: number, file: { buffer: Buffer; fileName: string; type?: string }, data: OmkData = {}) {
    const fd = {
      ...this.formatData(data, "o:Media"),
      "o:ingester": "upload",
      "file_index": "0",
      "o:item": { "o:id": itemId },
    };
    const rs = await this.request(this.url("media"), "POST", fd, file);
    this.medias.set(rs["o:id"], rs);
    return rs;
  }

  // m == "PUT" : ajoute les nouvelles valeurs aux valeurs existantes
  // m == "PATCH" : remplace les valeurs des propriétés fournies
  async updateResource(id: number, data: OmkData | null, type: OmkResourceType = "items", m: "PUT" | "PATCH" = "PUT", dataOri?: any) {
    let body: any = {};
    if (data) {
      const oriData = dataOri ?? (await this.request(this.url(`${type}/${id}`)));
      const newData = this.formatData(data, types[type]);
      for (const p in newData) {
        if (p == "@type") continue;
        if (oriData[p] && m == "PUT" && Array.isArray(oriData[p])) oriData[p] = oriData[p].concat(newData[p]);
        else oriData[p] = newData[p];
      }
      body = oriData;
    }
    const rs = await this.request(this.url(`${type}/${id}`), m, body);
    if (type == "items") this.items.set(rs["o:id"], rs);
    this.resources.delete(this.url(`${type}/${id}`));
    return rs;
  }

  // ajoute des liens (valeurs de type resource) vers les items rids, sans doublon avec les liens existants
  async addLinks(id: number, term: string, rids: number[]) {
    const item = await this.request(this.url(`items/${id}`));
    const existing = new Set((item[term] ?? []).map((v: any) => v.value_resource_id));
    const toAdd = [...new Set(rids)].filter(rid => rid !== id && !existing.has(rid));
    if (!toAdd.length) return item;
    return this.updateResource(id, { [term]: toAdd.map(rid => ({ rid })) }, "items", "PUT", item);
  }

  async deleteResource(id: number, type: OmkResourceType = "items") {
    await this.request(this.url(`${type}/${id}`), "DELETE");
    if (type == "items") this.items.delete(id);
    if (type == "media") this.medias.delete(id);
  }

  // renvoie le concept skos:Concept portant ce titre, et le crée s'il n'existe pas
  async getConcept(concept: string) {
    const cl = this.getClassByTerm("skos:Concept");
    const items = await this.searchItemsByProp(String(this.getPropId("dcterms:title")), concept, cl ? `resource_class_id[]=${cl["o:id"]}` : "");
    if (items.length) return items[0];
    return this.createItem({
      "o:resource_class": "skos:Concept",
      "dcterms:title": concept,
      "skos:prefLabel": concept,
    });
  }

  // ==========================================
  // FORMATAGE
  // ==========================================

  formatData(data: OmkData, type = "o:Item") {
    const fd: Record<string, any> = { "@type": type };
    let p: any;
    for (const [k, v] of Object.entries(data)) {
      switch (k) {
        case "o:item_set":
          fd[k] = [{ "o:id": v }];
          break;
        case "o:resource_class":
          p = this.getClassByTerm(v);
          if (!p) throw new Error(`Classe inconnue : ${v}`);
          fd[k] = { "o:id": p["o:id"] };
          break;
        case "o:resource_template":
          p = this.getRt(v);
          if (!p) throw new Error(`Modèle de ressource inconnu : ${v}`);
          fd[k] = { "o:id": p["o:id"] };
          break;
        case "o:media":
          if (!fd[k]) fd[k] = [];
          fd[k].push({ "o:ingester": "url", "ingest_url": v });
          break;
        case "file":
          fd["o:media"] = [{ "o:ingester": "upload", "file_index": "0" }];
          break;
        case "labels":
          for (const d of v) {
            p = this.props.find(prp => prp["o:label"] == d.p);
            if (!p) throw new Error(`Propriété inconnue : ${d.p}`);
            if (!fd[p["o:term"]]) fd[p["o:term"]] = [];
            fd[p["o:term"]].push(this.formatValue(p, d));
          }
          break;
        default:
          // on conserve tels quels les champs internes non gérés (o:is_public, etc.)
          if (k.startsWith("o:")) {
            fd[k] = v;
            break;
          }
          p = this.getPropByTerm(k);
          if (!p) throw new Error(`Propriété inconnue : ${k} (vocabulaire chargé ?)`);
          if (!fd[k]) fd[k] = [];
          if (Array.isArray(v)) fd[k] = v.map(val => this.formatValue(p, val));
          else fd[k].push(this.formatValue(p, v));
          break;
      }
    }
    return fd;
  }

  formatValue(p: any, v: any) {
    if (typeof v === "object" && v.rid) return { property_id: p["o:id"], value_resource_id: v.rid, type: "resource" };
    if (typeof v === "object" && v.u) return { property_id: p["o:id"], "@id": v.u, "o:label": v.l, type: "uri" };
    if (typeof v === "object") return { property_id: p["o:id"], "@value": JSON.stringify(v), type: "literal" };
    return { property_id: p["o:id"], "@value": v, type: "literal" };
  }

  // ==========================================
  // LIENS
  // ==========================================

  getAdminLink(r: any, id?: number, type?: string) {
    type = type ?? r["@type"][0];
    const path = type == "o:Item" ? "/admin/item/" : "/admin/media/";
    return this.publicApi.replace("/api/", path) + (id ?? r["o:id"]);
  }
  getMediaLink(file: string) {
    return this.publicApi.replace("/api/", "/") + file;
  }
}

// instance partagée configurée à partir du .env
let instance: Omk | null = null;
export async function getOmk(): Promise<Omk> {
  if (!instance) {
    const api = process.env.OMKS_API_URL;
    const ident = process.env.OMKS_KEY_IDENTITY;
    const key = process.env.OMKS_KEY_CREDENTIAL;
    if (!api || !ident || !key) {
      throw new Error("Identifiants Omeka S manquants dans le .env (OMKS_API_URL, OMKS_KEY_IDENTITY, OMKS_KEY_CREDENTIAL)");
    }
    instance = new Omk({ api, ident, key, vocabs: workflowConfig.omeka.vocabs });
  }
  await instance.init();
  return instance;
}
