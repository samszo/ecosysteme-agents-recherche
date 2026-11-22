import { createStep } from "@mastra/core/workflows";
import fs from "fs";
import path from "path";
import { addressList, mailbotConfig, profileById, ATTACHMENTS_DIR, type MailbotConfig } from "../../../config/mailbot";
import { boxLabel, downloadMessages, historyBox, listEnvelopes, mailFolders, openImap, parseMessage, type MailBox } from "../../../lib/mail/imap";
import { listDrafts, messageKey, readMessages, sha1, stripQuoted, writeMessages, type MailMessage } from "../../../lib/mail/store";

const safeName = (s: string) => s.replace(/[\\/:*?"<>|\x00-\x1f]+/g, "_").slice(0, 150) || "piece";

// adresses suivies dans chaque boîte, et propriétaire de la boîte (sens des messages)
function boxScope(config: MailbotConfig, box: MailBox, env: Record<string, string | undefined>) {
  if (box !== "bot") {
    const p = profileById(config, box.slice(8))!;
    return { owner: p.researcher.email.trim().toLowerCase(), addresses: addressList(p.recipients), folders: p.folders, since: p.since };
  }
  return { owner: (env.MAIL_FROM || env.SMTP_USER || env.BOT_IMAP_USER || "").trim().toLowerCase(), addresses: addressList([...config.bot.allowed, ...config.bot.group]), folders: config.bot.folders, since: "" };
}

// profil d'un message de la boîte du mailbot : le premier dont le chercheur ou un destinataire participe à l'échange
function profileOfMessage(config: MailbotConfig, addresses: string[]): string | null {
  const set = new Set(addresses);
  return config.profiles.find(p => addressList([p.researcher.email, ...p.recipients]).some(a => set.has(a)))?.id ?? null;
}

// lecture d'une boîte : nouveaux messages avec les adresses suivies, pièces jointes enregistrées localement
async function fetchBox(config: MailbotConfig, box: MailBox, knownIds: Set<string>, sentDrafts: Map<string, string>): Promise<MailMessage[]> {
  const scope = boxScope(config, box, process.env);
  if (!scope.addresses.length) {
    console.log(`⏭️ ${boxLabel(box)} : aucune adresse ${box === "bot" ? "autorisée ni de groupe" : "de destinataire"} dans les Réglages, boîte non lue.`);
    return [];
  }
  console.log(`📬 [IMAP] ${boxLabel(box)} : messages échangés avec ${scope.addresses.length} adresse(s)...`);
  const client = await openImap(process.env, box);
  const added: MailMessage[] = [];
  try {
    const folders = await mailFolders(client, scope.folders);
    const envelopes = await listEnvelopes(client, folders, scope.addresses, scope.since || undefined);
    // nouveaux messages (absents de l'index), les plus anciens d'abord ; un message présent dans deux dossiers n'est lu qu'une fois
    const seen = new Set<string>();
    const fresh = envelopes
      .filter(e => !knownIds.has(e.messageId) && !knownIds.has(messageKey(e.messageId, `${e.date}|${e.from}|${e.subject}`)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter(e => { const k = e.messageId || `${e.folder}/${e.uid}`; if (seen.has(k)) return false; seen.add(k); return true; });
    const batch = fresh.slice(0, config.mailbox.maxNewMessages);
    console.log(`📥 [IMAP] ${boxLabel(box)} : ${envelopes.length} message(s) trouvé(s), ${fresh.length} nouveau(x)${fresh.length > batch.length ? `, ${batch.length} archivé(s) à cette exécution` : ""}`);

    const byFolder = new Map<string, typeof batch>();
    for (const e of batch) byFolder.set(e.folder, [...(byFolder.get(e.folder) ?? []), e]);
    for (const [folder, list] of byFolder) {
      const sources = await downloadMessages(client, folder, list.map(e => e.uid));
      for (const e of list) {
        const source = sources.get(e.uid);
        if (!source) continue;
        try {
          const p = await parseMessage(source);
          const id = messageKey(p.messageId, `${p.date}|${p.from.address}|${p.subject}`);
          if (knownIds.has(id)) continue;
          knownIds.add(id);
          if (p.messageId) knownIds.add(p.messageId);
          // pièces jointes : outputDir/pieces/<id>/
          const dir = path.resolve(process.cwd(), config.outputDir, ATTACHMENTS_DIR, id);
          const attachments = p.attachments.map(a => {
            fs.mkdirSync(dir, { recursive: true });
            const file = path.join(dir, safeName(a.fileName));
            fs.writeFileSync(file, a.content);
            return { fileName: a.fileName, contentType: a.contentType, size: a.content.length, sha1: sha1(a.content), path: path.relative(process.cwd(), file) };
          });
          added.push({
            id, messageId: p.messageId, inReplyTo: p.inReplyTo, references: p.references, folder, uid: e.uid, date: p.date,
            from: p.from, to: p.to, cc: p.cc, subject: p.subject,
            box: box === "bot" ? "bot" : "history",
            profile: box === "bot" ? profileOfMessage(config, [p.from, ...p.to, ...p.cc].map(x => x.address)) : box.slice(8),
            // sortant : envoyé par le propriétaire de la boîte (dossier des envoyés si son adresse n'est pas connue)
            direction: (scope.owner ? p.from.address === scope.owner : folder !== "INBOX") ? "sortant" : "entrant",
            text: config.mailbox.stripQuoted ? stripQuoted(p.text) || p.text : p.text,
            attachments, archivedAt: new Date().toISOString(),
            draftId: sentDrafts.get(p.messageId) ?? null,
          });
        } catch (err) {
          console.warn(`⚠️ [IMAP] Message ${folder}/${e.uid} illisible :`, (err as Error).message);
        }
      }
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return added;
}

// Boîtes mail (IMAP) : historique de chaque profil (chercheur et ses destinataires), puis échanges du mailbot avec les chercheurs
export const fetchMailsStep = createStep({
  id: "fetch-mails",
  execute: async ({ inputData }) => {
    const config = mailbotConfig;
    const known = readMessages(config);
    const knownIds = new Set(known.flatMap(m => [m.id, m.messageId].filter(Boolean)));
    // messages envoyés par mailbot (rattachés à leur brouillon)
    const sentDrafts = new Map(listDrafts(config).filter(d => d.sentMessageId).map(d => [d.sentMessageId!, d.id]));

    const added: MailMessage[] = [];
    const errors: string[] = [];
    // boîtes historiques des profils, puis boîte du mailbot ; nombre de nouveaux messages par boîte
    const boxes: MailBox[] = [...config.profiles.map(p => historyBox(p.id)), "bot"];
    const counts: Record<string, number> = {};
    for (const box of boxes) {
      try {
        const list = await fetchBox(config, box, knownIds, sentDrafts);
        counts[box] = list.length;
        added.push(...list);
      } catch (e) {
        // une boîte injoignable n'empêche pas de traiter l'autre ; l'étape échoue si aucune n'a pu être lue
        errors.push((e as Error).message);
        console.warn(`⚠️ [IMAP] ${(e as Error).message}`);
      }
    }
    // échec si aucune des boîtes à lire (celles qui ont des adresses à suivre) n'a pu l'être
    const toRead = boxes.filter(box => boxScope(config, box, process.env).addresses.length).length;
    if (errors.length && errors.length >= toRead) throw new Error(`Aucune boîte mail lisible : ${errors.join(" ; ")}`);
    const all = added.length ? writeMessages(config, added) : known;
    const pj = added.reduce((n, m) => n + m.attachments.length, 0);
    const history = added.filter(m => m.box === "history").length, bot = added.length - history;
    console.log(`🗃️ ${added.length} message(s) ajouté(s) à l'archive locale (historique ${history}, mailbot ${bot} ; ${pj} pièce(s) jointe(s)) ; ${all.length} au total`);
    return { newIds: added.map(m => m.id), history, bot, byBox: counts, total: all.length, attachments: pj, errors, compose: !!(inputData as any)?.compose };
  },
});
