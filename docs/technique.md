# Documentation technique

Écosystème d'agents IA pour la production d'articles scientifiques (Laboratoire Paragraphe, Université Paris 8). Le projet est écrit en **TypeScript**, exécuté par **tsx** sous **Node.js 22+**, et orchestré par un workflow **Mastra**. Les modèles de langage sont ceux de l'**API Albert** (compatible OpenAI), les sources viennent de **Zotero** et les résultats sont archivés dans **Omeka S**.

## 1. Architecture

```mermaid
flowchart LR
    subgraph Client
        NAV[Navigateur]
    end
    subgraph Serveur["Serveur Node.js (src/ui/server.ts)"]
        UI[API HTTP + page<br/>src/ui/public/index.html]
        CFG[(.env<br/>workflow.config.json)]
    end
    subgraph Traitement["Processus enfant (src/index.ts)"]
        WF[Workflow Mastra<br/>paperProductionWorkflow]
        AG[Agents]
        TL[Outils]
    end
    NAV -- HTTP / SSE --> UI
    UI -- lit / écrit --> CFG
    UI -- spawn tsx --> WF
    WF --> AG
    WF --> TL
    AG -- chat completions --> ALB[(API Albert)]
    TL -- API web v3 --> ZOT[(Zotero)]
    TL -- API REST --> OMK[(Omeka S)]
    WF -- fichiers résultats --> FS[(répertoire de données)]
    UI -- lit --> FS
```

- **Interface** (`src/ui/server.ts`) : serveur `node:http` sans dépendance, qui gère `.env` et `workflow.config.json`, lance le workflow dans un **processus enfant** (la configuration et les connexions sont ainsi relues à chaque exécution), diffuse le journal en **Server-Sent Events** et sert les résultats.
- **Workflow** (`src/index.ts`) : enregistre la configuration dans Omeka S, exécute le workflow Mastra, produit la visualisation du graphe, le rapport de traitement, et importe les documents de synthèse.
- **Répertoire de données** : le répertoire courant. En local c'est la racine du projet ; dans Docker c'est le volume `/data`, le code étant dans `/app`.

## 2. Le workflow

```mermaid
flowchart TD
    IN([cfpUrl, cfpFile, cfpText,<br/>zoteroCollection]) --> P1
    subgraph P1[parallèle]
        S1[analyze-cfp<br/>fetchCfp + aapAnalystAgent<br/>→ AttenduAPP]
        S2[fetch-literature<br/>fetchZoteroData]
    end
    P1 --> P2
    subgraph P2[parallèle]
        S3[build-wiki<br/>buildLLMWiki + cleanGraph]
        S4[kappa-analysis<br/>fetchOmekaAnnotations + calculateFleissKappa<br/>+ kappaAnalystAgent]
    end
    P2 --> S5[normalize-okf<br/>exportToOpenKnowledge]
    S5 --> S6[draft-paper<br/>compileCollection + writerAgent<br/>→ PropAPP]
    S6 --> S7[review-paper<br/>epistemologistAgent]
    S7 --> OUT([relecture, graphe sigma.js,<br/>rapport de traitement])
```

Défini dans `src/workflow/paperProductionWorkflow.ts`. Règles de passage des données dans Mastra :

- après un `.parallel([...])`, l'étape suivante reçoit `{ "<id étape>": sortie, ... }` ;
- après un `.then(...)`, elle reçoit directement la sortie de l'étape précédente ;
- `getStepResult("<id>")` donne accès à la sortie de n'importe quelle étape antérieure (utilisé par `draft-paper`).

| Étape | Fichier | Entrées | Sorties principales |
|---|---|---|---|
| `analyze-cfp` | `analyzeCfpStep.ts` | paramètres de l'appel | `cfpAnalysis` (AttenduAPP), `aapItemId`, `aapTitle`, `aapUrl` |
| `fetch-literature` | `fetchLiteratureStep.ts` | `zoteroCollection` | `articles[]`, `collectionItemId` |
| `build-wiki` | `buildWikiStep.ts` | articles, AttenduAPP | `conceptGraph`, `extractedKeys`, `wikiMetadata` |
| `kappa-analysis` | `kappaAnalysisStep.ts` | `collectionItemId` | `kappa`, `confusions`, `summary` |
| `normalize-okf` | `normalizeOkfStep.ts` | graphe, articles | `exportResult` (`omekaIds`, `stats`) |
| `draft-paper` | `draftPaperStep.ts` | graphe + `getStepResult` | `draft` (PropAPP), `proposal` |
| `review-paper` | `reviewPaperStep.ts` | PropAPP, AttenduAPP | `finalReview` |

