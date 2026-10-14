// Tension entre deux lectures d'un même passage, d'après le rapport entre leurs couleurs sur le cercle chromatique
// (analogues, en carré, triadiques, complémentaires) ou une tension fixée pour une paire de significations
import type { ColorGrid } from "./annotationPositions";

export type ColorRelation = "identique" | "analogue" | "carre" | "triadique" | "complementaire" | "achromatique";
export interface TensionConfig { relations: Record<ColorRelation, number>; pairs: { a: string; b: string; tension: number }[] }

export const RELATION_LABELS: Record<ColorRelation | "fixee", string> = {
  identique: "identiques", analogue: "analogues", carre: "en carré", triadique: "triadiques",
  complementaire: "complémentaires", achromatique: "avec un gris", fixee: "tension fixée",
};

// teinte (degrés) et saturation (0-1) d'une couleur #rrggbb
function hueSat(hex: string): { h: number; s: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  if (!d) return { h: 0, s: 0 };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s };
}

export function colorRelation(c1: string, c2: string): ColorRelation | null {
  if (c1.toLowerCase() === c2.toLowerCase()) return "identique";
  const x = hueSat(c1), y = hueSat(c2);
  if (!x || !y) return null;
  if (x.s < 0.15 || y.s < 0.15) return "achromatique";
  const delta = Math.min(Math.abs(x.h - y.h), 360 - Math.abs(x.h - y.h));
  return delta < 45 ? "analogue" : delta < 105 ? "carre" : delta < 150 ? "triadique" : "complementaire";
}

// tension entre deux annotations (signification de la grille si connue, sinon couleur brute) ; null si indéterminée
export function tensionBetween(
  a: { position: string | null; color: string | null },
  b: { position: string | null; color: string | null },
  grid: ColorGrid,
  config: TensionConfig
): { tension: number; relation: ColorRelation | "fixee" } | null {
  if (a.position && a.position === b.position) return { tension: 0, relation: "identique" };
  const fixed = a.position && b.position
    ? config.pairs.find(p => (p.a === a.position && p.b === b.position) || (p.a === b.position && p.b === a.position))
    : undefined;
  if (fixed) return { tension: fixed.tension, relation: "fixee" };
  const colorOf = (x: typeof a) => grid.positions.find(p => p.position === x.position)?.color ?? x.color;
  const ca = colorOf(a), cb = colorOf(b);
  const relation = ca && cb ? colorRelation(ca, cb) : null;
  return relation ? { tension: config.relations[relation] ?? 0, relation } : null;
}

// tensions entre toutes les significations de la grille (aperçu dans l'onglet Grille)
export function tensionMatrix(grid: ColorGrid, config: TensionConfig) {
  const positions = grid.positions.map(p => ({ position: p.position, color: p.color, name: p.name }));
  return {
    positions,
    cells: positions.map(a => positions.map(b => {
      const t = tensionBetween(a, b, grid, config);
      return t ? { ...t, label: RELATION_LABELS[t.relation] } : null;
    })),
  };
}
