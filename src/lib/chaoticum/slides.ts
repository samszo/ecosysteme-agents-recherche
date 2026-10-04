// Diapos du site ConfErrance : liste des présentations (slide.html), nombre de diapos, copies d'écran
// Une présentation est un SVG dont les rectangles « slide_<n> » sont les diapos ; le script svg_slides en affiche
// le nombre moins un dans #numSlide-max, et slide.html?diapo=<n> ouvre directement la diapo n.
import fs from "fs";
import path from "path";
import type { Browser } from "playwright";
import type { ChaoticumConfig } from "../../config/chaoticum";

export interface Slide {
  // chemin de slide.html relatif au site (ex. "HDR/slide.html")
  path: string;
  // dossier de la présentation (ex. "HDR")
  name: string;
}

export interface Diapo extends Slide {
  diapo: number;
  max: number;
  url: string;
}

type SlidesConfig = ChaoticumConfig["slides"];
const siteBase = (c: SlidesConfig) => c.siteUrl.replace(/\/?$/, "/");
export const diapoUrl = (c: SlidesConfig, slidePath: string, diapo: number) => `${siteBase(c)}${slidePath}?diapo=${diapo}`;

// présentations disponibles : dossier local s'il existe (développement), sinon arborescence du dépôt GitHub (Docker)
export async function listSlides(c: SlidesConfig): Promise<Slide[]> {
  let paths: string[] = [];
  if (c.localDir && fs.existsSync(c.localDir)) {
    for (const d of fs.readdirSync(c.localDir, { withFileTypes: true })) {
      if (d.isDirectory() && fs.existsSync(path.join(c.localDir, d.name, "slide.html"))) paths.push(`${d.name}/slide.html`);
    }
  } else {
    const res = await fetch(`https://api.github.com/repos/${c.repo}/git/trees/HEAD?recursive=1`, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`GitHub ${res.status} : liste des présentations de ${c.repo} indisponible`);
    const prefix = `${c.docsPath.replace(/\/$/, "")}/`;
    paths = ((await res.json()).tree ?? [])
      .map((t: any) => String(t.path))
      .filter((p: string) => p.startsWith(prefix) && p.endsWith("/slide.html"))
      .map((p: string) => p.slice(prefix.length))
      // présentations du premier niveau seulement (docs/docs/… contient des copies)
      .filter((p: string) => p.split("/").length === 2);
  }
  return paths
    .map(p => ({ path: p, name: p.replace(/\/slide\.html$/, "") }))
    .filter(s => !c.exclude.includes(s.name))
    .sort((a, b) => a.path.localeCompare(b.path));
}

// nombre de diapos d'après le SVG chargé par slide.html (repli quand le navigateur n'est pas disponible)
export async function maxFromSvg(c: SlidesConfig, slide: Slide): Promise<number | null> {
  const read = async (rel: string) => {
    const local = c.localDir ? path.join(c.localDir, rel) : "";
    if (local && fs.existsSync(local)) return fs.readFileSync(local, "utf-8");
    const res = await fetch(`${siteBase(c)}${rel}`);
    return res.ok ? res.text() : "";
  };
  const html = await read(slide.path);
  const svgFile = /d3\.(?:svg|xml)\(\s*["']([^"']+\.svg)["']/.exec(html)?.[1];
  if (!svgFile) return null;
  const svg = await read(`${slide.name}/${svgFile}`);
  const ids = new Set([...svg.matchAll(/<rect\b[^>]*\bid="(slide_[^"]*)"/g)].map(m => m[1]));
  return ids.size ? ids.size - 1 : null;
}

// navigateur partagé pendant une exécution (Chromium de Playwright), null s'il n'est pas installé
export async function openBrowser(): Promise<Browser | null> {
  try {
    const { chromium } = await import("playwright");
    return await chromium.launch();
  } catch (e) {
    console.warn(`⚠️ [DIAPOS] Navigateur indisponible (${(e as Error).message.split("\n")[0]}) : nombre de diapos lu dans le SVG, pas de copie d'écran.`);
    return null;
  }
}

// nombre de diapos lu dans la page rendue (#numSlide-max), comme le spécifie le site
export async function maxFromPage(browser: Browser, c: SlidesConfig, slide: Slide): Promise<number | null> {
  const page = await browser.newPage({ viewport: c.viewport });
  try {
    await page.goto(`${siteBase(c)}${slide.path}`, { waitUntil: "networkidle", timeout: 30000 });
    // valeur provisoire « 38 » écrite par svg_slides avant le chargement du SVG
    await page.waitForFunction(() => {
      const m = document.querySelector("#numSlide-max");
      return !!m && m.textContent !== "38";
    }, null, { timeout: 15000 }).catch(() => {});
    const n = parseInt((await page.textContent("#numSlide-max").catch(() => "")) ?? "", 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } finally {
    await page.close();
  }
}

// copie d'écran de la diapo (PNG)
export async function screenshot(browser: Browser, c: SlidesConfig, d: Diapo): Promise<Buffer> {
  const page = await browser.newPage({ viewport: c.viewport });
  try {
    await page.goto(d.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(c.settleMs);
    return await page.screenshot({ type: "png" });
  } finally {
    await page.close();
  }
}

// texte d'une présentation (textes du SVG), pour la comparer au thème de la conférence ; gardé en cache
const textCache = new Map<string, string>();
export async function slideText(c: SlidesConfig, slide: Slide, max = 1200): Promise<string> {
  if (textCache.has(slide.path)) return textCache.get(slide.path)!;
  const read = async (rel: string) => {
    const local = c.localDir ? path.join(c.localDir, rel) : "";
    if (local && fs.existsSync(local)) return fs.readFileSync(local, "utf-8");
    const res = await fetch(`${siteBase(c)}${rel}`).catch(() => null);
    return res?.ok ? res.text() : "";
  };
  let text = "";
  try {
    const html = await read(slide.path);
    const svgFile = /d3\.(?:svg|xml)\(\s*["']([^"']+\.svg)["']/.exec(html)?.[1];
    const svg = svgFile ? await read(`${slide.name}/${svgFile}`) : "";
    text = [...svg.matchAll(/<(?:text|tspan|flowPara)\b[^>]*>([^<]+)</g)].map(m => m[1]!.trim()).filter(Boolean)
      .map(t => t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"'))
      .filter((t, i, a) => a.indexOf(t) === i).join(" · ").slice(0, max);
  } catch { /* présentation illisible : nom du dossier seulement */ }
  textCache.set(slide.path, text);
  return text;
}
