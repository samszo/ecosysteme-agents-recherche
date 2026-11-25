// Écrans de cadre de toute séance chaoticumSeminario : introduction, argumentaire général, remerciements et conclusion.
// Insérés autour des cycles (durées de la configuration), rédigés en un appel par le Rédacteur du cadre à partir de
// toute la partition (questions, diagrammes, citations, diapos) et du thème de la conférence
import { z } from "zod";
import { frameAgent } from "../../agents/frameAgent";
import { askAgent } from "../../agents/ask";
import { FRAME_TYPES, type ChaoticumConfig, type FrameType } from "../../config/chaoticum";
import { retime, spreadDuration, type FrameContent, type Screen } from "./partition";
import { themeBlock, type Theme } from "./theme";

export const isFrame = (t: string): t is FrameType => (FRAME_TYPES as readonly string[]).includes(t);

const FIELDS: Record<FrameType, z.ZodTypeAny> = {
  introduction: z.object({
    title: z.string().describe("titre de l'écran d'introduction (titre de la conférence, éventuellement reformulé)"),
    subtitle: z.string().describe("sous-titre accrocheur, 12 mots au plus"),
    text: z.string().describe("deux ou trois phrases : la démarche et l'invitation à participer"),
  }),
  argumentaire: z.object({
    title: z.string().describe("titre de l'argumentaire général"),
    text: z.string().describe("résumé du propos d'ensemble, 60 mots au plus"),
    points: z.array(z.string()).describe("3 à 6 étapes du raisonnement, dans l'ordre des séquences, 12 mots au plus chacune"),
  }),
  conclusion: z.object({
    title: z.string().describe("titre de la conclusion"),
    text: z.string().describe("deux ou trois phrases qui ouvrent la discussion"),
    points: z.array(z.string()).describe("0 à 3 pistes pour la suite, 12 mots au plus chacune"),
  }),
};

// résumé des séquences de la partition (écrans de cadre exclus), dans l'ordre
function sequences(screens: Screen[]): string {
  const cycles = [...new Set(screens.filter(s => !isFrame(s.type)).map(s => s.cycle))].sort((a, b) => a - b);
  return cycles.map(cycle => {
    const inCycle = screens.filter(s => s.cycle === cycle && !isFrame(s.type));
    const lines = inCycle.flatMap(s =>
      s.citation ? [`- citation : « ${s.citation.text.slice(0, 220)}${s.citation.text.length > 220 ? "…" : ""} » — ${[s.citation.source.creators, s.citation.source.year, s.citation.source.title].filter(Boolean).join(", ")}`] :
      s.diapo ? [`- diapo : ${s.diapo.name}, diapo ${s.diapo.diapo}${s.diapo.description ? ` : ${s.diapo.description.slice(0, 220)}` : ""}`] :
      s.question ? [`- question : ${s.question.text}${s.question.intention ? ` (intention : ${s.question.intention})` : ""}`] :
      s.diagramme ? [`- diagramme : ${s.diagramme.title} (${[...s.diagramme.mermaid.matchAll(/\["([^"]+)"\]/g)].map(m => m[1]).slice(0, 14).join(", ")})`] :
      s.contribution?.instruction ? [`- appel à contributions : ${s.contribution.instruction}`] : []);
    return `<sequence numero="${cycle + 1}">\n${lines.join("\n") || "(vide)"}\n</sequence>`;
  }).join("\n\n");
}

