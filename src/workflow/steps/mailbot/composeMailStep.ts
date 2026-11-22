import { createStep } from "@mastra/core/workflows";
import { mailbotConfig } from "../../../config/mailbot";
import { listDrafts, readMessages, saveDraft } from "../../../lib/mail/store";
import { composeMail, notifyAdmin, sendDraft } from "../../../lib/mail/generate";

// Mail à l'initiative de mailbot (tâche planifiée « envoi ») : envoyé directement, ou brouillon si compose.requireApproval
export const composeMailStep = createStep({
  id: "compose-mail",
  execute: async ({ getStepResult, runId }) => {
    const fetched: any = getStepResult("fetch-mails") ?? {};
    if (!fetched.compose) return { composed: false };
    const config = mailbotConfig;
    // références déjà citées dans les mails précédents : les moins utilisées sont proposées d'abord
    const used: Record<string, number> = {};
    for (const d of listDrafts(config)) if (d.kind === "initiative" && d.status === "envoyé") for (const z of d.sources?.zotero ?? []) used[z.key] = (used[z.key] ?? 0) + 1;
    const draft = saveDraft(config, await composeMail({ all: readMessages(config), config, runId: runId ?? null, usedRefs: used }), "création");
    if (config.compose.requireApproval) {
      console.log(`📝 Mail « ${draft.subject} » en attente de validation`);
      await notifyAdmin([draft], config);
      return { composed: true, draft: { id: draft.id, subject: draft.subject, status: draft.status } };
    }
    // échec de l'envoi : l'étape échoue (le brouillon reste visible avec son erreur et peut être renvoyé)
    const sent = await sendDraft(draft, config);
    return { composed: true, draft: { id: sent.id, subject: sent.subject, status: sent.status } };
  },
});
