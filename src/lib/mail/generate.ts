// Rédaction des mails de mailbot (réponses contradictoires, mails planifiés), envoi d'un brouillon validé et
// notification de l'administrateur ; partagé par les étapes du workflow et les routes du serveur
import { Albert } from "../albert/albert";
import { albertCollectionByName } from "../rag/ragQuery";
import { estimateTokens } from "../rag/ragIndex";
import { recordUsage } from "../metrics/usage";
import { Zotero } from "../zotero/zotero";
import { askAgent } from "../../agents/ask";
import { agentText } from "../../agents/overrides";
import { contradictorAgent, contradictorSchema, CONTRADICTOR_PROMPT } from "../../agents/contradictorAgent";
import { mailComposerAgent, mailComposerSchema, MAIL_COMPOSER_PROMPT } from "../../agents/mailComposerAgent";
import { workflowConfig } from "../../config";
import { addressList, collectionNames, profileById, type MailbotConfig, type MailbotProfile } from "../../config/mailbot";
import { messageDigest, saveDraft, sha1, threadOf, type MailDraft, type MailMessage } from "./store";
import { sendMail } from "./smtp";

type Env = Record<string, string | undefined>;
const fill = (template: string, vars: Record<string, string>) => template.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => vars[k] ?? m);

export const zoteroClient = (env: Env = process.env) => new Zotero(env.ZOTERO_USER_ID ?? "", env.ZOTERO_API_KEY ?? "", env.ZOTERO_GROUP_ID || undefined);
export const albertClient = (env: Env = process.env) => new Albert(workflowConfig.models.provider, env.ALBERT_API_KEY ?? "");

// collection Zotero d'un profil, ou de la boîte du mailbot (profile = null) : clé de la configuration, sinon collection
// de ce nom (créée si create)
export async function zoteroCollectionKey(zotero: Zotero, config: MailbotConfig, profile: MailbotProfile | null, create = false): Promise<string | null> {
  const { zoteroKey, zotero: name } = collectionNames(config, profile);
  if (zoteroKey) return zoteroKey;
  const found = (await zotero.collections()).find((c: any) => c.data?.name === name);
  if (found) return found.key;
  if (!create) return null;
  const key = await zotero.createCollection(name);
  console.log(`🆕 [ZOTERO] Collection « ${name} » créée (${key})`);
  return key;
}

export interface RagExtract { n: number; title: string; score: number; content: string }

// extraits des archives les plus proches de la requête, dans les collections Albert des profils donnés (null = boîte du
// mailbot) ; RAG indisponible : aucun extrait (la rédaction se fait alors sans les archives)
const safeRag = (env: Env, config: MailbotConfig, query: string, scopes: (MailbotProfile | null)[]) =>
  (async () => ragExtracts(albertClient(env), config, query, scopes))().catch(e => { console.warn("⚠️ [RAG] Recherche impossible :", (e as Error).message); return [] as RagExtract[]; });

export async function ragExtracts(albert: Albert, config: MailbotConfig, query: string, scopes: (MailbotProfile | null)[]): Promise<RagExtract[]> {
  if (!config.rag.enabled || !query.trim()) return [];
  const ids: number[] = [];
  for (const name of new Set(scopes.map(p => collectionNames(config, p).rag))) {
    const target = await albertCollectionByName(albert, name);
    if (target) ids.push(target.id);
  }
  if (!ids.length) return [];
  const res = await albert.search({ collectionIds: ids, query: query.slice(0, 4000), limit: config.rag.limit, method: config.rag.method as "hybrid" });
  recordUsage("Recherche RAG mailbot (vectorisation)", config.rag.embeddingsModel, { inputTokens: Number(res.usage?.prompt_tokens) || estimateTokens(query) });
  return res.data.map((r, i) => ({ n: i + 1, title: String(r.chunk.metadata?.title ?? `Document ${r.chunk.document_id}`), score: r.score, content: r.chunk.content.trim() }));
}

export interface ZoteroRef { key: string; title: string; citation: string; abstract: string }

