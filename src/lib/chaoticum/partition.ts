// Structure d'une partition chaoticumSeminario : suite d'écrans typés, regroupés en cycles, avec leur durée
import type { ChaoticumConfig, FrameType, ScreenType } from "../../config/chaoticum";
import type { Citation } from "./citations";
import type { Diapo } from "./slides";

export interface DiapoScreen extends Diapo {
  // copie d'écran (nom du fichier dans le dossier de la partition) et description par le modèle de vision
  screenshot: string | null;
  description: string;
}

export interface Screen {
  index: number;
  type: ScreenType | FrameType;
  // cycle : la question et le diagramme d'un cycle sont tirés de ses citations et de ses diapos (-1 : écran de cadre)
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
  // écran de cadre (introduction, argumentaire, conclusion) : titre, sous-titre, texte, points, intervenant, remerciements
  cadre?: FrameContent;
  // coût cumulé des traitements IA lancés depuis l'éditeur pour cet écran
  editCost?: EditCost;
}

export interface FrameContent {
  title: string;
  subtitle: string;
  text: string;
  points: string[];
  // intervenant et institution (introduction), remerciements (conclusion) : repris de la configuration
  credits?: string;
  thanks?: string;
}

// coût cumulé de traitements IA (tokens et estimation de estimateImpact)
export interface EditCost {
  treatments: number;
  tokens: number;
  energyWh: number;
  co2g: number;
  electricityCost: number;
  apiCost: number;
  currency: string;
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
  // coût de la génération (lanceur) et coût cumulé des traitements IA de l'éditeur, avec leur journal
  tokens?: { calls: number; input: number; output: number; total: number };
  impact?: Omit<EditCost, "treatments" | "tokens">;
  editCost?: EditCost;
  editCosts?: (Omit<EditCost, "treatments"> & { at: string; index: number; what: string })[];
}

// répartit une durée totale (secondes) selon des poids : arrondi à la seconde, 5 s au moins par écran,
// l'arrondi étant reporté sur le dernier écran
export function spreadDuration(weights: number[], total: number): number[] {
  const sum = weights.reduce((s, w) => s + w, 0) || 1;
  const durations = weights.map(w => Math.max(5, Math.round((total * w) / sum)));
  const last = durations.length - 1;
  durations[last] = Math.max(5, durations[last]! + total - durations.reduce((s, d) => s + d, 0));
  return durations;
}

// numéros et débuts des écrans après une modification ; renvoie la durée totale
export function retime(screens: Pick<Screen, "index" | "start" | "duration">[]): number {
  let start = 0;
  screens.forEach((x, i) => { x.index = i; x.start = start; start += x.duration; });
  return start;
}

// écrans de la partition (types, cycles, durées), avant tirage et génération
// les écrans de cadre (s'ils sont activés) prennent leur durée sur la durée totale : seul le reste est réparti ici
export function planScreens(c: Pick<ChaoticumConfig, "screens" | "durationMinutes" | "pattern" | "weights"> & { frame?: ChaoticumConfig["frame"] }): Screen[] {
  const pattern = c.pattern.length ? c.pattern : (["citation"] as ScreenType[]);
  const n = Math.max(1, Math.round(c.screens));
  const types = Array.from({ length: n }, (_, i) => pattern[i % pattern.length]!);
  const weight = (t: ScreenType) => Math.max(0.1, Number(c.weights[t]) || 1);
  const total = Math.max(1, Math.round(c.durationMinutes * 60));
  const durations = spreadDuration(types.map(weight), Math.max(5 * n, total - (c.frame ? frameSeconds(c.frame) : 0)));
  let start = 0;
  return types.map((type, index) => {
    const s: Screen = { index, type, cycle: Math.floor(index / pattern.length), duration: durations[index]!, start };
    start += durations[index]!;
    return s;
  });
}

// durée totale des écrans de cadre (0 s'ils sont désactivés)
export function frameSeconds(f: ChaoticumConfig["frame"]): number {
  if (!f?.enabled) return 0;
  return Object.values(f.durations ?? {}).reduce((s, d) => s + Math.max(5, Math.round(Number(d) || 0)), 0);
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
