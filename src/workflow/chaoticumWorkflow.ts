import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { materialStep } from "./steps/chaoticum/materialStep";
import { composeStep } from "./steps/chaoticum/composeStep";
import { chaoticumConfig } from "../config/chaoticum";

// chaoticumSeminario : matière tirée au hasard (citations Zotero, diapos ConfErrance), puis questions et diagrammes
export const chaoticumWorkflow = createWorkflow({
  id: chaoticumConfig.workflowId,
  inputSchema: z.object({ seed: z.string() }),
} as any)
  .then(materialStep)
  .then(composeStep)
  .commit();
