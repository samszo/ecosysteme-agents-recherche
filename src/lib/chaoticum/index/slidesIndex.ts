// Index RAG des diapos : un document Albert par diapo, avec la description de sa copie d'écran (modèle de vision)
// Chaque présentation est chargée une fois ; les diapos sont capturées en fixant le cadrage du SVG (sans transition).
// L'indexation est incrémentale : les diapos déjà indexées sont sautées, `slidesPerRun` borne une exécution.
import fs from "fs";
import path from "path";
import { z } from "zod";
import { Albert, chunkMetadata } from "../../albert/albert";
import { slideDescriberAgent } from "../../../agents/slideDescriberAgent";
import { askAgent } from "../../../agents/ask";
import { workflowConfig } from "../../../config";
import { recordUsage } from "../../metrics/usage";
import { diapoUrl, listSlides, openBrowser, slideText } from "../slides";
import { emptySlides, indexDir, loadStore, saveStore, type SlideEntry } from "./store";
import type { ChaoticumConfig } from "../../../config/chaoticum";

const VisionSchema = z.object({
  titre: z.string().describe("titre de la diapositive, ou idée principale en quelques mots"),
  motsCles: z.array(z.string()).describe("5 à 10 mots-clés"),
  description: z.string().describe("description en 120 mots au plus : textes lisibles, schémas et relations montrés, idée principale"),
});

const estimate = (t: string) => Math.ceil(t.length / 4);