Les outils sont appelés **directement** par les étapes (`outil.execute({ data })`) : les données brutes circulent entre les étapes sans passer par un modèle. Les agents ne reçoivent que ce qu'ils doivent rédiger ou analyser.

## 3. Organisation du code

```
src/
├── index.ts                 point d'entrée du workflow (npm start)
├── config.ts                configuration par défaut (defaultWorkflowConfig) + surcharges
├── configStore.ts           fusion / différences avec workflow.config.json
├── models.ts                modèles Albert (analytique, rapide)
├── graphViz.ts              export graphology et page sigma.js
├── omekaVerify.ts           audit des derniers items Omeka
├── agents/                  un fichier par agent (index.ts ré-exporte)
├── tools/                   un fichier par outil ou utilitaire
├── workflow/                une étape par fichier, assemblage, rapport, import
└── ui/                      serveur de l'interface et page web
```

### Agents (`src/agents/`)

| Agent | Modèle | Rôle |
|---|---|---|
| `aapAnalystAgent` | analytique | analyse des attendus de l'appel (AttenduAPP, markdown) |
| `writerAgent` | analytique | rédaction de PropAPP selon le plan, citations Pandoc |
| `epistemologistAgent` | analytique | relecture critique de PropAPP au regard d'AttenduAPP |
| `kappaAnalystAgent` | analytique | bilan de l'accord inter-juges et recommandations de recalibrage |
| `librarianAgent`, `wikiArchitectAgent`, `ontologistAgent` | rapide / analytique | agents outillés disponibles pour un usage conversationnel |

### Outils et utilitaires (`src/tools/`)

| Module | Rôle |
|---|---|
| `fetchCfp` | télécharge ou lit l'appel (URL ou fichier local), extrait le texte, crée ou met à jour l'item Omeka de l'appel |
| `fetchZoteroData` | parcourt la collection, extrait chaque pièce jointe, fusionne annotations et notes, enregistre documents, annotations et médias dans Omeka |
| `attachmentExtract` | extraction par format : PDF, page web enregistrée (zip), HTML, DOCX, ODT, EPUB, texte, image |
| `pdfExtract` | PDF.js : texte, surlignages (reconstruction par quadPoints), notes, auteur, images (encodage PNG via zlib) |
| `zip` | lecteur ZIP minimal (répertoire central + zlib) |
| `zotero` | client de l'API Zotero v3 : bibliothèque personnelle ou de groupe, pagination, notes, annotations, BibTeX |
| `zoteroToOmeka` | correspondance métadonnées Zotero → dcterms / bibo / curation |
| `zoteroCollections` | items Omeka des collections Zotero (création à la demande, sous-collections) |
| `omk` | client de l'API REST Omeka S (formatage des valeurs, liens, upload de médias) |
| `oaAnnotations` | enregistrement et relecture des `oa:Annotation` |
| `buildLLMWiki` | extraction Map-Reduce des concepts (annotations par positionnement, marqueurs, extraits de texte) |
| `cleanGraph` | nettoyage déterministe puis sémantique (modèle analytique) du graphe |
| `conceptIndex` | recherche d'un concept existant (identifiant ou titre) avant création |
| `conceptStore` | relecture du graphe d'un document déjà extrait |
| `exportToOpenKnowledge` | concepts, relations, liens document → concepts, date d'extraction |
| `annotationPositions` | couleur → positionnement (distance RVB) |
| `codebook` | codes de la grille d'annotation (kappa) |
| `fetchOmekaAnnotations` | annotations codées par juge, regroupées par phrase (similarité de Jaccard) |
| `calculateFleissKappa` | kappa de Fleiss (nombre de juges variable), kappa de Cohen, CSV des désaccords |
| `compileCollection` | références BibTeX, citations, mots-clés, auteurs pour PropAPP |
| `chunkText` | découpage des textes en extraits avec chevauchement |