// textes des écrans de cadre demandés (un seul appel) ; current : textes actuels à renouveler, hint : consigne de l'animateur
export async function composeFrame(
  p: { title: string; description?: string; screens: Screen[] },
  c: ChaoticumConfig,
  types: readonly FrameType[] = FRAME_TYPES,
  o: { theme?: Theme; hint?: string; current?: Partial<Record<FrameType, FrameContent>>; source?: string } = {},
): Promise<Partial<Record<FrameType, FrameContent>>> {
  const schema = z.object(Object.fromEntries(types.map(t => [t, FIELDS[t]])));
  const theme = o.theme ?? { title: p.title, description: p.description ?? "", programUrl: "", program: "" };
  const current = types.filter(t => o.current?.[t]).map(t => `${t} : ${o.current![t]!.title} — ${o.current![t]!.text}`);
  const { object } = await askAgent(frameAgent, {
    model: c.models.analytics, source: o.source ?? "Écrans de cadre (frameAgent)", schema,
    prompt: `Rédige ${types.map(t => ({ introduction: "l'introduction", argumentaire: "l'argumentaire général", conclusion: "la conclusion" })[t]).join(", ")} de la conférence.
${themeBlock(theme)}
${c.frame.presenter ? `Intervenant : ${c.frame.presenter}${c.frame.affiliation ? ` (${c.frame.affiliation})` : ""}\n` : ""}${current.length ? `Textes actuels, à renouveler :\n${current.join("\n")}\n` : ""}${o.hint ? `Consigne de l'animateur : ${o.hint}\n` : ""}
<sequences>
${sequences(p.screens) || "(aucune séquence générée)"}
</sequences>`,
  });
  const out: Partial<Record<FrameType, FrameContent>> = {};
  for (const t of types) {
    const x = (object as any)?.[t] ?? {};
    out[t] = {
      title: String(x.title ?? "").trim(),
      subtitle: String(x.subtitle ?? "").trim(),
      text: String(x.text ?? "").trim(),
      points: (Array.isArray(x.points) ? x.points : []).map((v: unknown) => String(v).trim()).filter(Boolean).slice(0, 6),
    };
  }
  return out;
}

// valeurs fixes de la configuration : intervenant (introduction), remerciements (conclusion)
export function frameDefaults(t: FrameType, c: ChaoticumConfig, title: string): FrameContent {
  const credits = [c.frame.presenter, c.frame.affiliation].filter(Boolean).join(" — ");
  return {
    title: t === "introduction" ? title : t === "argumentaire" ? "Argumentaire" : "Conclusion",
    subtitle: "", text: "", points: [],
    ...(t === "introduction" && credits ? { credits } : {}),
    ...(t === "conclusion" ? { thanks: c.frame.thanks } : {}),
  };
}

// écrans de cadre absents de la partition, insérés à leur place (introduction en tête, argumentaire au début ou à la
// fin, conclusion en dernier) ; keepTotal : la durée totale est conservée, les autres écrans sont réduits en proportion
export function insertFrames(screens: Screen[], c: ChaoticumConfig, title: string, keepTotal = false): FrameType[] {
  const missing = FRAME_TYPES.filter(t => !screens.some(s => s.type === t));
  if (!missing.length) return [];
  const total = retime(screens);
  const duration = (t: FrameType) => Math.max(5, Math.round(Number(c.frame.durations?.[t]) || 60));
  const make = (t: FrameType): Screen => ({ index: 0, type: t, cycle: -1, duration: duration(t), start: 0, cadre: frameDefaults(t, c, title) });
  if (keepTotal) {
    const body = screens.filter(s => !isFrame(s.type));
    const target = total - missing.reduce((n, t) => n + duration(t), 0) - screens.filter(s => isFrame(s.type)).reduce((n, s) => n + s.duration, 0);
    if (body.length && target >= 5 * body.length) spreadDuration(body.map(s => s.duration), target).forEach((d, i) => { body[i]!.duration = d; });
  }
  if (missing.includes("introduction")) screens.unshift(make("introduction"));
  if (missing.includes("argumentaire")) {
    const at = c.frame.argumentPosition === "debut"
      ? screens.findIndex(s => s.type === "introduction") + 1
      : (i => (i < 0 ? screens.length : i))(screens.findIndex(s => s.type === "conclusion"));
    screens.splice(at, 0, make("argumentaire"));
  }
  if (missing.includes("conclusion")) screens.push(make("conclusion"));
  retime(screens);
  return missing;
}

// textes rédigés reportés sur les écrans (intervenant et remerciements de la configuration conservés)
export function applyFrame(screens: Screen[], texts: Partial<Record<FrameType, FrameContent>>) {
  for (const s of screens) {
    if (isFrame(s.type) && texts[s.type]) s.cadre = { ...(s.cadre ?? { title: "", subtitle: "", text: "", points: [] }), ...texts[s.type]! };
  }
}
