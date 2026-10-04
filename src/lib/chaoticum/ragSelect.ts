// Matière de la partition tirée des index RAG (diapos, bibliothèque) : une requête par cycle issue du thème de la
// conférence, recherche dans les deux collections Albert, puis un appel par cycle qui choisit la citation et la diapo
// les plus cohérentes avec la conférence et rédige la question et le diagramme. Plus de parcours de Zotero ni d'analyse
// d'image à la génération : les descriptions des diapos et leurs copies d'écran viennent de l'index.
import fs from "fs";
import path from "path";
import { z } from "zod";
import { Albert } from "../albert/albert";
import { curatorAgent } from "../../agents/curatorAgent";
import { seminarioAgent } from "../../agents/seminarioAgent";
import { askAgent } from "../../agents/ask";
import { workflowConfig } from "../../config";
import { recordUsage } from "../metrics/usage";
import { zoteroWebUrl } from "../zotero/zotero";
import { emptySlides, emptyZotero, indexDir, loadStore, type AnnotationEntry, type ReferenceEntry, type SlideEntry } from "./index/store";
import { hasTheme, themeBlock, type Theme } from "./theme";
import { buildMermaid } from "./mermaid";
import { diagramFields, shortenQuestion } from "./generation";
import { shuffle, type Rng } from "./random";
import type { Citation } from "./citations";
import type { Screen } from "./partition";
import type { ChaoticumConfig } from "../../config/chaoticum";

type Cand = { a: AnnotationEntry; r: ReferenceEntry };

function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max), end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return (end > max * 0.5 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "")) + " […]";
}

const toCitation = ({ a, r }: Cand, max: number): Citation => ({
  key: a.key, kind: a.kind, text: clip(a.text || a.comment, max), comment: a.kind === "annotation" ? a.comment : "", page: a.page, color: a.color, author: a.author, date: a.date,
  source: { key: r.key, title: r.title, creators: r.creators, year: r.year, url: zoteroWebUrl(`items/${r.key}`) },
});