## 4. Extraction des documents

```mermaid
flowchart TD
    A[Pièce jointe Zotero] --> B{linkMode}
    B -- linked_url --> L[Lien sans fichier :<br/>métadonnées seules]
    B -- fichier --> C[Téléchargement /items/KEY/file]
    C --> D{Type}
    D -- PDF --> P[pdfExtract : texte,<br/>surlignages, notes, images]
    D -- page web --> H{Archive zip ?}
    H -- oui --> HZ[readZip → page principale<br/>+ images affichées]
    H -- non --> HT[HTML]
    HZ --> MC[mainContent : zone d'article<br/>article-texte, entry-content, article, main]
    HT --> MC
    D -- DOCX / ODT --> X[XML + commentaires<br/>+ images]
    D -- EPUB --> E["ordre de lecture (spine)<br/>+ images du manifeste"]
    D -- texte / image / autre --> T[texte brut, image, ou dépôt seul]
    P --> M[Fusion : annotations du fichier<br/>+ lecteur Zotero + notes de la notice]
    MC --> M
    X --> M
    E --> M
    T --> M
    M --> O[Item Omeka : métadonnées de la notice,<br/>texte, oa:Annotation, médias]
```

Clé de fusion des annotations : phrase normalisée, commentaire, auteur et code (deux juges peuvent annoter la même phrase). Les codes de la grille présents dans les marqueurs sont séparés des marqueurs ordinaires (`splitCodes`).

## 5. Graphe de concepts

```mermaid
flowchart LR
    A[Articles] --> M0[Marqueurs Zotero<br/>→ nœuds verrouillés]
    A --> R{curation:access<br/>renseigné ?}
    R -- oui --> RL[Relecture Omeka :<br/>dcterms:subject + dcterms:relation]
    R -- non --> P0[Phase 0 : annotations<br/>regroupées par positionnement]
    P0 --> P1[Phase 1 : extraits de texte<br/>modèle rapide, schéma JSON]
    P1 --> RED[Reduce : fusion,<br/>sources par nœud]
    M0 --> RED
    RL --> RED
    RED --> C1[Nettoyage déterministe :<br/>markdown, identifiants,<br/>boucles, doublons]
    C1 --> C2[Nettoyage sémantique :<br/>modèle analytique par lots<br/>libellés, fusions, suppressions]
    C2 --> C3[Suppression des nœuds isolés]
    C3 --> G[Graphe final]
```

- Les nœuds **verrouillés** (marqueurs) et **connus** (déjà dans Omeka) ne sont ni renommés ni supprimés par le nettoyage sémantique.
- Chaque nœud garde ses `sources` (clés Zotero des pièces jointes) à travers les fusions : elles servent aux liens `dcterms:subject`.
- Un article n'est marqué extrait (`curation:access`) qu'après une extraction sans erreur et l'export de ses concepts.

## 6. Accord inter-juges

```mermaid
flowchart LR
    A[oa:Annotation<br/>dcterms:creator = juge<br/>curation:type = code] --> B[Regroupement par phrase<br/>Jaccard ≥ unitSimilarity]
    B --> C[Un code par juge et par phrase]
    C --> D[Phrases codées<br/>par ≥ 2 juges]
    D --> E[Kappa de Fleiss<br/>n juges variable]
    D --> F[Kappa de Cohen<br/>si 2 juges]
    E --> G[CSV des désaccords,<br/>confusions, bilan de l'agent]
    F --> G
```

Kappa de Fleiss généralisé : P̄ = moyenne des Pᵢ = (Σⱼ nᵢⱼ² − nᵢ) / (nᵢ(nᵢ − 1)), Pₑ = Σⱼ pⱼ² avec pⱼ = Σᵢ nᵢⱼ / Σᵢ nᵢ. Le calcul est validé sur l'exemple de référence de Fleiss (κ = 0,210) et celui de Cohen (κ = 0,4).

