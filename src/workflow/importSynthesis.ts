// Import de documents (synthèses, AttenduAPP, PropAPP…) comme médias d'un item Omeka
import fs from "fs/promises";
import path from "path";
import { getOmk } from "../tools/omk";
import { getZoteroCollections } from "../tools/zoteroCollections";

export interface SynthesisDocument {
  filePath: string;
  title: string;
  type?: string;
}

// documents de synthèse (relecture, graphe, rapport…) dans l'item de la collection Zotero
export async function importSynthesis(zoteroCollection: string, documents: SynthesisDocument[], runId: string, configItemId: number | null) {
  const collectionItemId = await (await getZoteroCollections()).itemId(zoteroCollection);
  console.log(`\n📤 [OMEKA] Import des documents de synthèse dans la collection (Item ID ${collectionItemId})...`);
  return attachDocuments(collectionItemId, documents, runId, configItemId);
}

// dépose chaque document comme média de l'item, daté et relié à la configuration de l'exécution
export async function attachDocuments(itemId: number, documents: SynthesisDocument[], runId: string, configItemId: number | null) {
  const omk = await getOmk();
  const now = new Date().toISOString();
  const mediaIds: number[] = [];
  for (const doc of documents) {
    try {
      const buffer = await fs.readFile(doc.filePath);
      const ext = path.extname(doc.filePath);
      const media = await omk.uploadMedia(
        itemId,
        { buffer, fileName: `${path.basename(doc.filePath, ext)}_${now.replace(/[:.]/g, "-")}${ext}`, type: doc.type ?? "text/markdown" },
        {
          "dcterms:title": `${doc.title} – ${now}`,
          "dcterms:date": now,
          "dcterms:identifier": `${runId}/${path.basename(doc.filePath)}`,
          // lien vers la configuration de l'exécution qui a produit le document
          ...(configItemId ? { "dcterms:relation": { rid: configItemId } } : {}),
        }
      );
      mediaIds.push(media["o:id"]);
      console.log(`   ✅ ${doc.title} importé (Media ID ${media["o:id"]})`);
    } catch (e) {
      console.warn(`   ⚠️ Import de ${doc.filePath} impossible :`, (e as Error).message);
    }
  }
  return mediaIds;
}
