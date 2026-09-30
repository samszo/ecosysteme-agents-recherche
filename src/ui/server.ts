// Serveur d'une application cliente : paramètres (.env + configuration), lancement, suivi et résultats
// Un serveur par application, chacun avec son port, ses connexions, sa configuration et son traitement en cours :
//   npm run ui          → Atelier d'articles (academic-paper-factory), http://127.0.0.1:PORT (7272)
//   npm run ui:explo    → exploZoteroAnno, http://127.0.0.1:EXPLO_PORT (7273)
import http from "http";
import fs from "fs";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import dotenv from "dotenv";
import { defaultWorkflowConfig } from "../config";
import { defaultExploConfig, EXPLO_CONFIG_FILE } from "../config/explo";
import { buildGuide } from "../workflow/reports/annotationGuide";
import { mergeConfig, readConfigOverride, writeConfigOverride, CONFIG_FILE } from "../config/store";
import { Zotero } from "../lib/zotero/zotero";
import { Omk } from "../lib/omeka/omk";
import crypto from "crypto";
import { readHistory, type HistoryEntry } from "../workflow/runs/history";

// ROOT : répertoire de données (.env, workflow.config.json, résultats) = répertoire courant
// APP_DIR : code du projet (identique à ROOT en local, distinct dans le conteneur Docker)
const ROOT = process.cwd();
const APP_DIR = path.resolve(__dirname, "..", "..");
const PUBLIC_DIR = path.join(__dirname, "public");
const TSX = path.join(APP_DIR, "node_modules", ".bin", "tsx");

// ==========================================
// Applications et paramétrage propre à chaque serveur
// ==========================================
const EXPLO_ENV_FILE = process.env.EXPLO_ENV_FILE || ".env.explo";
const APPS = {
  paper: {
    label: "Atelier d'articles (academic-paper-factory)",
    script: path.join(APP_DIR, "src", "runners", "paper.ts"),
    page: "paper.html",
    // fichiers de connexion : le dernier reçoit les modifications, les précédents fournissent les valeurs héritées
    envFiles: [".env"],
    portKey: "PORT", hostKey: "HOST", defaultPort: 7272,
    // adresse publique de cette application (liens depuis l'autre application)
    urlKey: "PAPER_URL",
  },
  explo: {
    label: "exploZoteroAnno",
    script: path.join(APP_DIR, "src", "runners", "explo.ts"),
    page: "explo.html",
    // .env.explo surcharge .env : connexions propres à l'annotation collective (autre groupe Zotero, autre Omeka…)
    envFiles: [".env", EXPLO_ENV_FILE],
    portKey: "EXPLO_PORT", hostKey: "EXPLO_HOST", defaultPort: 7273,
    urlKey: "EXPLO_URL",
  },
} as const;
type AppName = keyof typeof APPS;

const APP_ARG = process.argv[2] || process.env.WORKFLOW_APP || "paper";
if (!(APP_ARG in APPS)) {
  console.error(`Application inconnue : ${APP_ARG} (attendu : ${Object.keys(APPS).join(", ")})`);
  process.exit(1);
}
const APP = APP_ARG as AppName;
const APP_DEF = APPS[APP];
const OTHER: AppName = APP === "paper" ? "explo" : "paper";
const ENV_PATHS = APP_DEF.envFiles.map(f => path.join(ROOT, f));
const ENV_FILE = ENV_PATHS[ENV_PATHS.length - 1]!;

