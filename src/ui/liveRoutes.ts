// Suivi d'une présentation en direct (chaoticumSeminario) : le lecteur du présentateur publie l'écran affiché et la
// transcription ; les personnes connectées (pages /public/suivre) suivent, tracent des traits de couleur sur les écrans et
// surlignent des passages de la transcription selon la grille d'annotation. Flux en direct : Server-Sent Events.
// L'état de chaque partition est gardé dans <partition>/live.json ; les annotations sont jointes à la séance enregistrée.
import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { AuthUser } from "./auth";
import type { ChaoticumConfig } from "../config/chaoticum";

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void;

export interface Annotation {
  id: string;
  kind: "stroke" | "highlight";
  at: string;
  author: { id: string; name: string };
  color: string;
  position: string;
  screen?: number;
  // trait : points normalisés (0-1) dans la zone de l'écran, épaisseur relative
  points?: [number, number][];
  width?: number;
  // surlignage : passage de la transcription (identifié par son heure) et caractères surlignés
  segment?: string;
  start?: number;
  end?: number;
  text?: string;
}
interface LiveState {
  session: string | null; // début de la séance du présentateur (startedAt) ; null : pas de séance en cours
  live: boolean;
  current: number;
  enteredAt: string | null;
  transcript: any[];
  annotations: Annotation[];
  updatedAt: string;
}

interface LiveCtx {
  publicDir: string;
  config: () => ChaoticumConfig;
  sendJson: (res: http.ServerResponse, status: number, data: unknown) => void;
  readBody: (req: http.IncomingMessage) => Promise<any>;
  currentUser: (req: http.IncomingMessage) => AuthUser | null;
  publicBase: () => string;
  partDir: (runId: string) => string;
  readPartition: (runId: string) => Promise<any>;
  readFile: (runId: string, name: string) => Promise<Buffer>;
}

const validId = (id: string | null): id is string => !!id && /^[\w-]{1,80}$/.test(id);
const PRESENTER = { id: "presentateur", name: "Présentateur" };