## 7. Proposition d'article (PropAPP)

```mermaid
sequenceDiagram
    participant S as draft-paper
    participant Z as Zotero
    participant W as writerAgent
    participant O as Omeka S
    S->>Z: items/top?include=data,bibtex,citation
    Z-->>S: BibTeX (clés de citation) + citations APA
    S->>S: citations (passages, notes « … » § n),<br/>mots-clés, auteurs (annotateurs)
    S->>W: AttenduAPP, plan, mots-clés, références,<br/>citations, résumé du graphe (balises)
    W-->>S: texte markdown selon le plan
    S->>S: assemblage : YAML, texte, annexe des citations,<br/>références (::: {#refs}) + BibTeX
    S->>O: médias PropAPP.md et PropAPP.bib<br/>dans l'item de l'appel
```

PropAPP est compatible **Pandoc** : `pandoc PropAPP.md --citeproc -o PropAPP.docx` produit un document avec la bibliographie (le fichier `PropAPP.bib` doit être à côté).

## 8. Modèle de données Omeka S

```mermaid
erDiagram
    COLLECTION {
        classe bibo_Collection
        dcterms_title nom "nom de la collection Zotero"
        dcterms_identifier cle "clé de la collection"
        dcterms_isPartOf lien "collection parente"
    }
    DOCUMENT {
        classe bibo_AcademicArticle "ou BookSection, Webpage…"
        dcterms_identifier cle "clé de la pièce jointe"
        dcterms_creator auteurs "métadonnées de la notice"
        dcterms_description texte "texte extrait"
        curation_access date "date d'extraction"
        curation_tag marqueurs "marqueurs Zotero"
    }
    ANNOTATION {
        classe oa_Annotation
        oa_exact passage "phrase surlignée"
        oa_bodyValue note "commentaire ou note"
        oa_styleClass couleur "couleur du surlignage"
        curation_category position "positionnement"
        curation_type code "code de la grille"
        dcterms_creator juge "auteur de l'annotation"
    }
    CONCEPT {
        classe skos_Concept
        dcterms_identifier id "identifiant normalisé"
        dcterms_title libelle "libellé"
        dcterms_type categorie "concept, auteur, marqueur…"
    }
    APPEL {
        classe bibo_CallForPapers "repli bibo:Document"
        dcterms_identifier url "lien de l'appel"
        dcterms_description texte "texte de l'appel"
        medias fichiers "AttenduAPP, PropAPP, BibTeX"
    }
    CONFIGURATION {
        classe dcterms_MethodOfInstruction
        dcterms_identifier runId "exécution"
        dcterms_description json "configuration"
        curation_status statut "running, success, failed"
    }
    DOCUMENT }o--|{ COLLECTION : "dcterms:isPartOf"
    ANNOTATION }o--|| DOCUMENT : "oa:hasTarget"
    DOCUMENT }o--o{ CONCEPT : "dcterms:subject"
    ANNOTATION }o--o{ CONCEPT : "curation:tag"
    CONCEPT }o--o{ CONCEPT : "dcterms:relation"
    APPEL }o--|| COLLECTION : "dcterms:relation"
    CONFIGURATION }o--|| COLLECTION : "dcterms:isPartOf"
```

Les termes utilisés sont paramétrables dans `config.omeka` (`accessTerm`, `subjectTerm`, `relationTerm`, `codeTerm`, `authorTerm`, `conceptClass`, `configClass`, `cfpClass`).

## 9. Configuration

La configuration par défaut est dans `src/config.ts` (`defaultWorkflowConfig`). Les modifications faites dans l'interface sont enregistrées dans `workflow.config.json` (seules les différences) et fusionnées au chargement (`configStore.ts`). Les chemins `kappa.codes`, `annotationPositions`, `omeka.vocabs` et `steps` sont remplacés en bloc, les autres objets sont fusionnés clé par clé. Le fichier est désigné par `WORKFLOW_CONFIG_FILE` s'il est défini.

