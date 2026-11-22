// Archive locale de mailbot : index des messages (messages.json), brouillons (un fichier JSON par brouillon),
// identifiants stables des messages et mise en forme du texte (citations retirées, Markdown pour le RAG)
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DRAFTS_DIR, MESSAGES_FILE, type MailbotConfig } from "../../config/mailbot";

export interface MailAttachment {
  fileName: string;
  contentType: string;
  size: number;
  // empreinte SHA-1 du contenu (idempotence des dépôts)
  sha1: string;
  // fichier enregistré dans outputDir/pieces/<id>/
  path: string;
  zoteroKey?: string | null;
  omekaMediaId?: number | null;
  albertDocumentId?: number | null;
  // texte extrait (pour le RAG), tronqué dans l'index
  textLength?: number;
}

export interface MailMessage {
  // identifiant stable : empreinte du Message-ID (sinon de la date, de l'expéditeur et du sujet)
  id: string;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  folder: string;
  uid: number;
  date: string;
  from: { address: string; name: string };
  to: { address: string; name: string }[];
  cc: { address: string; name: string }[];
  subject: string;
  // boîte d'origine : historique du chercheur, ou boîte du mailbot
  box: "history" | "bot";
  // profil du chercheur concerné : boîte historique lue, ou (boîte du mailbot) profil dont le chercheur ou un
  // destinataire participe à l'échange ; null = échange du mailbot sans profil
  profile: string | null;
  // entrant (reçu par le propriétaire de la boîte) ou sortant (envoyé par lui : le chercheur, ou le mailbot)
  direction: "entrant" | "sortant";
  text: string;
  attachments: MailAttachment[];
  archivedAt: string;
  omekaItemId?: number | null;
  zoteroKey?: string | null;
  albertDocumentId?: number | null;
  // envoyé par mailbot (brouillon validé ou mail planifié)
  draftId?: string | null;
}

export interface MailDraft {
  id: string;
  kind: "reponse" | "initiative";
  status: "en attente" | "envoyé" | "rejeté" | "échec";
  createdAt: string;
  updatedAt: string;
  runId: string | null;
  // destinataires visibles ; bcc : groupe en copie cachée (mail planifié, bot.groupVisible = false)
  to: string[];
  bcc?: string[];
  subject: string;
  body: string;
  // message auquel le brouillon répond
  replyTo?: { id: string; messageId: string; subject: string; date: string; from: string; references: string[]; excerpt: string } | null;
  // éléments transmis à l'agent (affichés à l'administrateur pour vérifier l'argumentation)
  sources?: { rag: { n: number; title: string; score: number; excerpt: string }[]; zotero: { key: string; title: string; citation: string }[]; thread: string[] };
  arguments?: { claim: string; counter: string; sources: number[] }[];
  model?: string;
  tokens?: number;
  sentAt?: string | null;
  sentMessageId?: string | null;
  error?: string | null;
  history?: { at: string; action: string; note?: string }[];
}

export const sha1 = (data: string | Buffer) => crypto.createHash("sha1").update(data).digest("hex");

// identifiant stable d'un message
export const messageKey = (messageId: string, fallback: string) => sha1(messageId || fallback).slice(0, 16);

const dir = (config: MailbotConfig, ...parts: string[]) => path.resolve(process.cwd(), config.outputDir, ...parts);

// ==========================================
// Index des messages
// ==========================================

export function readMessages(config: MailbotConfig): MailMessage[] {
  const file = dir(config, MESSAGES_FILE);
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : [];
  } catch (e) {
    console.warn(`⚠️ ${file} illisible :`, (e as Error).message);
    return [];
  }
}

export type MessageUpdate = Partial<Omit<MailMessage, "attachments">> & { id: string; attachments?: Partial<MailAttachment>[] };

// fusion par identifiant (les nouvelles valeurs complètent les anciennes ; pièces jointes fusionnées une à une, par
// empreinte et nom : les étapes parallèles mettent chacune à jour leurs propres champs), tri chronologique
export function writeMessages(config: MailbotConfig, messages: MessageUpdate[]) {
  const byId = new Map(readMessages(config).map(m => [m.id, m]));
  for (const u of messages) {
    const old = byId.get(u.id);
    const attachments = u.attachments
      ? (old?.attachments?.length ? old.attachments.map(a => ({ ...a, ...u.attachments!.find(x => x.sha1 === a.sha1 && x.fileName === a.fileName) })) : u.attachments as MailAttachment[])
      : old?.attachments ?? [];
    byId.set(u.id, { ...old, ...u, attachments } as MailMessage);
  }
  const all = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date));
  fs.mkdirSync(dir(config), { recursive: true });
  // écriture atomique : le serveur peut lire l'index pendant qu'une exécution l'écrit
  const file = dir(config, MESSAGES_FILE);
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(all, null, 2));
  fs.renameSync(`${file}.tmp`, file);
  return all;
}

