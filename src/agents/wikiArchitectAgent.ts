import { Agent } from "@mastra/core/agent";
import { ALBERT_MODEL_ANALYTICS } from "../config/models";
import { buildLLMWiki } from "../tools/buildLLMWiki";

export const wikiArchitectAgent = new Agent({
  name: "Architecte des Connaissances",
  instructions: `Tu es spécialisé en design des connaissances. 
  Prends les données brutes du Bibliothécaire et les directives de l'Analyste AAP. 
  Construis un index sémantique. Identifie les controverses et mappe les concepts clés.`,
  model: ALBERT_MODEL_ANALYTICS,
  tools: { buildLLMWiki }
});
