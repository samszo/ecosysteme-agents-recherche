// Index RAG des annotations Diigo (chaoticumSeminario) : pages d'une collection Omeka S (références de veille Diigo),
// retenues si elles ont des médias ou des passages surlignés (items du modèle « Diigo highlight » : bibo:content,
// schema:color, reliés à la page par dcterms:isPartOf). Comme pour la bibliothèque Zotero : un document Albert par page
// (identifiant Omeka, titre, mots-clés skos:semanticRelation répétés en tête, passages surlignés marqués de leur clé
// [[D<id>]], texte des médias de la page et analyse de ses images par le modèle de vision), redéposé seulement s'il a
// changé ; chaque image n'est analysée qu'une fois (cache par empreinte du fichier).
import crypto from "crypto";
import path from "path";
import { z } from "zod";
import { askAgent } from "../../../agents/ask";
import { imageDescriberAgent } from "../../../agents/imageDescriberAgent";
import { Albert, chunkMetadata } from "../../albert/albert";
import { containerUrl } from "../../omeka/omk";
import { extractAttachment, htmlToText } from "../../extraction/attachmentExtract";
import { isZip } from "../../extraction/zip";
import { workflowConfig } from "../../../config";
import { recordUsage } from "../../metrics/usage";
import { emptyImages, emptyZotero, loadStore, saveStore, type AnnotationEntry, type ImageDescription, type ImagesStore, type ReferenceEntry } from "./store";
import type { ChaoticumConfig } from "../../../config/chaoticum";

const estimate = (t: string) => Math.ceil(t.length / 4);
const clean = (t: string) => t.replace(/\s+/g, " ").trim();
const val = (it: any, term: string): string => it?.[term]?.[0]?.["@value"] ?? "";
// couleurs de surlignage de Diigo → couleurs de la grille (palette de Zotero)
const COLORS: Record<string, string> = { yellow: "#ffd400", green: "#5fb236", blue: "#2ea8e5", pink: "#e56eee", red: "#ff6666", orange: "#f19837", purple: "#a28ae5", grey: "#aaaaaa", gray: "#aaaaaa" };
const MAX_MEDIA_BYTES = 50_000_000;
// analyses d'images menées en parallèle
const IMAGE_CONCURRENCY = 4;
const ImageSchema = z.object({
  titre: z.string().describe("idée principale de l'image en quelques mots"),
  motsCles: z.array(z.string()).describe("5 à 10 mots-clés"),
  description: z.string().describe("description en 120 mots au plus"),
  texte: z.string().describe("texte lisible dans l'image, transcrit fidèlement (1 500 caractères au plus) ; vide s'il n'y en a pas"),
});