// ==========================================
// Brouillons
// ==========================================

const validId = (id: string) => /^[\w-]{1,80}$/.test(id);
const draftFile = (config: MailbotConfig, id: string) => {
  if (!validId(id)) throw new Error("Identifiant de brouillon invalide");
  return dir(config, DRAFTS_DIR, `${id}.json`);
};

export function readDraft(config: MailbotConfig, id: string): MailDraft | null {
  const file = draftFile(config, id);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : null;
}

export function listDrafts(config: MailbotConfig): MailDraft[] {
  const d = dir(config, DRAFTS_DIR);
  if (!fs.existsSync(d)) return [];
  const drafts: MailDraft[] = [];
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith(".json")) continue;
    try { drafts.push(JSON.parse(fs.readFileSync(path.join(d, f), "utf-8"))); } catch { /* fichier illisible : ignoré */ }
  }
  return drafts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveDraft(config: MailbotConfig, draft: MailDraft, action?: string, note?: string) {
  const now = new Date().toISOString();
  draft.updatedAt = now;
  if (action) draft.history = [...(draft.history ?? []), { at: now, action, ...(note ? { note } : {}) }];
  fs.mkdirSync(dir(config, DRAFTS_DIR), { recursive: true });
  const file = draftFile(config, draft.id);
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(draft, null, 2));
  fs.renameSync(`${file}.tmp`, file);
  return draft;
}

// ==========================================
// Texte des messages
// ==========================================

// retire les citations du message précédent : lignes « > … » et tout ce qui suit une ligne d'introduction de citation
export function stripQuoted(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  const intro = /^(le .{3,120} a écrit\s*:|on .{3,120} wrote\s*:|-{2,}\s*(message d'origine|original message|message transféré|forwarded message)\s*-{2,}|de\s*:.*<.*@.*>$|from\s*:.*@.*$)/i;
  for (const line of lines) {
    const l = line.trim();
    if (intro.test(l)) break;
    if (l.startsWith(">")) continue;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const who = (p: { address: string; name: string }) => (p.name ? `${p.name} <${p.address}>` : p.address);

// texte déposé dans le RAG : en-têtes puis corps (Markdown, découpé par Albert sur les titres et paragraphes)
export function messageMarkdown(m: MailMessage) {
  return [
    `# ${m.subject || "(sans sujet)"}`,
    "",
    `- Date : ${m.date}`,
    `- De : ${who(m.from)}`,
    `- À : ${m.to.map(who).join(", ")}`,
    ...(m.cc.length ? [`- Copie : ${m.cc.map(who).join(", ")}`] : []),
    `- Boîte : ${m.box === "bot" ? "mailbot" : "historique du chercheur"}${m.profile ? `, profil ${m.profile}` : ""} (${m.direction})`,
    ...(m.attachments.length ? [`- Pièces jointes : ${m.attachments.map(a => a.fileName).join(", ")}`] : []),
    "",
    m.text,
    "",
  ].join("\n");
}

// courte présentation d'un message pour les agents
export function messageDigest(m: MailMessage, maxChars = 3000) {
  const text = m.text.length > maxChars ? `${m.text.slice(0, maxChars)}…` : m.text;
  return `[${m.date.slice(0, 16).replace("T", " ")}] ${who(m.from)} → ${[...m.to, ...m.cc].map(who).join(", ")}${m.box === "bot" ? " (mailbot)" : ""} — « ${m.subject} »${m.attachments.length ? ` (pièces jointes : ${m.attachments.map(a => a.fileName).join(", ")})` : ""}\n${text}`;
}

// fil d'un message : messages qui partagent ses références, sinon même sujet normalisé
export function threadOf(m: MailMessage, all: MailMessage[]) {
  const ids = new Set([m.messageId, ...m.references, m.inReplyTo].filter(Boolean) as string[]);
  const norm = (s: string) => s.toLowerCase().replace(/^((re|tr|fwd?|aw)\s*:\s*)+/i, "").trim();
  const subject = norm(m.subject);
  return all.filter(x => x.id !== m.id && (ids.has(x.messageId) || x.references.some(r => ids.has(r)) || (x.inReplyTo && ids.has(x.inReplyTo)) || (subject && norm(x.subject) === subject)));
}