// variables d'environnement gérées par l'interface
const ENV_FIELDS = [
  { key: "ALBERT_API_KEY", label: "Clé API Albert", secret: true, group: "Albert", help: "Clé de l'API Albert (Etalab) pour les modèles de langage." },
  { key: "ZOTERO_API_KEY", label: "Clé API Zotero", secret: true, group: "Zotero", help: "À créer sur https://www.zotero.org/settings/keys (lecture de la bibliothèque)." },
  { key: "ZOTERO_USER_ID", label: "Identifiant utilisateur Zotero", group: "Zotero", help: "Visible sur la page des clés Zotero (« Your userID for use in API calls »)." },
  { key: "ZOTERO_GROUP_ID", label: "Identifiant du groupe Zotero", group: "Zotero", help: "Facultatif : bibliothèque de groupe (annotations de plusieurs juges). Vide = bibliothèque personnelle." },
  { key: "OMKS_API_URL", label: "URL de l'API Omeka S", group: "Omeka S", help: "Ex. https://mon-omeka.fr/api" },
  { key: "OMKS_KEY_IDENTITY", label: "Identité de la clé Omeka S", group: "Omeka S", help: "Clé API d'un utilisateur Omeka S (Utilisateur > Clés API)." },
  { key: "OMKS_KEY_CREDENTIAL", label: "Secret de la clé Omeka S", secret: true, group: "Omeka S" },
  { key: APP_DEF.portKey, label: "Port de cette interface", group: "Interface", help: `Pris en compte au prochain lancement du serveur (${APP_DEF.defaultPort} par défaut).` },
  { key: APPS[OTHER].urlKey, label: `Adresse de l'application ${APPS[OTHER].label}`, group: "Interface", help: `Pour le lien entre les deux applications (par défaut http://127.0.0.1:${APPS[OTHER].defaultPort}).` },
];
const SECRET_KEYS = new Set(ENV_FIELDS.filter(f => f.secret).map(f => f.key));

// ==========================================
// .env et configuration
// ==========================================

const parseEnv = (file: string): Record<string, string> => (fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {});

// connexions de ce serveur : fichiers fusionnés dans l'ordre (le dernier l'emporte)
function readEnv(): Record<string, string> {
  return Object.assign({}, ...ENV_PATHS.map(parseEnv));
}
// valeurs héritées des fichiers précédents (exploZoteroAnno : .env)
const inheritedEnv = (): Record<string, string> => Object.assign({}, ...ENV_PATHS.slice(0, -1).map(parseEnv));

// met à jour le fichier de connexion de ce serveur en conservant les commentaires et les autres variables ;
// une valeur identique à la valeur héritée n'est pas recopiée (elle suit alors les modifications du fichier commun)
function writeEnv(input: Record<string, string>) {
  const base = inheritedEnv();
  const own = parseEnv(ENV_FILE);
  const values = Object.fromEntries(Object.entries(input).filter(([k, v]) => k in own || (base[k] ?? "") !== v));
  // rien de propre à écrire : on ne crée pas de fichier vide
  if (!Object.keys(values).length && !fs.existsSync(ENV_FILE)) return;
  const lines = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf-8").split("\n") : [];
  const done = new Set<string>();
  const format = (v: string) => (/[\s#"'=]/.test(v) ? JSON.stringify(v) : v);
  const out = lines.map(line => {
    const m = /^\s*([A-Z0-9_]+)\s*=/.exec(line);
    if (m && m[1]! in values) {
      done.add(m[1]!);
      return `${m[1]}=${format(values[m[1]!]!)}`;
    }
    return line;
  });
  for (const [k, v] of Object.entries(values)) if (!done.has(k)) out.push(`${k}=${format(v)}`);
  fs.writeFileSync(ENV_FILE, out.join("\n").replace(/\n*$/, "\n"), "utf-8");
}

const currentConfig = () => mergeConfig(defaultWorkflowConfig, readConfigOverride());
const currentExploConfig = () => mergeConfig(defaultExploConfig, readConfigOverride(EXPLO_CONFIG_FILE));

// configuration propre à l'application de ce serveur
const APP_CONFIG = APP === "paper"
  ? { current: currentConfig, defaults: defaultWorkflowConfig as any, file: CONFIG_FILE }
  : { current: currentExploConfig, defaults: defaultExploConfig as any, file: EXPLO_CONFIG_FILE };

// adresses des deux applications (liens entre elles) : adresse publique si définie, sinon port local
function appUrls() {
  const env = Object.assign({}, parseEnv(path.join(ROOT, ".env")), parseEnv(path.join(ROOT, EXPLO_ENV_FILE)));
  return Object.fromEntries((Object.keys(APPS) as AppName[]).map(a => {
    const d = APPS[a];
    return [a, { label: d.label, url: env[d.urlKey] || process.env[d.urlKey] || `http://127.0.0.1:${env[d.portKey] || d.defaultPort}` }];
  }));
}

// ==========================================
// Exécution du workflow (processus enfant : configuration et connexions relues à chaque lancement)
// ==========================================

interface Run {
  id: number;
  app: AppName;
  status: "running" | "success" | "failed" | "stopped";
  startedAt: number;
  endedAt?: number;
  logs: string[];
  child?: ChildProcess | undefined;
}
let run: Run | null = null;
let runCounter = 0;
const listeners = new Set<http.ServerResponse>();
const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of listeners) res.write(payload);
}

