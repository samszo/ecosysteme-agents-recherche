import { createStep } from "@mastra/core/workflows";
import fs from "fs";
import path from "path";
import { mailbotConfig, profileById, type MailbotProfile } from "../../../config/mailbot";
import { readMessages, writeMessages, type MailMessage, type MessageUpdate } from "../../../lib/mail/store";
import { zoteroClient, zoteroCollectionKey } from "../../../lib/mail/generate";

// marqueur Zotero d'un message : retrouve ce qui a déjà été déposé (idempotence)
const tagOf = (id: string) => `mailbot:${id}`;

// collection cible d'un message : celle de son profil (boîte historique), sinon celle de la boîte du mailbot
const targetOf = (m: MailMessage): string => (m.box === "history" && m.profile ? m.profile : "");

// Zotero : pièces jointes déposées dans la collection du profil ou du mailbot (notice « courriel » parente si zotero.emailItems)
export const zoteroAttachmentsStep = createStep({
  id: "zotero-attachments",
  execute: async () => {
    const config = mailbotConfig;
    const summary = { collections: [] as { key: string; profile: string | null }[], items: 0, files: 0, errors: [] as string[] };
    if (!config.zotero.enabled) {
      console.log("⏭️ Zotero désactivé : pièces jointes non déposées.");
      return summary;
    }
    const todo = readMessages(config).filter(m => m.attachments.length && !m.zoteroKey);
    if (!todo.length) {
      console.log("📚 [ZOTERO] Aucune pièce jointe à déposer.");
      return summary;
    }
    const groups = new Map<string, MailMessage[]>();
    for (const m of todo) groups.set(targetOf(m), [...(groups.get(targetOf(m)) ?? []), m]);
    const zotero = zoteroClient();
    const maxBytes = config.zotero.maxAttachmentMb * 1024 * 1024;
    const updates: MessageUpdate[] = [];
    for (const [target, messages] of groups) {
      const profile: MailbotProfile | null = target ? profileById(config, target) : null;
      try {
        const collection = await zoteroCollectionKey(zotero, config, profile, true);
        if (!collection) throw new Error("collection Zotero introuvable");
        summary.collections.push({ key: collection, profile: profile?.id ?? null });
        // notices déjà déposées, par marqueur
        const byTag = new Map<string, string>();
        for (const it of await zotero.collectionItems(collection)) for (const t of it.data?.tags ?? []) if (String(t.tag).startsWith("mailbot:")) byTag.set(t.tag, it.data?.parentItem || it.key);
        console.log(`📚 [ZOTERO] Dépôt des pièces jointes de ${messages.length} message(s) dans la collection ${collection} (${profile ? `profil ${profile.id}` : "boîte du mailbot"})...`);
        for (const m of messages) {
          const tag = tagOf(m.id);
          try {
            if (byTag.has(tag)) { updates.push({ id: m.id, zoteroKey: byTag.get(tag)! }); continue; }
            let parent: string | undefined;
            if (config.zotero.emailItems) {
              [parent] = await zotero.createItems([{
                itemType: "email",
                subject: m.subject || "(sans sujet)",
                creators: [
                  { creatorType: "author", name: m.from.name || m.from.address },
                  ...m.to.map(t => ({ creatorType: "recipient", name: t.name || t.address })),
                ],
                date: m.date.slice(0, 10),
                abstractNote: m.text.slice(0, 10000),
                collections: [collection],
                tags: [{ tag }],
                extra: `Message-ID: ${m.messageId}`,
              }]);
              summary.items++;
            }
            const attachments = [];
            for (const a of m.attachments) {
              if (a.zoteroKey) continue;
              if (a.size > maxBytes) { console.warn(`   ⚠️ ${a.fileName} dépasse ${config.zotero.maxAttachmentMb} Mo : non déposé`); continue; }
              const key = await zotero.uploadAttachment({
                buffer: fs.readFileSync(path.resolve(process.cwd(), a.path)), fileName: a.fileName, contentType: a.contentType,
                ...(parent ? { parentItem: parent } : { collection, tags: [tag] }),
              });
              attachments.push({ sha1: a.sha1, fileName: a.fileName, zoteroKey: key });
              summary.files++;
            }
            updates.push({ id: m.id, zoteroKey: parent ?? attachments[0]?.zoteroKey ?? null, ...(attachments.length ? { attachments } : {}) });
          } catch (e) {
            summary.errors.push(`${m.subject} : ${(e as Error).message}`);
            console.warn(`   ⚠️ Pièces jointes de « ${m.subject} » non déposées :`, (e as Error).message);
          }
        }
      } catch (e) {
        // Zotero indisponible ou clé sans droit d'écriture : reprise à l'exécution suivante
        summary.errors.push((e as Error).message);
        console.warn("⚠️ [ZOTERO] Dépôt impossible :", (e as Error).message);
      }
    }
    if (updates.length) writeMessages(config, updates);
    console.log(`📚 [ZOTERO] ${summary.items} notice(s) courriel, ${summary.files} fichier(s) déposé(s)`);
    return summary;
  },
});
