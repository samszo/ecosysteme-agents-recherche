// Structure d'une partition chaoticumSeminario : suite d'écrans typés, regroupés en cycles, avec leur durée
import type { ChaoticumConfig, ScreenType } from "../../config/chaoticum";
import type { Citation } from "./citations";
import type { Diapo } from "./slides";

export interface DiapoScreen extends Diapo {
  // copie d'écran (nom du fichier dans le dossier de la partition) et description par le modèle de vision
  screenshot: string | null;
  description: string;
}

export interface Screen {
  index: number;
  type: ScreenType;
  // cycle : la question et le diagramme d'un cycle sont tirés de ses citations et de ses diapos
  cycle: number;
  // durée prévue et début prévu (secondes depuis le début de la séance)
  duration: number;
  start: number;
  citation?: Citation;
  diapo?: DiapoScreen;
  question?: { text: string; intention: string };
  diagramme?: { title: string; mermaid: string };
  // écran de contributions : consigne affichée au public (éditeur d'écran)
  contribution?: { instruction: string };
}

export interface Partition {
  runId: string;
  workflowId: string;
  title: string;
  description?: string;
  programUrl?: string;
  // choix des citations et des diapos : "theme" (orienté par le titre, la description et le programme) ou "hasard"
  selection?: string;
  createdAt: string;
  // dernière modification d'un écran (éditeur de partition)
  modifiedAt?: string;
  seed: string;
  durationSeconds: number;
  timer: ChaoticumConfig["timer"];
  grist: ChaoticumConfig["grist"];
  siteUrl: string;
  citationsScope: { scope: string; collection: string };
  screens: Screen[];
}

// écrans de la partition (types, cycles, durées), avant tirage et génération
export function planScreens(c: Pick<ChaoticumConfig, "screens" | "durationMinutes" | "pattern" | "weights">): Screen[] {
  const pattern = c.pattern.length ? c.pattern : (["citation"] as ScreenType[]);
  const n = Math.max(1, Math.round(c.screens));
  const types = Array.from({ length: n }, (_, i) => pattern[i % pattern.length]!);
  const weight = (t: ScreenType) => Math.max(0.1, Number(c.weights[t]) || 1);
  const total = Math.max(1, Math.round(c.durationMinutes * 60));
  const sum = types.reduce((s, t) => s + weight(t), 0);
  // durées arrondies à la seconde, l'arrondi étant reporté sur le dernier écran
  const durations = types.map(t => Math.max(5, Math.round((total * weight(t)) / sum)));
  durations[n - 1] = Math.max(5, durations[n - 1]! + total - durations.reduce((s, d) => s + d, 0));
  let start = 0;
  return types.map((type, index) => {
    const s: Screen = { index, type, cycle: Math.floor(index / pattern.length), duration: durations[index]!, start };
    start += durations[index]!;
    return s;
  });
}

// matière d'un cycle : ses citations et ses diapos, à défaut celles des cycles précédents
export function cycleMaterial(screens: Screen[], cycle: number) {
  for (let c = cycle; c >= 0; c--) {
    const inCycle = screens.filter(s => s.cycle === c);
    const citations = inCycle.flatMap(s => (s.citation ? [s.citation] : []));
    const diapos = inCycle.flatMap(s => (s.diapo ? [s.diapo] : []));
    if (citations.length || diapos.length) return { citations, diapos };
  }
  return { citations: [], diapos: [] };
}
