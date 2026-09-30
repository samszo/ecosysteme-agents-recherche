import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { workflowConfig } from "../config";
import { analyzeCfpStep } from "./steps/paper/analyzeCfpStep";
import { fetchLiteratureStep } from "./steps/common/fetchLiteratureStep";
import { buildWikiStep } from "./steps/paper/buildWikiStep";
import { kappaAnalysisStep } from "./steps/paper/kappaAnalysisStep";
import { normalizeOkfStep } from "./steps/paper/normalizeOkfStep";
import { draftPaperStep } from "./steps/paper/draftPaperStep";
import { reviewPaperStep } from "./steps/paper/reviewPaperStep";

// Assemblage
export const paperProductionWorkflow = createWorkflow({
  id: workflowConfig.workflowId,
  inputSchema: z.object({ cfpUrl: z.string().optional(), cfpFile: z.string().optional(), cfpText: z.string(), zoteroCollection: z.string() })
})
  .parallel([analyzeCfpStep, fetchLiteratureStep])
  // graphe de concepts et accord inter-juges en parallèle, après la récupération Zotero
  .parallel([buildWikiStep, kappaAnalysisStep])
  .then(normalizeOkfStep)
  .then(draftPaperStep)
  .then(reviewPaperStep)
  .commit();
