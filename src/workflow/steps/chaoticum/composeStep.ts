import { createStep } from "@mastra/core/workflows";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { chaoticumConfig } from "../../../config/chaoticum";
import { slideDescriberAgent } from "../../../agents/slideDescriberAgent";
import { seminarioAgent } from "../../../agents/seminarioAgent";
import { askAgent } from "../../../agents/ask";
import { cycleMaterial, type Screen } from "../../../lib/chaoticum/partition";
import { hasTheme, themeBlock, type Theme } from "../../../lib/chaoticum/theme";
import { buildMermaid, repairMermaid, type DiagramEdge } from "../../../lib/chaoticum/mermaid";
import { diagramFields, shortenQuestion } from "../../../lib/chaoticum/generation";

// compatibilité : réparation d'un diagramme écrit directement en Mermaid
export const cleanMermaid = repairMermaid;

const VisionSchema = z.object({
  titre: z.string().describe("titre de la diapositive, ou idée principale en quelques mots"),
  motsCles: z.array(z.string()).describe("5 à 10 mots-clés"),
  description: z.string().describe("description en 120 mots au plus"),
});

// le modèle décrit le diagramme (nœuds et liens) : le code Mermaid est construit par le programme, donc toujours valide
const GenerationSchema = z.object({
  question: z.string().describe("question ouverte posée au public : une seule phrase courte, 15 mots au plus"),
  intention: z.string().describe("en une phrase : ce que la question met en tension entre les citations et les diapos"),
  ...diagramFields,
});

// 2. Analyse (génération sans index RAG) : description des copies d'écran (slideDescriberAgent), puis question et
// diagramme de chaque cycle (seminarioAgent) ; ne fait que ce que l'analyse de cohérence RAG n'a pas déjà produit
export const composeStep = createStep({
  id: "compose",
  execute: async ({ inputData }) => {
    const c = chaoticumConfig;
    const { screens, dir, theme } = inputData as { screens: Screen[]; seed: string; dir: string; theme?: Theme };

    // diapos déjà décrites (index RAG) : pas de nouvelle analyse d'image
    for (const s of screens.filter(x => x.diapo?.screenshot && !x.diapo.description)) {
      const d = s.diapo!;
      try {
        const image = await fs.readFile(path.join(dir, d.screenshot!));
        const { object } = await askAgent(slideDescriberAgent, {
          model: c.models.vision, source: "Description des diapos (slideDescriberAgent)", schema: VisionSchema,
          prompt: [{ role: "user", content: [
            { type: "text", text: `Diapositive ${d.diapo} de la présentation « ${d.name} ».` },
            { type: "file", data: image, mediaType: "image/png", filename: d.screenshot! },
          ] }],
        });
        d.description = `${object.titre}. ${object.description}`;
        console.log(`👁️ [VISION] ${d.name} ${d.diapo} : ${d.description.slice(0, 100)}…`);
      } catch (e) {
        console.warn(`⚠️ [VISION] Description impossible pour ${d.url} :`, (e as Error).message);
      }
    }

    // cycles dont la question ou le diagramme reste à générer (déjà faits par l'analyse de cohérence RAG)
    const cycles = [...new Set(screens.filter(s => (s.type === "question" && !s.question) || (s.type === "diagramme" && !s.diagramme)).map(s => s.cycle))];
    for (const cycle of cycles) {
      const { citations, diapos } = cycleMaterial(screens, cycle);
      if (!citations.length && !diapos.length) continue;
      try {
        const { object } = await askAgent(seminarioAgent, {
          model: c.models.analytics, source: "Questions et diagrammes (seminarioAgent)", schema: GenerationSchema,
          prompt: `Séquence ${cycle + 1} de la conférence « ${c.title} ». Le public vient de voir les citations et les diapositives ci-dessous.
Formule la question, son intention et le diagramme de la séquence${theme && hasTheme(theme) ? ", en les rattachant au thème de la conférence" : ""}.
${theme && hasTheme(theme) ? `\n${themeBlock(theme)}\n` : ""}
<citations>
${citations.map((ci, i) => `[C${i + 1}] « ${ci.text} »${ci.comment ? ` (commentaire : ${ci.comment})` : ""} — ${[ci.source.creators, ci.source.year, ci.source.title].filter(Boolean).join(", ")}`).join("\n") || "(aucune)"}
</citations>

<diapositives>
${diapos.map((d, i) => `[D${i + 1}] ${d.name}, diapo ${d.diapo} : ${d.description || "(description indisponible)"}`).join("\n") || "(aucune)"}
</diapositives>`,
        });
        const question = await shortenQuestion(object.question.trim(), c.models.vision);
        const mermaid = object.nodes?.length ? buildMermaid(object.nodes, (object.edges ?? []) as DiagramEdge[]) : "";
        for (const s of screens.filter(x => x.cycle === cycle)) {
          if (s.type === "question") s.question = { text: question, intention: object.intention.trim() };
          if (s.type === "diagramme" && mermaid) s.diagramme = { title: object.diagramTitle.trim(), mermaid };
        }
        console.log(`❓ [CYCLE ${cycle + 1}] ${question}`);
      } catch (e) {
        console.warn(`⚠️ Génération impossible pour le cycle ${cycle + 1} :`, (e as Error).message);
      }
    }
    return { screens };
  },
});
