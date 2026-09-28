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

// documents de fin d'analyse (relecture, graphe, rapport, désaccords…) dans l'item « Configuration » de l'exécution ;
// si la configuration n'a pas pu être enregistrée, repli sur l'item de la collection Zotero
export async function importSynthesis(zoteroCollection: string, documents: SynthesisDocument[], runId: string, configItemId: number | null) {
  if (configItemId) {
    console.log(`\n📤 [OMEKA] Import des documents de fin d'analyse dans la configuration de l'exécution (Item ID ${configItemId})...`);
    return attachDocuments(configItemId, documents, runId, null);
  }
  const collectionItemId = await (await getZoteroCollections()).itemId(zoteroCollection);
  console.warn(`\n⚠️ [OMEKA] Configuration de l'exécution non enregistrée : documents importés dans la collection (Item ID ${collectionItemId})...`);
  return attachDocuments(collectionItemId, documents, runId, null);
}

// refus d'Omeka S pour un type ou une extension non autorisés (Admin › Paramètres › Sécurité)
const refusedExtension = (msg: string) => /Cannot store files with the resolved extension/i.test(msg);
const refusedMediaType = (msg: string) => /Cannot store files with the media type/i.test(msg);

// dépose chaque document comme média de l'item, daté et relié à la configuration de l'exécution
export async function attachDocuments(itemId: number, documents: SynthesisDocument[], runId: string, configItemId: number | null) {
  const omk = await getOmk();
  const now = new Date().toISOString();
  const mediaIds: number[] = [];
  for (const doc of documents) {
    try {
      const buffer = await fs.readFile(doc.filePath);
      const ext = path.extname(doc.filePath);
      const type = doc.type ?? "text/markdown";
      const base = `${path.basename(doc.filePath, ext)}_${now.replace(/[:.]/g, "-")}`;
      const metadata = {
        "dcterms:title": `${doc.title} – ${now}`,
        "dcterms:date": now,
        "dcterms:identifier": `${runId}/${path.basename(doc.filePath)}`,
        "dcterms:format": type,
        // lien vers la configuration de l'exécution qui a produit le document
        ...(configItemId ? { "dcterms:relation": { rid: configItemId } } : {}),
      };
      let media: any;
      try {
        media = await omk.uploadMedia(itemId, { buffer, fileName: base + ext, type }, metadata);
      } catch (e) {
        const msg = (e as Error).message;
        // extension refusée mais type de contenu accepté : nouvel essai en .txt (format d'origine dans dcterms:format)
        if (!refusedExtension(msg) || refusedMediaType(msg)) throw e;
        media = await omk.uploadMedia(itemId, { buffer, fileName: `${base}${ext}.txt`, type: "text/plain" }, metadata);
        console.log(`   ℹ️ Extension ${ext} non autorisée par Omeka S : ${doc.title} importé en .txt`);
      }
      mediaIds.push(media["o:id"]);
      console.log(`   ✅ ${doc.title} importé (Media ID ${media["o:id"]})`);
    } catch (e) {
      const msg = (e as Error).message;
      if (refusedExtension(msg) || refusedMediaType(msg)) {
        const ext = path.extname(doc.filePath).slice(1);
        console.warn(`   ⚠️ ${doc.title} non importé : Omeka S refuse ce type de fichier. Pour l'accepter, ajouter l'extension « ${ext} »` +
          `${refusedMediaType(msg) ? ` et le type « ${doc.type ?? "text/markdown"} »` : ""} dans Admin › Paramètres › Sécurité. Le fichier reste disponible localement (${doc.filePath}).`);
      } else {
        console.warn(`   ⚠️ Import de ${doc.filePath} impossible :`, msg);
      }
    }
  }
  return mediaIds;
}
