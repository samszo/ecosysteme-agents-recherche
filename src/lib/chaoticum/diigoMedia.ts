// Images des pages annotées avec Diigo (source « Annotations Diigo » de chaoticumSeminario) : vignettes Omeka S des
// médias de type image, pour l'éditeur d'écran et le lecteur (citations Diigo illustrées). Cache en mémoire.
import { omekaClient } from "./index/diigoIndex";

export interface DiigoImage { mediaId: number; pageId: number; url: string; original: string; title: string }

const pageCache = new Map<string, DiigoImage[]>();
const isImage = (m: any) => String(m["o:media_type"] ?? "").startsWith("image/");
const toImage = (m: any, pageId: number): DiigoImage | null => {
  const url = m["o:thumbnail_urls"]?.large ?? m["o:thumbnail_urls"]?.medium ?? m["o:original_url"];
  return url ? { mediaId: m["o:id"], pageId, url, original: m["o:original_url"] ?? url, title: m["dcterms:title"]?.[0]?.["@value"] ?? "" } : null;
};

// images de pages (identifiants Omeka des pages), dans l'ordre de leurs médias
export async function diigoPageImages(apiUrl: string, pageIds: number[]): Promise<Map<number, DiigoImage[]>> {
  const omk = omekaClient(apiUrl);
  const out = new Map<number, DiigoImage[]>();
  const missing = [...new Set(pageIds)].filter(id => { const c = pageCache.get(`${apiUrl}#${id}`); if (c) out.set(id, c); return !c; });
  if (missing.length) {
    const pages = await omk.byIds("items", missing);
    const mediaOf = new Map<number, number>();
    for (const p of pages) for (const m of p["o:media"] ?? []) mediaOf.set(m["o:id"], p["o:id"]);
    const media = mediaOf.size ? await omk.byIds("media", [...mediaOf.keys()]) : [];
    for (const id of missing) {
      const order = (pages.find(p => p["o:id"] === id)?.["o:media"] ?? []).map((m: any) => m["o:id"]);
      const imgs = media.filter(m => mediaOf.get(m["o:id"]) === id && isImage(m)).sort((a, b) => order.indexOf(a["o:id"]) - order.indexOf(b["o:id"]))
        .map(m => toImage(m, id)).filter((x): x is DiigoImage => !!x);
      pageCache.set(`${apiUrl}#${id}`, imgs);
      out.set(id, imgs);
    }
  }
  return out;
}

// vignettes de médias donnés (images analysées de l'index)
const mediaCache = new Map<string, DiigoImage | null>();
export async function diigoMediaImages(apiUrl: string, mediaIds: number[]): Promise<Map<number, DiigoImage>> {
  const missing = [...new Set(mediaIds)].filter(id => !mediaCache.has(`${apiUrl}#${id}`));
  if (missing.length) {
    const media = await omekaClient(apiUrl).byIds("media", missing);
    for (const id of missing) {
      const m = media.find(x => x["o:id"] === id);
      mediaCache.set(`${apiUrl}#${id}`, m ? toImage(m, Number(m["o:item"]?.["o:id"]) || 0) : null);
    }
  }
  const out = new Map<number, DiigoImage>();
  for (const id of mediaIds) { const x = mediaCache.get(`${apiUrl}#${id}`); if (x) out.set(id, x); }
  return out;
}
