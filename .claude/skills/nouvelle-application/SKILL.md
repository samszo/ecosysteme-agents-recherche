---
name: nouvelle-application
description: Créer une nouvelle application de l'écosystème d'agents de recherche (workflow Mastra + lanceur + page + serveur dédié + configuration + Omeka S + coût), sur le modèle de paper / explo / chaoticum. À utiliser dès qu'on demande un « nouveau workflow », une « nouvelle application », un nouvel outil de recherche branché sur Zotero/Albert/Omeka (ex. recocita), ou qu'on veut répliquer le socle dans un autre projet.
---

# Nouvelle application sur le modèle de l'écosystème

Une application = **un identifiant court** (`<app>`, minuscules, ex. `recocita`) + un `workflowId` (kebab-case, ex. `recocita`) + un port. Elle réutilise tout le socle (connexions Albert/Zotero/Omeka, coût, onglet Workflow, item de configuration Omeka, archives). Les gabarits de code sont dans `references/gabarits.md`.

## 0. Cadrer avant de coder

1. Lire `docs/technique.md` (sections 1-3, 8-11) et l'application la plus proche (explo = analyse d'une collection annotée ; chaoticum = génération + éditeur + routes riches ; paper = chaîne de rédaction).
2. Écrire le diagramme des étapes (qui est parallèle, qui dépend de quoi), les agents nécessaires (rôle, modèle `analytique` | `rapide` | `vision`), les fichiers produits, ce qui va dans Omeka S, et les **actions interactives** (validation par l'utilisateur après l'exécution → routes serveur, pas étapes du workflow).
3. Repérer ce qui est réutilisable : `fetchLiteratureStep` (collection Zotero → articles + annotations + Omeka), `fetchZoteroData`, `positionForColor` / grille de couleurs (`src/lib/analysis/annotationPositions.ts`), `chunkText`, `extractAttachment`, `Albert` (RAG), `compileCollection` (BibTeX). Ne pas dupliquer : paramétrer la brique commune (comme `exploGrid()` passé à `positionForColor`).
4. Si une décision de conception est ambiguë (port, grille de couleurs, ce qui est enregistré), la proposer avec une recommandation plutôt que deviner en silence.

## 1. Checklist des points de branchement

Faire **tous** les points ; un oubli donne une route 404, un onglet Workflow vide ou un coût non compté.

**Configuration**
- [ ] `src/config/<app>.ts` : `<APP>_CONFIG_FILE`, `default<App>Config` (avec `workflowId`, `input`, `outputDir: "resultats/<app>"`, `models` si spécifiques, sections commentées), `<app>Config = mergeConfig(default…, readConfigOverride(FILE))`, `export type <App>Config`, `RUNS_DIR` si archives. Réutiliser `workflowConfig.models/costs/omeka` plutôt que les recopier.
- [ ] Les tableaux sont toujours remplacés en bloc par `mergeConfig` ; un **objet-dictionnaire** dont l'utilisateur doit pouvoir supprimer des clés (comme `costs.models`) → ajouter son chemin à `REPLACED_PATHS` (`src/config/store.ts`).

**Workflow**
- [ ] `src/workflow/steps/<app>/<nom>Step.ts` : une étape par fichier, `createStep({ id, execute })`, outils appelés en direct, logs emoji.
- [ ] `src/workflow/<app>Workflow.ts` : `createWorkflow({ id: <app>Config.workflowId, inputSchema } as any).then(…).parallel([…]).commit()`.
- [ ] `src/workflow/index.ts` : ré-export.
- [ ] Outils Mastra éventuels dans `src/tools/` + `src/tools/index.ts` ; fonctions non-outils dans `src/lib/<domaine>/`.

