import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { fetchLiteratureStep } from "./steps/common/fetchLiteratureStep";
import { participationStep } from "./steps/explo/participationStep";
import { collaborationStep } from "./steps/explo/collaborationStep";
import { themesStep } from "./steps/explo/themesStep";
import { exploConfig } from "../config/explo";

// exploZoteroAnno : récupération Zotero (réutilisée, avec enregistrement Omeka), participation et collaborations
// en parallèle, puis thèmes de discussion
export const exploWorkflow = createWorkflow({
  id: exploConfig.workflowId,
  inputSchema: z.object({ zoteroCollection: z.string() }),
} as any)
  .then(fetchLiteratureStep)
  .parallel([participationStep, collaborationStep])
  .then(themesStep)
  .commit();
