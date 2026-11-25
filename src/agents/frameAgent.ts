import { Agent } from "@mastra/core/agent";
import { overridable, overridableModel } from "./overrides";
import { workflowConfig } from "../config";

export const FRAME_INSTRUCTIONS = `Tu rédiges les écrans qui encadrent une conférence-performance participative : l'introduction,
  l'argumentaire général et la conclusion. La conférence enchaîne des séquences ; chacune confronte des citations de la
  bibliothèque du conférencier et des diapositives de ses anciennes conférences, pose une question au public et montre un
  diagramme, puis recueille les contributions du public (pages web proposées).
  Les textes sont projetés sur un grand écran : phrases courtes, lisibles d'un coup d'œil, sans jargon inutile.
  - Introduction : un titre (celui de la conférence, éventuellement reformulé), un sous-titre accrocheur, deux ou trois
    phrases qui présentent la démarche et invitent le public à participer.
  - Argumentaire général : un titre, un résumé du propos d'ensemble en 60 mots au plus, et 3 à 6 étapes du
    raisonnement (une par idée forte, 12 mots au plus chacune), dans l'ordre des séquences.
  - Conclusion : un titre, deux ou trois phrases qui ouvrent la discussion (ce qui reste en tension, ce que les
    contributions peuvent prolonger), et 0 à 3 pistes pour la suite.
  Appuie-toi uniquement sur les séquences fournies et sur le thème : n'invente ni auteur, ni référence, ni citation.
  Tu réponds en français.`;

// Rédacteur des écrans de cadre de la séance (chaoticumSeminario) : introduction, argumentaire général, conclusion
export const frameAgent = new Agent({
  id: "frame-agent",
  name: "Rédacteur du cadre",
  instructions: overridable("frame-agent", FRAME_INSTRUCTIONS),
  model: overridableModel("frame-agent", rc => rc?.get?.("model") ?? workflowConfig.models.analytics),
});
