import { createStep } from "@mastra/core/workflows";
import { discussionAgent } from "../../../agents/discussionAgent";
import { formatAnnotations } from "../../../tools/buildLLMWiki";
import { recordUsage } from "../../../lib/metrics/usage";
import { workflowConfig } from "../../../config";
import { exploConfig, exploGrid } from "../../../config/explo";

// Thèmes de discussion (agent) à partir des passages communs, des notes et de la participation
export const themesStep = createStep({
  id: "themes",
  execute: async ({ inputData, getStepResult }) => {
    // après un .parallel(), inputData regroupe les sorties des étapes par id
    const participation: any = inputData["participation"] ?? {};
    const collaboration: any = inputData["collaboration"] ?? {};
    const literature: any = getStepResult("fetch-literature") ?? {};
    const { count, maxPassages } = exploConfig.themes;

    const passage = (u: any) =>
      `- « ${u.phrase} » (${u.document}) — ${u.annotations.map((a: any) => `${a.author} : ${a.position ?? "couleur hors grille"}${a.note ? ` (« ${a.note} »)` : ""}`).join(" ; ")}`;
    const divergent = (collaboration.divergent ?? []).slice(0, Math.ceil(maxPassages * 0.6));
    const convergent = (collaboration.convergent ?? []).slice(0, maxPassages - divergent.length);

    // notes et surlignages commentés, regroupés par signification (réutilise formatAnnotations et la grille)
    const commented = (literature.articles ?? []).flatMap((a: any) =>
      (a.annotations ?? []).filter((x: any) => x.note).map((x: any) => ({ ...x, note: `${x.note} [${x.author ?? "?"}, ${a.title}]` }))
    );
    const tags = new Map<string, number>();
    for (const a of literature.articles ?? []) for (const t of a.tags ?? []) tags.set(t, (tags.get(t) ?? 0) + 1);

    if (!divergent.length && !convergent.length && !commented.length) {
      console.log("⚠️ Pas de passage commun ni de commentaire : thèmes de discussion non générés.");
      return { themes: "", participation, collaboration };
    }

    console.log("🧠 Agent : Thèmes de discussion...");
    const res = await discussionAgent.generate(`Propose ${count} thèmes de discussion.

<grille>
${exploGrid().positions.map(p => `- ${p.name} = ${p.position} : ${p.instruction}`).join("\n")}
</grille>

<participation>
${(participation.collaborators ?? []).map((c: any) => `- ${c.name} : ${c.annotations} surlignage(s), ${c.notes} note(s), ${c.documents} document(s)`).join("\n")}
</participation>

<passages_divergents description="même passage, significations différentes">
${divergent.map(passage).join("\n") || "(aucun)"}
</passages_divergents>

<passages_convergents description="même passage, même signification">
${convergent.map(passage).join("\n") || "(aucun)"}
</passages_convergents>

<commentaires_et_notes>
${formatAnnotations(commented, 8000, exploGrid()) || "(aucun)"}
</commentaires_et_notes>

<marqueurs>
${[...tags].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([t, n]) => `${t} (${n})`).join(", ") || "(aucun)"}
</marqueurs>`);
    recordUsage("Thèmes de discussion (discussionAgent)", workflowConfig.models.analytics, (res as any).totalUsage ?? res.usage);
    return { themes: res.text, participation, collaboration };
  },
});
