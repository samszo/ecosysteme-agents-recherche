import { createStep } from "@mastra/core/workflows";
import { indexCollectionForRag } from "../../../lib/rag/ragIndex";
import { exploConfig } from "../../../config/explo";

// RAG Albert : dépôt des documents de la collection dans la collection privée Albert de même nom
export const ragIndexStep = createStep({
  id: "rag-index",
  execute: async ({ inputData, getStepResult }) => {
    const literature: any = getStepResult("fetch-literature") ?? inputData ?? {};
    if (!exploConfig.rag.enabled) {
      console.log("⏭️ RAG Albert désactivé : documents non indexés.");
      return { rag: null };
    }
    console.log("⚙️ RAG Albert : indexation des documents...");
    try {
      return { rag: await indexCollectionForRag(literature.articles ?? [], exploConfig.input.zoteroCollection) };
    } catch (e) {
      // l'indexation ne bloque pas l'analyse de l'annotation collective
      console.warn("⚠️ [RAG] Indexation impossible :", (e as Error).message);
      return { rag: { enabled: true, error: (e as Error).message } };
    }
  },
});
