// Instructions et demandes des agents modifiées depuis l'interface (onglet Workflow de chaque application), enregistrées
// dans agents.config.json : { "<id de l'agent>": { "instructions": "…", "prompt": "…" } }. Le fichier est relu à chaque
// appel : une modification vaut aussi pour les actions du serveur (éditeur d'écran…), sans redémarrage.
import fs from "fs";
import path from "path";
import { readConfigOverride } from "../config/store";

export const AGENTS_CONFIG_FILE = path.resolve(process.cwd(), process.env.AGENTS_CONFIG_FILE || "agents.config.json");

export interface AgentOverride { instructions?: string | undefined; prompt?: string | undefined }
export type AgentTextKey = keyof AgentOverride;

export const readAgentOverrides = (): Record<string, AgentOverride> => readConfigOverride(AGENTS_CONFIG_FILE);

// texte modifié d'un agent, sinon celui par défaut
export const agentText = (id: string, key: AgentTextKey, fallback: string): string => readAgentOverrides()[id]?.[key] || fallback;

// instructions d'un agent Mastra (argument dynamique : évalué à chaque génération)
export const overridable = (id: string, defaults: string) => () => agentText(id, "instructions", defaults);

// enregistre les textes d'un agent ; un texte vide ou égal à la valeur par défaut est retiré du fichier
export function writeAgentOverride(id: string, values: AgentOverride, defaults: AgentOverride) {
  const all = readAgentOverrides();
  const kept: AgentOverride = {};
  for (const key of ["instructions", "prompt"] as const) {
    const v = values[key];
    if (v && v.trim() && v !== defaults[key]) kept[key] = v;
  }
  if (Object.keys(kept).length) all[id] = kept; else delete all[id];
  fs.writeFileSync(AGENTS_CONFIG_FILE, JSON.stringify(all, null, 2) + "\n", "utf-8");
  return kept;
}
