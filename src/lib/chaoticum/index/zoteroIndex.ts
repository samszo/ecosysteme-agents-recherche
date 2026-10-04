// Index RAG de la bibliothèque Zotero : un document Albert par référence (notice), avec ses mots-clés et ses notes
// répétés en tête (poids dans la recherche), puis ses passages surlignés marqués de leur clé [[CLÉ]] pour retrouver
// la citation à partir d'un extrait. Seules les références modifiées depuis la dernière indexation sont redéposées.
import crypto from "crypto";
import { Albert, chunkMetadata } from "../../albert/albert";
import { Zotero, authorOf, tagNames } from "../../zotero/zotero";
import { htmlToText } from "../../extraction/attachmentExtract";
import { workflowConfig } from "../../../config";
import { recordUsage } from "../../metrics/usage";
import { emptyZotero, loadStore, saveStore, type AnnotationEntry, type ReferenceEntry } from "./store";
import type { ChaoticumConfig } from "../../../config/chaoticum";

const estimate = (t: string) => Math.ceil(t.length / 4);
const clean = (t: string) => t.replace(/\s+/g, " ").trim();

function creatorsOf(d: any) {
  const names = (d?.creators ?? []).map((c: any) => c.lastName || c.name).filter(Boolean);
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} et al.` : names.join(", ");
}

export async function indexZotero(c: ChaoticumConfig) {
  const albert = new Albert(workflowConfig.models.provider, process.env.ALBERT_API_KEY ?? "");
  const zotero = new Zotero(process.env.ZOTERO_USER_ID ?? "", process.env.ZOTERO_API_KEY ?? "");
  const library = process.env.ZOTERO_GROUP_ID ? `groups/${process.env.ZOTERO_GROUP_ID}` : `users/${process.env.ZOTERO_USER_ID}`;
  const store = loadStore("bibliotheque", emptyZotero(), c);
  const { collection, created } = await albert.ensureCollection(c.rag.zoteroCollection, `Bibliothèque Zotero ${library} : une référence par document (chaoticumSeminario)`);
  if (store.collectionId !== collection.id || store.library !== library) {
    // nouvelle collection ou autre bibliothèque : tout est redéposé
    store.items = {};
    store.collectionId = collection.id;
    store.library = library;
  }
  console.log(`📚 [RAG] Collection Albert « ${collection.name} » (${collection.id})${created ? " créée" : ""} ; bibliothèque ${library}`);

  // lecture de la bibliothèque en quelques requêtes paginées (pas une requête par pièce jointe)
  const [top, attachments, notes, annotations] = await Promise.all([
    zotero.topItems(), zotero.itemsWhere("itemType=attachment"), zotero.itemsWhere("itemType=note"), zotero.itemsWhere("itemType=annotation"),
  ]);
  console.log(`📥 [ZOTERO] ${top.length} notice(s), ${attachments.length} pièce(s) jointe(s), ${notes.length} note(s), ${annotations.length} annotation(s)`);
  const parentOfAttachment = new Map(attachments.map((a: any) => [a.key, a.data.parentItem ?? null]));
  const byRef = new Map<string, { notes: any[]; annotations: any[] }>();
  const bucket = (k: string) => { if (!byRef.has(k)) byRef.set(k, { notes: [], annotations: [] }); return byRef.get(k)!; };
  for (const n of notes) if (n.data.parentItem) bucket(n.data.parentItem).notes.push(n);
  for (const a of annotations) {
    const ref = parentOfAttachment.get(a.data.parentItem);
    if (ref) bucket(ref).annotations.push(a);
  }

  const refs = top.filter((it: any) => !["attachment", "note", "annotation"].includes(it.data.itemType));
  let uploaded = 0, unchanged = 0, removed = 0, errors = 0, tokens = 0;
  for (const it of refs) {
    const d = it.data;
    const b = byRef.get(it.key) ?? { notes: [], annotations: [] };
    const tags = [...new Set([...tagNames(d), ...b.notes.flatMap((n: any) => tagNames(n.data)), ...b.annotations.flatMap((a: any) => tagNames(a.data))])];
    const anns: Record<string, AnnotationEntry> = {};
    const noteLines = b.notes.map((n: any) => {
      const text = clean(htmlToText(n.data.note ?? ""));
      anns[n.key] = { key: n.key, kind: "note", text, comment: "", page: "", color: null, author: authorOf(n) ?? null, date: n.data.dateAdded ?? null };
      return { key: n.key, text };
    }).filter((n: any) => n.text);
    const highlightLines = b.annotations.filter((a: any) => a.data.annotationText || a.data.annotationComment).map((a: any) => {
      const x = a.data;
      anns[a.key] = { key: a.key, kind: "annotation", text: clean(x.annotationText ?? ""), comment: clean(x.annotationComment ?? ""), page: String(x.annotationPageLabel ?? ""), color: x.annotationColor ?? null, author: authorOf(a) ?? null, date: x.dateAdded ?? null };
      const e = anns[a.key]!, page = e.page ? ` (p. ${e.page})` : "";
      // annotation sans passage surligné (note posée dans le lecteur) : son commentaire seul
      return e.text ? `- « ${e.text} »${page}${e.comment ? ` — ${e.comment}` : ""} [[${a.key}]]` : `- Note${page} : ${e.comment} [[${a.key}]]`;
    });
    const year = /\b(1[5-9]|20)\d{2}\b/.exec(d.date ?? "")?.[0] ?? "";
    const creators = creatorsOf(d);
    // pondération : mots-clés et notes répétés en tête du document (premier extrait, recherche lexicale et sémantique)
    const keywordBlock = tags.length ? Array.from({ length: c.rag.keywordsWeight }, () => `Mots-clés : ${tags.join(" ; ")}`).join("\n") : "";
    const notesText = noteLines.map((n: any) => `${n.text.slice(0, 1500)} [[${n.key}]]`).join("\n\n");
    const notesBlock = notesText ? [`## Notes du chercheur\n\n${notesText}`, ...Array.from({ length: Math.max(0, c.rag.notesWeight - 1) }, () => `## Rappel des notes\n\n${noteLines.map((n: any) => n.text.slice(0, 600)).join("\n\n")}`)].join("\n\n") : "";
    const content = [
      `# ${d.title || "(sans titre)"}`,
      `${creators}${year ? ` (${year})` : ""}${d.publicationTitle || d.bookTitle ? `. ${d.publicationTitle || d.bookTitle}` : ""}.`,
      keywordBlock, notesBlock,
      highlightLines.length ? `## Passages surlignés\n\n${highlightLines.join("\n")}` : "",
      d.abstractNote ? `## Résumé\n\n${clean(d.abstractNote)}` : "",
    ].filter(Boolean).join("\n\n");
    const hash = crypto.createHash("sha1").update(content).digest("hex");
    const known = store.items[it.key];
    if (known?.hash === hash && known.docId) { unchanged++; continue; }
    // une notice sans note ni passage surligné ne fournit pas de citation : indexée quand même (contexte), sans citation
    try {
      if (known?.docId) await albert.deleteDocument(known.docId).catch(() => {});
      const docId = await albert.createDocument({
        collectionId: collection.id, content, fileName: `ref ${it.key}.md`, name: `ref ${it.key}`,
        chunkSize: c.rag.chunkSize, chunkOverlap: c.rag.chunkOverlap, presetSeparators: "markdown",
        metadata: chunkMetadata({ kind: "reference", key: it.key, title: d.title, creators, year, collections: (d.collections ?? []).join(",") }),
      });
      tokens += estimate(content);
      const entry: ReferenceEntry = { key: it.key, title: d.title || "(sans titre)", creators, year, collections: d.collections ?? [], tags, annotations: anns, hash, docId, indexedAt: new Date().toISOString() };
      store.items[it.key] = entry;
      uploaded++;
      if (uploaded % 20 === 0) { saveStore("bibliotheque", store, c); console.log(`   … ${uploaded} référence(s) déposée(s)`); }
    } catch (e) {
      errors++;
      console.warn(`   ⚠️ ${d.title || it.key} :`, (e as Error).message.split("\n")[0]);
    }
  }
  // références supprimées de la bibliothèque : retirées de la collection Albert
  const present = new Set(refs.map((r: any) => r.key));
  for (const [key, e] of Object.entries(store.items)) {
    if (present.has(key)) continue;
    if (e.docId) await albert.deleteDocument(e.docId).catch(() => {});
    delete store.items[key];
    removed++;
  }
  saveStore("bibliotheque", store, c);
  if (tokens) recordUsage("Index de la bibliothèque : vectorisation (estimation)", "BAAI/bge-m3", { inputTokens: tokens, outputTokens: 0, totalTokens: tokens });
  const citations = Object.values(store.items).reduce((s, e) => s + Object.keys(e.annotations).length, 0);
  console.log(`✅ [BIBLIOTHÈQUE] ${uploaded} référence(s) déposée(s), ${unchanged} inchangée(s), ${removed} retirée(s), ${errors} erreur(s) ; index : ${Object.keys(store.items).length} référence(s), ${citations} citation(s) possible(s)`);
  return { uploaded, unchanged, removed, errors, references: Object.keys(store.items).length, citations };
}
