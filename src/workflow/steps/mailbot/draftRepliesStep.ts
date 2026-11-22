import { createStep } from "@mastra/core/workflows";
import { addressList, mailbotConfig } from "../../../config/mailbot";
import { readDraft, readMessages, saveDraft, threadOf, type MailDraft } from "../../../lib/mail/store";
import { draftReply, notifyAdmin } from "../../../lib/mail/generate";

// Brouillons de réponse contradictoire aux mails récents reçus par le mailbot d'une adresse autorisée et restés sans
// réponse (validés ensuite par l'administrateur)
export const draftRepliesStep = createStep({
  id: "draft-replies",
  execute: async ({ runId }) => {
    const config = mailbotConfig;
    if (!config.reply.enabled) {
      console.log("⏭️ Réponses désactivées.");
      return { drafts: [] as { id: string; subject: string }[], skipped: 0, errors: [] as string[] };
    }
    const all = readMessages(config);
    const allowed = new Set(addressList(config.bot.allowed));
    const botMessages = all.filter(m => m.box === "bot");
    const limit = new Date(Date.now() - config.reply.maxAgeDays * 86400_000).toISOString();
    // sans réponse : aucun message envoyé par le mailbot après lui dans le même fil
    const answered = (m: (typeof all)[number]) => threadOf(m, botMessages).some(x => x.direction === "sortant" && x.date > m.date)
      || botMessages.some(x => x.direction === "sortant" && x.date > m.date && (x.inReplyTo === m.messageId || x.references.includes(m.messageId)));
    const candidates = botMessages.filter(m => m.direction === "entrant" && allowed.has(m.from.address) && m.date >= limit && !readDraft(config, `rep-${m.id}`) && !answered(m));
    if (!candidates.length) {
      console.log(`✉️ Aucun nouveau mail d'une adresse autorisée à traiter (moins de ${config.reply.maxAgeDays} jour(s), sans réponse${allowed.size ? "" : " ; liste des adresses autorisées vide"}).`);
      return { drafts: [], skipped: 0, errors: [] };
    }
    console.log(`✉️ ${candidates.length} mail(s) reçu(s) par le mailbot en attente de réponse : rédaction des brouillons...`);
    const created: MailDraft[] = [];
    const errors: string[] = [];
    for (const m of candidates) {
      try {
        const draft = await draftReply({ message: m, all, config, runId: runId ?? null });
        created.push(saveDraft(config, draft, "création"));
        console.log(`   📝 Brouillon « ${draft.subject} » en attente de validation`);
      } catch (e) {
        errors.push(`${m.subject} : ${(e as Error).message}`);
        console.warn(`   ⚠️ Brouillon pour « ${m.subject} » non rédigé :`, (e as Error).message);
      }
    }
    await notifyAdmin(created, config);
    return { drafts: created.map(d => ({ id: d.id, subject: d.subject })), skipped: 0, errors };
  },
});