// notices des collections (hors courriels et pièces jointes) ; les moins utilisées d'abord, puis les plus récentes
export async function zoteroReferences(zotero: Zotero, collectionKeys: (string | null)[], count: number, used: Record<string, number> = {}): Promise<ZoteroRef[]> {
  const keys = [...new Set(collectionKeys.filter(Boolean) as string[])];
  if (!keys.length || count <= 0) return [];
  const byKey = new Map<string, any>();
  for (const k of keys) for (const it of await zotero.collectionTopItems(k)) byKey.set(it.key, it);
  return [...byKey.values()]
    .filter((it: any) => !["email", "attachment", "note", "annotation"].includes(it.data?.itemType))
    .sort((a: any, b: any) => (used[a.key] ?? 0) - (used[b.key] ?? 0) || String(b.data?.dateAdded).localeCompare(String(a.data?.dateAdded)))
    .slice(0, count)
    .map((it: any) => ({
      key: it.key,
      title: String(it.data?.title ?? ""),
      citation: String(it.citation ?? "").replace(/<[^>]+>/g, "").trim(),
      abstract: String(it.data?.abstractNote ?? "").slice(0, 800),
    }));
}

// notices des collections Zotero des profils donnés (null = boîte du mailbot) ; erreur non bloquante
async function references(env: Env, config: MailbotConfig, scopes: (MailbotProfile | null)[], count: number, used?: Record<string, number>) {
  if (!config.zotero.enabled) return [];
  try {
    const zotero = zoteroClient(env);
    const keys = [];
    for (const p of scopes) keys.push(await zoteroCollectionKey(zotero, config, p).catch(() => null));
    return await zoteroReferences(zotero, keys, count, used);
  } catch (e) {
    console.warn("⚠️ [ZOTERO] Références indisponibles :", (e as Error).message);
    return [];
  }
}

const formatExtracts = (x: RagExtract[]) => x.map(e => `[${e.n}] « ${e.title} »\n${e.content}`).join("\n\n") || "(aucun extrait)";
const formatRefs = (r: ZoteroRef[]) => r.map(z => `- [${z.key}] ${z.citation || z.title}${z.abstract ? `\n  Résumé : ${z.abstract}` : ""}`).join("\n") || "(aucune référence)";
// personnes concernées, transmises aux agents : interlocuteurs du mail et chercheur dont l'historique est archivé
const researcherLabel = (profiles: MailbotProfile[]) => profiles.filter(p => p.researcher.email)
  .map(p => `Chercheur dont l'historique est archivé : ${[p.researcher.name, `<${p.researcher.email}>`, p.researcher.description].filter(Boolean).join(" — ")}`).join("\n");
const who = (p: { address: string; name: string }) => (p.name ? `${p.name} <${p.address}>` : p.address);
const draftSources = (rag: RagExtract[], refs: ZoteroRef[], thread: string[]) => ({
  rag: rag.map(e => ({ n: e.n, title: e.title, score: e.score, excerpt: e.content.slice(0, 600) })),
  zotero: refs.map(z => ({ key: z.key, title: z.title, citation: z.citation })),
  thread,
});
const threadLine = (x: MailMessage) => `${x.date.slice(0, 10)} · ${x.box === "bot" ? "mailbot" : "historique"} · ${x.from.address} · ${x.subject}`;

const reSubject = (s: string) => (/^re\s*:/i.test(s) ? s : `Re : ${s}`);
const isAddress = (a: string) => /^[^\s@<>,;]+@[^\s@<>,;]+$/.test(a);

