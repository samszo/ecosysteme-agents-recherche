// Historique de la consommation de tokens des traitements (une ligne JSON par exécution dans usage.history.jsonl) et
// estimation du coût d'un agent ou d'un traitement à partir des exécutions passées (onglet Workflow). Les rapports
// produits avant cet historique (tableau « Consommation de tokens ») sont relus aussi.
import fs from "fs";
import path from "path";
import type { UsageEntry, UsageSummary } from "./usage";

export const USAGE_HISTORY_FILE = path.resolve(process.cwd(), process.env.USAGE_HISTORY_FILE || "usage.history.jsonl");

export interface UsageRun { at: string; app: string; task: string | null; entries: Pick<UsageEntry, "source" | "model" | "calls" | "inputTokens" | "outputTokens">[] }

// ajout de la consommation d'une exécution (task : traitement hors workflow, ex. indexation)
export function appendUsageHistory(app: string, usage: UsageSummary, task: string | null = null) {
  if (!usage.calls) return;
  const run: UsageRun = { at: new Date().toISOString(), app, task, entries: usage.entries.map(({ source, model, calls, inputTokens, outputTokens }) => ({ source, model, calls, inputTokens, outputTokens })) };
  try { fs.appendFileSync(USAGE_HISTORY_FILE, JSON.stringify(run) + "\n"); }
  catch (e) { console.warn("⚠️ Historique de consommation non écrit :", (e as Error).message); }
}

// rapports d'exécution : application d'après le nom du fichier
const REPORTS: Record<string, string> = { "rapport_traitement.md": "paper", "rapport_explo.md": "explo", "rapport_chaoticum.md": "chaoticum" };

function reportRuns(dir: string, depth = 0): UsageRun[] {
  if (depth > 4 || !fs.existsSync(dir)) return [];
  const out: UsageRun[] = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) { out.push(...reportRuns(full, depth + 1)); continue; }
    const app = REPORTS[f.name];
    if (!app) continue;
    const text = fs.readFileSync(full, "utf-8");
    const start = text.indexOf("| Traitement | Modèle | Appels |");
    if (start < 0) continue;
    const entries: UsageRun["entries"] = [];
    for (const line of text.slice(start).split("\n").slice(2)) {
      if (!line.startsWith("|")) break;
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      if (cells[0]!.startsWith("**")) continue; // totaux par modèle
      const num = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;
      entries.push({ source: cells[0]!.replace(/\\\|/g, "|"), model: cells[1]!.replace(/`/g, ""), calls: num(cells[2]!), inputTokens: num(cells[3]!), outputTokens: num(cells[4]!) });
    }
    if (entries.length) out.push({ at: fs.statSync(full).mtime.toISOString(), app, task: null, entries });
  }
  return out;
}

// exécutions connues (historique et rapports), sans doublon (un rapport recopié dans une archive n'est compté qu'une fois)
export function usageRuns(resultsDir = path.resolve(process.cwd(), "resultats")): UsageRun[] {
  const runs: UsageRun[] = [];
  try {
    for (const line of fs.readFileSync(USAGE_HISTORY_FILE, "utf-8").split("\n")) if (line.trim()) runs.push(JSON.parse(line));
  } catch { /* pas encore d'historique */ }
  runs.push(...reportRuns(resultsDir));
  const seen = new Set<string>();
  return runs.filter(r => {
    const key = JSON.stringify([...r.entries].map(e => [e.source, e.model, e.calls, e.inputTokens, e.outputTokens]).sort());
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.at.localeCompare(a.at));
}

export interface AgentEstimate { inputTokens: number; outputTokens: number; callsPerRun: number; runs: number; basis: "historique" | "a priori" }

// appels d'un agent : étiquette dans le libellé (ex. « (writerAgent) ») ou libellé des anciens rapports
export const usageMatcher = (tag: string, legacy: string[] = []) => (source: string) => source.includes(tag) || legacy.includes(source);

// consommation moyenne d'un agent sur les dernières exécutions où il a été appelé
export function agentEstimate(runs: UsageRun[], match: (source: string) => boolean, fallback: { inputTokens: number; outputTokens: number; callsPerRun: number }, last = 20): AgentEstimate {
  const per = runs.map(r => r.entries.filter(e => match(e.source))).filter(es => es.length && es.some(e => e.calls)).slice(0, last);
  if (!per.length) return { ...fallback, runs: 0, basis: "a priori" };
  const calls = per.map(es => es.reduce((n, e) => n + e.calls, 0));
  const totalCalls = calls.reduce((a, b) => a + b, 0);
  const sum = (k: "inputTokens" | "outputTokens") => per.flat().reduce((n, e) => n + e[k], 0);
  return {
    inputTokens: Math.round(sum("inputTokens") / totalCalls),
    outputTokens: Math.round(sum("outputTokens") / totalCalls),
    callsPerRun: Math.round((totalCalls / per.length) * 10) / 10,
    runs: per.length,
    basis: "historique",
  };
}

// consommation moyenne, par exécution d'un workflow, des traitements sans agent (extraction, vectorisation, nettoyage…)
export function otherUsage(runs: UsageRun[], app: string, isAgent: (source: string) => boolean, last = 20) {
  const appRuns = runs.filter(r => r.app === app && !r.task).slice(0, last);
  const byKey = new Map<string, { source: string; model: string; inputTokens: number; outputTokens: number }>();
  for (const r of appRuns) for (const e of r.entries) {
    if (isAgent(e.source)) continue;
    const k = `${e.source}|${e.model}`;
    const x = byKey.get(k) ?? { source: e.source, model: e.model, inputTokens: 0, outputTokens: 0 };
    x.inputTokens += e.inputTokens; x.outputTokens += e.outputTokens;
    byKey.set(k, x);
  }
  const n = Math.max(1, appRuns.length);
  return { runs: appRuns.length, entries: [...byKey.values()].map(x => ({ ...x, inputTokens: Math.round(x.inputTokens / n), outputTokens: Math.round(x.outputTokens / n) })) };
}
