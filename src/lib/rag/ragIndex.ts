// Indexation des documents d'une collection Zotero dans le RAG d'Albert
// - chaque collection Zotero a une collection privée Albert de même nom ;
// - un document en double dans la collection n'est déposé qu'une fois ;
// - un document présent dans plusieurs collections Zotero est déposé dans chacune des collections Albert correspondantes ;
// - le résultat du dépôt est enregistré dans un fichier JSON, média de l'item Omeka S du document.
import crypto from "crypto";
import { Albert, chunkMetadata, type AlbertCollection, type AlbertDocument } from "../albert/albert";
import { getOmk } from "../omeka/omk";
import { Zotero } from "../zotero/zotero";
import { recordUsage } from "../metrics/usage";
import { uploadWithFallback } from "../../workflow/runs/importSynthesis";
import { workflowConfig } from "../../config";
import { exploConfig } from "../../config/explo";
import type { ZoteroArticle } from "../../tools/fetchZoteroData";

// titre du média JSON qui garde la trace de l'indexation d'un document
export const RAG_RECORD_TITLE = "Indexation RAG Albert";
// taille maximale d'un fichier déposé (Albert : 20 Mo ; marge pour les caractères multi-octets)
const MAX_PART_CHARS = 5_000_000;
// nombre de tokens estimé d'un texte (≈ 4 caractères par token)
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

// nom du document dans Albert : préfixe stable (item Omeka, sinon clé Zotero) qui permet de le retrouver d'une analyse à l'autre
const docId = (a: ZoteroArticle) => (a.omekaItemId ? `omeka-${a.omekaItemId}` : `zotero-${a.zoteroKey}`);
const docName = (a: ZoteroArticle, part = "") => `${docId(a)} ${a.title.replace(/[\\/:*?"<>|\s]+/g, " ").trim().slice(0, 120)}${part}.md`;
const idOfName = (name: string) => /^((?:omeka|zotero)-\w+)(?=[\s.]|$)/.exec(name)?.[1] ?? null;

// texte déposé : référence puis texte extrait (Markdown, découpé par Albert sur les titres et paragraphes)
function documentMarkdown(a: ZoteroArticle) {
  const ref = [a.creators, a.year].filter(Boolean).join(", ");
  return `# ${a.title}\n\n${ref ? `${ref}. ` : ""}Zotero ${a.zoteroKey}${a.omekaItemId ? `, Omeka S item ${a.omekaItemId}` : ""}.\n\n${a.text}\n`;
}

