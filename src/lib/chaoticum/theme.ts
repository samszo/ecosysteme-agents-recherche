// Thème de la conférence (titre, description, programme) et choix des citations et des présentations qui s'en
// rapprochent le plus (modèle analytique), le hasard départageant les candidats retenus
import { z } from "zod";
import { curatorAgent } from "../../agents/curatorAgent";
import { askAgent } from "../../agents/ask";
import { extractAttachment } from "../extraction/attachmentExtract";
import type { ChaoticumConfig } from "../../config/chaoticum";

export interface Theme {
  title: string;
  description: string;
  programUrl: string;
  // texte du programme (extrait de la page ou du PDF), tronqué
  program: string;
}

// thème de la conférence ; le programme est téléchargé et son texte extrait (page web ou PDF)
export async function loadTheme(c: Pick<ChaoticumConfig, "title" | "description" | "programUrl">, maxChars = 6000): Promise<Theme> {
  let program = "";
  if (c.programUrl) {
    try {
      const res = await fetch(c.programUrl, { headers: { "User-Agent": "Mozilla/5.0 (chaoticumSeminario)" }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get("content-type") ?? "text/html";
      const name = new URL(c.programUrl).pathname.split("/").pop() || "programme.html";
      program = (await extractAttachment(Buffer.from(await res.arrayBuffer()), type.split(";")[0]!, name)).text.replace(/\s+/g, " ").trim().slice(0, maxChars);
      console.log(`📅 Programme des conférences : ${program.length} caractères extraits de ${c.programUrl}`);
    } catch (e) {
      console.warn(`⚠️ Programme des conférences illisible (${c.programUrl}) :`, (e as Error).message);
    }
  }
  return { title: c.title, description: c.description, programUrl: c.programUrl, program };
}

export const hasTheme = (t: Theme) => !!(t.description || t.program || (t.title && t.title !== "Chaoticum Seminario"));

export function themeBlock(t: Theme) {
  return `<conference>
Titre : ${t.title}
${t.description ? `Description : ${t.description}\n` : ""}${t.program ? `Programme des conférences (extrait) : ${t.program}\n` : ""}</conference>`;
}

const Choice = z.object({ choix: z.array(z.number().int()).describe("numéros retenus, du plus au moins pertinent") });

// numéros des candidats les plus proches du thème (n au plus), dans l'ordre de pertinence ; [] si le modèle échoue
export async function rankByTheme(theme: Theme, candidates: string[], n: number, what: string, model: string, source: string): Promise<number[]> {
  if (!candidates.length) return [];
  try {
    const { object } = await askAgent(curatorAgent, {
      model, source: `${source} (curatorAgent)`, schema: Choice,
      prompt: `Parmi les ${what} numérotés ci-dessous, choisis les ${n} plus en rapport avec le thème de la conférence.

${themeBlock(theme)}

<candidats>
${candidates.map((t, i) => `[${i + 1}] ${t}`).join("\n")}
</candidats>`,
    });
    const seen = new Set<number>();
    return object.choix.map(i => i - 1).filter(i => i >= 0 && i < candidates.length && !seen.has(i) && (seen.add(i), true)).slice(0, n);
  } catch (e) {
    console.warn(`⚠️ Choix par thème impossible (${what}) : tirage au hasard.`, (e as Error).message);
    return [];
  }
}
