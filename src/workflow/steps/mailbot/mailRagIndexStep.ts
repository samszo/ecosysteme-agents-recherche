import { createStep } from "@mastra/core/workflows";
import fs from "fs";
import path from "path";
import { collectionNames, mailbotConfig, profileById } from "../../../config/mailbot";
import { chunkMetadata } from "../../../lib/albert/albert";
import { estimateTokens } from "../../../lib/rag/ragIndex";
import { recordUsage } from "../../../lib/metrics/usage";
import { extractAttachment } from "../../../lib/extraction/attachmentExtract";
import { albertClient } from "../../../lib/mail/generate";
import { messageMarkdown, readMessages, writeMessages, type MailMessage, type MessageUpdate } from "../../../lib/mail/store";

// taille maximale d'un document déposé (Albert : 20 Mo)
const MAX_CHARS = 5_000_000;
const docName = (prefix: string, title: string) => `${prefix} ${title.replace(/[\\/:*?"<>|\s]+/g, " ").trim().slice(0, 100) || "sans titre"}.md`;
const idOfName = (name: string) => /^((?:mail|pj)-[\w-]+)(?=[\s.]|$)/.exec(name)?.[1] ?? null;
// collection cible : celle du profil (boîte historique), sinon celle de la boîte du mailbot
const targetOf = (m: MailMessage): string => (m.box === "history" && m.profile ? m.profile : "");

// RAG Albert : chaque message et le texte de chaque pièce jointe dans la collection privée de son profil, ou du mailbot
export const mailRagIndexStep = createStep({
  id: "mail-rag-index",
  execute: async () => {
    const config = mailbotConfig;
    const summary = { collections: [] as { id: number; name: string; profile: string | null }[], messages: 0, attachments: 0, present: 0, withoutText: 0, estimatedTokens: 0, errors: [] as string[] };
    if (!config.rag.enabled) {
      console.log("⏭️ RAG Albert désactivé : messages non indexés.");
      return summary;
    }
    const todo = readMessages(config).filter(m => !m.albertDocumentId || m.attachments.some(a => !a.albertDocumentId && a.textLength !== 0));
    if (!todo.length) {
      console.log("🔎 [RAG] Aucun message à indexer.");
      return summary;
    }
    const groups = new Map<string, MailMessage[]>();
    for (const m of todo) groups.set(targetOf(m), [...(groups.get(targetOf(m)) ?? []), m]);
    const updates: MessageUpdate[] = [];
    let albert;
    try { albert = albertClient(); }
    catch (e) {
      console.warn("⚠️ [RAG] Indexation impossible :", (e as Error).message);
      summary.errors.push((e as Error).message);
      return summary;
    }
    for (const [target, messages] of groups) {
      const profile = target ? profileById(config, target) : null;
      const name = collectionNames(config, profile).rag;
      try {
        const description = profile ? `Historique mail de ${profile.researcher.email || profile.id} – mailbot` : "Échanges de la boîte du mailbot – mailbot";
        const { collection, created } = await albert.ensureCollection(name, description);
        summary.collections.push({ id: collection.id, name, profile: profile?.id ?? null });
        // documents déjà présents (préfixe stable mail-<id> / pj-<id>-<empreinte>)
        const present = new Map<string, number>();
        if (!created) for (const d of await albert.documents(collection.id)) { const id = idOfName(d.name); if (id) present.set(id, d.id); }
        console.log(`🔎 [RAG] Indexation de ${messages.length} message(s) dans la collection Albert « ${name} » (${collection.id})...`);
        const upload = async (key: string, title: string, markdown: string, meta: Record<string, string | number>) => {
          if (present.has(key)) { summary.present++; return present.get(key)!; }
          const text = markdown.slice(0, MAX_CHARS);
          const id = await albert.createDocument({
            collectionId: collection.id, content: text, fileName: docName(key, title), name: docName(key, title),
            chunkSize: config.rag.chunkSize, chunkOverlap: config.rag.chunkOverlap, presetSeparators: "markdown",
            metadata: chunkMetadata({ ...meta, title }),
          });
          summary.estimatedTokens += estimateTokens(text);
          return id;
        };
        for (const m of messages) {
          try {
            const u: MessageUpdate = { id: m.id };
            const meta = { message_id: m.id, box: m.box, profile: m.profile ?? "", date: m.date.slice(0, 10), direction: m.direction, from: m.from.address };
            if (!m.albertDocumentId) {
              u.albertDocumentId = await upload(`mail-${m.id}`, m.subject || "(sans sujet)", messageMarkdown(m), { ...meta, kind: "mail" });
              summary.messages++;
            }
            const attachments = [];
            for (const a of m.attachments) {
              if (a.albertDocumentId || a.textLength === 0) continue;
              const key = `pj-${m.id}-${a.sha1.slice(0, 8)}`;
              let id = present.get(key) ?? null;
              let textLength = a.textLength;
              if (!id) {
                const extracted = await extractAttachment(fs.readFileSync(path.resolve(process.cwd(), a.path)), a.contentType, a.fileName).catch(() => null);
                textLength = extracted?.text.trim().length ?? 0;
                if (!textLength) { summary.withoutText++; attachments.push({ sha1: a.sha1, fileName: a.fileName, textLength: 0 }); continue; }
                const md = `# ${a.fileName}\n\nPièce jointe du mail « ${m.subject} » (${m.date.slice(0, 10)}, ${m.from.address}).\n\n${extracted!.text}\n`;
                id = await upload(key, a.fileName, md, { ...meta, kind: "piece-jointe" });
                summary.attachments++;
              } else summary.present++;
              attachments.push({ sha1: a.sha1, fileName: a.fileName, albertDocumentId: id, ...(textLength ? { textLength } : {}) });
            }
            if (attachments.length) u.attachments = attachments;
            updates.push(u);
          } catch (e) {
            summary.errors.push(`${m.subject} : ${(e as Error).message}`);
            console.warn(`   ⚠️ Message « ${m.subject} » non indexé :`, (e as Error).message);
          }
        }
      } catch (e) {
        // Albert indisponible : reprise à l'exécution suivante
        console.warn(`⚠️ [RAG] Collection « ${name} » : indexation impossible :`, (e as Error).message);
        summary.errors.push((e as Error).message);
      }
    }
    if (updates.length) writeMessages(config, updates);
    // coût de la vectorisation (estimation : 4 caractères par token)
    if (summary.estimatedTokens) recordUsage("Indexation RAG mailbot (vectorisation)", config.rag.embeddingsModel, { inputTokens: summary.estimatedTokens });
    console.log(`🔎 [RAG] ${summary.messages} message(s) et ${summary.attachments} pièce(s) jointe(s) indexé(s), ${summary.present} déjà présent(s), ${summary.withoutText} pièce(s) sans texte`);
    return summary;
  },
});
