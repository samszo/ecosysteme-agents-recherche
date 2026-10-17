// Authentification des personnes qui suivent une présentation (chaoticumSeminario, pages /public/suivre) :
// Google (OpenID Connect), GitHub (OAuth), CAS d'un établissement (par défaut celui de l'université Paris 8) ou
// comptes locaux (users.json, mots de passe hachés avec scrypt).
// La session est un cookie signé (HMAC) : ni base de sessions, ni donnée personnelle stockée côté serveur.
import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface AuthUser { id: string; name: string; provider: "google" | "github" | "cas" | "local"; email?: string }
type Handler = (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void;

interface AuthCtx {
  root: string;
  publicDir: string;
  readEnv: () => Record<string, string>;
  publicBase: () => string;
  sendJson: (res: http.ServerResponse, status: number, data: unknown) => void;
  readBody: (req: http.IncomingMessage) => Promise<any>;
}

const SESSION_COOKIE = "chaoticum_session", OAUTH_COOKIE = "chaoticum_oauth";
const SESSION_HOURS = 12;
const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");

const PROVIDERS = {
  google: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token",
    scope: "openid email profile", id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET",
  },
  github: {
    authorize: "https://github.com/login/oauth/authorize", token: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email", id: "GITHUB_CLIENT_ID", secret: "GITHUB_CLIENT_SECRET",
  },
} as const;
type Provider = keyof typeof PROVIDERS;

// adresse de retour après connexion : seulement une page de suivi de ce serveur
const safeNext = (n: string | null) => (n && /^\/public\/[\w/?=&%.-]*$/.test(n) && !n.startsWith("//") ? n : "/public/suivre");

