// Correspondance entre les métadonnées d'un item Zotero et les propriétés Omeka S (dcterms, bibo, curation)
import type { Omk, OmkData } from "./omk";
import { decodeEntities } from "./attachmentExtract";
import { zoteroWebUrl } from "./zotero";
import { splitCodes } from "./codebook";

// type d'item Zotero → classe bibo
const ITEM_CLASSES: Record<string, string> = {
  journalArticle: "bibo:AcademicArticle",
  magazineArticle: "bibo:Article",
  newspaperArticle: "bibo:Article",
  conferencePaper: "bibo:AcademicArticle",
  book: "bibo:Book",
  bookSection: "bibo:BookSection",
  thesis: "bibo:Thesis",
  report: "bibo:Report",
  webpage: "bibo:Webpage",
  blogPost: "bibo:Webpage",
  presentation: "bibo:Slideshow",
  letter: "bibo:Letter",
  manuscript: "bibo:Manuscript",
  patent: "bibo:Patent",
  film: "bibo:Film",
  interview: "bibo:Interview",
  document: "bibo:Document",
};

// champs Zotero simples → propriété Omeka
const FIELDS: Record<string, string> = {
  abstractNote: "dcterms:abstract",
  date: "dcterms:date",
  language: "dcterms:language",
  publisher: "dcterms:publisher",
  place: "dcterms:spatial",
  rights: "dcterms:rights",
  publicationTitle: "dcterms:isPartOf",
  bookTitle: "dcterms:isPartOf",
  websiteTitle: "dcterms:isPartOf",
  proceedingsTitle: "dcterms:isPartOf",
  series: "dcterms:isPartOf",
  volume: "bibo:volume",
  issue: "bibo:issue",
  pages: "bibo:pages",
  numPages: "bibo:numPages",
  edition: "bibo:edition",
  DOI: "bibo:doi",
  ISBN: "bibo:isbn",
  ISSN: "bibo:issn",
  shortTitle: "bibo:shortTitle",
};

function creatorName(c: any): string {
  return c.name ?? [c.lastName, c.firstName].filter(Boolean).join(", ");
}

// métadonnées Omeka d'une pièce jointe, enrichies de celles de son item Zotero parent
// collectionItemIds : items Omeka des collections Zotero contenant l'item (dcterms:isPartOf)
export function zoteroMetadata(omk: Omk, attachment: any, parent: any | null, zoteroUserId: string, collectionItemIds: number[] = []): OmkData {
  const a = attachment.data;
  const p = parent?.data ?? null;
  const md: OmkData = {};
  const add = (term: string, value: any) => {
    if (value === undefined || value === null || value === "" || !omk.getPropByTerm(term)) return;
    // Zotero conserve parfois les entités HTML des sites d'origine (&#8217;, &#233;…)
    if (typeof value === "string") value = decodeEntities(value).trim();
    md[term] = md[term] ? [...[md[term]].flat(), value] : value;
  };

  const itemClass = ITEM_CLASSES[p?.itemType] ?? "bibo:Document";
  if (omk.getClassByTerm(itemClass)) md["o:resource_class"] = itemClass;

  add("dcterms:title", p?.title || a.title);
  // identifiant de la pièce jointe : sert de clé pour le cache Omeka
  add("dcterms:identifier", attachment.key);
  add("dcterms:type", p?.itemType ?? "attachment");
  add("dcterms:format", a.contentType);

  if (p) {
    for (const c of p.creators ?? []) {
      const name = creatorName(c);
      if (name) add(c.creatorType === "author" ? "dcterms:creator" : "dcterms:contributor", name);
    }
    for (const [field, term] of Object.entries(FIELDS)) add(term, p[field]);
    // marqueurs de la notice, hors codes de la grille d'annotation
    for (const t of splitCodes((p.tags ?? []).map((t: any) => t.tag)).tags) add("curation:tag", t);
    add("bibo:uri", { u: zoteroWebUrl(`items/${parent.key}`), l: "Notice Zotero" });
  }
  // appartenance aux collections Zotero (un item peut être dans plusieurs collections)
  for (const rid of collectionItemIds) add("dcterms:isPartOf", { rid });

  const url = p?.url || a.url;
  if (url) add("dcterms:source", { u: url, l: p?.title || a.title || url });

  return md;
}