export interface RagRecordEntry {
  zoteroCollection: { key: string; name: string };
  albertCollection: { id: number; name: string };
  documents: { id: number; name: string }[];
  status: "créé" | "déjà présent";
  date: string;
  characters?: number;
  estimatedTokens?: number;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface RagIndexSummary {
  enabled: boolean;
  albert: string;
  collections: { zoteroKey: string; name: string; albertId: number; created: boolean; added: number; present: number }[];
  documents: number;
  uploaded: number;
  alreadyIndexed: number;
  withoutText: number;
  duplicatesSkipped: number;
  estimatedTokens: number;
  records: number;
  errors: string[];
}

export async function indexCollectionForRag(articles: ZoteroArticle[], currentKey: string, rag = exploConfig.rag): Promise<RagIndexSummary> {
  const albert = new Albert(workflowConfig.models.provider, process.env.ALBERT_API_KEY ?? "");
  const summary: RagIndexSummary = {
    enabled: true, albert: workflowConfig.models.provider, collections: [], documents: 0, uploaded: 0, alreadyIndexed: 0,
    withoutText: 0, duplicatesSkipped: 0, estimatedTokens: 0, records: 0, errors: [],
  };

  // noms des collections Zotero de la bibliothèque (une collection Albert par nom)
  const zotero = new Zotero(process.env.ZOTERO_USER_ID ?? "", process.env.ZOTERO_API_KEY ?? "");
  const zoteroNames = new Map<string, string>((await zotero.collections()).map((c: any) => [c.key, c.data.name]));
  if (!zoteroNames.has(currentKey)) throw new Error(`Collection Zotero ${currentKey} introuvable`);

  // un seul dépôt par document : exemplaires déjà fusionnés par fetchZoteroData, et textes identiques
  // (fusion désactivée, ou même document rattaché à deux notices) regroupés ici ; leurs collections sont cumulées
  const docs = new Map<string, ZoteroArticle>();
  const byText = new Map<string, string>();
  for (const a of articles) {
    summary.duplicatesSkipped += a.duplicates?.length ?? 0;
    if (!a.text?.trim()) { summary.withoutText++; continue; }
    const hash = crypto.createHash("sha1").update(a.text.replace(/\s+/g, " ").trim()).digest("hex");
    const key = byText.get(hash) ?? docId(a);
    const known = docs.get(key);
    if (known) {
      summary.duplicatesSkipped++;
      known.collectionKeys = [...new Set([...known.collectionKeys, ...(a.collectionKeys ?? [])])];
      continue;
    }
    byText.set(hash, key);
    docs.set(key, { ...a, collectionKeys: [...(a.collectionKeys ?? [])] });
  }
  summary.documents = docs.size;
  console.log(`🔎 [RAG] ${docs.size} document(s) à indexer dans Albert (${summary.duplicatesSkipped} doublon(s) écarté(s), ${summary.withoutText} sans texte)`);

  // collections Albert (par nom) et documents qu'elles contiennent déjà (par identifiant de document)
  const albertCollections = new Map<string, { collection: AlbertCollection; byDoc: Map<string, AlbertDocument[]>; stats: RagIndexSummary["collections"][number] }>();
  const collectionFor = async (zoteroKey: string) => {
    const name = zoteroNames.get(zoteroKey);
    if (!name) return null;
    if (!albertCollections.has(name)) {
      const { collection, created } = await albert.ensureCollection(name, `Collection Zotero « ${name} » (${zoteroKey}) – exploZoteroAnno`);
      const byDoc = new Map<string, AlbertDocument[]>();
      if (!created) {
        for (const d of await albert.documents(collection.id)) {
          const id = idOfName(d.name);
          if (id) byDoc.set(id, [...(byDoc.get(id) ?? []), d]);
        }
      }
      console.log(`${created ? "🆕" : "📚"} [RAG] Collection Albert « ${name} » (${collection.id}) ${created ? "créée" : `: ${byDoc.size} document(s) déjà indexé(s)`}`);
      const stats = { zoteroKey, name, albertId: collection.id, created, added: 0, present: 0 };
      summary.collections.push(stats);
      albertCollections.set(name, { collection, byDoc, stats });
    }
    return albertCollections.get(name)!;
  };

  const omk = await getOmk().catch(() => null);
  let tokens = 0;
  for (const doc of docs.values()) {
    const targets = rag.allCollections ? [...new Set([currentKey, ...doc.collectionKeys])] : [currentKey];
    const entries: RagRecordEntry[] = [];
    let created = false;
    for (const zoteroKey of targets) {
      try {
        const target = await collectionFor(zoteroKey);
        if (!target) continue;
        const now = new Date().toISOString();
        const base = { zoteroCollection: { key: zoteroKey, name: target.collection.name }, albertCollection: { id: target.collection.id, name: target.collection.name }, date: now };
        const existing = target.byDoc.get(docId(doc));
        if (existing?.length) {
          // déjà présent (analyse précédente, ou autre collection Zotero de même nom traitée plus haut)
          entries.push({ ...base, documents: existing.map(d => ({ id: d.id, name: d.name })), status: "déjà présent" });
          target.stats.present++;
          summary.alreadyIndexed++;
          continue;
        }
        const markdown = documentMarkdown(doc);
        const parts = Math.ceil(markdown.length / MAX_PART_CHARS);
        const uploaded: AlbertDocument[] = [];
        for (let i = 0; i < parts; i++) {
          const name = docName(doc, parts > 1 ? ` (${i + 1}-${parts})` : "");
          const id = await albert.createDocument({
            collectionId: target.collection.id,
            content: markdown.slice(i * MAX_PART_CHARS, (i + 1) * MAX_PART_CHARS),
            fileName: name,
            name,
            chunkSize: rag.chunkSize,
            chunkOverlap: rag.chunkOverlap,
            presetSeparators: "markdown",
            metadata: chunkMetadata({ omeka_id: doc.omekaItemId, zotero_key: doc.zoteroKey, title: doc.title, creators: doc.creators, year: doc.year, zotero_collection: zoteroKey }),
          });
          uploaded.push({ id, name });
        }
        target.byDoc.set(docId(doc), uploaded);
        const estimated = estimateTokens(markdown);
        tokens += estimated;
        entries.push({ ...base, documents: uploaded.map(d => ({ id: d.id, name: d.name })), status: "créé", characters: markdown.length, estimatedTokens: estimated, chunkSize: rag.chunkSize, chunkOverlap: rag.chunkOverlap });
        target.stats.added++;
        summary.uploaded++;
        created = true;
        console.log(`   ⬆️ [RAG] « ${doc.title} » → ${target.collection.name} (document ${uploaded.map(d => d.id).join(", ")})`);
      } catch (e) {
        const msg = `« ${doc.title} » → ${zoteroNames.get(zoteroKey) ?? zoteroKey} : ${(e as Error).message}`;
        summary.errors.push(msg);
        console.warn(`   ⚠️ [RAG] ${msg}`);
      }
    }
    // trace JSON sur l'item Omeka du document, à chaque nouveau dépôt (elle remplace la précédente)
    if (created && omk && doc.omekaItemId) {
      try {
        await saveRagRecord(omk, doc, entries);
        summary.records++;
      } catch (e) {
        console.warn(`   ⚠️ [OMEKA] Trace de l'indexation non enregistrée pour « ${doc.title} » :`, (e as Error).message);
      }
    }
  }

  // la vectorisation n'est pas décomptée par Albert : estimation à partir du texte déposé
  if (tokens) recordUsage("Indexation RAG (vectorisation, estimation)", rag.embeddingsModel, { inputTokens: tokens, outputTokens: 0, totalTokens: tokens });
  summary.estimatedTokens = tokens;
  console.log(`✅ [RAG] ${summary.uploaded} dépôt(s), ${summary.alreadyIndexed} déjà présent(s), ${summary.errors.length} erreur(s) ; ≈ ${tokens.toLocaleString("fr-FR")} tokens vectorisés`);
  return summary;
}

// média JSON « Indexation RAG Albert » de l'item du document ; les traces précédentes de l'application sont remplacées
async function saveRagRecord(omk: Awaited<ReturnType<typeof getOmk>>, doc: ZoteroArticle, entries: RagRecordEntry[]) {
  const itemId = doc.omekaItemId!;
  const now = new Date().toISOString();
  const record = {
    albert: workflowConfig.models.provider,
    document: { omekaItemId: itemId, zoteroKeys: [doc.zoteroKey, ...(doc.duplicates ?? []).map(d => d.zoteroKey)], title: doc.title },
    updatedAt: now,
    collections: entries,
  };
  const previous = (await omk.request(omk.url("media", { item_id: itemId, per_page: 100 })).catch(() => []))
    .filter((m: any) => String(m["o:title"] ?? "").startsWith(RAG_RECORD_TITLE));
  const { media } = await uploadWithFallback(
    omk, itemId,
    { buffer: Buffer.from(JSON.stringify(record, null, 2), "utf-8"), fileName: `rag_albert_${docId(doc)}_${now.replace(/[:.]/g, "-")}.json`, type: "application/json" },
    { "dcterms:title": `${RAG_RECORD_TITLE} – ${now}`, "dcterms:date": now, "dcterms:format": "application/json" },
  );
  for (const m of previous) await omk.deleteResource(m["o:id"], "media").catch(() => {});
  console.log(`   🧾 [OMEKA] Trace de l'indexation enregistrée (Media ID ${media["o:id"]})`);
}