export async function ragMaterial(o: { c: ChaoticumConfig; theme: Theme; screens: Screen[]; rng: Rng; dir: string }): Promise<{ used: boolean; reason?: string }> {
  const { c, theme, screens, rng, dir } = o;
  if (!c.rag.enabled) return { used: false, reason: "index RAG désactivés" };
  const sStore = loadStore("diapos", emptySlides(), c), zStore = loadStore("bibliotheque", emptyZotero(), c);
  const slides = Object.values(sStore.items).filter(e => e.docId && e.description);
  const inScope = (r: ReferenceEntry) => c.citations.scope !== "collection" || r.collections.includes(c.citations.collection);
  const allCits: Cand[] = Object.values(zStore.items).filter(inScope).flatMap(r => Object.values(r.annotations).map(a => ({ a, r })))
    .filter(x => (x.a.text || x.a.comment).length >= c.citations.minLength && (c.citations.includeNotes || x.a.kind === "annotation"));
  const needC = screens.some(s => s.type === "citation"), needD = screens.some(s => s.type === "diapo");
  if (needC && !allCits.length) return { used: false, reason: "index de la bibliothèque vide (ou aucune citation dans la collection choisie)" };
  if (needD && !slides.length) return { used: false, reason: "index des diapos vide" };
  console.log(`🔎 [RAG] Index : ${slides.length} diapo(s), ${allCits.length} citation(s) possible(s)`);

  const albert = new Albert(workflowConfig.models.provider, process.env.ALBERT_API_KEY ?? "");
  const themed = hasTheme(theme);
  const cycles = [...new Set(screens.map(s => s.cycle))].sort((a, b) => a - b);

  // une requête de recherche par cycle, chacune sur une facette du thème de la conférence
  let queries: string[] = [];
  if (themed) {
    try {
      const { object } = await askAgent(curatorAgent, {
        model: c.models.analytics, source: "Requêtes RAG (curatorAgent)",
        schema: z.object({ requetes: z.array(z.string()).describe("requêtes de recherche, une par séquence, chacune sur une facette différente du thème") }),
        prompt: `La conférence enchaîne ${cycles.length} séquences ; chacune confronte une citation de la bibliothèque et une diapo des anciennes conférences. Propose ${cycles.length} requêtes de recherche.\n\n${themeBlock(theme)}`,
      });
      queries = object.requetes.map(q => q.trim()).filter(Boolean);
      console.log(`🧭 [RAG] Requêtes : ${queries.map((q, i) => `${i + 1}. ${q}`).join(" · ")}`);
    } catch (e) {
      console.warn("⚠️ [RAG] Requêtes indisponibles : candidats tirés au hasard dans les index.", (e as Error).message);
    }
  }

  const sCol = sStore.collectionId, zCol = zStore.collectionId;
  const usedCit = new Set<string>(), usedDia = new Set<string>();
  let previous: { citations: Citation[]; diapos: SlideEntry[] } = { citations: [], diapos: [] };

  for (const cycle of cycles) {
    const inCycle = screens.filter(s => s.cycle === cycle);
    const cScreens = inCycle.filter(s => s.type === "citation"), dScreens = inCycle.filter(s => s.type === "diapo");
    const genScreens = inCycle.filter(s => s.type === "question" || s.type === "diagramme");
    if (!cScreens.length && !dScreens.length && !genScreens.length) continue;
    const query = queries[cycle % Math.max(1, queries.length)];

    // candidats : résultats du RAG pour la requête du cycle, complétés au hasard dans les index
    let cits: Cand[] = [], dias: SlideEntry[] = [];
    if (cScreens.length) {
      if (query && zCol) {
        try {
          const res = await albert.search({ collectionIds: [zCol], query, limit: c.rag.searchLimit, method: "hybrid",
            ...(c.citations.scope === "collection" && c.citations.collection ? { metadataFilter: { key: "collections", type: "co" as const, value: c.citations.collection } } : {}) });
          recordUsage("Recherche RAG (bibliothèque)", "BAAI/bge-m3", { inputTokens: Number(res.usage?.prompt_tokens) || Math.ceil(query.length / 4), outputTokens: 0 });
          for (const hit of res.data) {
            const r = zStore.items[String(hit.chunk.metadata?.key ?? "")];
            if (!r || !inScope(r)) continue;
            const keys = [...hit.chunk.content.matchAll(/\[\[([A-Z0-9]+)\]\]/g)].map(m => m[1]!);
            const anns = keys.length ? keys.map(k => r.annotations[k]).filter(Boolean) as AnnotationEntry[] : Object.values(r.annotations);
            for (const a of anns) if (!cits.some(x => x.a.key === a.key)) cits.push({ a, r });
          }
        } catch (e) { console.warn("⚠️ [RAG] Recherche dans la bibliothèque impossible :", (e as Error).message.split("\n")[0]); }
      }
      cits = cits.filter(x => !usedCit.has(x.a.key) && allCits.some(y => y.a.key === x.a.key)).slice(0, 8);
      for (const x of shuffle(rng, allCits)) { if (cits.length >= Math.max(cScreens.length, query ? cScreens.length : 6)) break; if (!usedCit.has(x.a.key) && !cits.includes(x)) cits.push(x); }
    }
    if (dScreens.length) {
      if (query && sCol) {
        try {
          const res = await albert.search({ collectionIds: [sCol], query, limit: c.rag.searchLimit, method: "hybrid" });
          recordUsage("Recherche RAG (diapos)", "BAAI/bge-m3", { inputTokens: Number(res.usage?.prompt_tokens) || Math.ceil(query.length / 4), outputTokens: 0 });
          for (const hit of res.data) {
            const e = sStore.items[`${hit.chunk.metadata?.path}#${hit.chunk.metadata?.diapo}`];
            if (e?.description && !dias.includes(e)) dias.push(e);
          }
        } catch (e) { console.warn("⚠️ [RAG] Recherche dans les diapos impossible :", (e as Error).message.split("\n")[0]); }
      }
      dias = dias.filter(e => !usedDia.has(`${e.path}#${e.diapo}`)).slice(0, 8);
      for (const e of shuffle(rng, slides)) { if (dias.length >= Math.max(dScreens.length, query ? dScreens.length : 6)) break; if (!usedDia.has(`${e.path}#${e.diapo}`) && !dias.includes(e)) dias.push(e); }
    }

    // analyse de cohérence : choix de la citation et de la diapo, question et diagramme (un seul appel)
    const fields: Record<string, z.ZodTypeAny> = {
      coherence: z.string().describe("en une phrase : pourquoi ces éléments vont ensemble et avec la conférence"),
    };
    if (cScreens.length) fields.citations = z.array(z.number().int()).describe(`numéros des ${cScreens.length} citation(s) retenue(s) parmi [C…]`);
    if (dScreens.length) fields.diapos = z.array(z.number().int()).describe(`numéros des ${dScreens.length} diapo(s) retenue(s) parmi [D…]`);
    if (genScreens.length) {
      fields.question = z.string().describe("question ouverte posée au public : une seule phrase courte, 15 mots au plus");
      fields.intention = z.string().describe("en une phrase : ce que la question met en tension");
      Object.assign(fields, diagramFields);
    }
    let pickC: Cand[] = cits.slice(0, cScreens.length), pickD: SlideEntry[] = dias.slice(0, dScreens.length), gen: any = null;
    try {
      const { object } = await askAgent(seminarioAgent, {
        model: c.models.analytics, source: "Cohérence, questions et diagrammes (seminarioAgent)",
        schema: z.object(fields),
        prompt: `Séquence ${cycle + 1} de la conférence « ${theme.title} ».
${cScreens.length ? `Choisis ${cScreens.length} citation(s) parmi [C…]` : ""}${cScreens.length && dScreens.length ? " et " : ""}${dScreens.length ? `${dScreens.length} diapo(s) parmi [D…]` : ""}${cScreens.length || dScreens.length ? "." : ""}
${genScreens.length ? "Formule ensuite la question, son intention et le diagramme de la séquence." : ""}
${themed ? `\n${themeBlock(theme)}\n` : ""}${query ? `\nRequête de la séquence : ${query}\n` : ""}
${cits.length ? `<citations>\n${cits.map((x, i) => `[C${i + 1}] « ${clip(x.a.text || x.a.comment, 400)} »${x.a.comment && x.a.text ? ` (commentaire : ${clip(x.a.comment, 200)})` : ""} — ${[x.r.creators, x.r.year, x.r.title].filter(Boolean).join(", ")}`).join("\n")}\n</citations>` : ""}
${dias.length ? `<diapos>\n${dias.map((e, i) => `[D${i + 1}] ${e.name}, diapo ${e.diapo} : ${e.title}. ${e.description}`).join("\n")}\n</diapos>` : ""}
${!cScreens.length && !dScreens.length && (previous.citations.length || previous.diapos.length) ? `<elements_de_la_sequence>\n${previous.citations.map(ci => `« ${ci.text} » — ${ci.source.creators || ci.source.title}`).join("\n")}\n${previous.diapos.map(d => `${d.name}, diapo ${d.diapo} : ${d.title}. ${d.description}`).join("\n")}\n</elements_de_la_sequence>` : ""}`,
      });
      const o2 = object as any;
      const pick = <T>(list: T[], idx: number[] | undefined, n: number) => {
        const seen = new Set<number>(), out: T[] = [];
        for (const i of idx ?? []) if (i >= 1 && i <= list.length && !seen.has(i)) { seen.add(i); out.push(list[i - 1]!); }
        for (const x of list) { if (out.length >= n) break; if (!out.includes(x)) out.push(x); }
        return out.slice(0, n);
      };
      if (cScreens.length) pickC = pick(cits, o2.citations, cScreens.length);
      if (dScreens.length) pickD = pick(dias, o2.diapos, dScreens.length);
      gen = o2;
      if (o2.coherence) console.log(`🔗 [SÉQUENCE ${cycle + 1}] ${o2.coherence}`);
    } catch (e) {
      console.warn(`⚠️ [RAG] Analyse de cohérence impossible pour la séquence ${cycle + 1} : premiers candidats retenus.`, (e as Error).message.split("\n")[0]);
    }

    // affectation aux écrans ; copies d'écran de l'index recopiées dans la partition
    const chosenCits = pickC.map(x => toCitation(x, c.citations.maxLength));
    cScreens.forEach((s, i) => { if (chosenCits[i]) { s.citation = chosenCits[i]; usedCit.add(pickC[i]!.a.key); } });
    dScreens.forEach((s, i) => {
      const e = pickD[i];
      if (!e) return;
      usedDia.add(`${e.path}#${e.diapo}`);
      let screenshot: string | null = null;
      if (e.screenshot) {
        const src = path.join(indexDir(c), e.screenshot);
        if (fs.existsSync(src)) { screenshot = `diapo_${String(s.index + 1).padStart(2, "0")}.png`; fs.copyFileSync(src, path.join(dir, screenshot)); }
      }
      s.diapo = { path: e.path, name: e.name, diapo: e.diapo, max: e.max, url: e.url, screenshot, description: `${e.title}. ${e.description}` };
    });
    if (chosenCits.length || pickD.length) previous = { citations: chosenCits, diapos: pickD };
    if (gen?.question || gen?.nodes) {
      const question = gen.question ? await shortenQuestion(String(gen.question).trim(), c.models.vision) : "";
      const mermaid = gen.nodes?.length ? buildMermaid(gen.nodes, gen.edges ?? []) : "";
      for (const s of genScreens) {
        if (s.type === "question" && question) s.question = { text: question, intention: String(gen.intention ?? "").trim() };
        if (s.type === "diagramme" && mermaid) s.diagramme = { title: String(gen.diagramTitle ?? "").trim(), mermaid };
      }
      if (question) console.log(`❓ [SÉQUENCE ${cycle + 1}] ${question}`);
    }
    for (const s of cScreens) if (s.citation) console.log(`   ❝ ${s.citation.text.slice(0, 90)}${s.citation.text.length > 90 ? "…" : ""} — ${s.citation.source.creators || s.citation.source.title}`);
    for (const s of dScreens) if (s.diapo) console.log(`   🖼️ ${s.diapo.name} ${s.diapo.diapo} : ${s.diapo.description.slice(0, 80)}…`);
  }
  return { used: true };
}
