import { Agent } from "@mastra/core/agent";
import { overridable, overridableModel } from "./overrides";
import { workflowConfig } from "../config";

export const EPISTEMOLOGIST_INSTRUCTIONS = `Tu es un relecteur scientifique (peer-reviewer) spécialiste de la modélisation onto-éthique.
  Vérifie l'alignement avec l'appel à propositions et la validité des liens conceptuels.
  Propose des reformulations pour les passages manquant de profondeur critique.`;

// Relecture critique de la proposition d'article
export const epistemologistAgent = new Agent({
  id: "epistemologist-agent",
  name: "Épistémologue Critique",
  instructions: overridable("epistemologist-agent", EPISTEMOLOGIST_INSTRUCTIONS),
  model: overridableModel("epistemologist-agent", () => workflowConfig.models.analytics),
});
