import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { workflowConfig } from "../config";
import { analyzeCfpStep } from "./analyzeCfpStep";
import { fetchLiteratureStep } from "./fetchLiteratureStep";
import { buildWikiStep } from "./buildWikiStep";
import { kappaAnalysisStep } from "./kappaAnalysisStep";
import { normalizeOkfStep } from "./normalizeOkfStep";
import { draftPaperStep } from "./draftPaperStep";
import { reviewPaperStep } from "./reviewPaperStep";

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
