import { createStep } from "@mastra/core/workflows";
import { fetchZoteroData } from "../../../tools/fetchZoteroData";

// 2. Tuyauterie pure (Exécution directe de l'outil Zotero, sans LLM)
export const fetchLiteratureStep = createStep({
  id: "fetch-literature",
  execute: async ({ inputData }) => {
    console.log("⚙️ Outil : Connexion Zotero...");
    // On appelle la fonction métier de l'outil directement !
    // mergeDuplicates : exploZoteroAnno fusionne les exemplaires d'un même document (l'Atelier ne le demande pas)
    const result = await fetchZoteroData.execute({
      data: { collectionId: inputData.zoteroCollection, mergeDuplicates: !!inputData.mergeDuplicates }
    });
    
    // On propage le vrai tableau d'articles bruts, pas un résumé LLM
    return { articles: result.articles, collectionItemId: result.collectionItemId };
  }
});
