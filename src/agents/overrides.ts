// Instructions, demandes et modèles des agents modifiés depuis l'interface (onglet Workflow de chaque application),
// enregistrés dans agents.config.json : { "<id de l'agent>": { "instructions": "…", "prompt": "…", "model": "…" } }. Le fichier est relu à chaque
// appel : une modification vaut aussi pour les actions du serveur (éditeur d'écran…), sans redémarrage.
import fs from "fs";
import path from "path";
import { readConfigOverride } from "../config/store";
import { albertModel } from "../config/models";

export const AGENTS_CONFIG_FILE = path.resolve(process.cwd(), process.env.AGENTS_CONFIG_FILE || "agents.config.json");

export interface AgentOverride { instructions?: string | undefined; prompt?: string | undefined; model?: string | undefined }
export type AgentTextKey = keyof AgentOverride;

export const readAgentOverrides = (): Record<string, AgentOverride> => readConfigOverride(AGENTS_CONFIG_FILE);

// texte modifié d'un agent, sinon celui par défaut
export const agentText = (id: string, key: AgentTextKey, fallback: string): string => readAgentOverrides()[id]?.[key] || fallback;

// instructions d'un agent Mastra (argument dynamique : évalué à chaque génération)
export const overridable = (id: string, defaults: string) => () => agentText(id, "instructions", defaults);

// modèle d'un agent : celui choisi dans l'onglet Workflow, sinon celui de l'étape ou de la configuration
export const agentModelId = (id: string, fallback: string): string => readAgentOverrides()[id]?.model || fallback;
// modèle d'un agent Mastra (argument dynamique) ; fallback : modèle par défaut, éventuellement donné par l'appel
// (contexte de requête « model »)
export const overridableModel = (id: string, fallback: (requestContext: any) => string) =>
  ({ requestContext }: any) => albertModel(agentModelId(id, fallback(requestContext)));

// enregistre les textes et le modèle d'un agent ; une valeur vide ou égale à celle par défaut est retirée du fichier
export function writeAgentOverride(id: string, values: AgentOverride, defaults: AgentOverride) {
  const all = readAgentOverrides();
  const kept: AgentOverride = {};
  for (const key of ["instructions", "prompt", "model"] as const) {
    const v = values[key];
    if (v && v.trim() && v !== defaults[key]) kept[key] = v;
  }
  if (Object.keys(kept).length) all[id] = kept; else delete all[id];
  fs.writeFileSync(AGENTS_CONFIG_FILE, JSON.stringify(all, null, 2) + "\n", "utf-8");
  return kept;
}
