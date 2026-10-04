// Index locaux des collections RAG (diapos, bibliothèque) : état de l'indexation incrémentale, dans le dossier de données
import fs from "fs";
import path from "path";
import { chaoticumConfig } from "../../../config/chaoticum";

export interface SlideEntry {
  path: string;
  name: string;
  diapo: number;
  max: number;
  url: string;
  // copie d'écran (chemin relatif au dossier de l'index)
  screenshot: string | null;
  title: string;
  keywords: string[];
  description: string;
  docId: number | null;
  indexedAt: string;
}

export interface AnnotationEntry {
  key: string;
  kind: "annotation" | "note";
  text: string;
  comment: string;
  page: string;
  color: string | null;
  author: string | null;
  date: string | null;
}

export interface ReferenceEntry {
  key: string;
  title: string;
  creators: string;
  year: string;
  collections: string[];
  tags: string[];
  annotations: Record<string, AnnotationEntry>;
  hash: string;
  docId: number | null;
  indexedAt: string;
}

export interface SlidesStore { collectionId: number | null; presentations: Record<string, { max: number; checkedAt: string }>; items: Record<string, SlideEntry>; updatedAt: string | null }
export interface ZoteroStore { collectionId: number | null; library: string; items: Record<string, ReferenceEntry>; updatedAt: string | null }

export const indexDir = (c = chaoticumConfig) => path.resolve(process.cwd(), c.outputDir, "index");
const file = (name: string, c = chaoticumConfig) => path.join(indexDir(c), `${name}.json`);

export function loadStore<T>(name: "diapos" | "bibliotheque", empty: T, c = chaoticumConfig): T {
  try { return { ...empty, ...JSON.parse(fs.readFileSync(file(name, c), "utf-8")) }; } catch { return empty; }
}

export function saveStore(name: "diapos" | "bibliotheque", data: any, c = chaoticumConfig) {
  fs.mkdirSync(indexDir(c), { recursive: true });
  const target = file(name, c);
  fs.writeFileSync(`${target}.tmp`, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }));
  fs.renameSync(`${target}.tmp`, target);
}

export const emptySlides = (): SlidesStore => ({ collectionId: null, presentations: {}, items: {}, updatedAt: null });
export const emptyZotero = (): ZoteroStore => ({ collectionId: null, library: "", items: {}, updatedAt: null });
