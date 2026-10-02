// Configuration du workflow exploZoteroAnno (annotation collective d'une collection Zotero)
// Valeurs par défaut ; l'application cliente (/explo) enregistre les modifications dans explo.config.json
import path from "path";
import { mergeConfig, readConfigOverride } from "./store";
import { workflowConfig } from ".";

export const EXPLO_CONFIG_FILE = path.resolve(process.cwd(), process.env.EXPLO_CONFIG_FILE || "explo.config.json");

export const defaultExploConfig = {
  workflowId: "explo-zotero-anno",

  input: {
    // collection Zotero annotée collectivement (bibliothèque de groupe recommandée)
    zoteroCollection: workflowConfig.input.zoteroCollection,
  },

  // grille de couleurs partagée par les collaborateurs : chaque couleur de surlignage a un sens commun
  grid: {
    title: "Grille d'annotation collective",
    introduction:
      "Chaque membre du groupe surligne les passages dans le lecteur de Zotero (bibliothèque de groupe) en choisissant la couleur qui correspond à sa lecture. Un commentaire sur le surlignage précise le point de vue ; une note sur la notice résume une idée ; un marqueur désigne un concept.",
    positions: [
      { color: "#ffd400", name: "jaune", position: "Idée clé", instruction: "Passage central pour comprendre le document." },
      { color: "#5fb236", name: "vert", position: "Accord", instruction: "Idée que je partage ou que je souhaite reprendre." },
      { color: "#ff6666", name: "rouge", position: "Désaccord", instruction: "Affirmation que je conteste ou qui me pose problème." },
      { color: "#2ea8e5", name: "bleu", position: "Définition", instruction: "Définition d'un concept ou d'un terme." },
      { color: "#a28ae5", name: "violet", position: "Méthode", instruction: "Méthode, protocole ou démarche de recherche." },
      { color: "#e56eee", name: "magenta", position: "Question", instruction: "Point à discuter en groupe, question ouverte." },
      { color: "#f19837", name: "orange", position: "Exemple", instruction: "Exemple, cas, terrain d'étude." },
      { color: "#aaaaaa", name: "gris", position: "Contexte", instruction: "Élément de contexte, information secondaire." },
    ],
    // distance RVB maximale pour rattacher une couleur de surlignage à la grille
    tolerance: 80,
  },

  analysis: {
    // deux surlignages d'un même document portent sur le même passage si leurs mots se recouvrent à ce taux (Jaccard)
    unitSimilarity: 0.6,
    // nom donné aux annotations sans auteur (bibliothèque personnelle, PDF annotés hors Zotero)
    unassignedLabel: "(non attribué)",
    // documents en double dans la collection (même fichier, DOI, URL, ou titre et année) : un seul document dans
    // Omeka S, dont les annotations, notes et marqueurs cumulent ceux de tous les exemplaires
    mergeDuplicates: true,
    // nombre minimum de passages annotés en commun pour calculer un kappa interprétable
    minPassagesForKappa: 5,
  },

  themes: {
    // nombre de thèmes de discussion à proposer
    count: 6,
    // nombre maximum de passages transmis à l'agent
    maxPassages: 120,
  },

  // RAG Albert (https://guides.ia.numerique.gouv.fr/albert-api/guides/rag) : chaque collection Zotero a une collection
  // privée Albert de même nom, qui reçoit le texte de chacun de ses documents (une seule fois, doublons compris)
  rag: {
    // indexation des documents à chaque analyse
    enabled: true,
    // un document présent dans plusieurs collections Zotero est aussi déposé dans les collections Albert correspondantes
    allCollections: true,
    // découpage des textes par Albert (caractères)
    chunkSize: 2048,
    chunkOverlap: 200,
    // modèle de vectorisation des collections Albert (estimation du coût d'indexation)
    embeddingsModel: "BAAI/bge-m3",
    // consultation : nombre d'extraits, méthode de recherche (hybrid, semantic, lexical), seuil (sémantique seulement)
    limit: 8,
    method: "hybrid",
    scoreThreshold: 0,
    // instructions générales du modèle (le modèle de prompt choisi les complète)
    system:
      "Tu es un assistant de recherche. Tu réponds en français, uniquement à partir des extraits fournis, et tu cites chaque extrait utilisé par son numéro entre crochets, par exemple [2]. Si les extraits ne permettent pas de répondre, dis-le.",
    // modèles de prompt enregistrés dans Omeka S (repérés par dcterms:type) ; variables : {{question}}, {{extraits}}, {{collection}}
    promptType: "Modèle de prompt RAG",
    promptClass: "dcterms:MethodOfInstruction",
    // réponses enregistrées (bibo:Note : « notes or annotations about a resource »)
    answerType: "Réponse RAG",
    answerClass: "bibo:Note",
    // modèles proposés à la création (bouton « Créer les modèles par défaut »)
    defaultPrompts: [
      {
        title: "Synthèse",
        description: "Synthèse des documents de la collection sur une question.",
        template: "Question : {{question}}\n\nÀ partir des extraits de la collection « {{collection}} », rédige une synthèse structurée (idées principales, points d'accord et de désaccord entre auteurs), en citant les extraits.\n\nExtraits :\n{{extraits}}",
      },
      {
        title: "Définitions",
        description: "Définitions d'un concept selon les documents.",
        template: "Concept : {{question}}\n\nRelève les définitions de ce concept proposées dans les extraits, en distinguant les auteurs et en citant les extraits. Signale les divergences.\n\nExtraits :\n{{extraits}}",
      },
      {
        title: "Questions de discussion",
        description: "Questions ouvertes pour une séance collective.",
        template: "Thème : {{question}}\n\nPropose cinq questions ouvertes pour une séance de discussion sur ce thème, chacune appuyée sur un ou plusieurs extraits cités.\n\nExtraits :\n{{extraits}}",
      },
      {
        title: "Citations",
        description: "Passages à citer sur un sujet.",
        template: "Sujet : {{question}}\n\nSélectionne les passages les plus pertinents à citer sur ce sujet : pour chacun, la citation exacte, sa référence (numéro de l'extrait et titre du document) et une phrase expliquant son intérêt.\n\nExtraits :\n{{extraits}}",
      },
    ],
  },

  // dossier des fichiers produits (dans le répertoire de données)
  outputDir: "resultats/explo",
};

export type ExploConfig = typeof defaultExploConfig;

// configuration effective : défauts + surcharges de explo.config.json
export const exploConfig: ExploConfig = mergeConfig(defaultExploConfig, readConfigOverride(EXPLO_CONFIG_FILE));

// grille au format attendu par positionForColor / formatAnnotations
export const exploGrid = (config: ExploConfig = exploConfig) => ({ positions: config.grid.positions, tolerance: config.grid.tolerance });
