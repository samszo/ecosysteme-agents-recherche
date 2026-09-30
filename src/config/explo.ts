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
    // nombre minimum de passages annotés en commun pour calculer un kappa interprétable
    minPassagesForKappa: 5,
  },

  themes: {
    // nombre de thèmes de discussion à proposer
    count: 6,
    // nombre maximum de passages transmis à l'agent
    maxPassages: 120,
  },

  // dossier des fichiers produits (dans le répertoire de données)
  outputDir: "resultats/explo",
};

export type ExploConfig = typeof defaultExploConfig;

// configuration effective : défauts + surcharges de explo.config.json
export const exploConfig: ExploConfig = mergeConfig(defaultExploConfig, readConfigOverride(EXPLO_CONFIG_FILE));

// grille au format attendu par positionForColor / formatAnnotations
export const exploGrid = (config: ExploConfig = exploConfig) => ({ positions: config.grid.positions, tolerance: config.grid.tolerance });
