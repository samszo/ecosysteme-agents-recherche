import { Agent } from "@mastra/core/agent";
import { ALBERT_MODEL_ANALYTICS } from "../config/models";
import { exportToOpenKnowledge } from "../tools/exportToOpenKnowledge";

export const ontologistAgent = new Agent({
  name: "Ontologue des Connaissances",
  instructions: `Prends le graphe de concepts brut généré par l'Architecte. 
  Mappe ces concepts sur des vocabulaires standards du web sémantique. 
  Prépare les métadonnées pour un export Open Knowledge Format / JSON-LD.`,
  model: ALBERT_MODEL_ANALYTICS,
  tools: { exportToOpenKnowledge }
});
