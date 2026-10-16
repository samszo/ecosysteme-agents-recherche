// Configuration du workflow chaoticumSeminario : partition de présentation pour une conférence
// Valeurs par défaut ; l'application cliente enregistre les modifications dans chaoticum.config.json
import path from "path";
import { mergeConfig, readConfigOverride } from "./store";
import { workflowConfig } from ".";
import { defaultExploConfig } from "./explo";

export const CHAOTICUM_CONFIG_FILE = path.resolve(process.cwd(), process.env.CHAOTICUM_CONFIG_FILE || "chaoticum.config.json");

// types d'écran de la partition
export const SCREEN_TYPES = ["citation", "diapo", "question", "contribution", "diagramme"] as const;
export type ScreenType = (typeof SCREEN_TYPES)[number];

export const defaultChaoticumConfig = {
  workflowId: "chaoticum-seminario",
  // titre de la conférence (affiché par le lecteur de partition)
  title: "Chaoticum Seminario",
  // description de la conférence et lien vers le programme : ils orientent le choix des citations et des diapos
  // et la formulation des questions
  description: "",
  programUrl: "",

  // choix des citations et des diapos : au hasard, ou parmi les plus proches du thème de la conférence
  // (titre, description, programme), départagées au hasard
  selection: {
    byTheme: true,
    // citations candidates soumises au modèle (tirées au hasard), dont il retient les plus pertinentes
    citationCandidates: 40,
    // présentations retenues par le modèle, parmi lesquelles les diapos sont tirées
    slideShortlist: 12,
  },

  // index RAG Albert : les diapos (une par document, avec la description de son image) et la bibliothèque Zotero
  // (une référence par document) sont indexées à l'avance ; la génération cherche dans ces index au lieu de
  // parcourir Zotero et d'analyser les images
  rag: {
    enabled: true,
    // collections privées Albert (créées au besoin)
    slidesCollection: "chaoticum-diapos",
    zoteroCollection: "chaoticum-bibliotheque",
    // diapos décrites par exécution d'indexation (l'indexation reprend où elle s'est arrêtée)
    slidesPerRun: 150,
    // poids dans la recherche : les mots-clés et les notes sont répétés en tête du document de chaque référence
    keywordsWeight: 3,
    notesWeight: 2,
    // extraits demandés au RAG par recherche
    searchLimit: 10,
    // découpage des documents par Albert
    chunkSize: 2048,
    chunkOverlap: 200,
  },

  // partition : nombre d'écrans et durée totale ; la durée est répartie selon le poids de chaque type d'écran
  screens: 15,
  durationMinutes: 30,
  // suite des types d'écran, répétée jusqu'au nombre d'écrans (un cycle = une citation, une diapo, la question et
  // le diagramme qui en sont tirés, et un appel à contributions)
  pattern: ["citation", "diapo", "question", "contribution", "diagramme"] as ScreenType[],
  weights: { citation: 1, diapo: 1, question: 1.5, contribution: 2, diagramme: 1.5 } as Record<ScreenType, number>,
  // graine du tirage aléatoire (vide = nouvelle graine à chaque partition ; enregistrée pour pouvoir la refaire)
  seed: "",

  // chronomètre : vert jusqu'à warning × durée prévue, orange jusqu'à danger × durée, rouge au-delà
  timer: { warning: 1, danger: 1.25 },

  // citations : annotations (surlignages) et notes de la bibliothèque Zotero ou d'une collection
  citations: {
    // "library" : toute la bibliothèque (connexions Zotero) ; "collection" : une collection
    scope: "collection" as "library" | "collection",
    collection: workflowConfig.input.zoteroCollection,
    includeNotes: true,
    // longueur des citations retenues (caractères)
    minLength: 40,
    maxLength: 700,
    // sources des citations : bibliothèque Zotero (portée ci-dessus) et annotations Diigo (index RAG « diigo »)
    sources: ["zotero", "diigo"] as ("zotero" | "diigo")[],
  },

  // source « Annotations Diigo » : pages d'une collection Omeka S (références de veille Diigo : titre, mots-clés
  // skos:semanticRelation, médias), indexées seulement si elles ont des médias ou des passages surlignés (items du
  // modèle « Diigo highlight » : bibo:content, schema:color, reliés à la page par dcterms:isPartOf)
  diigo: {
    apiUrl: "https://samszo.humanum-p8.fr/api",
    itemSetId: 1,
    highlightTemplateId: 13,
    // collection privée Albert (créée au besoin)
    collection: "chaoticum-diigo",
    // texte des médias de la page annotée (fichiers, instantanés web) ajouté à son document, comme pour Zotero
    indexMedia: true,
    mediaMaxChars: 100000,
    // images des pages (captures Diigo, figures…) : analysées par le modèle de vision, leur description est indexée
    indexImages: true,
    // modèle de vision de l'analyse des images (plus précis que le modèle rapide pour transcrire le texte visible)
    visionModel: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
    // pages déposées par exécution d'indexation (0 : toutes ; l'indexation reprend où elle s'est arrêtée)
    perRun: 1000,
  },

  // diapos : site ConfErrance (une présentation = un dossier contenant slide.html)
  slides: {
    siteUrl: "https://samszo.github.io/ConfErrance/",
    // liste des présentations : dossier local s'il existe, sinon arborescence du dépôt GitHub
    localDir: "/Users/samszo/Sites/ConfErrance/docs",
    repo: "samszo/ConfErrance",
    docsPath: "docs",
    // présentations écartées du tirage (nom du dossier)
    exclude: [] as string[],
    // copie d'écran (Playwright) : taille de la fenêtre et attente de la fin de la transition
    viewport: { width: 1280, height: 720 },
    settleMs: 3000,
  },

  // contributions du public : formulaire Grist (QR code) et table des réponses (CSV)
  grist: {
    formUrl: "https://grist.numerique.gouv.fr/o/docs/forms/55jJeESkLrEcWq3R6G1EAr/4",
    responsesUrl: "https://grist.numerique.gouv.fr/api/docs/vcRsMWzsnq9U/download/csv?tableId=ScienceEnFete_05102026",
    urlColumn: "url",
    nameColumn: "nom",
    dateColumn: "date",
    // intervalle de lecture des réponses pendant la séance (secondes)
    pollSeconds: 10,
    // validation par l'animateur avant d'afficher une URL proposée par le public
    moderation: true,
  },

  // modèles : vision (description des copies d'écran) et analytique (questions, diagrammes)
  models: {
    vision: workflowConfig.models.fast,
    analytics: workflowConfig.models.analytics,
  },

  // transcription de la parole du présentateur pendant la séance (lecteur) : enregistrée avec la séance et rejouée
  // en sous-titres. "albert" : modèle de reconnaissance vocale d'Albert, l'audio est envoyé par tranches au serveur ;
  // "navigateur" : reconnaissance vocale du navigateur (sous-titres immédiats, mais l'audio part chez son fournisseur)
  transcription: {
    engine: "albert" as "albert" | "navigateur",
    model: "whisper-large-v3",
    language: "fr",
    // durée des tranches d'audio envoyées à Albert (secondes)
    chunkSeconds: 15,
    // niveau sonore minimal (0 à 1) d'une tranche pour l'envoyer : le silence ferait inventer du texte au modèle
    silenceLevel: 0.02,
    // sous-titres affichés sur l'écran projeté
    captions: true,
  },

  // annotation collective pendant la séance (personnes qui suivent la présentation, présentateur) : traits de couleur
  // sur les écrans et surlignage de la transcription ; grille équivalente à celle d'exploZoteroAnno
  annotation: {
    grid: defaultExploConfig.grid.positions.map(p => ({ ...p })),
  },

  // enregistrement des séances dans Omeka S
  omeka: {
    participationClass: "bibo:Performance",
    participationType: "Participation chaoticumSeminario",
  },

  outputDir: "resultats/chaoticum",
};

export type ChaoticumConfig = typeof defaultChaoticumConfig;

// sous-dossier de outputDir où chaque partition est archivée (un dossier par exécution)
export const PARTITIONS_DIR = "partitions";

export const chaoticumConfig: ChaoticumConfig = mergeConfig(defaultChaoticumConfig, readConfigOverride(CHAOTICUM_CONFIG_FILE));
