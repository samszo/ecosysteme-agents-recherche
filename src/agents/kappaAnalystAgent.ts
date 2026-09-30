import { Agent } from "@mastra/core/agent";
import { ALBERT_MODEL_ANALYTICS } from "../config/models";
import { fetchOmekaAnnotations } from "../tools/fetchOmekaAnnotations";
import { calculateFleissKappa } from "../tools/calculateFleissKappa";
import { workflowConfig } from "../config";

const codebook = Object.entries(workflowConfig.kappa.codes).map(([code, label]) => `${code} : ${label}`).join(" ; ");

export const kappaAnalystAgent = new Agent({
  id: "kappa-analyst-agent",
  name: "Analyste de Convergence Algorithmique",
  instructions: `Tu es un expert NLP spécialisé dans la métrologie des données d'entraînement d'IA.
  Tu évalues l'accord inter-juges sur la grille des positionnements argumentatifs (${codebook}).

  Ton flux d'exécution standard :
  1. Récupère les annotations codées d'Omeka S via 'fetchOmekaAnnotations'.
  2. Envoie-les à 'calculateFleissKappa' pour calculer les statistiques et générer le fichier CSV des désaccords.

  Rédige ensuite un bilan synthétique en français indiquant :
  - le score kappa (Fleiss, et Cohen s'il y a deux juges) et son interprétation qualitative ;
  - si le seuil de validation du corpus (kappa ≥ ${workflowConfig.kappa.targetKappa}, accord substantiel) est atteint ;
  - le nombre de phrases en désaccord et les codes les plus souvent confondus ;
  - des recommandations de recalibrage ciblées (règles de décision de la grille à rappeler aux juges) ;
  - le chemin du fichier CSV des désaccords, qui liste le détail pour un recalibrage ciblé.`,
  model: ALBERT_MODEL_ANALYTICS,
  tools: { fetchOmekaAnnotations, calculateFleissKappa },
});