// lecture de l'API Omeka S de la source (publique ; clé facultative DIIGO_OMKS_KEY_IDENTITY / DIIGO_OMKS_KEY_CREDENTIAL)
function omekaClient(apiUrl: string) {
  const base = apiUrl.replace(/\/+$/, "");
  const auth: Record<string, string> = process.env.DIIGO_OMKS_KEY_IDENTITY && process.env.DIIGO_OMKS_KEY_CREDENTIAL
    ? { key_identity: process.env.DIIGO_OMKS_KEY_IDENTITY, key_credential: process.env.DIIGO_OMKS_KEY_CREDENTIAL } : {};
  // nombre total de résultats d'une requête (en-tête Omeka-S-Total-Results)
  async function total(endpoint: string, params: [string, string | number][]) {
    const q = new URLSearchParams([...params.map(([k, v]) => [k, String(v)] as [string, string]), ["per_page", "1"], ...Object.entries(auth)]);
    const r = await fetch(containerUrl(`${base}/${endpoint}?${q}`), { headers: { Accept: "application/json" } });
    return Number(r.headers.get("omeka-s-total-results")) || null;
  }
  async function get(endpoint: string, params: [string, string | number][]): Promise<any[]> {
    const q = new URLSearchParams([...params.map(([k, v]) => [k, String(v)] as [string, string]), ...Object.entries(auth)]);
    const url = containerUrl(`${base}/${endpoint}?${q}`);
    for (let attempt = 1; ; attempt++) {
      try {
        const r = await fetch(url, { headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(`Omeka S ${r.status} sur ${endpoint}`);
        return await r.json();
      } catch (e) {
        if (attempt >= 3) throw e;
        await new Promise(res => setTimeout(res, 2000 * attempt));
      }
    }
  }
  // toutes les pages d'une requête
  async function all(endpoint: string, params: [string, string | number][], perPage = 500, onPage?: (n: number) => void) {
    const out: any[] = [];
    for (let page = 1; ; page++) {
      const batch = await get(endpoint, [...params, ["per_page", perPage], ["page", page], ["sort_by", "id"], ["sort_order", "asc"]]);
      out.push(...batch);
      onPage?.(out.length);
      if (batch.length < perPage) return out;
    }
  }
  // ressources par identifiants (lots de 100)
  async function byIds(endpoint: string, ids: number[]) {
    const out: any[] = [];
    for (let i = 0; i < ids.length; i += 100) out.push(...await get(endpoint, [...ids.slice(i, i + 100).map(id => ["id[]", id] as [string, number]), ["per_page", 100]]));
    return out;
  }
  return { all, byIds, total };
}

// analyse d'une image par le modèle de vision (vignette « large » d'Omeka S : JPEG d'environ 800 px, quel que soit le
// format d'origine), mise en cache par empreinte du fichier
async function describeImage(m: any, pageTitle: string, c: ChaoticumConfig, cache: ImagesStore, stats: { analyzed: number; cached: number }): Promise<ImageDescription | null> {
  const key = String(m["o:sha256"] || `media-${m["o:id"]}`);
  if (cache.items[key]) { stats.cached++; return cache.items[key]!; }
  const thumb = m["o:thumbnail_urls"]?.large ?? m["o:thumbnail_urls"]?.medium;
  const url = thumb ?? (/^image\/(png|jpeg)$/.test(m["o:media_type"]) && Number(m["o:size"]) < 5_000_000 ? m["o:original_url"] : null);
  if (!url) return null;
  const r = await fetch(containerUrl(url));
  if (!r.ok) throw new Error(`image ${r.status}`);
  const data = Buffer.from(await r.arrayBuffer());
  const mediaType = thumb ? "image/jpeg" : m["o:media_type"];
  const { object } = await askAgent(imageDescriberAgent, {
    model: c.diigo.visionModel || c.models.vision, source: "Index des annotations Diigo : analyse des images (imageDescriberAgent)", schema: ImageSchema,
    prompt: [{ role: "user", content: [
      { type: "text", text: `Image de la page annotée « ${pageTitle} ».` },
      { type: "file", data, mediaType, filename: `image ${m["o:id"]}.${mediaType === "image/png" ? "png" : "jpg"}` },
    ] }],
  });
  // « texte visible » laissé à sa valeur d'exemple par le modèle (aucun, néant, sichtbarer Text…) : vide
  const texte = clean(object.texte);
  const placeholder = /^[\s\p{P}]*(texte visible|visible text|sichtbarer text|aucun( texte)?|néant|rien|none|n\/a|vide)[\s\p{P}]*$/iu.test(texte);
  const d: ImageDescription = { mediaId: m["o:id"], titre: clean(object.titre), motsCles: object.motsCles.map(clean).filter(Boolean), description: clean(object.description), texte: placeholder ? "" : texte.slice(0, 1500), analyzedAt: new Date().toISOString() };
  cache.items[key] = d;
  stats.analyzed++;
  return d;
}

// texte des médias de la page annotée (même extraction que les pièces jointes Zotero ; instantané web : archive zip) et
// analyse de ses images
// (exportée pour les tests de l'analyse des médias)
export async function mediaText(media: any[], o: { maxChars: number; images: boolean; pageTitle: string; c: ChaoticumConfig; cache: ImagesStore; stats: { analyzed: number; cached: number } }) {
  const parts: string[] = [];
  const used: NonNullable<ReferenceEntry["media"]> = [];
  let budget = o.maxChars;
  const isImage = (m: any) => String(m["o:media_type"] ?? "").startsWith("image/");
  for (const m of media.filter(m => !isImage(m))) {
    if (budget <= 0) break;
    const url = m["o:original_url"];
    if (!url || (Number(m["o:size"]) || 0) > MAX_MEDIA_BYTES) continue;
    const title = val(m, "dcterms:title") || m["o:source"] || `média ${m["o:id"]}`;
    try {
      const r = await fetch(containerUrl(url));
      if (!r.ok) throw new Error(`fichier ${r.status}`);
      const buffer = Buffer.from(await r.arrayBuffer());
      const type = String(m["o:media_type"] ?? "");
      const name = path.basename(String(m["o:source"] ?? m["o:filename"] ?? "fichier")).split("?")[0] || "fichier";
      const extracted = (type === "application/zip" || type === "application/x-zip-compressed") && isZip(buffer)
        ? await extractAttachment(buffer, "text/html", "instantane.html")
        : await extractAttachment(buffer, type, name);
      const text = clean(extracted.text).slice(0, budget);
      if (!text) continue;
      parts.push(`## Texte du média : ${clean(title)}\n\n${text}`);
      used.push({ id: m["o:id"], title: clean(title), type: extracted.format, chars: text.length });
      budget -= text.length;
    } catch (e) {
      console.warn(`   ⚠️ Média ${m["o:id"]} (${clean(title).slice(0, 60)}) : ${(e as Error).message.split("\n")[0]}`);
    }
  }
  // images : analyses en parallèle, descriptions dans l'ordre des médias
  if (o.images) {
    const images = media.filter(isImage);
    const results: (ImageDescription | null)[] = new Array(images.length).fill(null);
    for (let i = 0; i < images.length; i += IMAGE_CONCURRENCY) {
      await Promise.all(images.slice(i, i + IMAGE_CONCURRENCY).map(async (m, j) => {
        try { results[i + j] = await describeImage(m, o.pageTitle, o.c, o.cache, o.stats); }
        catch (e) { console.warn(`   ⚠️ Image ${m["o:id"]} : ${(e as Error).message.split("\n")[0]}`); }
      }));
    }
    images.forEach((m, i) => {
      const d = results[i];
      if (!d) return;
      const text = [`## Image : ${d.titre}`, d.motsCles.length ? `Mots-clés : ${d.motsCles.join(" ; ")}` : "", d.description, d.texte ? `Texte visible : ${d.texte}` : ""].filter(Boolean).join("\n\n");
      parts.push(text);
      used.push({ id: m["o:id"], title: d.titre, type: "image", chars: text.length });
    });
  }
  return { text: parts.join("\n\n"), used };
}

export async function indexDiigo(c: ChaoticumConfig) {
  const d = c.diigo;
  const albert = new Albert(workflowConfig.models.provider, process.env.ALBERT_API_KEY ?? "");
  const omk = omekaClient(d.apiUrl);
  const source = `${d.apiUrl}#collection ${d.itemSetId}`;
  const store = loadStore("diigo", emptyZotero(), c);
  const imageCache = loadStore("diigo-images", emptyImages(), c);
  const imageStats = { analyzed: 0, cached: 0 };
  const { collection, created } = await albert.ensureCollection(d.collection, `Annotations Diigo (${source}) : une page annotée par document (chaoticumSeminario)`);
  if (store.collectionId !== collection.id || store.library !== source) {
    // nouvelle collection ou autre source : tout est redéposé (documents de l'ancienne source retirés de la collection)
    if (store.collectionId === collection.id) for (const e of Object.values(store.items)) if (e.docId) await albert.deleteDocument(e.docId).catch(() => {});
    store.items = {};
    store.collectionId = collection.id;
    store.library = source;
  }
  console.log(`📚 [RAG] Collection Albert « ${collection.name} » (${collection.id})${created ? " créée" : ""} ; source ${source}`);

  // passages surlignés (modèle « Diigo highlight ») regroupés par page, puis pages de la collection retenues :
  // celles qui ont des médias et celles qui ont des passages surlignés (sans lire toute la collection)
  let last = 0;
  const annotations = await omk.all("items", [["resource_template_id", d.highlightTemplateId]], 500, n => { if (n - last >= 2000) { last = n; console.log(`   … ${n} passage(s) surligné(s) lus`); } });
  const byParent = new Map<number, any[]>();
  let orphans = 0;
  for (const a of annotations) {
    const parent = Number(a["dcterms:isPartOf"]?.[0]?.value_resource_id);
    if (!parent) { orphans++; continue; }
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(a);
  }
  const inSet = (it: any) => (it["o:item_set"] ?? []).some((s: any) => Number(s["o:id"]) === Number(d.itemSetId));
  const withMedia = await omk.all("items", [["item_set_id", d.itemSetId], ["has_media", 1]]);
  const highlighted = (await omk.byIds("items", [...byParent.keys()].filter(id => !withMedia.some(m => m["o:id"] === id)))).filter(inSet);
  const parents = [...withMedia, ...highlighted].sort((a, b) => a["o:id"] - b["o:id"]);
  const inCollection = await omk.total("items", [["item_set_id", d.itemSetId]]);
  const withHighlights = parents.filter(p => byParent.has(p["o:id"])).length;
  const outside = [...byParent.keys()].filter(id => !parents.some(p => p["o:id"] === id)).length;
  console.log(`📥 [DIIGO] ${parents.length} page(s) retenue(s)${inCollection ? ` sur ${inCollection} dans la collection ${d.itemSetId}` : ""} : ${withMedia.length} avec média(s), ${withHighlights} avec passage(s) surligné(s) (${annotations.length} passage(s))${outside ? ` ; ${outside} page(s) surlignée(s) hors de la collection, ignorée(s)` : ""}${orphans ? ` ; ${orphans} passage(s) sans page` : ""}`);

  let uploaded = 0, unchanged = 0, removed = 0, errors = 0, tokens = 0, mediaFiles = 0, pending = 0;
  for (const p of parents) {
    const key = `O${p["o:id"]}`;
    const title = val(p, "dcterms:title") || p["o:title"] || "(sans titre)";
    const url = p["bibo:uri"]?.[0]?.["@id"] ?? val(p, "bibo:uri") ?? null;
    const tags = [...new Set((p["skos:semanticRelation"] ?? []).map((v: any) => clean(String(v.display_title ?? v["@value"] ?? ""))).filter(Boolean))] as string[];
    const author = p["cito:isCompiledBy"]?.[0]?.display_title ?? null;
    const anns: Record<string, AnnotationEntry> = {};
    const lines: string[] = [];
    for (const a of byParent.get(p["o:id"]) ?? []) {
      const text = clean(htmlToText(val(a, "bibo:content")));
      if (!text) continue;
      const k = `D${a["o:id"]}`, color = val(a, "schema:color").toLowerCase();
      anns[k] = { key: k, kind: "annotation", text, comment: "", page: "", color: COLORS[color] ?? (color || null), author: a["cito:isCompiledBy"]?.[0]?.display_title ?? author, date: val(a, "dcterms:created") || null };
      lines.push(`- « ${text} »${color ? ` (${color})` : ""} [[${k}]]`);
    }
    const mediaIds = (p["o:media"] ?? []).map((m: any) => m["o:id"]).sort((a: number, b: number) => a - b);
    const year = /\b(1[5-9]|20)\d{2}\b/.exec(val(p, "dcterms:created"))?.[0] ?? "";
    // empreinte : métadonnées, passages et médias (sans télécharger les fichiers des pages inchangées)
    // (l'analyse des images ne compte que pour les pages qui ont des médias : les autres gardent leur empreinte)
    const hashed: unknown[] = [title, url, tags, lines, d.indexMedia ? mediaIds : [], d.indexMedia ? d.mediaMaxChars : 0];
    if (d.indexMedia && mediaIds.length) hashed.push({ images: d.indexImages !== false });
    const hash = crypto.createHash("sha1").update(JSON.stringify(hashed)).digest("hex");
    const known = store.items[key];
    if (known?.hash === hash && known.docId) { unchanged++; continue; }
    if (d.perRun && uploaded >= d.perRun) { pending++; continue; }
    try {
      const media = d.indexMedia && mediaIds.length
        ? await mediaText(await omk.byIds("media", mediaIds), { maxChars: d.mediaMaxChars, images: d.indexImages !== false, pageTitle: title, c, cache: imageCache, stats: imageStats })
        : { text: "", used: [] };
      mediaFiles += media.used.length;
      const keywordBlock = tags.length ? Array.from({ length: c.rag.keywordsWeight }, () => `Mots-clés : ${tags.join(" ; ")}`).join("\n") : "";
      const content = [
        `# ${title}`,
        [author ? `Annoté par ${author}` : "", url ? `Page : ${url}` : "", `Omeka S : item ${p["o:id"]}`].filter(Boolean).join(" · ") + ".",
        keywordBlock,
        lines.length ? `## Passages surlignés\n\n${lines.join("\n")}` : "",
        media.text,
      ].filter(Boolean).join("\n\n");
      if (known?.docId) await albert.deleteDocument(known.docId).catch(() => {});
      const docId = await albert.createDocument({
        collectionId: collection.id, content, fileName: `diigo ${p["o:id"]}.md`, name: `diigo ${p["o:id"]}`,
        chunkSize: c.rag.chunkSize, chunkOverlap: c.rag.chunkOverlap, presetSeparators: "markdown",
        metadata: chunkMetadata({ kind: "diigo", key, omekaId: p["o:id"], title, url: url ?? "", year }),
      });
      tokens += estimate(content);
      store.items[key] = { key, title, creators: author ?? "", year, collections: [], tags, annotations: anns, source: "diigo", url, media: media.used, hash, docId, indexedAt: new Date().toISOString() };
      uploaded++;
      if (uploaded % 20 === 0) { saveStore("diigo", store, c); saveStore("diigo-images", imageCache, c); console.log(`   … ${uploaded} page(s) déposée(s), ${imageStats.analyzed} image(s) analysée(s)`); }
    } catch (e) {
      errors++;
      console.warn(`   ⚠️ ${title.slice(0, 80)} (item ${p["o:id"]}) :`, (e as Error).message.split("\n")[0]);
    }
  }
  // pages qui ne sont plus retenues (ni média ni passage surligné, ou hors de la collection) : retirées d'Albert
  const present = new Set(parents.map(p => `O${p["o:id"]}`));
  for (const [key, e] of Object.entries(store.items)) {
    if (present.has(key)) continue;
    if (e.docId) await albert.deleteDocument(e.docId).catch(() => {});
    delete store.items[key];
    removed++;
  }
  saveStore("diigo", store, c);
  saveStore("diigo-images", imageCache, c);
  if (tokens) recordUsage("Index des annotations Diigo : vectorisation (estimation)", "BAAI/bge-m3", { inputTokens: tokens, outputTokens: 0, totalTokens: tokens });
  const citations = Object.values(store.items).reduce((s, e) => s + Object.keys(e.annotations).length, 0);
  console.log(`✅ [DIIGO] ${uploaded} page(s) déposée(s) (${mediaFiles} média(s) lu(s), dont ${imageStats.analyzed} image(s) analysée(s) et ${imageStats.cached} déjà analysée(s)), ${unchanged} inchangée(s), ${removed} retirée(s), ${errors} erreur(s)${pending ? `, ${pending} à déposer à la prochaine indexation (limite de ${d.perRun} par exécution)` : ""} ; index : ${Object.keys(store.items).length} page(s), ${citations} citation(s) possible(s)`);
  return { uploaded, unchanged, removed, errors, pending, pages: Object.keys(store.items).length, citations };
}