export function createLive(ctx: LiveCtx) {
  const states = new Map<string, LiveState>();
  const clients = new Map<string, Set<{ res: http.ServerResponse; presenter: boolean }>>();
  const file = (runId: string) => path.join(ctx.partDir(runId), "live.json");
  const empty = (): LiveState => ({ session: null, live: false, current: 0, enteredAt: null, transcript: [], annotations: [], updatedAt: new Date().toISOString() });

  function state(runId: string): LiveState {
    if (!states.has(runId)) {
      let s = empty();
      try { s = { ...s, ...JSON.parse(fs.readFileSync(file(runId), "utf-8")) }; } catch { /* pas encore de séance suivie */ }
      states.set(runId, s);
    }
    return states.get(runId)!;
  }
  const timers = new Map<string, NodeJS.Timeout>();
  function persist(runId: string) {
    const s = state(runId);
    s.updatedAt = new Date().toISOString();
    clearTimeout(timers.get(runId));
    timers.set(runId, setTimeout(() => { try { fs.mkdirSync(ctx.partDir(runId), { recursive: true }); fs.writeFileSync(file(runId), JSON.stringify(s)); } catch { /* écriture différée impossible */ } }, 500));
  }
  function broadcast(runId: string, event: string, data: unknown) {
    for (const c of clients.get(runId) ?? []) c.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
  const followers = (runId: string) => [...(clients.get(runId) ?? [])].filter(c => !c.presenter).length;
  const publicState = (s: LiveState) => ({ session: s.session, live: s.live, current: s.current, enteredAt: s.enteredAt });

  function stream(req: http.IncomingMessage, res: http.ServerResponse, runId: string, presenter: boolean) {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    const s = state(runId);
    res.write(`event: init\ndata: ${JSON.stringify({ ...publicState(s), transcript: s.transcript, annotations: s.annotations, followers: followers(runId) })}\n\n`);
    if (!clients.has(runId)) clients.set(runId, new Set());
    const c = { res, presenter };
    clients.get(runId)!.add(c);
    broadcast(runId, "followers", { followers: followers(runId) });
    // maintien de la connexion à travers les proxys
    const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
    req.on("close", () => { clearInterval(ping); clients.get(runId)?.delete(c); broadcast(runId, "followers", { followers: followers(runId) }); });
  }

  // annotation reçue : validée, horodatée, attribuée, diffusée
  function addAnnotation(runId: string, author: { id: string; name: string }, a: any): Annotation {
    const s = state(runId);
    if (!s.session) throw new Error("La séance n'a pas commencé : les annotations s'ouvrent au début de la séance");
    const grid = ctx.config().annotation.grid;
    const g = grid.find(x => x.color.toLowerCase() === String(a.color ?? "").toLowerCase());
    if (!g) throw new Error("Couleur hors de la grille d'annotation");
    const base = { id: crypto.randomBytes(6).toString("hex"), at: new Date().toISOString(), author, color: g.color, position: g.position };
    let ann: Annotation;
    if (a.kind === "stroke") {
      const points = (Array.isArray(a.points) ? a.points : []).slice(0, 2000)
        .map((p: any) => [Math.min(1, Math.max(0, Number(p[0]))), Math.min(1, Math.max(0, Number(p[1])))].map(v => Math.round(v * 10000) / 10000) as [number, number])
        .filter((p: number[]) => p.every(Number.isFinite));
      if (points.length < 2) throw new Error("Trait trop court");
      ann = { ...base, kind: "stroke", screen: Math.max(0, Math.floor(Number(a.screen) || 0)), points, width: Math.min(0.02, Math.max(0.001, Number(a.width) || 0.004)) };
    } else if (a.kind === "highlight") {
      const seg = s.transcript.find(x => x.at === a.segment);
      const start = Math.floor(Number(a.start)), end = Math.floor(Number(a.end));
      if (!seg || !(start >= 0 && end > start && end <= String(seg.text).length)) throw new Error("Passage de la transcription introuvable");
      ann = { ...base, kind: "highlight", segment: seg.at, screen: seg.screen, start, end, text: String(seg.text).slice(start, end) };
    } else throw new Error("Annotation inconnue");
    s.annotations.push(ann);
    persist(runId);
    broadcast(runId, "annotation", ann);
    return ann;
  }
  function removeAnnotation(runId: string, authorId: string | null, id: string) {
    const s = state(runId);
    const a = s.annotations.find(x => x.id === id);
    if (!a) throw new Error("Annotation introuvable");
    if (authorId && a.author.id !== authorId) throw new Error("Seules ses propres annotations peuvent être retirées");
    s.annotations = s.annotations.filter(x => x.id !== id);
    persist(runId);
    broadcast(runId, "annotation-removed", { id });
  }

  // annotations d'une séance (jointes à la séance enregistrée)
  const sessionAnnotations = (runId: string, session: string) => { const s = state(runId); return s.session === session ? s.annotations : []; };

  // garde des pages et routes de suivi : session authentifiée et partition valide
  function guard(req: http.IncomingMessage, res: http.ServerResponse, url: URL, page = false): { runId: string; user: AuthUser } | null {
    const runId = url.searchParams.get("run");
    const user = ctx.currentUser(req);
    if (!user) {
      if (page) { res.writeHead(302, { Location: `/public/connexion?next=${encodeURIComponent(url.pathname + url.search)}` }); res.end(); }
      else ctx.sendJson(res, 401, { error: "Connexion requise" });
      return null;
    }
    if (!validId(runId)) { ctx.sendJson(res, 400, { error: "Partition invalide" }); return null; }
    return { runId, user };
  }
  const author = (u: AuthUser) => ({ id: u.id, name: u.name });

  const routes: Record<string, Handler> = {
    // ---------- présentateur (lecteur, routes protégées comme le reste de l'application) ----------
    "POST /api/chaoticum/live": async (req, res) => {
      const { run, session, live, current, enteredAt } = await ctx.readBody(req);
      if (!validId(run)) return ctx.sendJson(res, 400, { error: "Partition invalide" });
      const s = state(run);
      // nouvelle séance : nouvelles annotations (celles de la séance précédente sont dans la séance enregistrée)
      if (session && session !== s.session) Object.assign(s, { session, transcript: [], annotations: [] });
      Object.assign(s, { live: !!live, current: Math.max(0, Number(current) || 0), enteredAt: enteredAt ?? new Date().toISOString() });
      persist(run);
      broadcast(run, "state", publicState(s));
      ctx.sendJson(res, 200, { ok: true, followers: followers(run) });
    },
    "POST /api/chaoticum/live/segment": async (req, res) => {
      const { run, session, segment } = await ctx.readBody(req);
      if (!validId(run)) return ctx.sendJson(res, 400, { error: "Partition invalide" });
      const s = state(run);
      if (!s.session || s.session !== session || !segment?.text) return ctx.sendJson(res, 409, { error: "Séance non suivie" });
      const seg = { at: String(segment.at), duration: Number(segment.duration) || 0, screen: Number(segment.screen) || 0, text: String(segment.text).slice(0, 5000), engine: String(segment.engine ?? "") };
      s.transcript.push(seg);
      persist(run);
      broadcast(run, "segment", seg);
      ctx.sendJson(res, 200, { ok: true });
    },
    "GET /api/chaoticum/live/events": (req, res, url) => {
      const run = url.searchParams.get("run");
      if (!validId(run)) return ctx.sendJson(res, 400, { error: "Partition invalide" });
      stream(req, res, run, true);
    },
    "POST /api/chaoticum/live/annotation": async (req, res) => {
      const { run, annotation } = await ctx.readBody(req);
      if (!validId(run)) return ctx.sendJson(res, 400, { error: "Partition invalide" });
      try { ctx.sendJson(res, 200, addAnnotation(run, PRESENTER, annotation ?? {})); } catch (e) { ctx.sendJson(res, 400, { error: (e as Error).message }); }
    },
    // le présentateur peut retirer toute annotation (modération)
    "POST /api/chaoticum/live/annotation/delete": async (req, res) => {
      const { run, id } = await ctx.readBody(req);
      if (!validId(run)) return ctx.sendJson(res, 400, { error: "Partition invalide" });
      try { removeAnnotation(run, null, String(id)); ctx.sendJson(res, 200, { ok: true }); } catch (e) { ctx.sendJson(res, 400, { error: (e as Error).message }); }
    },
    // grille d'annotation et adresse publique (lien de suivi) pour le lecteur du présentateur
    "GET /api/chaoticum/live/info": (_req, res) => ctx.sendJson(res, 200, { grid: ctx.config().annotation.grid, publicBase: ctx.publicBase() }),

    // ---------- personnes qui suivent (pages /public/, session authentifiée) ----------
    "GET /public/suivre": (req, res, url) => {
      if (!guard(req, res, url, true)) return;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(path.join(ctx.publicDir, "jouer.html")));
    },
    "GET /public/api/suivre": async (req, res, url) => {
      const g = guard(req, res, url);
      if (!g) return;
      try {
        const { grist, configItemId, edits, ...partition } = await ctx.readPartition(g.runId);
        const s = state(g.runId);
        ctx.sendJson(res, 200, {
          // formulaire Grist : les personnes qui suivent peuvent aussi contribuer
          partition: { ...partition, grist: grist?.formUrl ? { formUrl: grist.formUrl } : null },
          live: { ...publicState(s), transcript: s.transcript, annotations: s.annotations },
          user: g.user, grid: ctx.config().annotation.grid,
        });
      } catch { ctx.sendJson(res, 404, { error: "Partition introuvable" }); }
    },
    "GET /public/api/suivre/file": async (req, res, url) => {
      const g = guard(req, res, url);
      if (!g) return;
      const name = url.searchParams.get("name") ?? "";
      if (!/^diapo_[\w-]{1,40}\.png$/.test(name)) return ctx.sendJson(res, 404, { error: "Fichier inconnu" });
      try { const content = await ctx.readFile(g.runId, name); res.writeHead(200, { "Content-Type": "image/png" }); res.end(content); }
      catch { ctx.sendJson(res, 404, { error: "Fichier inconnu" }); }
    },
    "GET /public/api/suivre/events": (req, res, url) => {
      const g = guard(req, res, url);
      if (g) stream(req, res, g.runId, false);
    },
    "POST /public/api/suivre/annotation": async (req, res, url) => {
      const g = guard(req, res, url);
      if (!g) return;
      const { annotation } = await ctx.readBody(req);
      try { ctx.sendJson(res, 200, addAnnotation(g.runId, author(g.user), annotation ?? {})); } catch (e) { ctx.sendJson(res, 400, { error: (e as Error).message }); }
    },
    "POST /public/api/suivre/annotation/delete": async (req, res, url) => {
      const g = guard(req, res, url);
      if (!g) return;
      const { id } = await ctx.readBody(req);
      try { removeAnnotation(g.runId, g.user.id, String(id)); ctx.sendJson(res, 200, { ok: true }); } catch (e) { ctx.sendJson(res, 400, { error: (e as Error).message }); }
    },
  };

  return { routes, sessionAnnotations, endSession: (runId: string) => { const s = state(runId); s.live = false; persist(runId); broadcast(runId, "state", publicState(s)); } };
}