function runState() {
  return run && { id: run.id, app: run.app, label: APPS[run.app].label, status: run.status, startedAt: run.startedAt, endedAt: run.endedAt, lines: run.logs.length };
}

function startRun(app: AppName = APP): Run {
  const r: Run = { id: ++runCounter, app, status: "running", startedAt: Date.now(), logs: [] };
  run = r;
  const child = spawn(TSX, [APPS[app].script], {
    cwd: ROOT,
    env: { ...process.env, ...readEnv(), FORCE_COLOR: "0", NO_COLOR: "1" },
  });
  r.child = child;
  let partial = "";
  const onData = (chunk: Buffer) => {
    const text = partial + stripAnsi(chunk.toString("utf-8"));
    const lines = text.split("\n");
    partial = lines.pop() ?? "";
    for (const line of lines) {
      r.logs.push(line);
      if (r.logs.length > 20000) r.logs.shift();
      broadcast("log", line);
    }
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  child.on("close", code => {
    if (partial) {
      r.logs.push(partial);
      broadcast("log", partial);
    }
    if (r.status === "running") {
      // index.ts ne quitte pas en erreur si le workflow échoue : on lit le statut dans les logs
      const failed = code !== 0 || r.logs.some(l => l.includes("❌ Le workflow a échoué"));
      r.status = failed ? "failed" : "success";
    }
    r.endedAt = Date.now();
    r.child = undefined;
    broadcast("status", runState());
  });
  broadcast("status", runState());
  return r;
}

// ==========================================
// Tests de connexion
// ==========================================

async function checkConnections() {
  const env = readEnv();
  const result: Record<string, { ok: boolean; message: string }> = {};

  try {
    const res = await fetch(`${currentConfig().models.provider}/models`, { headers: { Authorization: `Bearer ${env.ALBERT_API_KEY}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();
    result.albert = { ok: true, message: `${data.data?.length ?? 0} modèle(s) disponible(s)` };
  } catch (e) {
    result.albert = { ok: false, message: (e as Error).message };
  }

  try {
    if (!env.ZOTERO_API_KEY || !(env.ZOTERO_USER_ID || env.ZOTERO_GROUP_ID)) throw new Error("clé ou identifiant manquant");
    const collections = await new Zotero(env.ZOTERO_USER_ID ?? "", env.ZOTERO_API_KEY, env.ZOTERO_GROUP_ID || undefined).collections();
    result.zotero = { ok: true, message: `${collections.length} collection(s) dans la bibliothèque ${env.ZOTERO_GROUP_ID ? `du groupe ${env.ZOTERO_GROUP_ID}` : "personnelle"}` };
  } catch (e) {
    result.zotero = { ok: false, message: (e as Error).message };
  }

  try {
    if (!env.OMKS_API_URL) throw new Error("URL manquante");
    if (!env.OMKS_KEY_IDENTITY || !env.OMKS_KEY_CREDENTIAL) throw new Error("clé d'API incomplète (identité et secret requis)");
    const omk = new Omk({ api: env.OMKS_API_URL, ident: env.OMKS_KEY_IDENTITY, key: env.OMKS_KEY_CREDENTIAL, vocabs: [] });
    const vocabs = await omk.request(omk.url("vocabularies", { per_page: 100 }));
    const prefixes = vocabs.map((v: any) => v["o:prefix"]);
    const missing = currentConfig().omeka.vocabs.filter(v => !prefixes.includes(v));

    // Vérification de la clé sans aucun effet : Omeka ignore une clé invalide en lecture (requête traitée comme
    // anonyme), on demande donc la modification d'un item qui ne peut pas exister. Omeka contrôle les droits avant
    // de chercher l'item : 403 = clé refusée ou droits insuffisants, 404 = clé valide avec droit d'écriture.
    let keyStatus = "";
    try {
      await omk.request(omk.url("items/2147483647"), "PATCH", {});
      keyStatus = "clé valide";
    } catch (e) {
      const msg = (e as Error).message;
      if (/ : 404 /.test(msg)) keyStatus = "clé valide, droits d'écriture";
      else if (/ : 403 /.test(msg)) {
        throw new Error("clé d'API refusée ou droits insuffisants : vérifier l'identité et le secret de la clé, et que son utilisateur a au moins le rôle Auteur");
      } else throw e;
    }
    result.omeka = {
      ok: missing.length === 0,
      message: missing.length
        ? `${keyStatus} ; vocabulaire(s) manquant(s) : ${missing.join(", ")}`
        : `${keyStatus} ; vocabulaires : ${prefixes.join(", ")}`,
    };
  } catch (e) {
    result.omeka = { ok: false, message: (e as Error).message };
  }
  return result;
}

// ==========================================
// Appels traités : historique local + configurations d'exécution enregistrées dans Omeka S
// ==========================================

// clé d'un appel : lien, sinon fichier, sinon empreinte du texte
const cfpKey = (input: any) =>
  input?.cfpUrl || input?.cfpFile || `texte:${crypto.createHash("sha1").update(String(input?.cfpText ?? "")).digest("hex").slice(0, 12)}`;

async function omekaRuns(): Promise<{ runs: HistoryEntry[]; error?: string }> {
  const env = readEnv();
  if (!env.OMKS_API_URL) return { runs: [], error: "Omeka S non configuré" };
  try {
    const omk = new Omk({ api: env.OMKS_API_URL, ident: env.OMKS_KEY_IDENTITY ?? "", key: env.OMKS_KEY_CREDENTIAL ?? "", vocabs: [] });
    const items = await omk.getAllItems("property[0][property]=dcterms:type&property[0][type]=eq&property[0][text]=Configuration de workflow&sort_by=created&sort_order=desc");
    const val = (it: any, t: string) => it[t]?.[0]?.["@value"] ?? null;
    // items des appels à propositions (identifiant = lien ou empreinte) : titre et item de l'appel
    const aapItems = await omk.getAllItems("property[0][property]=dcterms:type&property[0][type]=eq&property[0][text]=Appel à propositions");
    const aapByIdentifier = new Map(aapItems.map((it: any) => [val(it, "dcterms:identifier"), { title: it["o:title"] ?? null, itemId: it["o:id"] }]));
    const runs: HistoryEntry[] = [];
    for (const it of items) {
      let config: any = {};
      try { config = JSON.parse(val(it, "dcterms:description") ?? "{}"); } catch { /* description illisible */ }
      if (!config.input) continue;
      let data: any = null;
      try { data = JSON.parse(val(it, "curation:data") ?? "null"); } catch { /* pas de consommation */ }
      const tokens = data?.tokens ?? null;
      runs.push({
        runId: val(it, "dcterms:identifier") ?? `omeka-${it["o:id"]}`,
        startedAt: val(it, "curation:dateStart") ?? val(it, "dcterms:date") ?? it["o:created"]?.["@value"],
        endedAt: val(it, "curation:dateEnd") ?? "",
        status: val(it, "curation:status") ?? "inconnu",
        input: config.input,
        aap: { ...(aapByIdentifier.get(config.input.cfpUrl) ?? { title: null, itemId: null }), url: config.input.cfpUrl || null },
        collectionItemId: it["dcterms:isPartOf"]?.[0]?.value_resource_id ?? null,
        configItemId: it["o:id"],
        proposalTitle: null,
        tokens,
        impact: data?.impact ?? null,
      });
    }
    return { runs };
  } catch (e) {
    return { runs: [], error: (e as Error).message };
  }
}

async function history() {
  const [local, omeka] = await Promise.all([readHistory(), omekaRuns()]);
  // fusion par identifiant d'exécution : l'historique local est plus complet (titre de l'appel, proposition)
  const byRun = new Map<string, HistoryEntry & { source: string }>();
  for (const r of omeka.runs) byRun.set(r.runId, { ...r, source: "omeka" });
  for (const r of local) byRun.set(r.runId, { ...byRun.get(r.runId), ...r, tokens: r.tokens ?? byRun.get(r.runId)?.tokens ?? null, impact: r.impact ?? byRun.get(r.runId)?.impact ?? null, source: byRun.has(r.runId) ? "local+omeka" : "local" });

  const omekaAdmin = readEnv().OMKS_API_URL?.replace(/\/api\/?$/, "/admin/item/") ?? "";
  const calls = new Map<string, any>();
  for (const r of [...byRun.values()].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))) {
    const key = cfpKey(r.input);
    if (!calls.has(key)) {
      calls.set(key, {
        key,
        title: (r.aap?.title && r.aap.title.length >= 12 && /\p{L}{3}/u.test(r.aap.title) ? r.aap.title : null) || r.input.cfpUrl || r.input.cfpFile || String(r.input.cfpText ?? "").slice(0, 120),
        url: r.input.cfpUrl || null,
        file: r.input.cfpFile || null,
        fileExists: r.input.cfpFile ? fs.existsSync(path.resolve(ROOT, r.input.cfpFile)) : null,
        aapItemId: r.aap?.itemId ?? null,
        runs: [],
      });
    }
    const call = calls.get(key);
    if (!call.aapItemId && r.aap?.itemId) call.aapItemId = r.aap.itemId;
    // titre enregistré exploitable (les premiers appels ont parfois « 1 » ou « Call for Papers »), sinon le lien
    const goodTitle = (t: string | null | undefined) => !!t && t.length >= 12 && /\p{L}{3}/u.test(t);
    if (!goodTitle(call.title) && goodTitle(r.aap?.title)) call.title = r.aap!.title;
    call.runs.push(r);
  }
  return { calls: [...calls.values()], omekaAdmin, omekaError: omeka.error ?? null };
}

// fichiers produits par exploZoteroAnno (dossier outputDir)
function exploResultFiles() {
  const dir = path.join(ROOT, currentExploConfig().outputDir);
  const known = [
    { name: "rapport_explo.md", title: "Rapport" },
    { name: "themes_discussion.md", title: "Thèmes de discussion" },
    { name: "reseau_collaborations.html", title: "Réseau des collaborations" },
    { name: "guide_annotation.md", title: "Guide d'annotation" },
    { name: "participation.json", title: "Participation (données)" },
    { name: "collaborations.json", title: "Collaborations (données)" },
  ];
  return known
    .map(f => {
      const full = path.join(dir, f.name);
      return fs.existsSync(full) ? { ...f, size: fs.statSync(full).size, mtime: fs.statSync(full).mtimeMs } : null;
    })
    .filter(Boolean);
}

// ==========================================
// Résultats
// ==========================================

function resultFiles() {
  const config = currentConfig();
  const files = [
    { name: config.proposal.proposalFile, title: "PropAPP – Proposition d'article" },
    { name: config.proposal.expectationsFile, title: "AttenduAPP – Attendus de l'appel" },
    { name: "rapport_traitement.md", title: "Rapport de traitement" },
    { name: config.proposal.bibtexFile, title: "Références BibTeX" },
    { name: "relecture_article.md", title: "Relecture épistémologique" },
    { name: "visualisation_graphe.html", title: "Graphe de concepts (sigma.js)" },
    { name: config.kappa.csvPath, title: "Désaccords d'annotation entre juges" },
  ];
  return files
    .map(f => {
      const full = path.resolve(ROOT, config.outputDir, f.name);
      return fs.existsSync(full) ? { ...f, size: fs.statSync(full).size, mtime: fs.statSync(full).mtimeMs } : null;
    })
    .filter(Boolean);
}

// ==========================================
// Serveur HTTP
// ==========================================

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function readBody(req: http.IncomingMessage): Promise<any> {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 2_000_000) throw new Error("Requête trop volumineuse");
  }
  return body ? JSON.parse(body) : {};
}

const routes: Record<string, (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void> = {
  "GET /": (_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(path.join(PUBLIC_DIR, APP_DEF.page)));
  },

  // application de ce serveur et adresses des deux applications
  "GET /api/apps": (_req, res) => sendJson(res, 200, { current: APP, apps: appUrls() }),

  "GET /api/settings": (_req, res) => {
    const env = readEnv();
    const own = parseEnv(ENV_FILE);
    sendJson(res, 200, {
      // inherited : valeur reprise du fichier commun (.env) et non définie dans le fichier de ce serveur
      env: ENV_FIELDS.map(f => ({ ...f, value: f.secret ? "" : env[f.key] ?? "", isSet: !!env[f.key], inherited: ENV_PATHS.length > 1 && !(f.key in own) && !!env[f.key] })),
      envFile: path.relative(ROOT, ENV_FILE),
      config: APP_CONFIG.current(),
      defaults: APP_CONFIG.defaults,
      configFile: path.relative(ROOT, APP_CONFIG.file),
    });
  },

  "POST /api/settings": async (req, res) => {
    const { env = {}, config } = await readBody(req);
    // un secret laissé vide n'est pas modifié ; clear:true l'efface
    const values: Record<string, string> = {};
    for (const f of ENV_FIELDS) {
      const v = env[f.key];
      if (v === undefined) continue;
      if (SECRET_KEYS.has(f.key) && v.value === "" && !v.clear) continue;
      values[f.key] = String(v.value ?? "").trim();
    }
    writeEnv(values);
    const saved = config ? writeConfigOverride(APP_CONFIG.defaults, config, APP_CONFIG.file) : undefined;
    sendJson(res, 200, { ok: true, override: saved });
  },

  // import du fichier de l'appel à propositions (enregistré depuis un navigateur quand le site bloque les robots)
  "POST /api/cfp-file": async (req, res, url) => {
    const name = path.basename(url.searchParams.get("name") ?? "appel").replace(/[^\w.\-]+/g, "_");
    if (!/\.(pdf|html?|txt|md|docx|odt)$/i.test(name)) return sendJson(res, 400, { error: "Formats acceptés : PDF, HTML, TXT, MD, DOCX, ODT." });
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 50_000_000) return sendJson(res, 413, { error: "Fichier trop volumineux (50 Mo maximum)." });
      chunks.push(chunk);
    }
    const dir = path.join(ROOT, "aap");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), Buffer.concat(chunks));
    sendJson(res, 200, { path: `aap/${name}` });
  },

  "POST /api/check": async (_req, res) => sendJson(res, 200, await checkConnections()),

  "GET /api/zotero/collections": async (_req, res) => {
    const env = readEnv();
    try {
      const zotero = new Zotero(env.ZOTERO_USER_ID ?? "", env.ZOTERO_API_KEY ?? "", env.ZOTERO_GROUP_ID || undefined);
      const collections = (await zotero.collections()).map((c: any) => ({
        key: c.key, name: c.data.name, parent: c.data.parentCollection || null, items: c.meta?.numItems ?? null,
      }));
      sendJson(res, 200, collections);
    } catch (e) {
      sendJson(res, 502, { error: (e as Error).message });
    }
  },

  "GET /api/albert/models": async (_req, res) => {
    const env = readEnv();
    try {
      const r = await fetch(`${currentConfig().models.provider}/models`, { headers: { Authorization: `Bearer ${env.ALBERT_API_KEY}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: any = await r.json();
      sendJson(res, 200, (data.data ?? []).map((m: any) => ({ id: m.id, type: m.type ?? null })));
    } catch (e) {
      sendJson(res, 502, { error: (e as Error).message });
    }
  },

  "POST /api/run": (_req, res, url) => {
    const app = url.searchParams.get("app") ?? APP;
    if (app !== APP) return sendJson(res, 400, { error: `Ce serveur lance ${APP_DEF.label} ; ${APPS[app as AppName]?.label ?? app} a son propre serveur.` });
    if (run?.status === "running") return sendJson(res, 409, { error: "Un traitement est déjà en cours." });
    startRun();
    sendJson(res, 200, runState());
  },

  // ==========================================
  // Application exploZoteroAnno
  // ==========================================
  // ancienne adresse de l'application (servie par le serveur de l'Atelier) : renvoi vers le serveur dédié
  "GET /explo": (_req, res) => {
    res.writeHead(302, { Location: APP === "explo" ? "/" : appUrls().explo!.url });
    res.end();
  },

  "GET /api/explo/settings": (_req, res) => {
    sendJson(res, 200, { config: currentExploConfig(), defaults: defaultExploConfig, configFile: path.relative(ROOT, EXPLO_CONFIG_FILE) });
  },

  "POST /api/explo/settings": async (req, res) => {
    const { config } = await readBody(req);
    sendJson(res, 200, { ok: true, override: writeConfigOverride(defaultExploConfig, config, EXPLO_CONFIG_FILE) });
  },

  // guide d'annotation à partir de la grille (enregistrée ou en cours d'édition)
  "POST /api/explo/guide": async (req, res) => {
    const { config, collectionName } = await readBody(req);
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(buildGuide(mergeConfig(defaultExploConfig, config ?? {}), collectionName));
  },

  "GET /api/explo/results": (_req, res) => sendJson(res, 200, exploResultFiles()),

  "GET /api/explo/file": (_req, res, url) => {
    const name = url.searchParams.get("name") ?? "";
    const file = exploResultFiles().find((f: any) => f.name === name);
    if (!file) return sendJson(res, 404, { error: "Fichier inconnu" });
    const raw = url.searchParams.get("raw") === "1" && name.endsWith(".html");
    const type = name.endsWith(".json") ? "application/json" : raw ? "text/html" : "text/plain";
    res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
    res.end(fs.readFileSync(path.join(ROOT, currentExploConfig().outputDir, name)));
  },

  "POST /api/run/stop": (_req, res) => {
    if (run?.child) {
      run.status = "stopped";
      run.child.kill("SIGTERM");
    }
    sendJson(res, 200, runState());
  },

  "GET /api/run": (_req, res) => sendJson(res, 200, runState()),

  // flux des logs (Server-Sent Events) : historique du traitement en cours puis lignes en direct
  "GET /api/run/events": (req, res) => {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write(`event: status\ndata: ${JSON.stringify(runState())}\n\n`);
    for (const line of run?.logs ?? []) res.write(`event: log\ndata: ${JSON.stringify(line)}\n\n`);
    listeners.add(res);
    req.on("close", () => listeners.delete(res));
  },

  "GET /api/results": (_req, res) => sendJson(res, 200, resultFiles()),

  "GET /api/history": async (_req, res) => sendJson(res, 200, await history()),

  "GET /api/file": (_req, res, url) => {
    const name = url.searchParams.get("name") ?? "";
    // seuls les fichiers de résultats connus sont servis
    if (!resultFiles().some((f: any) => f.name === name)) return sendJson(res, 404, { error: "Fichier inconnu" });
    // raw=1 : page HTML servie telle quelle (ouverture du graphe en plein écran)
    const raw = url.searchParams.get("raw") === "1" && name.endsWith(".html");
    res.writeHead(200, { "Content-Type": `${raw ? "text/html" : "text/plain"}; charset=utf-8` });
    res.end(fs.readFileSync(path.resolve(ROOT, currentConfig().outputDir, name)));
  },
};

// routes propres à une application (les autres sont communes aux deux serveurs)
const APP_ONLY: Record<string, AppName> = {
  "POST /api/cfp-file": "paper", "GET /api/results": "paper", "GET /api/history": "paper", "GET /api/file": "paper",
  "GET /api/explo/settings": "explo", "POST /api/explo/settings": "explo", "POST /api/explo/guide": "explo",
  "GET /api/explo/results": "explo", "GET /api/explo/file": "explo",
};

// documentation HTML générée par npm run docs (docs/html)
const DOCS_DIR = path.join(APP_DIR, "docs", "html");
function serveDocs(res: http.ServerResponse, pathname: string) {
  const name = path.basename(pathname.replace(/^\/docs\/?/, "") || "index.html");
  const file = path.join(DOCS_DIR, name);
  if (!name.endsWith(".html") || !fs.existsSync(file)) return sendJson(res, 404, { error: "Page de documentation introuvable (lancer npm run docs)" });
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(fs.readFileSync(file));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "GET" && (url.pathname === "/docs" || url.pathname.startsWith("/docs/"))) {
    if (url.pathname === "/docs") { res.writeHead(302, { Location: "/docs/" }); return res.end(); }
    return serveDocs(res, url.pathname);
  }
  const key = `${req.method} ${url.pathname}`;
  const handler = routes[key];
  if (!handler || (APP_ONLY[key] && APP_ONLY[key] !== APP)) return sendJson(res, 404, { error: "Introuvable" });
  try {
    await handler(req, res, url);
  } catch (e) {
    if (!res.headersSent) sendJson(res, 500, { error: (e as Error).message });
  }
});

const port = Number(process.env[APP_DEF.portKey] || readEnv()[APP_DEF.portKey]) || APP_DEF.defaultPort;
// écoute locale par défaut : l'interface manipule des clés d'API
// (dans le conteneur Docker, HOST=0.0.0.0 et le port n'est publié que sur 127.0.0.1 de l'hôte)
const host = process.env[APP_DEF.hostKey] || process.env.HOST || "127.0.0.1";
server.listen(port, host, () => {
  console.log(`🖥️  ${APP_DEF.label} : http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port} (connexions : ${APP_DEF.envFiles.join(" + ")})`);
});
