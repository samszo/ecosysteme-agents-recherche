import { createStep } from "@mastra/core/workflows";
import { computeParticipation } from "../../../tools/computeParticipation";

// Participation des collaborateurs (outil exécuté directement)
export const participationStep = createStep({
  id: "participation",
  execute: async ({ inputData }) => {
    console.log("⚙️ Outil : Participation des collaborateurs...");
    return (await computeParticipation.execute({ data: { articles: inputData.articles ?? [] } })) as any;
  },
});
