import { Agent } from "@mastra/core/agent";
import { ALBERT_MODEL_ANALYTICS } from "../config/models";

export const epistemologistAgent = new Agent({
  name: "Épistémologue Critique",
  instructions: `Tu es un relecteur scientifique (peer-reviewer) spécialiste de la modélisation onto-éthique.
  Vérifie l'alignement avec l'appel à propositions et la validité des liens conceptuels.
  Propose des reformulations pour les passages manquant de profondeur critique.`,
  model: ALBERT_MODEL_ANALYTICS,
});
