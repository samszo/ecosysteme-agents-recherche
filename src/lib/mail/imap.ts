// Lecture des boîtes mail (IMAP, imapflow) : boîte « historique » du chercheur et boîte du mailbot ; messages
// échangés avec une liste d'adresses, dépôt d'un message envoyé dans la boîte du mailbot
import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail, type AddressObject } from "mailparser";
import { htmlToText } from "../extraction/attachmentExtract";
import { historyEnvPrefix } from "../../config/mailbot";

type Env = Record<string, string | undefined>;

// "bot" : boîte du mailbot (BOT_IMAP_*, identifiants SMTP par défaut) ; "history:<profil>" : boîte historique d'un
// profil (HISTORY_<PROFIL>_IMAP_*)
export type MailBox = "bot" | `history:${string}`;
export const historyBox = (profileId: string): MailBox => `history:${profileId}`;
export const boxLabel = (box: MailBox) => (box === "bot" ? "boîte du mailbot" : `boîte historique « ${box.slice(8)} »`);

export interface ImapSettings { box: MailBox; host: string; port: number; secure: boolean; user: string; password: string }

export function imapSettings(env: Env = process.env, box: MailBox = "bot"): ImapSettings {
  const k = box === "bot" ? "BOT_IMAP_" : historyEnvPrefix(box.slice(8));
  const host = env[`${k}HOST`] ?? "";
  const user = env[`${k}USER`] || (box === "bot" ? env.SMTP_USER : "") || "";
  const password = env[`${k}PASSWORD`] || (box === "bot" ? env.SMTP_PASSWORD : "") || "";
  if (!host || !user || !password) throw new Error(`Connexion IMAP de la ${boxLabel(box)} incomplète (${k}HOST, ${k}USER, ${k}PASSWORD dans ⚙ Paramètres${box === "bot" ? " ; identifiant et mot de passe repris du SMTP s'ils sont vides" : ""})`);
  const port = Number(env[`${k}PORT`]) || 993;
  // ports SMTP saisis pour IMAP : la connexion resterait bloquée sans message clair
  if ([25, 465, 587].includes(port)) throw new Error(`${k}PORT ${port} est un port d'envoi (SMTP) : utiliser 993 (TLS) ou 143 (STARTTLS)`);
  // vide : TLS direct sur 993, STARTTLS sur 143
  const secure = (env[`${k}SECURE`] || (port === 143 ? "false" : "true")) !== "false";
  return { box, host, port, secure, user, password };
}

// message du serveur (imapflow ne met que « Command failed » dans message) et conseil selon le fournisseur
function imapError(e: any, s: ImapSettings): Error {
  const server = String(e?.responseText ?? "").trim();
  if (e?.authenticationFailed || /AUTHENTICATIONFAILED|invalid credentials|password/i.test(server)) {
    const hint = /gmail|google/i.test(s.host)
      ? " Gmail exige un mot de passe d'application (compte Google › Sécurité › Validation en deux étapes › Mots de passe des applications) à la place du mot de passe du compte."
      : " Vérifier l'identifiant (adresse complète) et le mot de passe ; certains fournisseurs exigent un mot de passe d'application.";
    return new Error(`${boxLabel(s.box)} : authentification IMAP refusée par ${s.host}${server ? ` : ${server}` : ""}.${hint}`);
  }
  if (e?.code === "ETIMEDOUT" || /timeout/i.test(String(e?.message))) return new Error(`${boxLabel(s.box)} : ${s.host}:${s.port} ne répond pas (délai dépassé) : vérifier le serveur, le port et le chiffrement`);
  return new Error(`${boxLabel(s.box)} : IMAP ${s.host}:${s.port} : ${server || e?.message || e}${e?.code ? ` (${e.code})` : ""}`);
}

export async function openImap(env: Env = process.env, box: MailBox = "bot"): Promise<ImapFlow> {
  const s = imapSettings(env, box);
  const client = new ImapFlow({
    host: s.host, port: s.port, secure: s.secure, auth: { user: s.user, pass: s.password }, logger: false,
    connectionTimeout: 15_000, greetingTimeout: 15_000,
  });
  // erreur de socket après la connexion : signalée par l'opération en cours, sans faire tomber le processus
  client.on("error", () => {});
  try {
    await client.connect();
  } catch (e) {
    throw imapError(e, s);
  }
  return client;
}

// dossiers parcourus : ceux de la configuration, sinon boîte de réception + dossier des envoyés (\Sent)
export async function mailFolders(client: ImapFlow, configured: string[]): Promise<string[]> {
  if (configured.length) return configured;
  const list = await client.list();
  const sent = list.find(f => f.specialUse === "\\Sent")?.path
    ?? list.find(f => /^(inbox[./])?(sent|envoy|éléments envoyés|sent items|sent messages)/i.test(f.path))?.path;
  return ["INBOX", ...(sent ? [sent] : [])];
}

export async function sentFolder(client: ImapFlow): Promise<string | null> {
  const folders = await mailFolders(client, []);
  return folders[1] ?? null;
}