export function createAuth(ctx: AuthCtx) {
  // ==========================================
  // Secret de signature : AUTH_SECRET, sinon généré une fois dans le répertoire de données
  // ==========================================
  const secretFile = path.join(ctx.root, "auth.secret");
  function secret(): string {
    const env = ctx.readEnv().AUTH_SECRET;
    if (env) return env;
    if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
    return fs.readFileSync(secretFile, "utf-8").trim();
  }
  const sign = (data: object) => { const p = b64(JSON.stringify(data)); return `${p}.${crypto.createHmac("sha256", secret()).update(p).digest("base64url")}`; };
  function verify<T>(token: string | undefined): T | null {
    const [p, mac] = String(token ?? "").split(".");
    if (!p || !mac) return null;
    const good = crypto.createHmac("sha256", secret()).update(p).digest("base64url");
    if (mac.length !== good.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
    try { const d = JSON.parse(Buffer.from(p, "base64url").toString("utf-8")); return d.exp && d.exp > Date.now() ? d : null; } catch { return null; }
  }

  const cookies = (req: http.IncomingMessage) => Object.fromEntries(String(req.headers.cookie ?? "").split(/;\s*/).filter(Boolean).map(c => { const i = c.indexOf("="); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
  // adresse publique (CHAOTICUM_URL), sinon celle de la requête (proxy : X-Forwarded-Proto)
  const origin = (req: http.IncomingMessage) => {
    const base = ctx.publicBase();
    if (base && !/\/\/(127\.|localhost|\[::1\])/.test(base)) return base.replace(/\/$/, "");
    const proto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0] || "http";
    return `${proto}://${req.headers["x-forwarded-host"] ?? req.headers.host}`;
  };
  const secure = (req: http.IncomingMessage) => origin(req).startsWith("https:");
  const cookie = (req: http.IncomingMessage, name: string, value: string, maxAge: number) =>
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure(req) ? "; Secure" : ""}`;

  function startSession(req: http.IncomingMessage, res: http.ServerResponse, user: AuthUser, next: string) {
    const token = sign({ user, exp: Date.now() + SESSION_HOURS * 3600_000 });
    res.writeHead(302, { "Set-Cookie": [cookie(req, SESSION_COOKIE, token, SESSION_HOURS * 3600), cookie(req, OAUTH_COOKIE, "", 0)], Location: next });
    res.end();
  }
  const currentUser = (req: http.IncomingMessage): AuthUser | null => verify<{ user: AuthUser }>(cookies(req)[SESSION_COOKIE])?.user ?? null;

  // ==========================================
  // Accès : AUTH_ALLOWED (adresses, @domaines, github:identifiant ; vide = tout compte authentifié)
  // ==========================================
  function allowed(u: AuthUser) {
    // comptes locaux et comptes de l'établissement (CAS) : toujours autorisés
    if (u.provider === "local" || u.provider === "cas") return true;
    const rules = String(ctx.readEnv().AUTH_ALLOWED ?? "").split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!rules.length) return true;
    const email = (u.email ?? "").toLowerCase();
    return rules.some(r => (r.startsWith("@") ? email.endsWith(r) : r.startsWith("github:") ? u.provider === "github" && u.id === r : email === r));
  }

  // ==========================================
  // Comptes locaux
  // ==========================================
  const usersFile = path.join(ctx.root, "users.json");
  type LocalUser = { login: string; name: string; salt: string; hash: string; createdAt: string };
  const readUsers = (): LocalUser[] => { try { return JSON.parse(fs.readFileSync(usersFile, "utf-8")); } catch { return []; } };
  const writeUsers = (u: LocalUser[]) => fs.writeFileSync(usersFile, JSON.stringify(u, null, 2), { mode: 0o600 });
  const hash = (password: string, salt: string) => crypto.scryptSync(password, salt, 64).toString("hex");
  // essais de connexion locale par adresse IP (10 par quart d'heure)
  const attempts = new Map<string, { n: number; until: number }>();

  const configured = (p: Provider) => { const env = ctx.readEnv(); return !!(env[PROVIDERS[p].id] && env[PROVIDERS[p].secret]); };

  // ==========================================
  // CAS (protocole CAS 2 : /login puis /serviceValidate) : CAS_URL, par défaut celui de l'université Paris 8 ;
  // CAS_URL=non le désactive ; CAS_LABEL : nom affiché sur le bouton
  // ==========================================
  const CAS_DEFAULT = "https://cas.univ-paris8.fr/cas";
  const casUrl = () => { const v = (ctx.readEnv().CAS_URL ?? "").trim(); return /^(non|off|aucun|false|0)$/i.test(v) ? "" : (v || CAS_DEFAULT).replace(/\/(login)?\/?$/, ""); };
  const casLabel = () => ctx.readEnv().CAS_LABEL || (casUrl() === CAS_DEFAULT ? "Université Paris 8" : "CAS de l'établissement");
  const casService = (req: http.IncomingMessage) => `${origin(req)}/public/auth/cas/callback`;
  const xml = (s: string) => s.replace(/&#0*39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
  const fail = (res: http.ServerResponse, message: string) => { res.writeHead(302, { Location: `/public/connexion?erreur=${encodeURIComponent(message)}` }); res.end(); };

  // ==========================================
  // OAuth : redirection vers le fournisseur, puis retour avec un code
  // ==========================================
  function oauthStart(p: Provider): Handler {
    return (req, res, url) => {
      if (!configured(p)) return fail(res, `Connexion ${p} non configurée`);
      const state = crypto.randomBytes(16).toString("hex");
      const q = new URLSearchParams({ client_id: ctx.readEnv()[PROVIDERS[p].id]!, redirect_uri: `${origin(req)}/public/auth/${p}/callback`, response_type: "code", scope: PROVIDERS[p].scope, state, ...(p === "google" ? { prompt: "select_account" } : {}) });
      res.writeHead(302, { "Set-Cookie": cookie(req, OAUTH_COOKIE, sign({ state, p, next: safeNext(url.searchParams.get("next")), exp: Date.now() + 600_000 }), 600), Location: `${PROVIDERS[p].authorize}?${q}` });
      res.end();
    };
  }

  function oauthCallback(p: Provider): Handler {
    return async (req, res, url) => {
      const pending = verify<{ state: string; p: string; next: string }>(cookies(req)[OAUTH_COOKIE]);
      if (!pending || pending.p !== p || pending.state !== url.searchParams.get("state")) return fail(res, "Connexion expirée ou invalide : recommencer");
      if (url.searchParams.get("error")) return fail(res, `Connexion refusée (${url.searchParams.get("error")})`);
      const env = ctx.readEnv();
      try {
        const tokenRes = await fetch(PROVIDERS[p].token, {
          method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
          body: new URLSearchParams({ client_id: env[PROVIDERS[p].id]!, client_secret: env[PROVIDERS[p].secret]!, code: url.searchParams.get("code") ?? "", redirect_uri: `${origin(req)}/public/auth/${p}/callback`, grant_type: "authorization_code" }),
        });
        const token: any = await tokenRes.json();
        if (!token.access_token) throw new Error(token.error_description || token.error || `jeton refusé (${tokenRes.status})`);
        const get = async (u: string) => { const r = await fetch(u, { headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json", "User-Agent": "chaoticumSeminario" } }); if (!r.ok) throw new Error(`profil indisponible (${r.status})`); return r.json(); };
        let user: AuthUser;
        if (p === "google") {
          const info: any = await get("https://openidconnect.googleapis.com/v1/userinfo");
          user = { id: `google:${info.sub}`, name: info.name || info.email, provider: "google", ...(info.email_verified ? { email: info.email } : {}) };
        } else {
          const info: any = await get("https://api.github.com/user");
          const emails: any[] = await get("https://api.github.com/user/emails").catch(() => []);
          const email = emails.find(e => e.primary && e.verified)?.email;
          user = { id: `github:${String(info.login).toLowerCase()}`, name: info.name || info.login, provider: "github", ...(email ? { email } : {}) };
        }
        if (!allowed(user)) return fail(res, `Le compte ${user.email ?? user.id} n'est pas autorisé à suivre cette présentation`);
        startSession(req, res, user, pending.next);
      } catch (e) { fail(res, `Connexion ${p} impossible : ${(e as Error).message}`); }
    };
  }

  const routes: Record<string, Handler> = {
    "GET /public/connexion": (_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(path.join(ctx.publicDir, "connexion.html")));
    },
    "GET /public/auth/providers": (req, res) => ctx.sendJson(res, 200, { google: configured("google"), github: configured("github"), cas: casUrl() ? { label: casLabel() } : false, local: readUsers().length > 0, user: currentUser(req) }),
    "GET /public/auth/me": (req, res) => { const u = currentUser(req); ctx.sendJson(res, u ? 200 : 401, u ? { user: u } : { error: "Non connecté" }); },
    "GET /public/auth/google": oauthStart("google"),
    "GET /public/auth/google/callback": oauthCallback("google"),
    "GET /public/auth/github": oauthStart("github"),
    "GET /public/auth/github/callback": oauthCallback("github"),

    // CAS : redirection vers la page de connexion de l'établissement (l'adresse de retour garde la page à suivre)
    "GET /public/auth/cas": (req, res, url) => {
      if (!casUrl()) return fail(res, "Connexion CAS non configurée");
      res.writeHead(302, { "Set-Cookie": cookie(req, OAUTH_COOKIE, sign({ p: "cas", next: safeNext(url.searchParams.get("next")), exp: Date.now() + 600_000 }), 600), Location: `${casUrl()}/login?service=${encodeURIComponent(casService(req))}` });
      res.end();
    },
    // retour du CAS avec un ticket, validé auprès du serveur CAS (réponse XML)
    "GET /public/auth/cas/callback": async (req, res, url) => {
      const pending = verify<{ p: string; next: string }>(cookies(req)[OAUTH_COOKIE]);
      const ticket = url.searchParams.get("ticket");
      if (!ticket) return fail(res, "Connexion CAS annulée ou sans ticket");
      try {
        const r = await fetch(`${casUrl()}/serviceValidate?service=${encodeURIComponent(casService(req))}&ticket=${encodeURIComponent(ticket)}`, { headers: { Accept: "application/xml" } });
        const body = await r.text();
        const failure = /<cas:authenticationFailure[^>]*>([\s\S]*?)<\/cas:authenticationFailure>/.exec(body);
        if (failure) throw new Error(xml(failure[1]!));
        const login = /<cas:user>([\s\S]*?)<\/cas:user>/.exec(body)?.[1];
        if (!login) throw new Error(`réponse inattendue du serveur CAS (${r.status})`);
        // attributs éventuellement transmis par le CAS (nom, adresse)
        const attr = (...names: string[]) => { for (const n of names) { const m = new RegExp(`<cas:${n}>([\\s\\S]*?)</cas:${n}>`).exec(body); if (m) return xml(m[1]!); } return ""; };
        const name = attr("displayName", "cn") || [attr("givenName"), attr("sn")].filter(Boolean).join(" ") || xml(login);
        const email = attr("mail", "email");
        const user: AuthUser = { id: `cas:${xml(login).toLowerCase()}`, name, provider: "cas", ...(email ? { email } : {}) };
        startSession(req, res, user, pending?.next ?? "/public/suivre");
      } catch (e) { fail(res, `Connexion ${casLabel()} impossible : ${(e as Error).message}`); }
    },

    "POST /public/auth/local": async (req, res) => {
      const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "").split(",")[0]!.trim();
      const a = attempts.get(ip);
      if (a && a.n >= 10 && a.until > Date.now()) return ctx.sendJson(res, 429, { error: "Trop d'essais : réessayer dans un quart d'heure" });
      const { login, password, next } = await ctx.readBody(req);
      const u = readUsers().find(x => x.login === String(login ?? "").trim().toLowerCase());
      const ok = !!u && crypto.timingSafeEqual(Buffer.from(hash(String(password ?? ""), u.salt), "hex"), Buffer.from(u.hash, "hex"));
      if (!ok) {
        attempts.set(ip, { n: (a && a.until > Date.now() ? a.n : 0) + 1, until: Date.now() + 900_000 });
        return ctx.sendJson(res, 401, { error: "Identifiant ou mot de passe incorrect" });
      }
      attempts.delete(ip);
      const token = sign({ user: { id: `local:${u!.login}`, name: u!.name || u!.login, provider: "local" }, exp: Date.now() + SESSION_HOURS * 3600_000 });
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Set-Cookie": cookie(req, SESSION_COOKIE, token, SESSION_HOURS * 3600) });
      res.end(JSON.stringify({ ok: true, next: safeNext(next ?? null) }));
    },

    "POST /public/auth/logout": (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Set-Cookie": cookie(req, SESSION_COOKIE, "", 0) });
      res.end(JSON.stringify({ ok: true }));
    },

    // gestion des comptes locaux (page de configuration, protégée comme le reste de l'application)
    "GET /api/auth/users": (req, res) => ctx.sendJson(res, 200, {
      users: readUsers().map(({ login, name, createdAt }) => ({ login, name, createdAt })),
      providers: { google: configured("google"), github: configured("github"), cas: casUrl() ? { label: casLabel(), url: casUrl() } : false },
      callbacks: { google: `${origin(req)}/public/auth/google/callback`, github: `${origin(req)}/public/auth/github/callback`, cas: casService(req) },
    }),
    "POST /api/auth/users": async (req, res) => {
      const { login, name, password } = await ctx.readBody(req);
      const l = String(login ?? "").trim().toLowerCase();
      if (!/^[a-z0-9._@-]{2,60}$/.test(l)) return ctx.sendJson(res, 400, { error: "Identifiant invalide (lettres, chiffres, . _ @ -)" });
      const users = readUsers();
      const existing = users.find(u => u.login === l);
      if (!existing && String(password ?? "").length < 8) return ctx.sendJson(res, 400, { error: "Mot de passe de 8 caractères au moins" });
      if (password && String(password).length < 8) return ctx.sendJson(res, 400, { error: "Mot de passe de 8 caractères au moins" });
      const salt = crypto.randomBytes(16).toString("hex");
      const entry: LocalUser = existing
        ? { ...existing, name: String(name ?? existing.name).trim() || l, ...(password ? { salt, hash: hash(String(password), salt) } : {}) }
        : { login: l, name: String(name ?? "").trim() || l, salt, hash: hash(String(password), salt), createdAt: new Date().toISOString() };
      writeUsers([...users.filter(u => u.login !== l), entry].sort((a, b) => a.login.localeCompare(b.login)));
      ctx.sendJson(res, 200, { ok: true, created: !existing });
    },
    "POST /api/auth/users/delete": async (req, res) => {
      const { login } = await ctx.readBody(req);
      writeUsers(readUsers().filter(u => u.login !== String(login ?? "").toLowerCase()));
      ctx.sendJson(res, 200, { ok: true });
    },
  };

  return { routes, currentUser };
}
