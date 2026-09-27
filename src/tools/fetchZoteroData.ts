import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import path from "path";
import { getOmk } from "./omk";
import type { PdfAnnotation } from "./pdfExtract";
import { extractAttachment } from "./attachmentExtract";
import { saveAnnotations, loadAnnotations } from "./oaAnnotations";
import { Zotero, tagNames } from "./zotero";
import { zoteroMetadata } from "./zoteroToOmeka";
import { splitCodes } from "./codebook";
import { getZoteroCollections } from "./zoteroCollections";
import { workflowConfig } from "../config";

const { accessTerm } = workflowConfig.omeka;

export interface ZoteroArticle {
  zoteroKey: string;
  // notice Zotero parente de la pièce jointe (référence bibliographique)
  parentKey: string | null;
  title: string;
  format: string;
  text: string;
  annotations: PdfAnnotation[];
  // marqueurs Zotero de la notice, de la pièce jointe et de ses notes (traités comme des concepts)
  tags: string[];
  images: { page: number; width: number; height: number; omekaMediaId?: number }[];
  omekaItemId?: number;
  // date de la dernière extraction sémantique (curation:access), null si elle reste à faire
  accessed: string | null;
}

// fusionne des listes d'annotations (fichier, lecteur Zotero, notes Zotero) sans doublon
function mergeAnnotations(a: PdfAnnotation[], b: PdfAnnotation[]): PdfAnnotation[] {
  // l'auteur et le code font partie de la clé : plusieurs juges peuvent annoter la même phrase
  const key = (x: PdfAnnotation) => `${x.phrase.replace(/\s+/g, " ").toLowerCase()}|${x.note}|${x.author ?? ""}|${x.code ?? ""}`;
  const seen = new Set(a.map(key));
  return [...a, ...b.filter(x => !seen.has(key(x)))].sort((x, y) => x.page - y.page);
}

