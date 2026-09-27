// Surcharge de la configuration par défaut (config.ts) par le fichier workflow.config.json,
// modifiable depuis l'interface client (src/ui). Seules les valeurs différentes des défauts y sont enregistrées.
import fs from "fs";
import path from "path";

export const CONFIG_FILE = path.resolve(process.cwd(), process.env.WORKFLOW_CONFIG_FILE || "workflow.config.json");

// valeurs remplacées en bloc (et non fusionnées clé par clé) : on doit pouvoir y supprimer des entrées
export const REPLACED_PATHS = new Set(["kappa.codes", "annotationPositions", "omeka.vocabs", "steps"]);

const isObject = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);

export function mergeConfig<T>(defaults: T, override: any, prefix = ""): T {
  if (!isObject(defaults) || !isObject(override)) return (override === undefined ? defaults : override) as T;
  const out: Record<string, any> = { ...defaults };
  for (const [key, value] of Object.entries(override)) {
    const p = prefix ? `${prefix}.${key}` : key;
    out[key] = REPLACED_PATHS.has(p) || !isObject(out[key]) ? value : mergeConfig(out[key], value, p);
  }
  return out as T;
}

// différences entre une configuration et les défauts (ce qui sera enregistré dans workflow.config.json)
export function diffConfig(defaults: any, config: any, prefix = ""): any {
  if (!isObject(defaults) || !isObject(config) || REPLACED_PATHS.has(prefix)) {
    return JSON.stringify(defaults) === JSON.stringify(config) ? undefined : config;
  }
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(config)) {
    const d = diffConfig(defaults[key], value, prefix ? `${prefix}.${key}` : key);
    if (d !== undefined) out[key] = d;
  }
  return Object.keys(out).length ? out : undefined;
}

export function readConfigOverride(): any {
  try {
    return fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) : {};
  } catch (e) {
    console.warn(`⚠️ ${CONFIG_FILE} illisible, configuration par défaut utilisée :`, (e as Error).message);
    return {};
  }
}

export function writeConfigOverride(defaults: any, config: any) {
  const diff = diffConfig(defaults, config) ?? {};
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(diff, null, 2) + "\n", "utf-8");
  return diff;
}