// brouillon de réponse contradictoire à un mail reçu par le mailbot (hint : précision de l'administrateur)
export async function draftReply(o: { message: MailMessage; all: MailMessage[]; config: MailbotConfig; runId: string | null; env?: Env; hint?: string; id?: string }): Promise<MailDraft> {
  const { message: m, config } = o;
  const env = o.env ?? process.env;
  const thread = threadOf(m, o.all).filter(x => x.date <= m.date).slice(-config.reply.threadMessages);
  // contexte du profil concerné (son historique) et échanges du mailbot
  const profile = profileById(config, m.profile);
  const scopes = profile ? [profile, null] : [null];
  const rag = await safeRag(env, config, `${m.subject}\n${m.text}`, scopes);
  const refs = await references(env, config, scopes, config.reply.zoteroItems);
  const prompt = fill(agentText("contradictor-agent", "prompt", CONTRADICTOR_PROMPT), {
    correspondant: [`Auteur du mail : ${who(m.from)}`, researcherLabel(profile ? [profile] : [])].filter(Boolean).join("\n"),
    message: messageDigest(m, 8000),
    fil: thread.map(x => messageDigest(x, 2000)).join("\n\n---\n\n") || "(premier message du fil)",
    extraits: formatExtracts(rag),
    references: formatRefs(refs),
  }) + (o.hint ? `\n\nPrécision de l'administrateur pour cette nouvelle proposition : ${o.hint}` : "");
  console.log(`🧠 Agent : Contradicteur (« ${m.subject} »)...`);
  const res = await askAgent(contradictorAgent, { model: config.models.analytics, source: "Réponse contradictoire (contradictorAgent)", prompt, schema: contradictorSchema });
  const now = new Date().toISOString();
  return {
    id: o.id ?? `rep-${m.id}`,
    kind: "reponse", status: "en attente", createdAt: now, updatedAt: now, runId: o.runId,
    to: [m.from.address],
    subject: res.object?.subject?.trim() || reSubject(m.subject),
    body: `${(res.object?.body ?? res.text).trim()}\n\n${config.signature}`.trim(),
    replyTo: { id: m.id, messageId: m.messageId, subject: m.subject, date: m.date, from: m.from.address, references: [...m.references, m.messageId].filter(Boolean), excerpt: m.text.slice(0, 1500) },
    sources: draftSources(rag, refs, thread.map(threadLine)),
    arguments: res.object?.arguments ?? [],
    model: config.models.analytics,
    tokens: Number(res.usage?.totalTokens) || 0,
    history: [],
  };
}

// mail au groupe à l'initiative de mailbot : derniers échanges du mailbot et de l'historique, RAG sur leurs sujets,
// notices de la collection
export async function composeMail(o: { all: MailMessage[]; config: MailbotConfig; runId: string | null; env?: Env; usedRefs?: Record<string, number>; hint?: string; id?: string }): Promise<MailDraft> {
  const { config } = o;
  const env = o.env ?? process.env;
  const group = addressList(config.bot.group);
  if (!group.length) throw new Error("Groupe des mails planifiés vide (Réglages › Boîte du mailbot)");
  const recent = o.all.filter(m => m.box === "bot").slice(-config.compose.archiveMessages);
  const history = o.all.filter(m => m.box === "history").slice(-config.compose.historyMessages);
  const instruction = config.compose.instruction || "relancer la discussion du groupe à partir des derniers échanges, en apportant un éclairage nouveau";
  const query = [instruction, ...[...recent, ...history].slice(-6).map(m => `${m.subject} ${m.text.slice(0, 400)}`)].join("\n");
  // groupe commun : historiques de tous les profils et échanges du mailbot
  const scopes = [...config.profiles, null];
  const rag = await safeRag(env, config, query, scopes);
  const refs = await references(env, config, scopes, config.compose.zoteroItems, o.usedRefs);
  const prompt = fill(agentText("mail-composer-agent", "prompt", MAIL_COMPOSER_PROMPT), {
    correspondant: [`Groupe destinataire : ${group.join(", ")}`, researcherLabel(config.profiles)].filter(Boolean).join("\n"),
    consigne: instruction,
    archives: recent.map(x => messageDigest(x, 1500)).join("\n\n---\n\n") || "(aucun échange du mailbot avec le groupe)",
    historique: history.map(x => messageDigest(x, 1500)).join("\n\n---\n\n") || "(aucun échange archivé)",
    extraits: formatExtracts(rag),
    references: formatRefs(refs),
  }) + (o.hint ? `\n\nPrécision de l'administrateur pour cette nouvelle proposition : ${o.hint}` : "");
  console.log("🧠 Agent : Rédacteur de courriels...");
  const res = await askAgent(mailComposerAgent, { model: config.models.analytics, source: "Mail planifié (mailComposerAgent)", prompt, schema: mailComposerSchema });
  const now = new Date().toISOString();
  return {
    id: o.id ?? `ini-${sha1(now + Math.random()).slice(0, 12)}`,
    kind: "initiative", status: "en attente", createdAt: now, updatedAt: now, runId: o.runId,
    // groupe visible (« À ») ou en copie cachée
    to: config.bot.groupVisible ? group : [],
    bcc: config.bot.groupVisible ? [] : group,
    subject: res.object?.subject?.trim() || "Suite de nos échanges",
    body: `${(res.object?.body ?? res.text).trim()}\n\n${config.signature}`.trim(),
    replyTo: null,
    sources: draftSources(rag, refs, [...history, ...recent].map(threadLine)),
    model: config.models.analytics,
    tokens: Number(res.usage?.totalTokens) || 0,
    history: [],
  };
}