**Agents** (skill `agent-albert`)
- [ ] `src/agents/<nom>Agent.ts` + `src/agents/index.ts`.
- [ ] `AGENTS` dans `src/workflow/diagrams.ts` (usageTag, estimate…) et **`DIAGRAMS.<app>`** (stages = ordre réel du workflow, outside = actions de l'interface) ; élargir le type `Record<"paper" | "explo" | "chaoticum" | "<app>", …>`.

**Lanceur**
- [ ] `src/runners/<app>.ts` : `import "dotenv/config"`, `saveWorkflowConfig` → `run.start` → fichiers → `usageSummary` / `appendUsageHistory("<app>", …)` / `estimateImpact` → rapport → archive `resultats/<app>/<RUNS_DIR>/<runId>/` → `updateWorkflowStatus` + `attachDocuments` (skill `persistance-omeka`). En cas d'échec, logguer exactement `❌ Le workflow a échoué` (le serveur le détecte).
- [ ] `src/workflow/reports/<app>Report.ts` : rapport markdown (statut, durée, résultats, tableau de consommation, coût).
- [ ] `src/lib/metrics/usageHistory.ts` : ajouter `"rapport_<app>.md": "<app>"` à `REPORTS`.

**Serveur** (`src/ui/server.ts`)
- [ ] Constante `<APP>_ENV_FILE = process.env.<APP>_ENV_FILE || ".env.<app>"`.
- [ ] Entrée dans `APPS` : `label`, `script`, `page`, `envFiles: [".env", <APP>_ENV_FILE]`, `portKey: "<APP>_PORT"`, `hostKey`, `defaultPort`, `urlKey: "<APP>_URL"`.
- [ ] `APP_CONFIG` : `current`, `defaults`, `file` (et `current<App>Config`).
- [ ] `appUrls()` : ajouter `<APP>_ENV_FILE` à la liste des fichiers lus.
- [ ] `ENV_FIELDS` : nouvelles clés propres à l'app sous `...(APP === "<app>" ? [...] : [])` (skill `connecteur-api`).
- [ ] `checkConnections()` : test de toute nouvelle API.
- [ ] `TASKS.<app>` si traitements secondaires lancés par `POST /api/run?task=`.
- [ ] `GET /api/workflow` / `POST /api/workflow/agent` : si l'app a des modèles propres (vision…), les intégrer à `allModels` comme pour chaoticum.
- [ ] Routes propres : préfixe `/api/<app>/…`. Peu nombreuses → dans `routes` + `APP_ONLY`. Nombreuses → `src/ui/<app>Routes.ts` exportant `<app>Routes(ctx)` (modèle `chaoticumRoutes.ts`), puis `Object.assign(routes, X)` et `APP_ONLY` généré depuis ses clés.
- [ ] Au minimum : `GET/POST /api/<app>/settings`, `GET /api/<app>/runs`, `GET /api/<app>/results?run=`, `GET /api/<app>/file?name=&run=` (liste blanche de noms, `run` validé `[\w-]`, repli sur les médias Omeka).

**Interface**
- [ ] `src/ui/public/<app>.html` : partir de `explo.html` (onglets `data-tab`, journal SSE, `workflowDiagram.js` pour l'onglet Workflow, onglet Analyses/historique, rendu markdown via `marked`), `--accent` propre.
- [ ] `src/ui/public/settings.html` : `:root[data-app="<app>"] { --accent: … }` (clair et sombre).
- [ ] Liens croisés : ajouter `<a id="link-<app>">` et `a.apps.<app>.url` dans les autres pages.

**Lancement, débogage, conteneur**
- [ ] `package.json` : `"<app>": "tsx src/runners/<app>.ts"`, `"ui:<app>": "tsx src/ui/server.ts <app>"`.
- [ ] `.claude/launch.json` : `ui-<app>` (port défaut) et `ui-<app>-test` (port de test libre).
- [ ] `.vscode/launch.json` : « Workflow : <app> », « Interface : <app> (728x) », compound, et `<APP>_PORT`/`<APP>_URL` dans les `env` des autres interfaces.
- [ ] `Dockerfile` : commande `workflow-<app>` (et healthcheck : port selon `WORKFLOW_APP`).
- [ ] `docker-compose.yml` : service `<app>` (`WORKFLOW_APP`, `HOST: 0.0.0.0`, `<APP>_PORT`, port publié sur `127.0.0.1`).
- [ ] `.gitignore` et `.dockerignore` : `.env.<app>`, `<app>.config.json`.
- [ ] `.env.example` : nouvelles clés (vides).

**Documentation** (obligatoire)
- [ ] `docs/technique.md` : tableau des applications (en-tête), arborescence (section 3), agents, nouvelle section « Workflow <app> » (diagramme mermaid, tableau des éléments, clés de config, routes), modèle de données si nouvelles classes, section 14 (docker).
- [ ] `docs/utilisateur.md`, `docs/installation.md`, `README.md` (schéma mermaid + démarrage rapide), puis `npm run docs`.

## 2. Vérifier

1. `npm run <app>` en ligne de commande avec une petite collection : le workflow va au bout, `resultats/<app>/` contient les fichiers et le rapport, la consommation n'est pas nulle.
2. `preview_start` sur `ui-<app>-test` : page, ⚙ Paramètres (test des connexions), onglet Workflow (diagramme + agents + coût estimé), lancement et journal SSE, onglet résultats, liens vers les autres apps. Vérifier qu'une route `/api/<app>/…` répond 404 sur un autre serveur.
3. Dans Omeka S : item « Configuration <workflowId> – … », statut `success`, `curation:data` (tokens, impact), médias.

## 3. Répliquer le socle dans un autre dépôt

Copier `src/config/{index,store,models}.ts`, `src/agents/{ask,overrides}.ts`, `src/lib/{albert,zotero,omeka,metrics,extraction}/`, `src/workflow/{runs,diagrams.ts}`, `src/ui/{server.ts,public/settings.html,public/workflowDiagram.js}`, `scripts/build-docs.ts`, `Dockerfile`, `docker/`, `docker-compose.yml`, ce `CLAUDE.md` et `.claude/skills/`. Retirer les apps inutiles de `APPS`/`DIAGRAMS`/`APP_ONLY`, puis suivre la checklist ci-dessus pour la première application.
