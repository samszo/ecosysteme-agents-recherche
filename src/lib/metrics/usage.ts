// Comptage des tokens consommés par les appels aux modèles pendant une exécution du workflow
// (le workflow tourne dans un seul processus : le compteur est partagé par toutes les étapes)

export interface UsageEntry {
  source: string;
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  // appels dont l'API n'a pas renvoyé de consommation
  unknown: number;
}

const entries = new Map<string, UsageEntry>();

// usage : champ "totalUsage" (agents Mastra) ou "usage" (generateObject du SDK ai)
export function recordUsage(source: string, model: string, usage: any) {
  const key = `${source}|${model}`;
  const e = entries.get(key) ?? { source, model, calls: 0, inputTokens: 0, outputTokens: 0, reasoningTokens: 0, totalTokens: 0, unknown: 0 };
  e.calls++;
  const input = Number(usage?.inputTokens ?? usage?.promptTokens ?? 0) || 0;
  const output = Number(usage?.outputTokens ?? usage?.completionTokens ?? 0) || 0;
  const total = Number(usage?.totalTokens ?? 0) || input + output;
  if (!usage || !total) e.unknown++;
  e.inputTokens += input;
  e.outputTokens += output;
  e.reasoningTokens += Number(usage?.reasoningTokens ?? usage?.outputTokenDetails?.reasoningTokens ?? 0) || 0;
  e.totalTokens += total;
  entries.set(key, e);
}

export function usageSummary() {
  const list = [...entries.values()];
  const sum = (k: keyof UsageEntry) => list.reduce((n, e) => n + (e[k] as number), 0);
  return {
    entries: list,
    calls: sum("calls"),
    inputTokens: sum("inputTokens"),
    outputTokens: sum("outputTokens"),
    reasoningTokens: sum("reasoningTokens"),
    totalTokens: sum("totalTokens"),
    unknown: sum("unknown"),
  };
}
export type UsageSummary = ReturnType<typeof usageSummary>;
