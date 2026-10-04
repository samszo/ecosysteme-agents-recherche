// Routes du serveur chaoticumSeminario : partitions (archive locale et Omeka S), lecteur, contributions Grist, séances
import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { Omk } from "../lib/omeka/omk";
import { containerUrl } from "../lib/omeka/omk";
import { PARTITIONS_DIR, type ChaoticumConfig } from "../config/chaoticum";
import { deleteContribution, frameable, readContributions, updateContribution } from "../lib/chaoticum/grist";
import { uploadWithFallback } from "../workflow/runs/importSynthesis";
import { listSlides } from "../lib/chaoticum/slides";
import { emptySlides, emptyZotero, indexDir, loadStore } from "../lib/chaoticum/index/store";
import { regenerate } from "../lib/chaoticum/regenerate";

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void;
interface Ctx {
  root: string;
  publicDir: string;
  readEnv: () => Record<string, string>;
  config: () => ChaoticumConfig;
  serverOmk: () => Promise<Omk>;
  sendJson: (res: http.ServerResponse, status: number, data: unknown) => void;
  readBody: (req: http.IncomingMessage) => Promise<any>;
  // adresse publique de l'application (CHAOTICUM_URL), vide si non configurée
  publicBase: () => string;
}

const validId = (id: string | null): id is string => !!id && /^[\w-]{1,80}$/.test(id);
// copies d'écran : diapo_NN.png (génération) ou diapo_<identifiant>.png (éditeur d'écran)
const FILE_NAME = /^(partition\.json|rapport_chaoticum\.md|diapo_[\w-]{1,40}\.png)$/;
const SCREEN_TYPES = ["citation", "diapo", "question", "contribution", "diagramme"];
const TYPES: Record<string, string> = { ".json": "application/json", ".md": "text/markdown", ".png": "image/png" };
const val = (it: any, t: string) => it?.[t]?.[0]?.["@value"] ?? null;

