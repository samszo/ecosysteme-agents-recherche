# Gabarits d'une nouvelle application

Remplacer `<app>` (identifiant, ex. `recocita`), `<App>` (PascalCase), `<APP>` (majuscules), `<workflow-id>`. Ces gabarits reprennent le code existant : en cas de doute, le fichier cité fait foi.

## `src/config/<app>.ts` (modèle : `src/config/explo.ts`)

```ts
// Configuration du workflow <app> : <rôle en une phrase>
// Valeurs par défaut ; l'application cliente enregistre les modifications dans <app>.config.json
import path from "path";
import { mergeConfig, readConfigOverride } from "./store";
import { workflowConfig } from ".";

export const <APP>_CONFIG_FILE = path.resolve(process.cwd(), process.env.<APP>_CONFIG_FILE || "<app>.config.json");

export const default<App>Config = {
  workflowId: "<workflow-id>",

  input: {
    // collection Zotero traitée
    zoteroCollection: workflowConfig.input.zoteroCollection,
  },

  // … une section commentée par sujet (grille, recherche, agents…) ; chaque valeur a un commentaire

  // dossier des fichiers produits (dans le répertoire de données)
  outputDir: "resultats/<app>",
};

export type <App>Config = typeof default<App>Config;

// sous-dossier de outputDir où chaque exécution est archivée
export const RUNS_DIR = "analyses";

// configuration effective : défauts + surcharges de <app>.config.json
export const <app>Config: <App>Config = mergeConfig(default<App>Config, readConfigOverride(<APP>_CONFIG_FILE));
```

## Étape (modèle : `src/workflow/steps/explo/themesStep.ts`)

```ts
import { createStep } from "@mastra/core/workflows";
import { monOutil } from "../../../tools/monOutil";
import { <app>Config } from "../../../config/<app>";

// <ce que fait l'étape, en une ligne>
export const monEtapeStep = createStep({
  id: "mon-etape",
  execute: async ({ inputData, getStepResult }) => {
    // après un .parallel(), inputData = { "<id>": sortie } ; sinon la sortie de l'étape précédente
    const literature: any = getStepResult("fetch-literature") ?? {};
    console.log("🔎 Mon étape...");
    // outil appelé directement : les données ne passent pas par un modèle
    const result = await monOutil.execute({ data: { articles: literature.articles ?? [] } });
    return { result };
  },
});
```

## Workflow (modèle : `src/workflow/exploWorkflow.ts`)

```ts
import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { fetchLiteratureStep } from "./steps/common/fetchLiteratureStep";
import { monEtapeStep } from "./steps/<app>/monEtapeStep";
import { <app>Config } from "../config/<app>";

// <app> : <enchaînement en une phrase>
export const <app>Workflow = createWorkflow({
  id: <app>Config.workflowId,
  inputSchema: z.object({ zoteroCollection: z.string() }),
} as any)
  .then(fetchLiteratureStep)
  .parallel([monEtapeStep /*, autreStep */])
  .commit();
```

Penser à `export { <app>Workflow } from "./<app>Workflow";` dans `src/workflow/index.ts`, et à `DIAGRAMS.<app>` dans `src/workflow/diagrams.ts` :

```ts
<app>: {
  workflowId: "<workflow-id>",
  title: "<Nom affiché>",
  stages: [
    [{ id: "fetch-literature", label: "Collection Zotero", description: "Documents, annotations et notes → Omeka S" }],
    [{ id: "mon-etape", label: "…", description: "…", agents: ["mon-agent"] }],
  ],
  outside: [
    // actions de l'interface qui appellent un agent hors workflow
  ],
},
```

## Lanceur (modèle complet : `src/runners/explo.ts`)

Squelette ; recopier les blocs du lanceur d'explo pour les détails (archive, médias, logs).

