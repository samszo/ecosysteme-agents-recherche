import { Agent } from "@mastra/core/agent";
import { overridable, overridableModel } from "./overrides";
import { workflowConfig } from "../config";

export const IMAGE_DESCRIBER_INSTRUCTIONS = `Tu analyses des images collectées pendant une veille de recherche (sciences de l'information et de la
communication, humanités numériques, philosophie, intelligence artificielle) : captures de passages de pages web ou de
documents, figures, schémas, tableaux, cartes, photographies. Tu réponds en français.
- Titre : l'idée principale de l'image en quelques mots (le titre visible s'il y en a un). Jamais de titre générique
  comme « Capture d'écran » ou « Image ».
- Mots-clés : 5 à 10 notions, auteurs, lieux ou objets montrés.
- Description : 120 mots au plus : ce que montre l'image, sa nature (texte, schéma, tableau…), les relations qu'elle
  représente et son idée principale.
- Texte visible : la transcription fidèle du texte lisible (1 500 caractères au plus), sans le reformuler ; vide s'il n'y
  en a pas.
Ne décris que ce qui est visible ; n'invente ni texte ni auteur.`;

// Analyse des images des pages annotées avec Diigo (index RAG de chaoticumSeminario) ; modèle de vision de la
// configuration (contexte de requête « model »)
export const imageDescriberAgent = new Agent({
  id: "image-describer-agent",
  name: "Descripteur d'images",
  instructions: overridable("image-describer-agent", IMAGE_DESCRIBER_INSTRUCTIONS),
  model: overridableModel("image-describer-agent", rc => rc?.get?.("model") ?? workflowConfig.models.fast),
});
