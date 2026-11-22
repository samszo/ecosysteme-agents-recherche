// Envoi des mails du mailbot (SMTP, nodemailer) : message composé une fois (source brute), envoyé puis copié dans les
// envoyés de la boîte du mailbot
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { appendToSent } from "./imap";

type Env = Record<string, string | undefined>;

export function smtpSettings(env: Env = process.env) {
  const host = env.SMTP_HOST ?? "";
  // identifiants de la boîte du mailbot par défaut (même compte)
  const user = env.SMTP_USER || env.BOT_IMAP_USER || "";
  const pass = env.SMTP_PASSWORD || env.BOT_IMAP_PASSWORD || "";
  if (!host || !user || !pass) throw new Error("Connexion SMTP incomplète (SMTP_HOST, et SMTP_USER / SMTP_PASSWORD ou ceux de la boîte du mailbot, dans ⚙ Paramètres)");
  const port = Number(env.SMTP_PORT) || 465;
  // ports IMAP saisis pour SMTP : la connexion resterait bloquée sans message clair
  if ([993, 143].includes(port)) throw new Error(`SMTP_PORT ${port} est un port de lecture (IMAP) : utiliser 465 (TLS) ou 587 (STARTTLS)`);
  return {
    // vide : TLS direct sur 465, STARTTLS sinon (587, 25)
    host, port, secure: (env.SMTP_SECURE || (port === 465 ? "true" : "false")) !== "false", user, pass,
    from: env.MAIL_FROM || user, fromName: env.MAIL_FROM_NAME || "",
  };
}

const transport = (env: Env) => {
  const s = smtpSettings(env);
  return { s, t: nodemailer.createTransport({
    host: s.host, port: s.port, secure: s.secure, auth: { user: s.user, pass: s.pass },
    connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 60_000,
  }) };
};

// message explicite : authentification refusée, délai dépassé (port ou TLS inadaptés), autre
function smtpError(e: any, s: ReturnType<typeof smtpSettings>): Error {
  const server = String(e?.response ?? "").trim();
  if (e?.code === "EAUTH") return new Error(`authentification SMTP refusée par ${s.host}${server ? ` : ${server}` : ""} (vérifier SMTP_USER et SMTP_PASSWORD ; mot de passe d'application si le fournisseur l'exige)`);
  if (["ETIMEDOUT", "ESOCKET", "ECONNECTION"].includes(e?.code) || /timeout|wrong version number/i.test(String(e?.message))) {
    return new Error(`${s.host}:${s.port} ne répond pas en SMTP ${s.secure ? "TLS" : "STARTTLS"} : vérifier le serveur et le port (465 avec TLS, 587 avec STARTTLS)${e?.message ? ` — ${e.message}` : ""}`);
  }
  return new Error(`SMTP ${s.host}:${s.port} : ${server || e?.message || e}`);
}

// to : destinataires visibles ; bcc : copie cachée (groupe non visible)
export interface OutgoingMail { to: string[]; bcc?: string[]; subject: string; text: string; inReplyTo?: string | null; references?: string[] }

// envoie le message ; copie dans le dossier des envoyés si appendSent (erreur non bloquante)
export async function sendMail(mail: OutgoingMail, env: Env = process.env, appendSent = true): Promise<{ messageId: string; raw: Buffer; sentFolder: string | null }> {
  const { s, t } = transport(env);
  const domain = s.from.split("@")[1] || "mailbot.local";
  const messageId = `<mailbot.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 10)}@${domain}>`;
  const raw: Buffer = await new MailComposer({
    from: s.fromName ? { name: s.fromName, address: s.from } : s.from,
    // groupe en copie cachée : le message est adressé au mailbot lui-même, les destinataires ne sont que dans l'enveloppe
    to: mail.to.length ? mail.to : s.from,
    subject: mail.subject,
    text: mail.text,
    messageId,
    date: new Date(),
    ...(mail.inReplyTo ? { inReplyTo: mail.inReplyTo } : {}),
    ...(mail.references?.length ? { references: mail.references } : {}),
    headers: { "X-Mailer": "mailbot (ecosysteme-agents-recherche)" },
  }).compile().build();
  try { await t.sendMail({ envelope: { from: s.from, to: [...mail.to, ...(mail.bcc ?? [])] }, raw }); }
  catch (e) { throw smtpError(e, s); }
  let sentFolder: string | null = null;
  if (appendSent) {
    try { sentFolder = await appendToSent(raw, env); }
    catch (e) { console.warn("⚠️ [IMAP] Copie dans les envoyés impossible :", (e as Error).message); }
  }
  return { messageId, raw, sentFolder };
}

// test de connexion (page Paramètres) : authentification sans envoi
export async function checkSmtp(env: Env) {
  const { s, t } = transport(env);
  try { await t.verify(); }
  catch (e) { throw smtpError(e, s); }
  return `authentification acceptée par ${s.host}:${s.port} ; expéditeur ${s.from}`;
}
