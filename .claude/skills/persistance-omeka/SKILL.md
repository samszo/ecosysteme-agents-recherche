---
name: persistance-omeka
description: Enregistrer dans Omeka S les exécutions, documents, annotations et résultats d'une application de l'écosystème, avec archive locale, historique, comptage des tokens et estimation du coût (énergie, carbone, équivalent API). À utiliser quand un workflow ou une route doit sauvegarder quelque chose, relire une exécution passée, ou rendre compte de son coût.
---

# Persistance Omeka S, archives et coût

Lire d'abord `docs/technique.md` §8 (modèle de données) : il est **partagé** par toutes les applications. Réutiliser les classes et propriétés existantes avant d'en inventer.

## 1. Le cycle d'une exécution (dans `src/runners/<app>.ts`)

```
saveWorkflowConfig(runId, input, { workflowId, config })   → item « Configuration <workflowId> – <date> », curation:status = running
run.start(...)
usageSummary() → appendUsageHistory("<app>", usage) → estimateImpact(usage)
écriture des fichiers dans resultats/<app>/ + archive resultats/<app>/<RUNS_DIR>/<runId>/ (copie + analyse.json)
updateWorkflowStatus(itemId, status, usage, impact)          → curation:status, curation:dateEnd, curation:data (JSON tokens + impact)
attachDocuments(itemId, documents, runId, null)              → un média par fichier, dcterms:identifier = "<runId>/<fichier>"
```

Fonctions : `src/workflow/runs/saveWorkflowConfig.ts`, `src/workflow/runs/importSynthesis.ts` (`attachDocuments`, `uploadWithFallback` : extension refusée → nouvel essai en `.txt`), `src/lib/metrics/{usage,usageHistory,impact}.ts`. Chaque appel Omeka est dans un `try/catch` → `⚠️` : **Omeka indisponible ne doit jamais faire échouer le workflow**, les fichiers locaux restent la source de secours.

Relire les exécutions passées (onglet Analyses) : fusionner l'archive locale et les items de configuration Omeka dont la description JSON porte le bon `workflowId` ; servir un fichier depuis l'archive locale, sinon depuis le média Omeka repéré par `dcterms:identifier = <runId>/<nom>` (lu par `o:original_url`). Modèle : `exploRuns`, `omekaExploFiles`, `readExploFile` dans `src/ui/server.ts`.

## 2. Écrire des données métier

```ts
const omk = await getOmk();                         // instance partagée, initialisée (vocabulaires, classes)
const item = await omk.createItem({
  ...(omk.getClassByTerm("bibo:Document") ? { "o:resource_class": "bibo:Document" } : {}),
  "dcterms:title": "…",
  "dcterms:identifier": cléStable,                   // pour retrouver l'item (idempotence)
  "dcterms:isPartOf": { rid: collectionItemId },     // lien vers un autre item
  "dcterms:source": { u: url, l: "libellé" },        // lien web
  ...(omk.getPropByTerm("curation:data") ? { "curation:data": JSON.stringify(données) } : {}),
});
// PATCH obligatoire pour une mise à jour partielle : la méthode par défaut (PUT) remplace toutes les valeurs de l'item
await omk.updateResource(id, { "curation:status": "…" }, "items", "PATCH");
await omk.uploadMedia(itemId, { buffer, fileName, type }, { "dcterms:title": "…" });
const found = await omk.searchItemsByProp("dcterms:identifier", cléStable);
```

- **Idempotence** : chercher par `dcterms:identifier` (ou empreinte SHA-1 d'un texte normalisé) avant de créer ; mettre à jour plutôt que dupliquer.
- **Termes paramétrables** : les classes/propriétés métier vont dans la configuration (`workflowConfig.omeka.*` ou `config.omeka.*` de l'app, cf. `participationClass`), testées avec `getClassByTerm` / `getPropByTerm` avant usage (repli sur une classe générique si absente). Vocabulaires requis : `workflowConfig.omeka.vocabs` (vérifiés par le test de connexion).
- **Réutiliser** : collection Zotero → `getZoteroCollections().itemId(clé)` ; documents et `oa:Annotation` → déjà créés par `fetchZoteroData` (étape `fetch-literature`) ; annotations → `src/lib/omeka/oaAnnotations.ts`.
- **Correspondances habituelles** : document lu = classe bibo (`zoteroToOmeka.ts`) ; annotation = `oa:Annotation` (`oa:exact`, `oa:bodyValue`, `oa:styleClass` = couleur, `oa:hasTarget`) ; concept = `skos:Concept` ; exécution = `dcterms:MethodOfInstruction` ; réponse/résultat textuel = `bibo:Note` + média markdown ; décisions et traces = `curation:data` (JSON) sur l'item concerné.
- Un nouveau type d'item → l'ajouter au diagramme `erDiagram` de `docs/technique.md` §8.

## 3. Coût

- Tout appel modèle → `recordUsage(source, modèle, usage)` (automatique via `askAgent`, voir skill `agent-albert`). Vectorisation sans retour de tokens : estimer `texte.length / 4` avec le modèle d'embeddings (cf. `ragIndex.ts`).
- `estimateImpact(usageSummary())` utilise `workflowConfig.costs` (prix électricité, intensité carbone, matériel, paramètres actifs et tarifs par modèle, `fallback`). Un nouveau modèle → l'ajouter à `costs.models` dans `src/config/index.ts`.
- Rapport : `usageReport(usage, impact)` (`src/workflow/reports/paperReport.ts`) ; logs : `fmtEnergy`, `fmtCo2`, `fmtMoney`.
- Actions de serveur qui appellent un modèle (régénération, consultation RAG) : calculer et renvoyer leur coût dans la réponse JSON (`estimateImpact` sur l'usage de l'appel), et l'enregistrer avec le résultat sauvegardé.
- `appendUsageHistory("<app>", usage, task?)` alimente l'estimation de l'onglet Workflow ; ajouter `"rapport_<app>.md": "<app>"` à `REPORTS` dans `usageHistory.ts`.

## 4. Choix interactifs à consolider

Quand l'utilisateur accepte/refuse des propositions après l'exécution (ex. références suggérées), enregistrer chaque décision avec son contexte (proposition, passage, raison, date, auteur) : en local (`resultats/<app>/…json`) **et** dans Omeka (`curation:data` ou item dédié lié par `dcterms:relation`). Ces décisions peuvent ensuite être injectées comme exemples dans la demande de l'agent (variable `{{exemples}}` du gabarit).
