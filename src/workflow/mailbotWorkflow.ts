import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { fetchMailsStep } from "./steps/mailbot/fetchMailsStep";
import { archiveOmekaStep } from "./steps/mailbot/archiveOmekaStep";
import { zoteroAttachmentsStep } from "./steps/mailbot/zoteroAttachmentsStep";
import { mailRagIndexStep } from "./steps/mailbot/mailRagIndexStep";
import { draftRepliesStep } from "./steps/mailbot/draftRepliesStep";
import { composeMailStep } from "./steps/mailbot/composeMailStep";
import { mailbotConfig } from "../config/mailbot";

// mailbot : lecture de la boîte mail, puis archivage Omeka S, pièces jointes dans Zotero et indexation RAG en parallèle,
// brouillons de réponse contradictoire aux nouveaux mails, et mail à l'initiative de mailbot (tâche « envoi »)
export const mailbotWorkflow = createWorkflow({
  id: mailbotConfig.workflowId,
  inputSchema: z.object({ compose: z.boolean().optional() }),
} as any)
  .then(fetchMailsStep)
  .parallel([archiveOmekaStep, zoteroAttachmentsStep, mailRagIndexStep])
  .then(draftRepliesStep)
  .then(composeMailStep)
  .commit();
