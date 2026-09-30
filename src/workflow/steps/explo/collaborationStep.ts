import { createStep } from "@mastra/core/workflows";
import { analyzeCollaboration } from "../../../tools/analyzeCollaboration";

// Analyse des collaborations (outil exécuté directement)
export const collaborationStep = createStep({
  id: "collaboration",
  execute: async ({ inputData }) => {
    console.log("⚙️ Outil : Analyse des collaborations...");
    return (await analyzeCollaboration.execute({ data: { articles: inputData.articles ?? [] } })) as any;
  },
});
