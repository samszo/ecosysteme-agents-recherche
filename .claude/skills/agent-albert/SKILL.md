---
name: agent-albert
description: Ajouter ou modifier un agent Mastra de l'écosystème (modèles Albert) — instructions modifiables depuis l'onglet Workflow, gabarit de demande à {{variables}}, sortie structurée zod, comptage des tokens et estimation du coût. À utiliser pour tout nouvel appel à un modèle de langage (analyse, rédaction, vision, choix, vérification) dans une étape, une route du serveur ou une bibliothèque.
---

# Agent Albert

Règle d'or : **un appel modèle = un agent déclaré + un `recordUsage`**. Pas d'appel `fetch` direct aux complétions dans une étape (seule exception historique : le RAG d'explo via `Albert.chat`, déclaré quand même comme `rag-assistant` dans `AGENTS`).

## 1. Le fichier de l'agent — `src/agents/<nom>Agent.ts`

Modèles : `src/agents/discussionAgent.ts` (demande-gabarit) et `src/agents/seminarioAgent.ts` (modèle passé par l'appel, sortie structurée).

```ts
import { Agent } from "@mastra/core/agent";
import { overridable, overridableModel } from "./overrides";
import { workflowConfig } from "../config";

// consignes stables : rôle, style, contraintes, langue ; jamais les données
export const MON_AGENT_INSTRUCTIONS = `Tu … Tu réponds en français.
N'invente ni référence ni passage : utilise uniquement ce qui est fourni.`;

// facultatif : demande modifiable dans l'onglet Workflow ; variables : {{a}}, {{b}}
export const MON_AGENT_PROMPT = `…
<a>
{{a}}
</a>`;

// <rôle en une ligne> (<application>)
export const monAgent = new Agent({
  id: "mon-agent",                       // kebab-case, = clé dans AGENTS et agents.config.json
  name: "Nom affiché",
  instructions: overridable("mon-agent", MON_AGENT_INSTRUCTIONS),
  // modèle : celui choisi dans l'onglet Workflow, sinon celui passé par l'appel (askAgent), sinon le défaut
  model: overridableModel("mon-agent", rc => rc?.get?.("model") ?? workflowConfig.models.analytics),
});
```

Puis l'exporter dans `src/agents/index.ts`.

- Consignes stables dans les **instructions** ; données dans la **demande**, balisées en pseudo-XML (`<citations>…</citations>`), éléments numérotés (`[C1]`, `[D2]`) quand l'agent doit choisir.
- Toujours une consigne anti-hallucination (« N'invente ni … »), surtout pour les références bibliographiques.
- Modèle : `workflowConfig.models.analytics` (raisonnement, rédaction), `.fast` (reformulation, tri simple), modèle de vision de la config de l'app pour les images.

## 2. L'appeler

**Sortie structurée (préféré)** — `askAgent` (`src/agents/ask.ts`) compte les tokens tout seul :

```ts
import { z } from "zod";
import { askAgent } from "../../../agents/ask";
import { monAgent } from "../../../agents/monAgent";

const Schema = z.object({ references: z.array(z.object({ title: z.string(), reason: z.string() })) });

const { object } = await askAgent(monAgent, {
  model: cfg.models.analytics,
  source: "Suggestion de références (monAgent)",   // contient l'usageTag « (monAgent) »
  schema: Schema,
  prompt: `…données balisées…`,                      // ou Message[] avec { type: "file", data, mediaType } pour une image
});
```

**Gabarit modifiable** — comme `themesStep.ts` :

```ts
const prompt = agentText("mon-agent", "prompt", MON_AGENT_PROMPT);
const vars: Record<string, string> = { a: "…", b: "…" };
const { text } = await askAgent(monAgent, { model, source: "… (monAgent)", prompt: prompt.replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] ?? m) });
```

Une variable vide doit valoir `"(aucun)"`, pas une chaîne vide. Si l'agent est appelé sans `askAgent` (`agent.generate`), appeler soi-même `recordUsage(source, agentModelId("mon-agent", modèle), res.totalUsage ?? res.usage)`.

Appels nombreux (un par annotation, par diapo…) : limiter la concurrence (4 en parallèle comme `slidesIndex`), entourer chaque appel d'un `try/catch` qui loggue `⚠️` et continue.

## 3. Le déclarer — `src/workflow/diagrams.ts`

1. Importer `MON_AGENT_INSTRUCTIONS` (et `MON_AGENT_PROMPT`).
2. Ajouter à `AGENTS` :

```ts
"mon-agent": { id: "mon-agent", usageTag: "(monAgent)", estimate: { inputTokens: 1500, outputTokens: 500, callsPerRun: 10 },
  name: "Nom affiché", role: "ce qu'il fait, en minuscules", model: "analytique",
  instructions: MON_AGENT_INSTRUCTIONS, prompt: MON_AGENT_PROMPT,
  promptHelp: "Variables : {{a}} (…), {{b}} (…).",
  note: "La demande contient … ; la réponse suit un schéma (…)." },
```

   `estimate` sert au coût prévisionnel tant qu'aucune exécution n'existe : estimer honnêtement (`callsPerRun` = nombre d'appels pour une exécution typique). `usageTag` doit apparaître dans **toutes** les `source` de ses appels.
3. Référencer l'agent dans `DIAGRAMS.<app>` : `agents: ["mon-agent"]` sur l'étape (stages) ou dans `outside` s'il est appelé par une route du serveur.
4. Si l'agent utilise un modèle propre à l'application (ex. vision), étendre `allModels` / `defaultModel` dans `GET /api/workflow` et `POST /api/workflow/agent` (`src/ui/server.ts`).

## 4. Documenter et vérifier

- Ligne dans le tableau « Agents » de `docs/technique.md` (agent, modèle, rôle).
- Onglet Workflow de l'application : l'agent apparaît avec ses instructions, sa demande, son modèle et un coût estimé ; modifier puis « Rétablir » fonctionne (fichier `agents.config.json`).
- Après une exécution : la ligne `… (monAgent)` figure dans le tableau de consommation du rapport, avec des tokens non nuls.
