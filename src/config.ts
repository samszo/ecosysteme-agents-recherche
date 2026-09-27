// Configuration centrale du workflow (enregistrée dans Omeka S à chaque exécution)
// Valeurs par défaut ; l'interface client (npm run ui) enregistre les modifications dans workflow.config.json
import { mergeConfig, readConfigOverride } from "./configStore";

export const defaultWorkflowConfig = {
  workflowId: "academic-paper-factory",

  // données d'entrée
  input: {
    // lien vers l'appel à propositions (page web ou PDF) ; il est enregistré dans Omeka S
    cfpUrl: "",
    // fichier local de l'appel (PDF, HTML…) quand le site bloque le téléchargement automatique (ex. protection Cloudflare)
    cfpFile: "",
    // texte de l'appel (utilisé seul sans lien, ou en complément du document en ligne)
    cfpText: "Appel à propositions sur l'éthique des écosystèmes d'information numérique...",
    zoteroCollection: "9MXWYNIG",
  },

  // modèles de langage (API Albert)
  models: {
    provider: "https://albert.api.etalab.gouv.fr/v1",
    analytics: "openai/gpt-oss-120b",
    fast: "mistralai/Ministral-3-8B-Instruct-2512",
  },

  // Zotero
  zotero: {
    // marqueurs ajoutés automatiquement (import, éditeur) en plus des marqueurs manuels
    automaticTags: true,
  },

  // extraction sémantique (buildLLMWiki)
  extraction: {
    chunkSize: 12000,
    chunkOverlap: 1000,
    maxAnnotationChars: 6000,
  },

  // catégorie des concepts issus des marqueurs Zotero
  tagCategory: "marqueur",

  // positionnement du chercheur selon la couleur de l'annotation (palette Zotero par défaut)
  // chaque positionnement oriente le prompt d'extraction des annotations
  annotationPositions: [
    { color: "#ffd400", name: "jaune", position: "Idée clé",
      instruction: "Concepts centraux du document : crée-les et relie-les entre eux (relations 'compose', 'implique', 'structure')." },
    { color: "#5fb236", name: "vert", position: "Accord",
      instruction: "Idées que le chercheur adopte pour son propre travail : relie-les avec 'soutient', 'fonde' ou 'prolonge'." },
    { color: "#ff6666", name: "rouge", position: "Désaccord",
      instruction: "Thèses que le chercheur conteste : crée les concepts et relie-les aux concepts qu'ils contredisent avec 's_oppose_a' ou 'critique'." },
    { color: "#2ea8e5", name: "bleu", position: "Définition",
      instruction: "Définitions : crée le concept défini et ses composantes (relations 'se_definit_par', 'compose')." },
    { color: "#a28ae5", name: "violet", position: "Méthode",
      instruction: "Méthodes et protocoles : catégorie 'methode', relations 'outille' ou 'mesure' vers les concepts étudiés." },
    { color: "#e56eee", name: "magenta", position: "Question ouverte",
      instruction: "Questions à approfondir : catégorie 'question', relie-les aux concepts concernés avec 'interroge'." },
    { color: "#f19837", name: "orange", position: "Exemple",
      instruction: "Exemples, cas et terrains : catégorie 'exemple', relation 'illustre' vers le concept illustré." },
    { color: "#aaaaaa", name: "gris", position: "Contexte",
      instruction: "Éléments de contexte secondaires : n'extrais que les concepts indispensables." },
  ],
  // distance RGB maximale pour rattacher une couleur à la palette (les PDF annotés hors Zotero varient légèrement)
  annotationColorTolerance: 80,

  // accord inter-juges (kappa) sur la grille d'annotation des positionnements argumentatifs (grille_annotation.md)
  // chaque juge code une phrase en ajoutant le code comme marqueur Zotero sur son annotation
  kappa: {
    codes: {
      "ACC-S": "Accord – Assentiment",
      "ACC-E": "Accord – Expansion",
      "ACC-C": "Accord – Concession",
      "DES-F": "Désaccord – Factuel / Logique",
      "DES-A": "Désaccord – Absurde",
      "NEU-S": "Neutralité – Suspension",
      "NEU-R": "Neutralité – Relativisation",
      "RHET-H": "Rhétorique – Ad hominem",
      "RHET-E": "Rhétorique – Épouvantail",
      "DEP-S": "Dépassement – Synthèse",
      "AMB": "Ambigu",
    } as Record<string, string>,
    // deux annotations d'un même document désignent la même phrase si leurs mots se recouvrent à ce taux (Jaccard)
    unitSimilarity: 0.8,
    // score requis pour valider le corpus d'entraînement (accord substantiel)
    targetKappa: 0.61,
    csvPath: "generated/desaccords_annotation.csv",
  },

  // proposition d'article (PropAPP) construite à partir des attendus de l'appel (AttenduAPP) et de la collection Zotero
  proposal: {
    // plan en markdown : chaque titre est une section à rédiger, les lignes « Consigne : » guident la rédaction
    plan: `# Titre de la proposition
Consigne : titre court et explicite, en lien direct avec l'appel.

## Résumé
Consigne : 250 mots maximum ; problématique, démarche, apports attendus.

## Introduction et problématique
Consigne : situer la question au regard des attendus de l'appel et annoncer l'hypothèse.

## Cadre théorique
Consigne : mobiliser les concepts du graphe et les références de la collection, avec citations.

## Méthodologie et corpus
Consigne : décrire le corpus, les méthodes d'analyse et leur justification.

## Résultats attendus et discussion
Consigne : montrer ce que la proposition apporte aux axes de l'appel.

## Conclusion
Consigne : synthèse et perspectives.`,
    // auteurs ajoutés aux annotateurs Zotero (qui sont auteurs de droit)
    authors: [] as string[],
    // nombre de mots-clés retenus dans la compilation
    maxKeywords: 15,
    // marqueurs Zotero qui qualifient une note sans être des mots-clés
    ignoredTags: ["citation"],
    // nombre maximum de citations transmises au rédacteur (toutes figurent en annexe)
    maxCitations: 40,
    // style CSL des citations bibliographiques fournies par Zotero
    citationStyle: "apa",
    // fichiers produits
    expectationsFile: "AttenduAPP.md",
    proposalFile: "PropAPP.md",
    bibtexFile: "PropAPP.bib",
  },

  // nettoyage du graphe (cleanGraph)
  cleaning: {
    batchSize: 80,
  },

  // propriétés Omeka S utilisées
  omeka: {
    vocabs: ["dcterms", "skos", "oa", "bibo", "curation"],
    conceptClass: "skos:Concept",
    // classe de l'item décrivant la configuration d'une exécution du workflow
    configClass: "dcterms:MethodOfInstruction",
    // classe de l'item de l'appel à propositions (repli sur bibo:Document si absente de l'instance)
    cfpClass: "bibo:CallForPapers",
    // date de la dernière extraction sémantique d'une pièce jointe (vide = à extraire)
    accessTerm: "curation:access",
    // lien pièce jointe → concepts
    subjectTerm: "dcterms:subject",
    // lien concept → concept
    relationTerm: "dcterms:relation",
    // code de la grille d'annotation attribué par le juge (sur l'oa:Annotation)
    codeTerm: "curation:type",
    // juge auteur de l'annotation (sur l'oa:Annotation)
    authorTerm: "dcterms:creator",
  },

  steps: ["analyze-cfp", "fetch-literature", "build-wiki", "kappa-analysis", "normalize-okf", "draft-paper", "review-paper"],
};

export type WorkflowConfig = typeof defaultWorkflowConfig;

// configuration effective : défauts + surcharges de workflow.config.json
export const workflowConfig: WorkflowConfig = mergeConfig(defaultWorkflowConfig, readConfigOverride());
