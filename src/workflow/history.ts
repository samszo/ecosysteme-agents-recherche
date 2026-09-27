// Historique local des exécutions (workflow.history.json, dans le répertoire de données) :
// l'interface l'utilise pour lister les appels déjà traités et rejouer une analyse
import fs from "fs/promises";
import path from "path";

export const HISTORY_FILE = path.resolve(process.cwd(), process.env.WORKFLOW_HISTORY_FILE || "workflow.history.json");
const MAX_ENTRIES = 500;

export interface HistoryEntry {
  runId: string;
  startedAt: string;
  endedAt: string;
  status: string;
  input: { cfpUrl?: string; cfpFile?: string; cfpText: string; zoteroCollection: string };
  aap: { title: string | null; itemId: number | null; url: string | null };
  collectionItemId: number | null;
  configItemId: number | null;
  proposalTitle: string | null;
  tokens: { calls: number; input: number; output: number; total: number } | null;
}

export async function readHistory(): Promise<HistoryEntry[]> {
  try {
    return JSON.parse(await fs.readFile(HISTORY_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export async function appendHistory(entry: HistoryEntry) {
  const history = (await readHistory()).filter(h => h.runId !== entry.runId);
  history.unshift(entry);
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history.slice(0, MAX_ENTRIES), null, 2) + "\n", "utf-8");
}
