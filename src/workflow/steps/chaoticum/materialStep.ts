import { createStep } from "@mastra/core/workflows";
import fs from "fs/promises";
import path from "path";
import { chaoticumConfig, PARTITIONS_DIR } from "../../../config/chaoticum";
import { planScreens, type Screen } from "../../../lib/chaoticum/partition";
import { CitationPicker } from "../../../lib/chaoticum/citations";
import { diapoUrl, listSlides, maxFromPage, maxFromSvg, openBrowser, screenshot, slideText, type Slide } from "../../../lib/chaoticum/slides";
import { hasTheme, loadTheme, rankByTheme } from "../../../lib/chaoticum/theme";
import { ragMaterial } from "../../../lib/chaoticum/ragSelect";
import { pick, randomInt, seededRandom } from "../../../lib/chaoticum/random";

// 1. Matière de la partition : écrans prévus, citations tirées de Zotero, diapos tirées du site ConfErrance (copies d'écran)
export const materialStep = createStep({
  id: "material",
  execute: async ({ inputData, runId }) => {
    const c = chaoticumConfig;
    const seed: string = inputData.seed;
    const rng = seededRandom(seed);
    const screens: Screen[] = planScreens(c);
    const dir = path.resolve(process.cwd(), c.outputDir, PARTITIONS_DIR, runId);
    await fs.mkdir(dir, { recursive: true });
    console.log(`🎼 Partition : ${screens.length} écran(s) en ${c.durationMinutes} min (graine ${seed}) : ${screens.map(s => s.type).join(" → ")}`);

    // thème de la conférence (titre, description, programme) : oriente le choix des citations et des diapos
    const theme = await loadTheme(c);
    const byTheme = c.selection.byTheme && hasTheme(theme);
    console.log(byTheme ? `🎯 Choix orienté par le thème « ${theme.title} »${theme.program ? " et le programme" : ""}` : "🎲 Choix au hasard (pas de thème renseigné ou choix par thème désactivé)");

    // index RAG (diapos décrites, bibliothèque) : recherche et analyse de cohérence, sans parcourir Zotero ni capturer
    const rag = await ragMaterial({ c, theme: byTheme ? theme : { ...theme, description: "", program: "", title: "Chaoticum Seminario" }, screens, rng, dir });
    if (rag.used) return { screens, seed, dir, theme, rag: true };
    console.log(`ℹ️ Index RAG non utilisés (${rag.reason}) : tirage direct dans Zotero et sur le site (plus lent).`);

    // citations
    const citationScreens = screens.filter(s => s.type === "citation");
    if (citationScreens.length) {
      console.log(`📥 [ZOTERO] Tirage de ${citationScreens.length} citation(s) (${c.citations.scope === "collection" ? `collection ${c.citations.collection}` : "bibliothèque"})...`);
      const chooser = byTheme ? (texts: string[], n: number) => rankByTheme(theme, texts, n, "passages de la bibliothèque", c.models.analytics, "Choix des citations (thème)") : undefined;
      const citations = await new CitationPicker(c.citations, rng).pick(citationScreens.length, chooser, c.selection.citationCandidates);
      citationScreens.forEach((s, i) => { s.citation = citations[i]!; });
      for (const ci of citations) console.log(`   ❝ ${ci.text.slice(0, 90)}${ci.text.length > 90 ? "…" : ""} — ${ci.source.creators || ci.source.title}`);
    }

    // diapos : présentation au hasard, nombre de diapos (#numSlide-max), diapo au hasard, copie d'écran
    const diapoScreens = screens.filter(s => s.type === "diapo");
    if (diapoScreens.length) {
      const all = await listSlides(c.slides);
      console.log(`🖼️ [DIAPOS] ${all.length} présentation(s) disponible(s) sur ${c.slides.siteUrl}`);
      if (!all.length) throw new Error("Aucune présentation (slide.html) trouvée");
      // présentations les plus proches du thème (d'après les textes de leur SVG), sinon toutes
      let slides: Slide[] = all;
      if (byTheme) {
        const texts = await Promise.all(all.map(async s => `${s.name} : ${(await slideText(c.slides, s, 400)) || "(sans texte)"}`));
        const order = await rankByTheme(theme, texts, Math.min(c.selection.slideShortlist, all.length), "présentations (nom du dossier : textes des diapos)", c.models.analytics, "Choix des présentations (thème)");
        if (order.length) {
          slides = order.map(i => all[i]!);
          console.log(`🎯 Présentations retenues : ${slides.map(s => s.name).join(", ")}`);
        }
      }
      const browser = await openBrowser();
      const maxCache = new Map<string, number | null>();
      try {
        for (const s of diapoScreens) {
          let slide = pick(rng, slides), max: number | null = null;
          // une présentation sans diapo lisible est remplacée par une autre (5 essais)
          for (let attempt = 0; attempt < 5; attempt++) {
            if (!maxCache.has(slide.path)) {
              maxCache.set(slide.path, browser ? await maxFromPage(browser, c.slides, slide).catch(() => null) ?? await maxFromSvg(c.slides, slide) : await maxFromSvg(c.slides, slide));
            }
            max = maxCache.get(slide.path) ?? null;
            if (max !== null) break;
            slide = pick(rng, slides);
          }
          const diapo = randomInt(rng, max ?? 0);
          const url = diapoUrl(c.slides, slide.path, diapo);
          let file: string | null = null;
          if (browser) {
            try {
              file = `diapo_${String(s.index + 1).padStart(2, "0")}.png`;
              await fs.writeFile(path.join(dir, file), await screenshot(browser, c.slides, { ...slide, diapo, max: max ?? 0, url }));
            } catch (e) {
              console.warn(`   ⚠️ Copie d'écran impossible pour ${url} :`, (e as Error).message);
              file = null;
            }
          }
          s.diapo = { ...slide, diapo, max: max ?? 0, url, screenshot: file, description: "" };
          console.log(`   🖼️ ${slide.name} : diapo ${diapo}/${max ?? "?"}${file ? ` (copie ${file})` : ""}`);
        }
      } finally {
        await browser?.close();
      }
    }
    return { screens, seed, dir, theme };
  },
});
