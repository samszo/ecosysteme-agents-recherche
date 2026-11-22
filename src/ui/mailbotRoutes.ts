// Routes du serveur mailbot : réglages, archive des messages, brouillons (validation par l'administrateur, envoi),
// exécutions passées, et planification (synchronisation et mails planifiés selon des expressions cron)
import http from "http";
import fs from "fs";
import path from "path";
import type { Omk } from "../lib/omeka/omk";
import { writeConfigOverride } from "../config/store";
import { defaultMailbotConfig, MAILBOT_CONFIG_FILE, PROFILE_ID, RUNS_DIR, type MailbotConfig } from "../config/mailbot";
import { listDrafts, readDraft, readMessages, saveDraft, type MailDraft } from "../lib/mail/store";
import { composeMail, draftReply, sendDraft } from "../lib/mail/generate";
import { cronError, nextRun, parseCron } from "../lib/mail/cron";
import { usageSummary } from "../lib/metrics/usage";

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void;
interface Ctx {
  root: string;
  readEnv: () => Record<string, string>;
  config: () => MailbotConfig;
  serverOmk: () => Promise<Omk>;
  sendJson: (res: http.ServerResponse, status: number, data: unknown) => void;
  readBody: (req: http.IncomingMessage) => Promise<any>;
  // traitement en cours sur ce serveur, lancement d'une exécution (task : « envoi » ou synchronisation)
  isRunning: () => boolean;
  startRun: (task?: string) => void;
}

const validId = (id: unknown): id is string => typeof id === "string" && /^[\w-]{1,80}$/.test(id);
const FILES: Record<string, string> = { "rapport_mailbot.md": "text/markdown", "brouillons.json": "application/json" };
const val = (it: any, t: string) => it?.[t]?.[0]?.["@value"] ?? null;
const SCHEDULE_FILE = "planification.json";

interface ScheduleState { lastSync: string | null; lastCompose: string | null; pending: "sync" | "envoi" | null; log: { at: string; task: string; started: boolean; note?: string }[] }