| Clé | Rôle |
|---|---|
| `input.cfpUrl`, `input.cfpFile`, `input.cfpText` | appel à propositions : lien, fichier local, texte ou précisions |
| `input.zoteroCollection` | clé de la collection Zotero |
| `models.provider`, `models.analytics`, `models.fast` | API Albert et modèles |
| `zotero.automaticTags` | inclure les marqueurs automatiques |
| `extraction.chunkSize`, `chunkOverlap`, `maxAnnotationChars` | découpage des textes, taille du bloc d'annotations |
| `tagCategory` | catégorie des concepts issus des marqueurs |
| `annotationPositions`, `annotationColorTolerance` | table couleur → positionnement → consigne |
| `kappa.codes`, `unitSimilarity`, `targetKappa`, `csvPath` | accord inter-juges |
| `proposal.plan`, `authors`, `maxKeywords`, `ignoredTags`, `maxCitations`, `citationStyle` | PropAPP |
| `proposal.expectationsFile`, `proposalFile`, `bibtexFile` | noms des fichiers produits |
| `cleaning.batchSize` | taille des lots de nettoyage sémantique |
| `omeka.*` | vocabulaires, classes et propriétés |

## 10. API de l'interface

| Méthode et route | Rôle |
|---|---|
| `GET /` | page de l'interface |
| `GET /api/settings` | variables `.env` (secrets masqués), configuration effective et par défaut |
| `POST /api/settings` | enregistre `.env` (un secret vide est conservé) et `workflow.config.json` |
| `POST /api/check` | teste Albert, Zotero et Omeka S (vocabulaires) |
| `GET /api/zotero/collections` | collections de la bibliothèque |
| `GET /api/albert/models` | modèles disponibles |
| `POST /api/cfp-file?name=` | importe le fichier de l'appel dans `aap/` |
| `POST /api/run`, `POST /api/run/stop`, `GET /api/run` | lancer, arrêter, état |
| `GET /api/run/events` | journal et statut en Server-Sent Events |
| `GET /api/results`, `GET /api/file?name=` | liste et contenu des résultats (liste blanche) |
| `GET /docs/…` | documentation HTML |

Le serveur écoute sur `127.0.0.1` (variable `HOST` pour le conteneur) et le port `PORT` (7272).

## 11. Étendre le projet

**Ajouter un outil** : créer `src/tools/monOutil.ts` sur le modèle des outils existants (`new Tool({ name, description, schema, execute: async ({ data }) => … })`, schéma zod typé avec `z.infer`), puis l'exporter dans `src/tools/index.ts`.

**Ajouter une étape** : créer `src/workflow/monEtape.ts` avec `createStep({ id, execute })`, l'insérer dans `paperProductionWorkflow.ts`, ajouter son identifiant à `config.steps` et son libellé dans `processingReport.ts`.

**Ajouter un paramètre** : l'ajouter à `defaultWorkflowConfig` ; il apparaît automatiquement dans l'interface (ajouter un libellé dans `LABELS`, et la section dans `SECTIONS`, de `index.html`).

## 12. Documentation et conteneur

- `npm run docs` convertit `docs/*.md` en `docs/html/*.html` (script `scripts/build-docs.ts`, bibliothèque **marked** ; les diagrammes **Mermaid** sont rendus dans le navigateur).
- `Dockerfile` : image `node:22-bookworm-slim`, code dans `/app`, données dans le volume `/data`, utilisateur `node`, commandes `workflow-ui` (défaut) et `workflow`.
- `docker-compose.yml` : port publié sur `127.0.0.1:7272`, volume `./data:/data`, `host.docker.internal` pour un Omeka S local.

## 13. Limites connues

- `tsc --noEmit` signale des erreurs de typage liées à la configuration TypeScript (CommonJS avec `verbatimModuleSyntax`) et aux types Mastra (étapes sans schéma) ; l'exécution par tsx n'est pas affectée.
- La reconstruction des passages surlignés d'un PDF est une approximation proportionnelle à la largeur des blocs de texte.
- Les sites protégés contre les robots ne peuvent pas être téléchargés : utiliser un fichier local.
- Le contexte des modèles limite la taille des textes transmis (appel très long, plan très détaillé).
