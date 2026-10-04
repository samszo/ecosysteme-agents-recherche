import { Agent } from "@mastra/core/agent";
import { albertModel } from "../config/models";
import { workflowConfig } from "../config";

// Description des diapos de conférence à partir de leur copie d'écran (modèle de vision ; chaoticumSeminario)
// Le modèle est celui de la configuration (contexte de requête « model »), par défaut le modèle rapide.
export const slideDescriberAgent = new Agent({
  id: "slide-describer-agent",
  name: "Descripteur de diapositives",
  instructions: `Tu décris des diapositives de conférences de recherche (sciences de l'information et de la communication,
  humanités numériques, intelligence artificielle) à partir de leur copie d'écran, en français.
  - Titre : le titre visible de la diapositive ; à défaut, son idée principale en quelques mots. Jamais de titre générique
    comme « Analyse de la diapositive », « Description de la diapositive » ou « Diapositive ».
  - Mots-clés : 5 à 10 notions, auteurs ou objets montrés.
  - Description : 120 mots au plus, avec les textes lisibles, les schémas et les relations qu'ils montrent, l'idée principale.
  Ne décris que ce qui est visible ; n'invente ni texte ni auteur.`,
  model: ({ requestContext }: any) => albertModel(requestContext?.get?.("model") ?? workflowConfig.models.fast),
});