export async function indexSlides(c: ChaoticumConfig, limit = c.rag.slidesPerRun) {
  const albert = new Albert(workflowConfig.models.provider, process.env.ALBERT_API_KEY ?? "");
  const store = loadStore("diapos", emptySlides(), c);
  const { collection, created } = await albert.ensureCollection(c.rag.slidesCollection, "Diapos du site ConfErrance décrites par le modèle de vision (chaoticumSeminario)");
  if (store.collectionId !== collection.id) {
    // nouvelle collection Albert : les documents de l'index précédent n'y sont pas
    for (const e of Object.values(store.items)) e.docId = null;
    store.collectionId = collection.id;
  }
  console.log(`📚 [RAG] Collection Albert « ${collection.name} » (${collection.id})${created ? " créée" : ""} : ${Object.values(store.items).filter(e => e.docId).length} diapo(s) déjà indexée(s)`);

  const slides = await listSlides(c.slides);
  const browser = await openBrowser();
  if (!browser) throw new Error("Chromium (Playwright) est nécessaire pour indexer les diapos : npx playwright install chromium");
  const shotsDir = path.join(indexDir(c), "diapos");
  let done = 0, tokens = 0, errors = 0;
  // descriptions et dépôts en parallèle (4 au plus), captures en série
  const pending = new Set<Promise<void>>();
  const throttle = async () => { while (pending.size >= 4) await Promise.race(pending); };

  const describe = async (slide: { path: string; name: string }, n: number, max: number, png: Buffer, file: string, context: string) => {
    const key = `${slide.path}#${n}`;
    try {
      const { object } = await askAgent(slideDescriberAgent, {
        model: c.models.vision, source: "Index des diapos : description (slideDescriberAgent)", schema: VisionSchema,
        prompt: [{ role: "user", content: [
          { type: "text", text: `Diapositive ${n} de la présentation « ${slide.name} ».` },
          { type: "file", data: png, mediaType: "image/png", filename: path.basename(file) },
        ] }],
      });
      const url = diapoUrl(c.slides, slide.path, n);
      const content = `# ${slide.name} — diapo ${n} : ${object.titre}\n\nMots-clés : ${object.motsCles.join(" ; ")}\n\n${object.description}\n\nPrésentation « ${slide.name} » : ${context}\n\n${url}\n`;
      const previous = store.items[key]?.docId;
      if (previous) await albert.deleteDocument(previous).catch(() => {});
      const docId = await albert.createDocument({
        collectionId: collection.id, content, fileName: `diapo ${slide.name} ${n}.md`, name: `diapo ${slide.path}#${n}`,
        chunkSize: c.rag.chunkSize, chunkOverlap: c.rag.chunkOverlap, presetSeparators: "markdown",
        metadata: chunkMetadata({ kind: "diapo", path: slide.path, name: slide.name, diapo: n, max, title: object.titre }),
      });
      tokens += estimate(content);
      const entry: SlideEntry = { path: slide.path, name: slide.name, diapo: n, max, url, screenshot: path.relative(indexDir(c), file), title: object.titre, keywords: object.motsCles, description: object.description, docId, indexedAt: new Date().toISOString() };
      store.items[key] = entry;
      console.log(`   ✅ ${slide.name} ${n}/${max} : ${object.titre}`);
    } catch (e) {
      errors++;
      console.warn(`   ⚠️ ${slide.name} ${n} :`, (e as Error).message.split("\n")[0]);
    }
  };

  try {
    outer: for (const slide of slides) {
      const known = store.presentations[slide.path]?.max;
      if (known !== undefined && Array.from({ length: known + 1 }, (_, n) => store.items[`${slide.path}#${n}`]?.docId).every(Boolean)) continue;
      const page = await browser.newPage({ viewport: c.slides.viewport });
      try {
        await page.goto(`${c.slides.siteUrl.replace(/\/?$/, "/")}${slide.path}`, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForFunction(() => (window as any).keys?.length > 0, null, { timeout: 15000 });
        const max = await page.evaluate(() => (window as any).keys.length - 1);
        store.presentations[slide.path] = { max, checkedAt: new Date().toISOString() };
        const context = await slideText(c.slides, slide, 300);
        console.log(`🖼️ [DIAPOS] ${slide.name} : ${max + 1} diapo(s)`);
        for (let n = 0; n <= max; n++) {
          if (store.items[`${slide.path}#${n}`]?.docId) continue;
          if (done >= limit) break outer;
          await page.evaluate((i: number) => {
            const w = window as any, r = w.slides[w.keys[i]];
            w.svg?.interrupt?.();
            document.querySelector("svg")?.setAttribute("viewBox", `${r.x.baseVal.value} ${r.y.baseVal.value} ${r.width.baseVal.value} ${r.height.baseVal.value}`);
            w.changeNavig?.(i);
          }, n);
          await page.waitForTimeout(350);
          const png = await page.screenshot({ type: "png" });
          const file = path.join(shotsDir, slide.name, `diapo_${n}.png`);
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, png);
          done++;
          await throttle();
          const p: Promise<void> = describe(slide, n, max, png, file, context).finally(() => { pending.delete(p); saveStore("diapos", store, c); });
          pending.add(p);
        }
      } catch (e) {
        errors++;
        console.warn(`⚠️ [DIAPOS] ${slide.name} illisible :`, (e as Error).message.split("\n")[0]);
      } finally {
        await page.close();
      }
    }
    await Promise.all(pending);
  } finally {
    await browser.close();
    saveStore("diapos", store, c);
  }
  if (tokens) recordUsage("Index des diapos : vectorisation (estimation)", "BAAI/bge-m3", { inputTokens: tokens, outputTokens: 0, totalTokens: tokens });
  const indexed = Object.values(store.items).filter(e => e.docId).length;
  const total = Object.values(store.presentations).reduce((s, p) => s + p.max + 1, 0);
  const pendingPresentations = slides.filter(s => store.presentations[s.path] === undefined).length;
  console.log(`✅ [DIAPOS] ${done} diapo(s) décrite(s) et indexée(s) (${errors} erreur(s)) ; index : ${indexed} diapo(s) sur ${total} connue(s)${pendingPresentations ? `, ${pendingPresentations} présentation(s) pas encore ouverte(s)` : ""}${done >= limit ? " — relancer l'indexation pour continuer" : ""}`);
  return { done, errors, indexed, total, pendingPresentations, complete: done < limit && !pendingPresentations };
}
