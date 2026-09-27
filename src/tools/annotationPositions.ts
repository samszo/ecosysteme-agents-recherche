// Positionnement du chercheur déduit de la couleur d'une annotation (table dans config.ts)
import { workflowConfig } from "../config";

export type AnnotationPosition = (typeof workflowConfig.annotationPositions)[number];

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// positionnement dont la couleur est la plus proche (dans la tolérance), sinon null
export function positionForColor(hex: string | undefined | null): AnnotationPosition | null {
  const rgb = hex ? hexToRgb(hex) : null;
  if (!rgb) return null;
  let best: AnnotationPosition | null = null;
  let bestDist = Infinity;
  for (const p of workflowConfig.annotationPositions) {
    const c = hexToRgb(p.color)!;
    const dist = Math.hypot(rgb[0] - c[0], rgb[1] - c[1], rgb[2] - c[2]);
    if (dist < bestDist) {
      best = p;
      bestDist = dist;
    }
  }
  return bestDist <= workflowConfig.annotationColorTolerance ? best : null;
}
