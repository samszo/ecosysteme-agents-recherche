import { Agent } from "@mastra/core/agent";
import { ALBERT_MODEL_FAST } from "../models";
import { fetchZoteroData } from "../tools/fetchZoteroData";

export const librarianAgent = new Agent({
  name: "Bibliothécaire",
  instructions: `Tu es un documentaliste scientifique. 
  Utilise l'outil Zotero pour récupérer la littérature pertinente. 
  Filtre les articles en fonction du bruit, résume leurs abstracts et prépare les textes intégraux.`,
  model: ALBERT_MODEL_FAST,
  tools: { fetchZoteroData }
});