export interface Envelope { folder: string; uid: number; messageId: string; date: string; subject: string; from: string }

// enveloppes des messages de ou vers l'une des adresses, dans chaque dossier (sans télécharger les messages)
export async function listEnvelopes(client: ImapFlow, folders: string[], addresses: string[], since?: string): Promise<Envelope[]> {
  const out: Envelope[] = [];
  if (!addresses.length) return out;
  for (const folder of folders) {
    let lock;
    try {
      lock = await client.getMailboxLock(folder);
    } catch (e) {
      console.warn(`⚠️ [IMAP] Dossier « ${folder} » inaccessible :`, (e as Error).message);
      continue;
    }
    try {
      // une recherche par adresse (une requête OU imbriquée sur des dizaines d'adresses est mal acceptée par certains serveurs)
      const uids = new Set<number>();
      for (const address of addresses) {
        const query: any = { or: [{ from: address }, { to: address }, { cc: address }] };
        if (since) query.since = new Date(since);
        for (const uid of (await client.search(query, { uid: true })) || []) uids.add(uid);
      }
      if (!uids.size) continue;
      for await (const msg of client.fetch([...uids], { uid: true, envelope: true, internalDate: true }, { uid: true })) {
        const env = msg.envelope;
        out.push({
          folder, uid: msg.uid,
          messageId: env?.messageId ?? "",
          date: new Date(env?.date ?? msg.internalDate ?? Date.now()).toISOString(),
          subject: env?.subject ?? "",
          from: env?.from?.[0]?.address ?? "",
        });
      }
      console.log(`📬 [IMAP] ${folder} : ${uids.size} message(s) avec ${addresses.length} adresse(s)`);
    } finally {
      lock.release();
    }
  }
  return out;
}

// source complète des messages d'un dossier (uids)
export async function downloadMessages(client: ImapFlow, folder: string, uids: number[]): Promise<Map<number, Buffer>> {
  const out = new Map<number, Buffer>();
  if (!uids.length) return out;
  const lock = await client.getMailboxLock(folder);
  try {
    for await (const msg of client.fetch(uids, { uid: true, source: true }, { uid: true })) {
      if (msg.source) out.set(msg.uid, msg.source);
    }
  } finally {
    lock.release();
  }
  return out;
}

const addresses = (a: AddressObject | AddressObject[] | undefined) =>
  (Array.isArray(a) ? a : a ? [a] : []).flatMap(x => x.value).map(v => ({ address: String(v.address ?? "").toLowerCase(), name: v.name ?? "" }));

export interface ParsedMessage {
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  date: string;
  from: { address: string; name: string };
  to: { address: string; name: string }[];
  cc: { address: string; name: string }[];
  subject: string;
  text: string;
  attachments: { fileName: string; contentType: string; content: Buffer }[];
}

export async function parseMessage(source: Buffer): Promise<ParsedMessage> {
  const p: ParsedMail = await simpleParser(source);
  const refs = Array.isArray(p.references) ? p.references : p.references ? [p.references] : [];
  return {
    messageId: p.messageId ?? "",
    inReplyTo: p.inReplyTo ?? null,
    references: refs,
    date: (p.date ?? new Date()).toISOString(),
    from: addresses(p.from)[0] ?? { address: "", name: "" },
    to: addresses(p.to),
    cc: addresses(p.cc),
    subject: p.subject ?? "",
    text: (p.text || (p.html ? htmlToText(String(p.html)) : "")).trim(),
    // pièces jointes réelles (les images intégrées au corps HTML sont ignorées)
    attachments: p.attachments
      .filter(a => a.contentDisposition !== "inline" || !!a.filename)
      .filter(a => !(a.related && !a.filename))
      .map((a, i) => ({ fileName: a.filename || `piece-${i + 1}`, contentType: a.contentType || "application/octet-stream", content: a.content })),
  };
}

// copie d'un message envoyé dans le dossier des envoyés de la boîte du mailbot
export async function appendToSent(raw: Buffer, env: Env = process.env) {
  const client = await openImap(env, "bot");
  try {
    // boîte neuve sans dossier des envoyés : il est créé (« Sent », reconnu ensuite par mailFolders)
    let folder = await sentFolder(client);
    if (!folder) {
      folder = (await client.mailboxCreate("Sent")).path;
      console.log(`📁 [IMAP] Dossier des envoyés « ${folder} » créé dans la boîte du mailbot`);
    }
    await client.append(folder, raw, ["\\Seen"]);
    return folder;
  } finally {
    await client.logout().catch(() => {});
  }
}

// test de connexion (page Paramètres) : dossiers lus et nombre de messages avec les adresses
export async function checkImap(env: Env, box: MailBox, addresses: string[] = [], folders: string[] = []) {
  const client = await openImap(env, box);
  try {
    const list = await mailFolders(client, folders);
    const count = addresses.length ? ` ; ${(await listEnvelopes(client, list, addresses)).length} message(s) avec ${addresses.length} adresse(s)` : "";
    return `dossiers lus : ${list.join(", ")}${count}`;
  } finally {
    await client.logout().catch(() => {});
  }
}
