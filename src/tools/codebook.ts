// Grille d'annotation des positionnements argumentatifs (codes ACC-S, DES-F…, cf. config.kappa.codes)
import { workflowConfig } from "../config";

const CODES = new Map(Object.keys(workflowConfig.kappa.codes).map(c => [c.toUpperCase(), c]));

// code de la grille correspondant à un marqueur, sinon null
export function toCode(tag: string): string | null {
  return CODES.get(tag.trim().toUpperCase()) ?? null;
}

// sépare les marqueurs en code de la grille (le premier trouvé) et marqueurs ordinaires (concepts)
export function splitCodes(tags: string[]): { code: string | null; tags: string[] } {
  let code: string | null = null;
  const rest: string[] = [];
  for (const tag of tags) {
    const c = toCode(tag);
    if (c) code ??= c;
    else rest.push(tag);
  }
  return { code, tags: rest };
}

export function codeLabel(code: string): string {
  return workflowConfig.kappa.codes[code] ?? code;
}
