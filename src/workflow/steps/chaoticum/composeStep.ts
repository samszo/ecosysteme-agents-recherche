import { createStep } from "@mastra/core/workflows";
import fs from "fs/promises";
import path from "path";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { albertModel } from "../../../config/models";
import { chaoticumConfig } from "../../../config/chaoticum";
import { recordUsage } from "../../../lib/metrics/usage";
import { cycleMaterial, type Screen } from "../../../lib/chaoticum/partition";
import { hasTheme, themeBlock, type Theme } from "../../../lib/chaoticum/theme";
import { buildMermaid, repairMermaid } from "../../../lib/chaoticum/mermaid";

// compatibilité : réparation d'un diagramme écrit directement en Mermaid
export const cleanMermaid = repairMermaid;

// le modèle décrit le diagramme (nœuds et liens) : le code Mermaid est construit par le programme, donc toujours valide
const GenerationSchema = z.object({
  question: z.string().describe("question ouverte posée au public : une seule phrase courte, 15 mots au plus, sans préambule"),
  intention: z.string().describe("en une phrase : ce que la question met en tension entre les citations et les diapos"),
  diagramTitle: z.string().describe("titre court du diagramme"),
  nodes: z.array(z.object({
    id: z.string().describe("identifiant court sans espace (ex. C1, D1, idee1)"),
    label: z.string().describe("libellé court, 6 mots au plus"),
  })).describe("6 à 14 idées issues des citations, des diapos et du thème"),
  edges: z.array(z.object({
    from: z.string().describe("identifiant du nœud de départ"),
    to: z.string().describe("identifiant du nœud d'arrivée"),
    label: z.string().optional().describe("relation en 1 à 3 mots (facultatif)"),
  })).describe("liens entre les idées"),
});

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// 2. Analyse : description des copies d'écran (vision), puis question et diagramme de chaque cycle (modèle analytique)
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
        const res = await generateText({
          model: albertModel(c.models.vision),
          messages: [{ role: "user", content: [
            { type: "text", text: "Décris en français cette diapositive d'une conférence de recherche : titre, textes lisibles, schémas et relations qu'ils montrent, idée principale. Réponds en un paragraphe de 120 mots au plus, sans inventer ce qui n'est pas visible." },
            { type: "file", data: image, mediaType: "image/png", filename: d.screenshot! },
          ] }],
        });
        d.description = res.text.trim();
        recordUsage("Description des diapos (vision)", c.models.vision, res.totalUsage ?? res.usage);
        console.log(`👁️ [VISION] ${d.name} ${d.diapo} : ${d.description.slice(0, 100)}…`);
      } catch (e) {
        console.warn(`⚠️ [VISION] Description impossible pour ${d.url} :`, (e as Error).message);
      }
    }

    // une génération par cycle qui contient un écran question ou diagramme
    // cycles dont la question ou le diagramme reste à générer (déjà faits par l'analyse de cohérence RAG)
    const cycles = [...new Set(screens.filter(s => (s.type === "question" && !s.question) || (s.type === "diagramme" && !s.diagramme)).map(s => s.cycle))];
    for (const cycle of cycles) {
      const { citations, diapos } = cycleMaterial(screens, cycle);
      if (!citations.length && !diapos.length) continue;
      try {
        const { object, usage } = await generateObject({
          model: albertModel(c.models.analytics),
          schema: GenerationSchema,
          prompt: `Tu prépares une séquence d'une conférence-performance participative, « ${c.title} ». Le public vient de voir les citations et les diapositives ci-dessous, tirées au hasard d'une bibliothèque de recherche et d'anciennes conférences.
Formule une question ouverte, courte et percutante (une seule phrase de 15 mots au plus, lisible d'un coup d'œil sur un grand écran), qui fait réagir le public en confrontant ces éléments (rapprochement inattendu, tension, prolongement)${theme && hasTheme(theme) ? " et en les rattachant au thème de la conférence" : ""}, puis un diagramme qui relie leurs idées, décrit par ses nœuds (idées courtes) et ses liens (relations).
N'invente ni auteur ni référence. Réponds en français.
${theme && hasTheme(theme) ? `\n${themeBlock(theme)}\n` : ""}
<citations>
${citations.map((ci, i) => `[C${i + 1}] « ${ci.text} »${ci.comment ? ` (commentaire : ${ci.comment})` : ""} — ${[ci.source.creators, ci.source.year, ci.source.title].filter(Boolean).join(", ")}`).join("\n") || "(aucune)"}
</citations>

<diapositives>
${diapos.map((d, i) => `[D${i + 1}] ${d.name}, diapo ${d.diapo} : ${d.description || "(description indisponible)"}`).join("\n") || "(aucune)"}
</diapositives>`,
        });
        recordUsage("Questions et diagrammes", c.models.analytics, usage);
        // question trop longue pour un grand écran : reformulée plus court (modèle de vision, rapide)
        let question = object.question.trim();
        if (words(question) > 15) {
          try {
            const short = await generateText({ model: albertModel(c.models.vision), prompt: `Raccourcis cette question à 15 mots au plus, sans en perdre le sens, et réponds uniquement par la question :\n${question}` });
            recordUsage("Raccourcissement des questions", c.models.vision, short.totalUsage ?? short.usage);
            const t = short.text.trim().replace(/^["«\s]+|["»\s]+$/g, "");
            if (t && words(t) < words(question)) question = t;
          } catch { /* question gardée telle quelle */ }
        }
        const mermaid = object.nodes?.length ? buildMermaid(object.nodes, object.edges ?? []) : "";
        for (const s of screens.filter(x => x.cycle === cycle)) {
          if (s.type === "question") s.question = { text: question, intention: object.intention.trim() };
          if (s.type === "diagramme" && mermaid) s.diagramme = { title: object.diagramTitle.trim(), mermaid };
        }
        console.log(`❓ [CYCLE ${cycle + 1}] ${object.question}`);
      } catch (e) {
        console.warn(`⚠️ Génération impossible pour le cycle ${cycle + 1} :`, (e as Error).message);
      }
    }
    return { screens };
  },
});
