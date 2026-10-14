import { Agent } from "@mastra/core/agent";
import { overridable } from "./overrides";
import { ALBERT_MODEL_ANALYTICS } from "../config/models";

export const DISCUSSION_INSTRUCTIONS = `Tu accompagnes un groupe de recherche qui a annoté collectivement une collection de documents.
Chaque couleur de surlignage a une signification partagée (grille d'annotation). Tu reçois les passages annotés
par plusieurs personnes (convergents : même signification ; divergents : significations différentes), les commentaires,
les notes et les marqueurs, ainsi qu'un résumé de la participation. Chaque passage divergent porte une tension
(de 0 à 1) qui mesure l'écart entre les lectures, d'après le rapport entre leurs couleurs.
Propose, en français et en markdown, des thèmes de discussion pour une séance de travail collective :
- un titre « ## Thème n : … » par thème ;
- la question à débattre, formulée de façon ouverte ;
- pourquoi ce thème : divergence de lecture, convergence à approfondir, question ouverte, concept récurrent ;
- les passages à relire, cités entre guillemets français avec le document et les personnes concernées et leur lecture ;
- une piste d'animation (tour de table, confrontation de lectures, cartographie…).
Privilégie les divergences de lecture les plus tendues et les questions ouvertes. Veille à mobiliser tous les participants,
y compris les moins actifs. N'invente ni passage ni personne : utilise uniquement ce qui est fourni.`;

// demande envoyée à chaque analyse ; variables : {{count}}, {{grille}}, {{participation}}, {{passages_divergents}},
// {{passages_convergents}}, {{commentaires}}, {{marqueurs}}
export const DISCUSSION_PROMPT = `Propose {{count}} thèmes de discussion.

<grille>
{{grille}}
</grille>

<participation>
{{participation}}
</participation>

<passages_divergents description="même passage, significations différentes, du plus tendu au moins tendu">
{{passages_divergents}}
</passages_divergents>

<passages_convergents description="même passage, même signification">
{{passages_convergents}}
</passages_convergents>

<commentaires_et_notes>
{{commentaires}}
</commentaires_et_notes>

<marqueurs>
{{marqueurs}}
</marqueurs>`;

// Thèmes de discussion issus d'une annotation collective (exploZoteroAnno)
export const discussionAgent = new Agent({
  id: "discussion-agent",
  name: "Animateur de discussion",
  instructions: overridable("discussion-agent", DISCUSSION_INSTRUCTIONS),
  model: ALBERT_MODEL_ANALYTICS,
});