```ts
// Lancement du workflow <app> (npm run <app>, ou depuis l'application cliente)
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { <app>Workflow } from "../workflow/<app>Workflow";
import { <app>Config, RUNS_DIR } from "../config/<app>";
import { build<App>Report } from "../workflow/reports/<app>Report";
import { saveWorkflowConfig, updateWorkflowStatus } from "../workflow/runs/saveWorkflowConfig";
import { attachDocuments, type SynthesisDocument } from "../workflow/runs/importSynthesis";
import { appendUsageHistory } from "../lib/metrics/usageHistory";
import { usageSummary } from "../lib/metrics/usage";
import { estimateImpact, fmtCo2, fmtEnergy, fmtMoney } from "../lib/metrics/impact";

async function main() {
  console.log("🚀 <app> : …");
  const input = { zoteroCollection: <app>Config.input.zoteroCollection };
  const outDir = path.resolve(process.cwd(), <app>Config.outputDir);
  await fs.mkdir(outDir, { recursive: true });
  const out = (name: string) => path.join(outDir, name);

  const run = await <app>Workflow.createRun();
  let configItemId: number | null = null;
  try {
    configItemId = await saveWorkflowConfig(run.runId, input, { workflowId: <app>Config.workflowId, config: <app>Config });
  } catch (e) {
    console.warn("⚠️ Configuration non enregistrée dans Omeka S :", (e as Error).message);
  }

  const startedAt = new Date();
  const runResult: any = await run.start({ inputData: input });
  const endedAt = new Date();
  // chaîne exacte lue par src/ui/server.ts pour marquer l'exécution en échec
  if (runResult.status === "failed") console.error("❌ Le workflow a échoué :", runResult.error);
  const steps = runResult.steps ?? {};

  const usage = usageSummary();
  appendUsageHistory("<app>", usage);
  const impact = estimateImpact(usage);
  console.log(`🔢 Tokens : ${usage.totalTokens.toLocaleString("fr-FR")} · ⚡ ${fmtEnergy(impact.energyWh)}, ${fmtCo2(impact.co2g)}, équivalent API ${fmtMoney(impact.apiCost, impact.currency)}`);

  const documents: SynthesisDocument[] = [];
  // … écrire chaque résultat dans out("…") et l'ajouter à documents (type MIME si ≠ markdown)
  await fs.writeFile(out("rapport_<app>.md"), build<App>Report({ runId: run.runId, status: runResult.status, startedAt, endedAt, steps, usage, impact }));
  documents.push({ filePath: out("rapport_<app>.md"), title: "Rapport <app>" });

  // archive locale (onglet Analyses) : copie des fichiers + analyse.json
  try {
    const archive = path.join(outDir, RUNS_DIR, run.runId);
    await fs.mkdir(archive, { recursive: true });
    for (const d of documents) await fs.copyFile(d.filePath, path.join(archive, path.basename(d.filePath)));
    await fs.writeFile(path.join(archive, "analyse.json"), JSON.stringify({
      runId: run.runId, workflowId: <app>Config.workflowId, status: runResult.status,
      startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(), configItemId,
      tokens: { calls: usage.calls, input: usage.inputTokens, output: usage.outputTokens, total: usage.totalTokens },
      impact: { energyWh: impact.energyWh, co2g: impact.co2g, electricityCost: impact.electricityCost, apiCost: impact.apiCost, currency: impact.currency },
      config: <app>Config,
    }, null, 2));
  } catch (e) {
    console.warn("⚠️ Archive locale non écrite :", (e as Error).message);
  }

  if (configItemId) {
    const imp = { energyWh: impact.energyWh, co2g: impact.co2g, electricityCost: impact.electricityCost, apiCost: impact.apiCost, currency: impact.currency };
    await updateWorkflowStatus(configItemId, runResult.status, usage, imp).catch(e => console.warn("⚠️ Statut non enregistré dans Omeka S :", (e as Error).message));
    console.log(`\n📤 [OMEKA] Import des résultats dans la configuration de l'exécution (Item ID ${configItemId})...`);
    await attachDocuments(configItemId, documents, run.runId, null).catch(e => console.warn("⚠️ Documents non importés :", (e as Error).message));
  }
  console.log(runResult.status === "success" ? "✅ <app> terminé." : `<app> terminé avec le statut ${runResult.status}.`);
}

main().catch(console.error);
```

## Rapport (modèle : `src/workflow/reports/exploReport.ts`)

Titre, ligne `Exécution \`runId\` · date · statut · durée`, `> ❌ erreur` si échec, sections de résultats, puis `push(...usageReport(ctx.usage, ctx.impact))` (importé de `./paperReport`) pour le tableau de consommation et le coût.

## Serveur : entrée `APPS` (`src/ui/server.ts`)

```ts
const <APP>_ENV_FILE = process.env.<APP>_ENV_FILE || ".env.<app>";
// …
<app>: {
  label: "<Nom affiché>",
  script: path.join(APP_DIR, "src", "runners", "<app>.ts"),
  page: "<app>.html",
  // .env.<app> surcharge .env (connexions propres)
  envFiles: [".env", <APP>_ENV_FILE],
  portKey: "<APP>_PORT", hostKey: "<APP>_HOST", defaultPort: 7278,
  urlKey: "<APP>_URL",
},
```

Puis `APP_CONFIG.<app>`, `appUrls()` (fichier d'env), routes + `APP_ONLY`.

## Module de routes (modèle : `src/ui/chaoticumRoutes.ts`)

```ts
// Routes du serveur <app> : <liste courte>
import http from "http";
import type { Omk } from "../lib/omeka/omk";
import type { <App>Config } from "../config/<app>";

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void;
interface Ctx {
  root: string;
  readEnv: () => Record<string, string>;
  config: () => <App>Config;
  serverOmk: () => Promise<Omk>;
  sendJson: (res: http.ServerResponse, status: number, data: unknown) => void;
  readBody: (req: http.IncomingMessage) => Promise<any>;
}

const validId = (id: string | null): id is string => !!id && /^[\w-]{1,80}$/.test(id);

export function <app>Routes(ctx: Ctx): Record<string, Handler> {
  return {
    "GET /api/<app>/runs": async (_req, res) => { /* archive locale + items de configuration Omeka (workflowId) */ },
    "POST /api/<app>/decision": async (req, res) => {
      const body = await ctx.readBody(req);
      if (!validId(body.run)) return ctx.sendJson(res, 400, { error: "Exécution invalide" });
      // …
      ctx.sendJson(res, 200, { ok: true });
    },
  };
}
```

Dans `server.ts` :

```ts
const <APP>_ROUTES = <app>Routes({ root: ROOT, readEnv, config: current<App>Config, serverOmk, sendJson, readBody });
Object.assign(routes, <APP>_ROUTES);
// dans APP_ONLY :
...Object.fromEntries(Object.keys(<APP>_ROUTES).map(k => [k, "<app>" as AppName])),
```

## `docker-compose.yml`

```yaml
  <app>:
    <<: *common
    container_name: ecosysteme-agents-recherche-<app>
    environment:
      WORKFLOW_APP: <app>
      HOST: 0.0.0.0
      <APP>_PORT: 7278
    ports:
      - "127.0.0.1:7278:7278"
```

## `.claude/launch.json`

```json
{ "name": "ui-<app>", "runtimeExecutable": "npm", "runtimeArgs": ["run", "ui:<app>"], "port": 7278 },
{ "name": "ui-<app>-test", "runtimeExecutable": "env", "runtimeArgs": ["<APP>_PORT=7279", "<APP>_URL=http://127.0.0.1:7279", "npm", "run", "ui:<app>"], "port": 7279 }
```
