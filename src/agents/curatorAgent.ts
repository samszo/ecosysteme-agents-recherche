import { Agent } from "@mastra/core/agent";
import { albertModel } from "../config/models";
import { workflowConfig } from "../config";

// Curateur de la conférence (chaoticumSeminario) : requêtes de recherche dans les index RAG à partir du thème de la
// conférence, et choix des citations et présentations les plus proches de ce thème
export const curatorAgent = new Agent({
  id: "curator-agent",
  name: "Curateur de conférence",
  instructions: `Tu prépares une conférence-performance participative à partir de la bibliothèque du conférencier
  (citations surlignées, notes) et de ses anciennes présentations (diapositives).
  Selon la demande :
  - tu formules des requêtes de recherche de 5 à 12 mots, chacune sur une facette différente du thème de la conférence,
    de la plus générale à la plus singulière ;
  - tu choisis, parmi des candidats numérotés, ceux qui sont le plus en rapport avec le thème, en variant les idées
    et les auteurs, et tu réponds par leurs numéros dans l'ordre de pertinence.
  Tu t'appuies sur le titre, la description et le programme de la conférence. Tu n'inventes rien. Tu réponds en français.`,
  model: ({ requestContext }: any) => albertModel(requestContext?.get?.("model") ?? workflowConfig.models.analytics),
});