export const draftRecipients = (d: MailDraft) => [...(d.to ?? []), ...(d.bcc ?? [])];

// envoi d'un brouillon (validé par l'administrateur, ou mail planifié sans validation) ; le message envoyé sera
// archivé par la synchronisation suivante (copie dans le dossier des envoyés de la boîte du mailbot)
export async function sendDraft(draft: MailDraft, config: MailbotConfig, env: Env = process.env): Promise<MailDraft> {
  if (draft.status === "envoyé") throw new Error("Brouillon déjà envoyé");
  const recipients = draftRecipients(draft).map(a => a.trim().toLowerCase());
  if (!recipients.length) throw new Error("Aucun destinataire");
  const bad = recipients.filter(a => !isAddress(a));
  if (bad.length) throw new Error(`Destinataire(s) invalide(s) : ${bad.join(", ")}`);
  // garde-fou : une réponse ne part qu'à une adresse autorisée, un mail planifié qu'aux membres du groupe
  const permitted = new Set(addressList(draft.kind === "reponse" ? config.bot.allowed : config.bot.group));
  const refused = recipients.filter(a => !permitted.has(a));
  if (refused.length) throw new Error(`Destinataire(s) hors de la liste ${draft.kind === "reponse" ? "des adresses autorisées" : "du groupe"} (Réglages › Boîte du mailbot) : ${refused.join(", ")}`);
  try {
    const sent = await sendMail({
      to: draft.to ?? [], bcc: draft.bcc ?? [], subject: draft.subject, text: draft.body,
      inReplyTo: draft.replyTo?.messageId ?? null, references: draft.replyTo?.references ?? [],
    }, env, config.bot.appendSent);
    draft.status = "envoyé";
    draft.sentAt = new Date().toISOString();
    draft.sentMessageId = sent.messageId;
    draft.error = null;
    console.log(`📨 [SMTP] Mail envoyé à ${recipients.join(", ")} : « ${draft.subject} »${sent.sentFolder ? ` (copie dans ${sent.sentFolder})` : ""}`);
    return saveDraft(config, draft, "envoi");
  } catch (e) {
    draft.status = "échec";
    draft.error = (e as Error).message;
    saveDraft(config, draft, "échec de l'envoi", draft.error);
    throw e;
  }
}

// prévient l'administrateur des brouillons en attente de validation
export async function notifyAdmin(drafts: MailDraft[], config: MailbotConfig, env: Env = process.env) {
  if (!drafts.length || !config.admin.notify || !config.admin.email) return;
  const url = (env.MAILBOT_URL || `http://127.0.0.1:${env.MAILBOT_PORT || 7278}`).replace(/\/+$/, "");
  const lines = drafts.map(d => `- ${d.kind === "reponse" ? "Réponse à" : "Mail au groupe"} ${draftRecipients(d).join(", ")} : « ${d.subject} »`);
  try {
    await sendMail({
      to: [config.admin.email],
      subject: `[mailbot] ${drafts.length} brouillon(s) à valider`,
      text: `Brouillon(s) en attente de validation :\n\n${lines.join("\n")}\n\nVérifier, modifier et envoyer : ${url}/#brouillons\n`,
    }, env, false);
    console.log(`🔔 Administrateur prévenu (${config.admin.email})`);
  } catch (e) {
    console.warn("⚠️ Notification de l'administrateur impossible :", (e as Error).message);
  }
}