export function chaoticumRoutes(ctx: Ctx): Record<string, Handler> {
  const base = () => path.join(ctx.root, ctx.config().outputDir, PARTITIONS_DIR);
  const partDir = (runId: string) => path.join(base(), runId);
  const adminUrl = () => ctx.readEnv().OMKS_API_URL?.replace(/\/api\/?$/, "/admin/item/") ?? "";

  // ==========================================
  // Partitions : archive locale + items de configuration Omeka S (workflowId chaoticum-seminario)
  // ==========================================

  function localPartitions() {
    if (!fs.existsSync(base())) return [];
    return fs.readdirSync(base()).flatMap(id => {
      try {
        const p = JSON.parse(fs.readFileSync(path.join(base(), id, "partition.json"), "utf-8"));
        return [{ runId: p.runId ?? id, title: p.title, createdAt: p.createdAt, status: p.status, screens: p.screens?.length ?? 0, durationSeconds: p.durationSeconds, seed: p.seed, configItemId: p.configItemId ?? null, tokens: p.tokens ?? null, impact: p.impact ?? null, source: "local" }];
      } catch { return []; }
    });
  }

  async function omekaPartitions(): Promise<{ list: any[]; error?: string }> {
    try {
      const omk = await ctx.serverOmk();
      const items = await omk.getAllItems("property[0][property]=dcterms:type&property[0][type]=eq&property[0][text]=Configuration de workflow&sort_by=created&sort_order=desc");
      const list = [];
      for (const it of items) {
        let config: any = {};
        try { config = JSON.parse(val(it, "dcterms:description") ?? "{}"); } catch { /* description illisible */ }
        if (config.workflowId !== ctx.config().workflowId) continue;
        let data: any = null;
        try { data = JSON.parse(val(it, "curation:data") ?? "null"); } catch { /* pas de consommation */ }
        list.push({ runId: val(it, "dcterms:identifier") ?? `omeka-${it["o:id"]}`, title: config.title, createdAt: val(it, "curation:dateStart") ?? val(it, "dcterms:date"), status: val(it, "curation:status") ?? "inconnu", screens: config.screens, durationSeconds: (config.durationMinutes ?? 0) * 60, seed: config.seed, configItemId: it["o:id"], tokens: data?.tokens ?? null, impact: data?.impact ?? null, source: "omeka" });
      }
      return { list };
    } catch (e) {
      return { list: [], error: (e as Error).message };
    }
  }

  // médias d'une exécution dans Omeka S : nom du fichier (fin de dcterms:identifier « <run>/<fichier> ») → adresse
  const mediaCache = new Map<string, Map<string, string>>();
  async function omekaFiles(runId: string) {
    if (!mediaCache.has(runId)) {
      const omk = await ctx.serverOmk();
      const item = (await omk.searchItemsByProp("dcterms:identifier", runId))[0];
      if (!item) throw new Error(`Partition ${runId} introuvable (ni archive locale, ni Omeka S)`);
      const files = new Map<string, string>();
      for (const m of await omk.request(omk.url("media", { item_id: item["o:id"], per_page: 200 }))) {
        const name = path.basename(String(val(m, "dcterms:identifier") ?? ""));
        if (FILE_NAME.test(name) && m["o:original_url"]) files.set(name, m["o:original_url"]);
      }
      mediaCache.set(runId, files);
    }
    return mediaCache.get(runId)!;
  }

  async function readFile(runId: string, name: string): Promise<Buffer> {
    if (!validId(runId) || !FILE_NAME.test(name)) throw new Error("Fichier inconnu");
    const local = path.join(partDir(runId), name);
    if (fs.existsSync(local)) return fs.readFileSync(local);
    const url = (await omekaFiles(runId)).get(name);
    if (!url) throw new Error("Fichier absent de cette partition");
    const r = await fetch(containerUrl(url));
    if (!r.ok) throw new Error(`Omeka S ${r.status} sur le fichier`);
    return Buffer.from(await r.arrayBuffer());
  }
  const readPartition = async (runId: string) => JSON.parse((await readFile(runId, "partition.json")).toString("utf-8"));

  // ==========================================
  // Modification d'un écran de la partition (archive locale + nouveau média partition.json dans Omeka S)
  // ==========================================

  const str = (v: unknown, max = 5000) => String(v ?? "").slice(0, max);
  function applyScreenChanges(p: any, index: number, ch: any) {
    const s = p.screens?.[index];
    if (!s) throw new Error(`Écran ${index + 1} introuvable`);
    const changed: string[] = [];
    if (ch.type && ch.type !== s.type) {
      if (!SCREEN_TYPES.includes(ch.type)) throw new Error(`Type d'écran inconnu : ${ch.type}`);
      // le contenu de l'ancien type est retiré
      for (const k of ["citation", "diapo", "question", "diagramme", "contribution"]) delete s[k];
      s.type = ch.type;
      changed.push("type");
    }
    if (ch.duration !== undefined) { s.duration = Math.max(5, Math.round(Number(ch.duration) || s.duration)); changed.push("durée"); }
    if (s.type === "contribution" && ch.contribution) { s.contribution = { instruction: str(ch.contribution.instruction, 300) }; changed.push("consigne"); }
    if (s.type === "citation" && ch.citation) {
      const c = ch.citation;
      s.citation = { ...(s.citation ?? { key: "manuel", kind: "note", color: null, author: null, date: null }), text: str(c.text), comment: str(c.comment, 1000), page: str(c.page, 40),
        source: { ...(s.citation?.source ?? { key: null, url: null }), creators: str(c.creators, 300), year: str(c.year, 10), title: str(c.title, 500) } };
      changed.push("citation");
    }
    if (s.type === "diapo" && ch.diapo) {
      const slidePath = str(ch.diapo.path ?? s.diapo?.path, 200), n = Math.max(0, Math.round(Number(ch.diapo.diapo) || 0));
      if (!/^[\w.-]+\/slide\.html$/.test(slidePath)) throw new Error("Présentation invalide (dossier/slide.html)");
      const moved = slidePath !== s.diapo?.path || n !== s.diapo?.diapo;
      s.diapo = { ...(s.diapo ?? {}), path: slidePath, name: slidePath.replace(/\/slide\.html$/, ""), diapo: n,
        max: Math.max(n, Number(ch.diapo.max ?? s.diapo?.max ?? n) || n), url: `${String(p.siteUrl).replace(/\/?$/, "/")}${slidePath}?diapo=${n}`,
        // la copie d'écran et sa description ne correspondent plus à la nouvelle diapo : reprises de l'index si elle y est
        ...(moved ? fromIndex(p, slidePath, n) : {}) };
      changed.push("diapo");
    }
    if (s.type === "question" && ch.question) { s.question = { text: str(ch.question.text, 600), intention: str(ch.question.intention, 1000) }; changed.push("question"); }
    if (s.type === "diagramme" && ch.diagramme) { s.diagramme = { title: str(ch.diagramme.title, 300), mermaid: str(ch.diagramme.mermaid, 20000) }; changed.push("diagramme"); }
    let start = 0;
    for (const x of p.screens) { x.start = start; start += x.duration; }
    p.durationSeconds = start;
    p.modifiedAt = new Date().toISOString();
    (p.edits ??= []).push({ at: p.modifiedAt, index, changed });
    return changed;
  }

  // diapo de l'index RAG : description et copie d'écran recopiée dans le dossier de la partition
  const newFiles = new Map<string, string[]>();
  function fromIndex(p: any, slidePath: string, n: number) {
    const e = loadStore("diapos", emptySlides(), ctx.config()).items[`${slidePath}#${n}`];
    if (!e?.description) return { screenshot: null, description: "" };
    let screenshot: string | null = null;
    const src = e.screenshot ? path.join(indexDir(ctx.config()), e.screenshot) : "";
    if (src && fs.existsSync(src)) {
      screenshot = `diapo_e${Date.now().toString(36)}.png`;
      fs.mkdirSync(partDir(p.runId), { recursive: true });
      fs.copyFileSync(src, path.join(partDir(p.runId), screenshot));
      newFiles.set(p.runId, [...(newFiles.get(p.runId) ?? []), screenshot]);
    }
    return { screenshot, description: `${e.title}. ${e.description}`, max: e.max };
  }

  // structure de la partition : insérer, dupliquer, déplacer, supprimer un écran
  function applyStructure(p: any, op: string, index: number, opts: any) {
    const n = p.screens.length;
    if (!Number.isInteger(index) || index < 0 || index >= n) throw new Error("Écran introuvable");
    const s = p.screens[index];
    if (op === "delete") { if (n <= 1) throw new Error("Une partition garde au moins un écran"); p.screens.splice(index, 1); }
    else if (op === "duplicate") p.screens.splice(index + 1, 0, JSON.parse(JSON.stringify(s)));
    else if (op === "insert") {
      const type = SCREEN_TYPES.includes(opts.type) ? opts.type : "contribution";
      p.screens.splice(index + 1, 0, { type, cycle: s.cycle, duration: Math.max(5, Math.round(Number(opts.duration) || 60)) });
    } else if (op === "move") {
      const to = Math.max(0, Math.min(n - 1, Number(opts.to)));
      p.screens.splice(to, 0, ...p.screens.splice(index, 1));
    } else throw new Error(`Opération inconnue : ${op}`);
    let start = 0;
    p.screens.forEach((x: any, i: number) => { x.index = i; x.start = start; start += x.duration; });
    p.durationSeconds = start;
    p.modifiedAt = new Date().toISOString();
    (p.edits ??= []).push({ at: p.modifiedAt, op, index });
  }

  async function savePartition(p: any) {
    fs.mkdirSync(partDir(p.runId), { recursive: true });
    const json = JSON.stringify(p, null, 2);
    fs.writeFileSync(path.join(partDir(p.runId), "partition.json"), json);
    let omeka: string | null = null;
    try {
      const omk = await ctx.serverOmk();
      const item = p.configItemId ? { "o:id": p.configItemId } : (await omk.searchItemsByProp("dcterms:identifier", p.runId))[0];
      if (item) {
        const identifier = `${p.runId}/partition.json`;
        const previous = (await omk.request(omk.url("media", { item_id: item["o:id"], per_page: 200 }))).filter((m: any) => val(m, "dcterms:identifier") === identifier);
        await uploadWithFallback(omk, item["o:id"], { buffer: Buffer.from(json, "utf-8"), fileName: `partition_${p.modifiedAt.replace(/[:.]/g, "-")}.json`, type: "application/json" },
          { "dcterms:title": `Partition chaoticumSeminario (données) – modifiée le ${p.modifiedAt}`, "dcterms:identifier": identifier, "dcterms:date": p.modifiedAt, "dcterms:format": "application/json" });
        for (const m of previous) await omk.deleteResource(m["o:id"], "media").catch(() => {});
        for (const f of newFiles.get(p.runId) ?? []) {
          await uploadWithFallback(omk, item["o:id"], { buffer: fs.readFileSync(path.join(partDir(p.runId), f)), fileName: f, type: "image/png" },
            { "dcterms:title": `Copie d'écran ${f} (éditeur)`, "dcterms:identifier": `${p.runId}/${f}` }).catch(() => {});
        }
        newFiles.delete(p.runId);
        mediaCache.delete(p.runId);
        omeka = "ok";
      }
    } catch (e) { omeka = (e as Error).message; }
    return omeka;
  }

  // ==========================================
  // Séances (participations) : archive locale + Omeka S
  // ==========================================

  const partsDir = (runId: string) => path.join(partDir(runId), "participations");

  function summary(p: any) {
    const contributions = p.contributions?.length ?? 0;
    const late = (p.events ?? []).filter((e: any) => e.status === "danger").length;
    return `Séance du ${new Date(p.startedAt).toLocaleString("fr-FR")} (${p.mode === "replay" ? "rejeu" : "en direct"}) : ${(p.events ?? []).length} passage(s) d'écran, ${Math.round((p.elapsedSeconds ?? 0) / 60)} min, ${contributions} contribution(s), ${late} écran(s) très dépassé(s).`;
  }

  async function saveParticipation(p: any) {
    if (!validId(p.runId)) throw new Error("Partition invalide");
    const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomBytes(3).toString("hex")}`;
    // jeton du lien public de rejeu (lecture seule, accessible sans authentification sous /public/)
    const record: any = { ...p, id, savedAt: new Date().toISOString(), shareToken: crypto.randomBytes(16).toString("hex") };
    fs.mkdirSync(partsDir(p.runId), { recursive: true });
    fs.writeFileSync(path.join(partsDir(p.runId), `${id}.json`), JSON.stringify(record, null, 2));

    // Omeka S : item de la séance relié à la partition, données et fichier JSON complet
    let itemId: number | null = null, error: string | null = null;
    try {
      const omk = await ctx.serverOmk();
      const c = ctx.config();
      const partitionItem = p.configItemId ? { "o:id": p.configItemId } : (await omk.searchItemsByProp("dcterms:identifier", p.runId))[0];
      const item = await omk.createItem({
        ...(omk.getClassByTerm(c.omeka.participationClass) ? { "o:resource_class": c.omeka.participationClass } : {}),
        "dcterms:title": `Participation – ${p.title ?? c.title} – ${new Date(p.startedAt).toLocaleString("fr-FR")}`,
        "dcterms:type": c.omeka.participationType,
        "dcterms:identifier": id,
        "dcterms:date": p.startedAt,
        "dcterms:description": summary(p),
        ...(partitionItem ? { "dcterms:relation": { rid: partitionItem["o:id"] } } : {}),
        ...(omk.getPropByTerm("curation:data") ? { "curation:data": JSON.stringify({ runId: p.runId, mode: p.mode, elapsedSeconds: p.elapsedSeconds, events: (p.events ?? []).length, contributions: (p.contributions ?? []).length, share: record.shareToken }) } : {}),
      });
      itemId = item["o:id"];
      await uploadWithFallback(omk, itemId!, { buffer: Buffer.from(JSON.stringify(record, null, 2), "utf-8"), fileName: `participation_${id}.json`, type: "application/json" },
        { "dcterms:title": `Participation ${id}`, "dcterms:identifier": `${p.runId}/participation_${id}.json`, "dcterms:format": "application/json" });
      record.omekaItemId = itemId;
      fs.writeFileSync(path.join(partsDir(p.runId), `${id}.json`), JSON.stringify(record, null, 2));
    } catch (e) {
      error = (e as Error).message;
    }
    return { id, itemId, error, adminUrl: itemId ? adminUrl() + itemId : null, ...shareLink(record.shareToken) };
  }

  // ==========================================
  // Lien public de rejeu : jeton aléatoire, routes /public/ en lecture seule
  // ==========================================

  const shareLink = (token: string) => ({ shareToken: token, sharePath: `/public/rejeu?t=${token}`, publicBase: ctx.publicBase() });
  const validToken = (t: string | null): t is string => !!t && /^[a-f0-9]{32}$/.test(t);

  // séance d'un jeton : archive locale, sinon Omeka S (jeton dans curation:data)
  async function findByToken(token: string): Promise<{ partition: any; participation: any }> {
    if (fs.existsSync(base())) {
      for (const runId of fs.readdirSync(base())) {
        const dir = partsDir(runId);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".json"))) {
          try {
            const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
            if (p.shareToken === token) return { participation: p, partition: await readPartition(p.runId) };
          } catch { /* fichier illisible */ }
        }
      }
    }
    const omk = await ctx.serverOmk();
    const item = (await omk.searchItemsByProp("curation:data", token, "", "in"))[0];
    let data: any = {};
    try { data = JSON.parse(val(item, "curation:data") ?? "{}"); } catch { /* données illisibles */ }
    if (!item || data.share !== token) throw new Error("Lien de rejeu inconnu");
    const participation = await readParticipation(data.runId, val(item, "dcterms:identifier"));
    return { participation, partition: await readPartition(data.runId) };
  }

  // lien public d'une séance déjà enregistrée (créé au besoin)
  async function shareParticipation(runId: string, id: string) {
    const p = await readParticipation(runId, id);
    if (p.shareToken) return shareLink(p.shareToken);
    p.shareToken = crypto.randomBytes(16).toString("hex");
    fs.mkdirSync(partsDir(runId), { recursive: true });
    fs.writeFileSync(path.join(partsDir(runId), `${id}.json`), JSON.stringify(p, null, 2));
    try {
      const omk = await ctx.serverOmk();
      const item = p.omekaItemId ? await omk.request(omk.url(`items/${p.omekaItemId}`)) : (await omk.searchItemsByProp("dcterms:identifier", id))[0];
      if (item && omk.getPropByTerm("curation:data")) {
        let data: any = {};
        try { data = JSON.parse(val(item, "curation:data") ?? "{}"); } catch { /* données illisibles */ }
        await omk.updateResource(item["o:id"], { "curation:data": JSON.stringify({ ...data, share: p.shareToken }) }, "items", "PATCH", item);
      }
    } catch { /* lien valable localement ; Omeka S indisponible */ }
    return shareLink(p.shareToken);
  }

  // données publiques d'un rejeu : sans liens d'administration, clés ni adresses du formulaire
  function publicReplay(partition: any, participation: any) {
    const { grist, configItemId, edits, ...part } = partition;
    const { omekaItemId, configItemId: _c, shareToken, ...seance } = participation;
    return { partition: { ...part, grist: null }, participation: seance };
  }

  async function listParticipations(runId: string) {
    const local = fs.existsSync(partsDir(runId))
      ? fs.readdirSync(partsDir(runId)).filter(f => f.endsWith(".json")).flatMap(f => {
          try { const p = JSON.parse(fs.readFileSync(path.join(partsDir(runId), f), "utf-8")); return [{ id: p.id, startedAt: p.startedAt, mode: p.mode, elapsedSeconds: p.elapsedSeconds, events: p.events?.length ?? 0, contributions: p.contributions?.length ?? 0, omekaItemId: p.omekaItemId ?? null, source: "local" }]; }
          catch { return []; }
        })
      : [];
    let omeka: any[] = [], error: string | null = null;
    try {
      const omk = await ctx.serverOmk();
      const items = await omk.getAllItems(`property[0][property]=dcterms:type&property[0][type]=eq&property[0][text]=${encodeURIComponent(ctx.config().omeka.participationType)}`);
      for (const it of items) {
        let data: any = {};
        try { data = JSON.parse(val(it, "curation:data") ?? "{}"); } catch { /* données illisibles */ }
        if (data.runId !== runId) continue;
        omeka.push({ id: val(it, "dcterms:identifier"), startedAt: val(it, "dcterms:date"), mode: data.mode, elapsedSeconds: data.elapsedSeconds, events: data.events, contributions: data.contributions, omekaItemId: it["o:id"], source: "omeka" });
      }
    } catch (e) { error = (e as Error).message; }
    const byId = new Map<string, any>();
    for (const p of omeka) byId.set(p.id, p);
    for (const p of local) byId.set(p.id, { ...byId.get(p.id), ...p, source: byId.has(p.id) ? "local+omeka" : "local" });
    return { participations: [...byId.values()].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt))), omekaAdmin: adminUrl(), omekaError: error };
  }

  async function readParticipation(runId: string, id: string) {
    const local = path.join(partsDir(runId), `${id}.json`);
    if (fs.existsSync(local)) return JSON.parse(fs.readFileSync(local, "utf-8"));
    const omk = await ctx.serverOmk();
    const item = (await omk.searchItemsByProp("dcterms:identifier", id))[0];
    if (!item) throw new Error("Séance introuvable");
    const media = (await omk.request(omk.url("media", { item_id: item["o:id"], per_page: 20 }))).find((m: any) => String(val(m, "dcterms:identifier") ?? "").endsWith(`participation_${id}.json`));
    if (!media?.["o:original_url"]) throw new Error("Fichier de la séance absent d'Omeka S");
    const r = await fetch(containerUrl(media["o:original_url"]));
    if (!r.ok) throw new Error(`Omeka S ${r.status} sur le fichier de la séance`);
    return r.json();
  }

  // ==========================================
  // Routes
  // ==========================================

  return {
    // lecteur de partition (plein écran)
    // éditeur d'écran (module partagé par la page de configuration et le lecteur)
    "GET /editeur-ecran.js": (_req, res) => {
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
      res.end(fs.readFileSync(path.join(ctx.publicDir, "editeur-ecran.js")));
    },

    "GET /jouer": (_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(path.join(ctx.publicDir, "jouer.html")));
    },

    "GET /api/chaoticum/partitions": async (_req, res) => {
      const [local, omeka] = [localPartitions(), await omekaPartitions()];
      const byRun = new Map<string, any>();
      for (const p of omeka.list) byRun.set(p.runId, p);
      for (const p of local) { const o = byRun.get(p.runId); byRun.set(p.runId, { ...o, ...p, configItemId: p.configItemId ?? o?.configItemId ?? null, source: o ? "local+omeka" : "local" }); }
      ctx.sendJson(res, 200, { partitions: [...byRun.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), omekaAdmin: adminUrl(), omekaError: omeka.error ?? null });
    },

    "GET /api/chaoticum/partition": async (_req, res, url) => {
      const runId = url.searchParams.get("run");
      if (!validId(runId)) return ctx.sendJson(res, 400, { error: "Partition invalide" });
      try { ctx.sendJson(res, 200, await readPartition(runId)); }
      catch (e) { ctx.sendJson(res, 404, { error: (e as Error).message }); }
    },

    "GET /api/chaoticum/file": async (_req, res, url) => {
      const runId = url.searchParams.get("run") ?? "", name = url.searchParams.get("name") ?? "";
      try {
        const content = await readFile(runId, name);
        res.writeHead(200, { "Content-Type": `${TYPES[path.extname(name)] ?? "application/octet-stream"}${name.endsWith(".png") ? "" : "; charset=utf-8"}` });
        res.end(content);
      } catch (e) { ctx.sendJson(res, 404, { error: (e as Error).message }); }
    },

    // réponses du formulaire Grist de la partition (ou de la configuration courante)
    "GET /api/chaoticum/contributions": async (_req, res, url) => {
      try {
        const runId = url.searchParams.get("run");
        const grist = validId(runId) ? (await readPartition(runId).catch(() => null))?.grist ?? ctx.config().grist : ctx.config().grist;
        ctx.sendJson(res, 200, { contributions: await readContributions(grist.responsesUrl, grist, ctx.readEnv().GRIST_API_KEY || undefined), at: new Date().toISOString() });
      } catch (e) { ctx.sendJson(res, 502, { error: (e as Error).message }); }
    },

    // modification ou suppression d'une contribution : dans Grist si la clé le permet, sinon pour la séance seulement
    "POST /api/chaoticum/contribution": async (req, res) => {
      const { run: runId, rowId, url, remove } = await ctx.readBody(req);
      if (!remove && !/^https?:\/\//i.test(String(url ?? ""))) return ctx.sendJson(res, 400, { error: "Adresse invalide (http:// ou https://)" });
      const apiKey = ctx.readEnv().GRIST_API_KEY;
      if (!apiKey || !Number.isInteger(rowId)) return ctx.sendJson(res, 200, { applied: "session", reason: apiKey ? "réponse lue sans identifiant Grist" : "pas de clé Grist (GRIST_API_KEY)" });
      try {
        const grist = (validId(runId) ? (await readPartition(runId).catch(() => null))?.grist : null) ?? ctx.config().grist;
        if (remove) await deleteContribution(grist.responsesUrl, rowId, apiKey);
        else await updateContribution(grist.responsesUrl, grist, rowId, String(url).trim(), apiKey);
        ctx.sendJson(res, 200, { applied: "grist" });
      } catch (e) { ctx.sendJson(res, 200, { applied: "session", reason: (e as Error).message }); }
    },

    // structure de la partition (insérer, dupliquer, déplacer, supprimer un écran)
    "POST /api/chaoticum/partition/structure": async (req, res) => {
      const { run: runId, op, index, ...opts } = await ctx.readBody(req);
      if (!validId(runId)) return ctx.sendJson(res, 400, { error: "Partition invalide" });
      try {
        const p = await readPartition(runId);
        applyStructure(p, String(op), Number(index), opts);
        ctx.sendJson(res, 200, { partition: p, omeka: await savePartition(p) });
      } catch (e) { ctx.sendJson(res, 400, { error: (e as Error).message }); }
    },

    // nouvelle proposition de question ou de diagramme pour un écran (non enregistrée : l'animateur valide)
    "POST /api/chaoticum/partition/regenerate": async (req, res) => {
      const { run: runId, index, what, hint } = await ctx.readBody(req);
      if (!validId(runId) || !["question", "diagramme"].includes(what)) return ctx.sendJson(res, 400, { error: "Demande invalide" });
      try { ctx.sendJson(res, 200, await regenerate(await readPartition(runId), Number(index), what, ctx.config(), str(hint, 300))); }
      catch (e) { ctx.sendJson(res, 502, { error: (e as Error).message }); }
    },

    // recherche dans les index locaux (citations ou diapos) pour l'éditeur d'écran : sans appel à Albert
    "GET /api/chaoticum/index/search": async (_req, res, url) => {
      const c = ctx.config(), kind = url.searchParams.get("kind"), q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
      const terms = q.split(/\s+/).filter(t => t.length > 1);
      const score = (text: string) => { const t = text.toLowerCase(); return terms.length ? terms.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0) : 1; };
      if (kind === "diapo") {
        const items = Object.values(loadStore("diapos", emptySlides(), c).items).filter(e => e.description)
          .map(e => ({ e, s: score(`${e.name} ${e.title} ${e.keywords.join(" ")} ${e.description}`) })).filter(x => x.s > 0)
          .sort((a, b) => b.s - a.s).slice(0, 24)
          .map(({ e }) => ({ path: e.path, name: e.name, diapo: e.diapo, max: e.max, title: e.title, description: e.description, thumb: e.screenshot ? `/api/chaoticum/index/screenshot?path=${encodeURIComponent(e.path)}&diapo=${e.diapo}` : null }));
        return ctx.sendJson(res, 200, items);
      }
      if (kind === "citation") {
        const items = Object.values(loadStore("bibliotheque", emptyZotero(), c).items).flatMap(r => Object.values(r.annotations).map(a => ({ a, r })))
          .filter(x => (x.a.text || x.a.comment).length >= 20)
          .map(x => ({ ...x, s: score(`${x.a.text} ${x.a.comment} ${x.r.title} ${x.r.creators} ${x.r.tags.join(" ")}`) })).filter(x => x.s > 0)
          .sort((a, b) => b.s - a.s).slice(0, 30)
          .map(({ a, r }) => ({ key: a.key, kind: a.kind, text: a.text || a.comment, comment: a.text ? a.comment : "", page: a.page, color: a.color, author: a.author, date: a.date, source: { key: r.key, title: r.title, creators: r.creators, year: r.year } }));
        return ctx.sendJson(res, 200, items);
      }
      ctx.sendJson(res, 400, { error: "kind = citation ou diapo" });
    },

    // copie d'écran d'une diapo de l'index (vignettes de l'éditeur)
    "GET /api/chaoticum/index/screenshot": async (_req, res, url) => {
      const e = loadStore("diapos", emptySlides(), ctx.config()).items[`${url.searchParams.get("path")}#${url.searchParams.get("diapo")}`];
      const file = e?.screenshot ? path.join(indexDir(ctx.config()), e.screenshot) : "";
      if (!file || !fs.existsSync(file)) return ctx.sendJson(res, 404, { error: "Copie d'écran absente" });
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "max-age=3600" });
      res.end(fs.readFileSync(file));
    },

    // modification d'un écran de la partition (durée, citation, diapo, question, diagramme)
    "POST /api/chaoticum/partition/screen": async (req, res) => {
      const { run: runId, index, changes } = await ctx.readBody(req);
      if (!validId(runId)) return ctx.sendJson(res, 400, { error: "Partition invalide" });
      try {
        const p = await readPartition(runId);
        const changed = applyScreenChanges(p, Number(index), changes ?? {});
        const omeka = await savePartition(p);
        ctx.sendJson(res, 200, { partition: p, changed, omeka });
      } catch (e) { ctx.sendJson(res, 400, { error: (e as Error).message }); }
    },

    // lien public de rejeu d'une séance enregistrée
    "POST /api/chaoticum/participation/share": async (req, res) => {
      const { run: runId, id } = await ctx.readBody(req);
      if (!validId(runId) || !validId(id)) return ctx.sendJson(res, 400, { error: "Séance invalide" });
      try { ctx.sendJson(res, 200, await shareParticipation(runId, id)); }
      catch (e) { ctx.sendJson(res, 404, { error: (e as Error).message }); }
    },

    // ==========================================
    // Rejeu public (lecture seule, sans authentification : exempter /public/ dans le proxy)
    // ==========================================
    "GET /public/rejeu": (_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" });
      res.end(fs.readFileSync(path.join(ctx.publicDir, "jouer.html")));
    },
    "GET /public/api/rejeu": async (_req, res, url) => {
      const token = url.searchParams.get("t");
      if (!validToken(token)) return ctx.sendJson(res, 404, { error: "Lien de rejeu inconnu" });
      try { const { partition, participation } = await findByToken(token); ctx.sendJson(res, 200, publicReplay(partition, participation)); }
      catch { ctx.sendJson(res, 404, { error: "Lien de rejeu inconnu" }); }
    },
    "GET /public/api/rejeu/file": async (_req, res, url) => {
      const token = url.searchParams.get("t"), name = url.searchParams.get("name") ?? "";
      if (!validToken(token) || !/^diapo_[\w-]{1,40}\.png$/.test(name)) return ctx.sendJson(res, 404, { error: "Fichier inconnu" });
      try {
        const { partition } = await findByToken(token);
        const content = await readFile(partition.runId, name);
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(content);
      } catch { ctx.sendJson(res, 404, { error: "Fichier inconnu" }); }
    },

    // état des index RAG (diapos, bibliothèque)
    "GET /api/chaoticum/index": async (_req, res) => {
      const c = ctx.config();
      const s = loadStore("diapos", emptySlides(), c), z = loadStore("bibliotheque", emptyZotero(), c);
      const presentations = await listSlides(c.slides).catch(() => []);
      const known = Object.keys(s.presentations).length;
      ctx.sendJson(res, 200, {
        enabled: c.rag.enabled,
        diapos: { indexed: Object.values(s.items).filter(e => e.docId).length, known: Object.values(s.presentations).reduce((n, p) => n + p.max + 1, 0), presentations: presentations.length, presentationsOpened: known, collectionId: s.collectionId, updatedAt: s.updatedAt },
        bibliotheque: { references: Object.keys(z.items).length, citations: Object.values(z.items).reduce((n, r) => n + Object.keys(r.annotations).length, 0), library: z.library, collectionId: z.collectionId, updatedAt: z.updatedAt },
      });
    },

    // présentations du site ConfErrance (éditeur de partition)
    "GET /api/chaoticum/slides": async (_req, res) => {
      try { ctx.sendJson(res, 200, await listSlides(ctx.config().slides)); }
      catch (e) { ctx.sendJson(res, 502, { error: (e as Error).message }); }
    },

    // une URL proposée par le public peut-elle s'afficher dans un iframe ?
    "GET /api/chaoticum/frameable": async (_req, res, url) => ctx.sendJson(res, 200, await frameable(url.searchParams.get("url") ?? "")),

    "POST /api/chaoticum/participation": async (req, res) => {
      try { ctx.sendJson(res, 200, await saveParticipation(await ctx.readBody(req))); }
      catch (e) { ctx.sendJson(res, 400, { error: (e as Error).message }); }
    },

    "GET /api/chaoticum/participations": async (_req, res, url) => {
      const runId = url.searchParams.get("run");
      if (!validId(runId)) return ctx.sendJson(res, 400, { error: "Partition invalide" });
      ctx.sendJson(res, 200, await listParticipations(runId));
    },

    "GET /api/chaoticum/participation": async (_req, res, url) => {
      const runId = url.searchParams.get("run"), id = url.searchParams.get("id");
      if (!validId(runId) || !validId(id)) return ctx.sendJson(res, 400, { error: "Séance invalide" });
      try { ctx.sendJson(res, 200, await readParticipation(runId, id)); }
      catch (e) { ctx.sendJson(res, 404, { error: (e as Error).message }); }
    },
  };
}
