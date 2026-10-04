import { Agent } from "@mastra/core/agent";
import { albertModel } from "../config/models";
import { workflowConfig } from "../config";

// Correcteur des textes affichés à l'écran (chaoticumSeminario) : raccourcit une question trop longue (modèle rapide)
export const editorAgent = new Agent({
  id: "editor-agent",
  name: "Correcteur d'écran",
  instructions: `Tu raccourcis des questions destinées à être projetées sur un grand écran : 15 mots au plus, sans en perdre
  le sens ni le ton. Tu réponds uniquement par la question raccourcie, sans guillemets ni commentaire.`,
  model: ({ requestContext }: any) => albertModel(requestContext?.get?.("model") ?? workflowConfig.models.fast),
});