export const fetchZoteroData = new Tool({
  name: "fetch-zotero-data",
  description: "Récupère les pièces jointes (PDF, pages web, DOCX, ODT, EPUB, texte, images, liens…) d'une collection Zotero ou depuis le cache Omeka S. Enregistre chaque pièce jointe dans Omeka avec les métadonnées de son item Zotero, extrait le texte, les annotations (surlignages, notes) et les images, et uploade le fichier et les images.",
  schema: z.object({
    collectionId: z.string(),
  }),
  execute: async ({ data }) => {
    const { collectionId } = data;
    const zUserId = process.env.ZOTERO_USER_ID;
    const zApiKey = process.env.ZOTERO_API_KEY;
    if (!zUserId || !zApiKey) {
      throw new Error("Identifiants Zotero manquants dans le .env");
    }
    const zotero = new Zotero(zUserId, zApiKey);
    const omk = await getOmk();
    const collections = await getZoteroCollections();
    // item Omeka de la collection traitée
    const collectionItemId = await collections.itemId(collectionId);

    console.log(`\n📥 Interrogation de la collection Zotero : ${collectionId}...`);

    const items = await zotero.collectionItems(collectionId);
    const byKey = new Map(items.map(it => [it.key, it]));
    const attachments = items.filter(it => it.data.itemType === "attachment");
    console.log(`📎 ${attachments.length} pièce(s) jointe(s) : ${[...new Set(attachments.map(a => a.data.contentType || "?"))].join(", ")}`);

    const extractedArticles: ZoteroArticle[] = [];

    // notes Zotero par notice parente (une notice peut avoir plusieurs pièces jointes)
    const notesByParent = new Map<string, Promise<PdfAnnotation[]>>();
    const parentNotes = (key: string) => {
      if (!notesByParent.has(key)) {
        notesByParent.set(key, zotero.notes(key).catch(e => {
          console.warn(`⚠️ [ZOTERO] Notes de ${key} illisibles :`, (e as Error).message);
          return [];
        }));
      }
      return notesByParent.get(key)!;
    };

    for (const attachment of attachments) {
      const zoteroKey = attachment.key;
      const contentType: string = attachment.data.contentType || "";
      const zoteroFileName: string = attachment.data.filename || attachment.data.title || zoteroKey;

      // le titre de la pièce jointe est souvent générique ("Snapshot", "Full Text PDF") : on prend celui de la notice parente
      let parent: any = null;
      const parentKey: string | undefined = attachment.data.parentItem;
      if (parentKey) {
        try {
          parent = byKey.get(parentKey) ?? (await zotero.item(parentKey));
        } catch {
          // notice parente inaccessible : on garde les informations de la pièce jointe
        }
      }
      const title: string = parent?.data?.title || attachment.data.title;
      // toutes les collections Zotero de l'item (portées par la notice parente, sinon par la pièce jointe)
      const collectionKeys: string[] = [...new Set([collectionId, ...(parent?.data?.collections ?? attachment.data.collections ?? [])])];
      const collectionItemIds: number[] = [];
      for (const key of collectionKeys) {
        try {
          collectionItemIds.push(await collections.itemId(key));
        } catch (e) {
          console.warn(`⚠️ [OMEKA] Collection Zotero ${key} non enregistrée :`, (e as Error).message);
        }
      }
      const metadata = zoteroMetadata(omk, attachment, parent, zUserId, collectionItemIds);

      // notes de la notice → annotations ; marqueurs de la notice, de la pièce jointe et des notes → concepts
      const notes = parentKey ? await parentNotes(parentKey) : [];
      // les codes de la grille d'annotation (ACC-S, DES-F…) ne sont pas des concepts
      const tags = splitCodes([...new Set([...tagNames(parent?.data), ...tagNames(attachment.data), ...notes.flatMap(n => n.tags ?? [])])]).tags;
      if (notes.length || tags.length) console.log(`🗒️ [ZOTERO] ${notes.length} note(s), ${tags.length} marqueur(s) : ${tags.join(", ")}`);

      // 1. Vérification dans le cache Omeka S
      try {
        const existingOmekaItems = await omk.searchItemsByProp("dcterms:identifier", zoteroKey);

        if (existingOmekaItems && existingOmekaItems.length > 0) {
          console.log(`♻️ [CACHE OMEKA] Article et Media déjà présents : ${title}`);
          const cachedItem = existingOmekaItems[0];
          const cachedText = cachedItem["dcterms:description"]?.[0]?.["@value"] || "";
          const cachedAnnotations = await loadAnnotations(omk, cachedItem["o:id"]);

          // notes ajoutées dans Zotero depuis le dernier passage
          const newNotes = mergeAnnotations(cachedAnnotations, notes).filter(n => !cachedAnnotations.includes(n));
          if (newNotes.length) {
            console.log(`🗒️ [ZOTERO] ${newNotes.length} nouvelle(s) note(s) pour ${title}`);
            await saveAnnotations(omk, cachedItem["o:id"], newNotes, title);
            cachedAnnotations.push(...newNotes);
          }
          const accessed: string | null = cachedItem[accessTerm]?.[0]?.["@value"] || null;

          // mise à jour des métadonnées Zotero (elles ont pu changer depuis le dernier passage)
          try {
            await omk.updateResource(cachedItem["o:id"], metadata, "items", "PATCH", cachedItem);
          } catch (e) {
            console.warn(`⚠️ [OMEKA] Mise à jour des métadonnées impossible pour ${title} :`, (e as Error).message);
          }

          extractedArticles.push({ zoteroKey, parentKey: parentKey ?? null, title, format: contentType, text: cachedText, annotations: cachedAnnotations, tags, images: [], omekaItemId: cachedItem["o:id"], accessed });
          continue;
        }
      } catch (e) {
        console.warn(`⚠️ Impossible de vérifier le cache Omeka S pour ${title}.`);
      }

      // 2. Téléchargement et extraction (les liens URL n'ont pas de fichier sur le serveur Zotero)
      let extracted: Awaited<ReturnType<typeof extractAttachment>> | null = null;
      let annotations: PdfAnnotation[] = [];
      if (attachment.data.linkMode !== "linked_url") {
        console.log(`⬇️ [ZOTERO] Téléchargement de la pièce jointe (${contentType || "type inconnu"}) : ${title}`);
        try {
          const buffer = await zotero.file(zoteroKey);
          extracted = await extractAttachment(buffer, contentType, zoteroFileName);
          const zoteroAnnotations = await zotero.annotations(zoteroKey).catch(() => []);
          annotations = mergeAnnotations(extracted.annotations, zoteroAnnotations);
          console.log(`📝 [${extracted.format.toUpperCase()}] ${extracted.text.length} caractères, ${annotations.length} annotation(s), ${extracted.images.length} image(s)`);
          if (!extracted.text) console.warn(`   ⚠️ Aucun texte extrait de "${title}" (format ${extracted.format}).`);
        } catch (error) {
          console.error(`❌ Fichier inexploitable pour ${title} :`, (error as Error).message);
        }
      } else {
        console.log(`🔗 [ZOTERO] Lien sans fichier : ${title}`);
      }
      const extractedText = extracted?.text ?? "";
      annotations = mergeAnnotations(annotations, notes);

      try {
        // 3. Création de l'Item dans Omeka S avec les métadonnées Zotero
        console.log(`⬆️ [OMEKA] Création de la notice bibliographique...`);
        const createdItem = await omk.createItem({
          ...metadata,
          ...(extractedText ? { "dcterms:description": extractedText } : {})
        });
        const omekaItemId = createdItem["o:id"];

        const images: ZoteroArticle["images"] = (extracted?.images ?? []).map(({ page, width, height }) => ({ page, width, height }));
        extractedArticles.push({ zoteroKey, parentKey: parentKey ?? null, title, format: extracted?.format ?? "link", text: extractedText, annotations, tags, images, omekaItemId, accessed: null });

        // 3b. Création des annotations (oa:Annotation) qui ciblent l'item
        await saveAnnotations(omk, omekaItemId, annotations, title);

        if (extracted) {
          // 4. Upload physique du fichier en tant que Media Omeka S
          const safeBase = `${title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 80)}_${zoteroKey}`;
          const fileExt = path.extname(extracted.file.fileName) || "";
          console.log(`📦 [OMEKA] Upload du fichier attaché à l'Item ID ${omekaItemId}...`);
          try {
            await omk.uploadMedia(
              omekaItemId,
              { buffer: extracted.file.buffer, fileName: safeBase + fileExt, type: extracted.file.type },
              { "dcterms:title": `Fichier original de ${title}` }
            );
            console.log(`✅ [OMEKA] Media uploadé avec succès !`);
          } catch (e) {
            console.warn(`⚠️ [OMEKA] Échec de l'upload du media :`, (e as Error).message);
          }

          // 5. Upload des images extraites (sauf si la pièce jointe est elle-même l'image)
          if (extracted.format !== "image") {
            for (const [i, img] of extracted.images.entries()) {
              try {
                const media = await omk.uploadMedia(
                  omekaItemId,
                  { buffer: img.data, fileName: `${safeBase}_${i + 1}_${img.fileName}`, type: img.type },
                  { "dcterms:title": `Image ${img.page} de ${title}` }
                );
                images[i]!.omekaMediaId = media["o:id"];
              } catch (e) {
                console.warn(`⚠️ [OMEKA] Échec de l'upload de l'image ${img.fileName} :`, (e as Error).message);
              }
            }
            if (extracted.images.length) console.log(`🖼️ [OMEKA] ${images.filter(im => im.omekaMediaId).length}/${extracted.images.length} image(s) uploadée(s)`);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur Omeka sur ${title} :`, (error as Error).message);
      }
    }

    return { articles: extractedArticles, collectionItemId };
  },
});