export function mailbotRoutes(ctx: Ctx): { routes: Record<string, Handler>; startScheduler: () => void } {
  const outDir = () => path.resolve(ctx.root, ctx.config().outputDir);
  const runsDir = () => path.join(outDir(), RUNS_DIR);

  // ==========================================
  // Planification
  // ==========================================
  const scheduleFile = () => path.join(outDir(), SCHEDULE_FILE);
  const readSchedule = (): ScheduleState => {
    try { return { lastSync: null, lastCompose: null, pending: null, log: [], ...JSON.parse(fs.readFileSync(scheduleFile(), "utf-8")) }; }
    catch { return { lastSync: null, lastCompose: null, pending: null, log: [] }; }
  };
  const writeSchedule = (s: ScheduleState) => {
    fs.mkdirSync(outDir(), { recursive: true });
    s.log = s.log.slice(-100);
    fs.writeFileSync(scheduleFile(), JSON.stringify(s, null, 2));
  };
  const minuteKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
  let lastTick = "";

  // toutes les 20 s : une échéance atteinte lance la tâche ; si un traitement est en cours, elle attend sa fin
  // (un mail planifié comprend une synchronisation : il l'emporte sur une synchronisation en attente)
  function tick() {
    const now = new Date();
    const key = minuteKey(now);
    const s = readSchedule();
    const c = ctx.config().schedule;
    let due: "sync" | "envoi" | null = s.pending;
    if (key !== lastTick) {
      lastTick = key;
      const match = (expr: string) => { try { return parseCron(expr)(now); } catch { return false; } };
      if (c.composeEnabled && match(c.compose)) due = "envoi";
      else if (c.syncEnabled && match(c.sync) && due !== "envoi") due = "sync";
    }
    if (!due) return;
    if (ctx.isRunning()) {
      if (s.pending !== due) { s.pending = due; s.log.push({ at: now.toISOString(), task: due, started: false, note: "traitement en cours : lancement différé" }); writeSchedule(s); }
      return;
    }
    ctx.startRun(due === "envoi" ? "envoi" : undefined);
    s.pending = null;
    if (due === "envoi") s.lastCompose = now.toISOString(); else s.lastSync = now.toISOString();
    s.log.push({ at: now.toISOString(), task: due, started: true });
    writeSchedule(s);
    console.log(`⏰ Planification : ${due === "envoi" ? "mail planifié" : "synchronisation"} lancé(e)`);
  }

  function scheduleState() {
    const c = ctx.config().schedule;
    const s = readSchedule();
    const next = (expr: string, enabled: boolean) => (enabled && !cronError(expr) ? nextRun(expr)?.toISOString() ?? null : null);
    return {
      sync: { enabled: c.syncEnabled, cron: c.sync, error: cronError(c.sync), next: next(c.sync, c.syncEnabled), last: s.lastSync },
      compose: { enabled: c.composeEnabled, cron: c.compose, error: cronError(c.compose), next: next(c.compose, c.composeEnabled), last: s.lastCompose },
      pending: s.pending, log: s.log.slice(-20).reverse(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // ==========================================
  // Exécutions : archive locale + items de configuration Omeka S (workflowId mailbot)
  // ==========================================
  function localRuns() {
    if (!fs.existsSync(runsDir())) return [];
    const runs: any[] = [];
    for (const id of fs.readdirSync(runsDir())) {
      try { runs.push({ ...JSON.parse(fs.readFileSync(path.join(runsDir(), id, "execution.json"), "utf-8")), source: "local" }); }
      catch { /* dossier sans description */ }
    }
    return runs;
  }
  async function omekaRuns(): Promise<{ runs: any[]; error?: string }> {
    try {
      const omk = await ctx.serverOmk();
      const items = await omk.getAllItems("property[0][property]=dcterms:type&property[0][type]=eq&property[0][text]=Configuration de workflow&sort_by=created&sort_order=desc");
      const runs: any[] = [];
      for (const it of items) {
        let config: any = {};
        try { config = JSON.parse(val(it, "dcterms:description") ?? "{}"); } catch { /* description illisible */ }
        if (config.workflowId !== defaultMailbotConfig.workflowId) continue;
        let data: any = null;
        try { data = JSON.parse(val(it, "curation:data") ?? "null"); } catch { /* pas de consommation */ }
        runs.push({
          runId: val(it, "dcterms:identifier") ?? `omeka-${it["o:id"]}`, status: val(it, "curation:status") ?? "inconnu",
          task: config.input?.compose ? "envoi" : null,
          startedAt: val(it, "curation:dateStart") ?? val(it, "dcterms:date"), endedAt: val(it, "curation:dateEnd") ?? "",
          configItemId: it["o:id"], profiles: (config.profiles ?? []).map((p: any) => ({ id: p.id, email: p.researcher?.email ?? "" })), tokens: data?.tokens ?? null, impact: data?.impact ?? null, source: "omeka",
        });
      }
      return { runs };
    } catch (e) {
      return { runs: [], error: (e as Error).message };
    }
  }
  async function readRunFile(name: string, runId: string): Promise<Buffer> {
    const local = path.join(runsDir(), runId, name);
    if (fs.existsSync(local)) return fs.readFileSync(local);
    // repli : média de l'item de configuration (dcterms:identifier « <run>/<fichier> »)
    const omk = await ctx.serverOmk();
    const item = (await omk.searchItemsByProp("dcterms:identifier", runId))[0];
    if (!item) throw new Error("Exécution introuvable");
    for (const m of await omk.request(omk.url("media", { item_id: item["o:id"], per_page: 100 }))) {
      if (path.basename(String(val(m, "dcterms:identifier") ?? "")) === name && m["o:original_url"]) {
        const res = await fetch(m["o:original_url"]);
        if (res.ok) return Buffer.from(await res.arrayBuffer());
      }
    }
    throw new Error("Fichier introuvable");
  }

  const draftOr404 = (res: http.ServerResponse, id: unknown) => {
    if (!validId(id)) { ctx.sendJson(res, 400, { error: "Brouillon invalide" }); return null; }
    const d = readDraft(ctx.config(), id);
    if (!d) ctx.sendJson(res, 404, { error: "Brouillon introuvable" });
    return d;
  };
  // modifications de l'administrateur (sujet, corps) avant enregistrement ou envoi
  const applyEdits = (d: any, body: any) => {
    if (typeof body.subject === "string" && body.subject.trim()) d.subject = body.subject.trim().slice(0, 500);
    if (typeof body.body === "string" && body.body.trim()) d.body = body.body.slice(0, 100_000);
  };

  const routes: Record<string, Handler> = {
    "GET /api/mailbot/settings": (_req, res) => ctx.sendJson(res, 200, { config: ctx.config(), defaults: defaultMailbotConfig }),
    "POST /api/mailbot/settings": async (req, res) => {
      const { config } = await ctx.readBody(req);
      if (!config || typeof config !== "object") return ctx.sendJson(res, 400, { error: "Configuration manquante" });
      for (const k of ["sync", "compose"] as const) {
        const err = config.schedule?.[k] !== undefined ? cronError(String(config.schedule[k])) : null;
        if (err) return ctx.sendJson(res, 400, { error: `Planification (${k === "sync" ? "synchronisation" : "mail planifié"}) : ${err}` });
      }
      // adresses vérifiées : une adresse mal saisie dans une liste priverait un chercheur de réponse ou ferait échouer un envoi
      const isAddress = (a: unknown) => typeof a === "string" && /^[^\s@<>,;]+@[^\s@<>,;]+$/.test(a.trim());
      // profils : au moins un, identifiants courts et uniques (ils nomment les clés de connexion), adresses valides
      const profiles = Array.isArray(config.profiles) ? config.profiles : [];
      if (!profiles.length) return ctx.sendJson(res, 400, { error: "Au moins un profil est nécessaire" });
      const ids = new Set<string>();
      for (const p of profiles) {
        if (!PROFILE_ID.test(String(p?.id ?? ""))) return ctx.sendJson(res, 400, { error: `Identifiant de profil invalide : « ${p?.id ?? ""} » (minuscules et chiffres, 20 caractères au plus)` });
        if (ids.has(p.id)) return ctx.sendJson(res, 400, { error: `Identifiant de profil en double : ${p.id}` });
        ids.add(p.id);
        if (p.researcher?.email && !isAddress(p.researcher.email)) return ctx.sendJson(res, 400, { error: `Profil ${p.id} : adresse du chercheur invalide` });
        const bad = (Array.isArray(p.recipients) ? p.recipients : []).filter((a: unknown) => !isAddress(a));
        if (bad.length) return ctx.sendJson(res, 400, { error: `Profil ${p.id} : adresse(s) invalide(s) parmi les destinataires : ${bad.join(", ")}` });
      }
      if (config.admin?.email && !isAddress(config.admin.email)) return ctx.sendJson(res, 400, { error: "Adresse de l'administrateur invalide" });
      for (const [list, label] of [[config.bot?.allowed, "adresses autorisées"], [config.bot?.group, "groupe"]] as const) {
        const bad = (Array.isArray(list) ? list : []).filter((a: unknown) => !isAddress(a));
        if (bad.length) return ctx.sendJson(res, 400, { error: `Adresse(s) invalide(s) dans la liste ${label} : ${bad.join(", ")}` });
      }
      writeConfigOverride(defaultMailbotConfig, config, MAILBOT_CONFIG_FILE);
      ctx.sendJson(res, 200, { ok: true, config: ctx.config(), schedule: scheduleState() });
    },

    // vue d'ensemble : messages archivés, brouillons, planification
    "GET /api/mailbot/overview": (_req, res) => {
      const config = ctx.config();
      const messages = readMessages(config);
      const drafts = listDrafts(config);
      ctx.sendJson(res, 200, {
        profiles: config.profiles.map(p => ({ id: p.id, researcher: p.researcher, messages: messages.filter(m => m.profile === p.id).length })),
        messages: {
          total: messages.length,
          incoming: messages.filter(m => m.direction === "entrant").length,
          outgoing: messages.filter(m => m.direction === "sortant").length,
          attachments: messages.reduce((n, m) => n + m.attachments.length, 0),
          omeka: messages.filter(m => m.omekaItemId).length,
          zotero: messages.filter(m => m.zoteroKey).length,
          rag: messages.filter(m => m.albertDocumentId).length,
          history: messages.filter(m => m.box === "history").length,
          bot: messages.filter(m => m.box === "bot").length,
          first: messages[0]?.date ?? null, last: messages[messages.length - 1]?.date ?? null,
        },
        drafts: { pending: drafts.filter(d => d.status === "en attente").length, sent: drafts.filter(d => d.status === "envoyé").length, failed: drafts.filter(d => d.status === "échec").length },
        schedule: scheduleState(),
        omekaAdmin: ctx.readEnv().OMKS_API_URL?.replace(/\/api\/?$/, "/admin/item/") ?? "",
      });
    },

    // messages archivés (sans le texte complet), du plus récent au plus ancien ; q : filtre sur le sujet, l'expéditeur et le texte
    "GET /api/mailbot/messages": (_req, res, url) => {
      const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
      const limit = Math.min(Number(url.searchParams.get("limit")) || 200, 2000);
      // box : history (historique du chercheur), bot (boîte du mailbot), vide = les deux
      const box = url.searchParams.get("box") ?? "";
      // profile : identifiant d'un profil (messages de son historique et échanges du mailbot qui le concernent)
      const profile = url.searchParams.get("profile") ?? "";
      const list = readMessages(ctx.config()).reverse()
        .filter(m => !box || m.box === box)
        .filter(m => !profile || m.profile === profile)
        .filter(m => !q || `${m.subject} ${m.from.address} ${m.from.name} ${m.to.map(t => t.address).join(" ")} ${m.text}`.toLowerCase().includes(q))
        .slice(0, limit)
        .map(({ text, ...m }) => ({ ...m, excerpt: text.slice(0, 240) }));
      ctx.sendJson(res, 200, { messages: list });
    },
    "GET /api/mailbot/message": (_req, res, url) => {
      const id = url.searchParams.get("id");
      if (!validId(id)) return ctx.sendJson(res, 400, { error: "Message invalide" });
      const m = readMessages(ctx.config()).find(x => x.id === id);
      m ? ctx.sendJson(res, 200, m) : ctx.sendJson(res, 404, { error: "Message introuvable" });
    },
    // pièce jointe archivée : téléchargement seulement (jamais affichée dans la page)
    "GET /api/mailbot/attachment": (_req, res, url) => {
      const id = url.searchParams.get("id"), sha = url.searchParams.get("sha1") ?? "";
      if (!validId(id) || !/^[0-9a-f]{40}$/.test(sha)) return ctx.sendJson(res, 400, { error: "Pièce jointe invalide" });
      const a = readMessages(ctx.config()).find(x => x.id === id)?.attachments.find(x => x.sha1 === sha);
      const file = a && path.resolve(ctx.root, a.path);
      if (!a || !file || !file.startsWith(outDir() + path.sep) || !fs.existsSync(file)) return ctx.sendJson(res, 404, { error: "Pièce jointe introuvable" });
      res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(a.fileName)}`, "X-Content-Type-Options": "nosniff" });
      res.end(fs.readFileSync(file));
    },

    // ==========================================
    // Brouillons : vérification, modification, envoi, rejet, nouvelle proposition
    // ==========================================
    "GET /api/mailbot/drafts": (_req, res) => ctx.sendJson(res, 200, { drafts: listDrafts(ctx.config()) }),
    "POST /api/mailbot/drafts/save": async (req, res) => {
      const body = await ctx.readBody(req);
      const d = draftOr404(res, body.id);
      if (!d) return;
      if (d.status === "envoyé") return ctx.sendJson(res, 409, { error: "Brouillon déjà envoyé" });
      applyEdits(d, body);
      ctx.sendJson(res, 200, saveDraft(ctx.config(), d, "modification"));
    },
    "POST /api/mailbot/drafts/send": async (req, res) => {
      const body = await ctx.readBody(req);
      const d = draftOr404(res, body.id);
      if (!d) return;
      if (d.status === "envoyé") return ctx.sendJson(res, 409, { error: "Brouillon déjà envoyé" });
      applyEdits(d, body);
      saveDraft(ctx.config(), d, "validation par l'administrateur");
      try { ctx.sendJson(res, 200, await sendDraft(d, ctx.config(), ctx.readEnv())); }
      catch (e) { ctx.sendJson(res, 502, { error: (e as Error).message }); }
    },
    "POST /api/mailbot/drafts/reject": async (req, res) => {
      const body = await ctx.readBody(req);
      const d = draftOr404(res, body.id);
      if (!d) return;
      if (d.status === "envoyé") return ctx.sendJson(res, 409, { error: "Brouillon déjà envoyé" });
      d.status = "rejeté";
      ctx.sendJson(res, 200, saveDraft(ctx.config(), d, "rejet", typeof body.note === "string" ? body.note.slice(0, 1000) : undefined));
    },
    // nouvelle rédaction (agent) avec une précision de l'administrateur ; remplace le texte du brouillon, coût renvoyé
    "POST /api/mailbot/drafts/regenerate": async (req, res) => {
      const body = await ctx.readBody(req);
      const d = draftOr404(res, body.id);
      if (!d) return;
      if (d.status === "envoyé") return ctx.sendJson(res, 409, { error: "Brouillon déjà envoyé" });
      const config = ctx.config();
      const env = ctx.readEnv();
      const hint = typeof body.hint === "string" ? body.hint.slice(0, 2000) : "";
      const all = readMessages(config);
      const before = usageSummary().totalTokens;
      try {
        let fresh;
        if (d.kind === "reponse") {
          const m = all.find(x => x.id === d.replyTo?.id);
          if (!m) return ctx.sendJson(res, 404, { error: "Message d'origine absent de l'archive" });
          fresh = await draftReply({ message: m, all, config, runId: d.runId, env, hint, id: d.id });
        } else {
          fresh = await composeMail({ all, config, runId: d.runId, env, hint, id: d.id });
        }
        const merged = { ...d, ...fresh, createdAt: d.createdAt, history: d.history, status: "en attente", error: null } as MailDraft;
        ctx.sendJson(res, 200, { draft: saveDraft(config, merged, "nouvelle proposition", hint || undefined), tokens: usageSummary().totalTokens - before });
      } catch (e) {
        ctx.sendJson(res, 502, { error: (e as Error).message });
      }
    },

    // ==========================================
    // Planification et exécutions
    // ==========================================
    "GET /api/mailbot/schedule": (_req, res) => ctx.sendJson(res, 200, scheduleState()),
    "GET /api/mailbot/runs": async (_req, res) => {
      const omeka = await omekaRuns();
      const byRun = new Map<string, any>();
      for (const r of omeka.runs) byRun.set(r.runId, r);
      for (const r of localRuns()) byRun.set(r.runId, { ...byRun.get(r.runId), ...r, source: byRun.has(r.runId) ? "local+omeka" : "local" });
      ctx.sendJson(res, 200, {
        runs: [...byRun.values()].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt))),
        omekaAdmin: ctx.readEnv().OMKS_API_URL?.replace(/\/api\/?$/, "/admin/item/") ?? "",
        omekaError: omeka.error ?? null,
      });
    },
    "GET /api/mailbot/results": (_req, res, url) => {
      const run = url.searchParams.get("run");
      if (!validId(run)) return ctx.sendJson(res, 400, { error: "Exécution invalide" });
      const dir = path.join(runsDir(), run);
      ctx.sendJson(res, 200, { files: Object.keys(FILES).map(name => ({ name, exists: fs.existsSync(path.join(dir, name)) })) });
    },
    "GET /api/mailbot/file": async (_req, res, url) => {
      const name = url.searchParams.get("name") ?? "", run = url.searchParams.get("run");
      if (!FILES[name]) return ctx.sendJson(res, 404, { error: "Fichier inconnu" });
      if (!validId(run)) return ctx.sendJson(res, 400, { error: "Exécution invalide" });
      try {
        const data = await readRunFile(name, run);
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(data);
      } catch (e) {
        ctx.sendJson(res, 404, { error: (e as Error).message });
      }
    },
  };

  return {
    routes,
    startScheduler: () => {
      setInterval(() => { try { tick(); } catch (e) { console.warn("⚠️ Planification :", (e as Error).message); } }, 20_000).unref();
      const s = scheduleState();
      console.log(`⏰ Planification mailbot : synchronisation ${s.sync.enabled ? `« ${s.sync.cron} »` : "désactivée"}, mail planifié ${s.compose.enabled ? `« ${s.compose.cron} »` : "désactivé"} (${s.timezone})`);
    },
  };
}
