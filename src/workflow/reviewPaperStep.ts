import { createStep } from "@mastra/core/workflows";
import { epistemologistAgent } from "../agents/epistemologistAgent";

// 6. Critique (Agent)
export const reviewPaperStep = createStep({
  id: "review-paper",
  execute: async ({ inputData }) => {
    console.log("🧠 Agent : Relecture épistémologique...");
    const res = await epistemologistAgent.generate(`Critique cette proposition d'article (PropAPP) au regard des attendus de l'appel à propositions (AttenduAPP).
Vérifie en particulier la réponse à la problématique et aux axes de l'appel, le respect des contraintes formelles, l'usage des références et des citations.

# Attendus de l'appel (AttenduAPP)
${inputData.cfpAnalysis}

# Proposition d'article (PropAPP)
${inputData.draft}`);
    
    return { 
      finalReview: res.text, 
      draft: inputData.draft, 
      proposal: inputData.proposal, 
      conceptGraph: inputData.conceptGraph // graphe final pour la visualisation sigma.js
    };
  }
});
