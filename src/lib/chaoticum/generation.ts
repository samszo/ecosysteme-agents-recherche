// Éléments communs de génération : schéma du diagramme (nœuds et liens), questions courtes
import { z } from "zod";
import { editorAgent } from "../../agents/editorAgent";
import { askAgent } from "../../agents/ask";

export const diagramFields = {
  diagramTitle: z.string().describe("titre court du diagramme"),
  nodes: z.array(z.object({
    id: z.string().describe("identifiant court sans espace (ex. C1, D1, idee1)"),
    label: z.string().describe("libellé court, 6 mots au plus"),
  })).describe("6 à 14 idées issues des citations, des diapos et du thème"),
  edges: z.array(z.object({
    from: z.string().describe("identifiant du nœud de départ"),
    to: z.string().describe("identifiant du nœud d'arrivée"),
    label: z.string().optional().describe("relation en 1 à 3 mots (facultatif)"),
  })).describe("liens entre les idées"),
};

export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// question trop longue pour un grand écran : reformulée en 15 mots au plus (agent correcteur, modèle rapide)
export async function shortenQuestion(question: string, model: string) {
  if (words(question) <= 15) return question;
  try {
    const short = await askAgent(editorAgent, { model, source: "Raccourcissement des questions (editorAgent)", prompt: question });
    const t = short.text.trim().replace(/^["«\s]+|["»\s]+$/g, "");
    return t && words(t) < words(question) ? t : question;
  } catch {
    return question;
  }
}
