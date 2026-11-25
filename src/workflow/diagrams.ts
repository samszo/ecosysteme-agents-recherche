// Description des workflows pour leur diagramme (onglet Workflow de chaque application) : étapes dans l'ordre d'exécution
// (plusieurs étapes dans un même groupe = exécution en parallèle), agents impliqués, et agents appelés hors du workflow
// (actions de l'interface, autres traitements). À tenir à jour avec les .then() / .parallel() des fichiers *Workflow.ts.
import { AAP_ANALYST_INSTRUCTIONS } from "../agents/aapAnalystAgent";
import { KAPPA_ANALYST_INSTRUCTIONS } from "../agents/kappaAnalystAgent";
import { WRITER_INSTRUCTIONS } from "../agents/writerAgent";
import { EPISTEMOLOGIST_INSTRUCTIONS } from "../agents/epistemologistAgent";
import { DISCUSSION_INSTRUCTIONS, DISCUSSION_PROMPT } from "../agents/discussionAgent";
import { CURATOR_INSTRUCTIONS } from "../agents/curatorAgent";
import { SEMINARIO_INSTRUCTIONS } from "../agents/seminarioAgent";
import { SLIDE_DESCRIBER_INSTRUCTIONS } from "../agents/slideDescriberAgent";
import { EDITOR_INSTRUCTIONS } from "../agents/editorAgent";
import { FRAME_INSTRUCTIONS } from "../agents/frameAgent";
import { IMAGE_DESCRIBER_INSTRUCTIONS } from "../agents/imageDescriberAgent";
import { CONTRADICTOR_INSTRUCTIONS, CONTRADICTOR_PROMPT } from "../agents/contradictorAgent";
import { MAIL_COMPOSER_INSTRUCTIONS, MAIL_COMPOSER_PROMPT } from "../agents/mailComposerAgent";

export type ModelRole = "analytique" | "rapide" | "vision";

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  model: ModelRole;
  tools?: string[];
  instructions: string;
  // demande modifiable (gabarit à variables) ; sans elle, la demande est construite par le programme
  prompt?: string;
  promptHelp?: string;
  // où sont les autres textes envoyés à l'agent
  note?: string;
  // étiquette des appels de l'agent dans les tableaux de consommation (ex. « (writerAgent) »)
  usageTag: string;
  // libellés des mêmes appels dans les rapports antérieurs aux agents
  legacyUsage?: string[];
  // consommation par défaut, tant qu'aucune exécution n'est connue : tokens par appel, appels par traitement
  estimate: { inputTokens: number; outputTokens: number; callsPerRun: number };
}

export interface StepInfo { id: string; label: string; description: string; agents?: string[]; model?: ModelRole }
export interface WorkflowDiagram { workflowId: string; title: string; stages: StepInfo[][]; outside: StepInfo[] }

export const AGENTS: Record<string, AgentInfo> = {
  "aap-analyst-agent": { id: "aap-analyst-agent", usageTag: "(aapAnalystAgent)", estimate: { inputTokens: 300, outputTokens: 1050, callsPerRun: 1 }, name: "Analyste AAP", role: "analyse les attendus de l'appel à propositions", model: "analytique", instructions: AAP_ANALYST_INSTRUCTIONS, note: "La demande contient le titre, la source et le texte de l'appel." },
  "kappa-analyst-agent": { id: "kappa-analyst-agent", usageTag: "(kappaAnalystAgent)", estimate: { inputTokens: 560, outputTokens: 1100, callsPerRun: 1 }, name: "Analyste de convergence", role: "évalue l'accord inter-juges (kappa) sur les annotations codées", model: "analytique", tools: ["fetchOmekaAnnotations", "calculateFleissKappa"], instructions: KAPPA_ANALYST_INSTRUCTIONS, note: "Les codes et le seuil de kappa insérés dans les instructions par défaut viennent de la configuration (Configuration › Kappa) au moment du chargement." },
  "writer-agent": { id: "writer-agent", usageTag: "(writerAgent)", estimate: { inputTokens: 6500, outputTokens: 1550, callsPerRun: 1 }, name: "Rédacteur académique", role: "rédige la proposition d'article selon le plan", model: "analytique", instructions: WRITER_INSTRUCTIONS, note: "La demande contient les attendus, le plan, les références, les citations, les mots-clés et le graphe de concepts." },
  "epistemologist-agent": { id: "epistemologist-agent", usageTag: "(epistemologistAgent)", estimate: { inputTokens: 4900, outputTokens: 4800, callsPerRun: 1 }, name: "Épistémologue critique", role: "relit la proposition au regard des attendus de l'appel", model: "analytique", instructions: EPISTEMOLOGIST_INSTRUCTIONS, note: "La demande contient la proposition et les attendus de l'appel." },
  "discussion-agent": { id: "discussion-agent", usageTag: "(discussionAgent)", estimate: { inputTokens: 1350, outputTokens: 2200, callsPerRun: 1 }, name: "Animateur de discussion", role: "propose des thèmes de discussion à partir de l'annotation collective", model: "analytique", instructions: DISCUSSION_INSTRUCTIONS, prompt: DISCUSSION_PROMPT,
    promptHelp: "Variables remplacées par les données de l'analyse : {{count}} (nombre de thèmes), {{grille}}, {{participation}}, {{passages_divergents}} (avec leur tension), {{passages_convergents}}, {{commentaires}}, {{marqueurs}}." },
  "rag-assistant": { id: "rag-assistant", usageTag: "Réponse RAG", estimate: { inputTokens: 3000, outputTokens: 600, callsPerRun: 1 }, name: "Assistant RAG Albert", role: "répond aux questions posées sur la collection (onglet RAG)", model: "analytique", instructions: "",
    note: "La demande est le modèle de prompt choisi dans l'onglet RAG (enregistré dans Omeka S, modifiable avec « Modifier »)." },
  "curator-agent": { id: "curator-agent", usageTag: "(curatorAgent)", legacyUsage: ["Requêtes RAG (thème)", "Choix des présentations (thème)", "Choix des citations (thème)"], estimate: { inputTokens: 300, outputTokens: 110, callsPerRun: 2 }, name: "Curateur de conférence", role: "formule les requêtes RAG et choisit citations et diapos selon le thème", model: "analytique", instructions: CURATOR_INSTRUCTIONS, note: "La demande contient le thème de la conférence et les candidats numérotés." },
  "frame-agent": { id: "frame-agent", usageTag: "(frameAgent)", estimate: { inputTokens: 1800, outputTokens: 450, callsPerRun: 1 }, name: "Rédacteur du cadre", role: "rédige l'introduction, l'argumentaire général et la conclusion de la séance", model: "analytique", instructions: FRAME_INSTRUCTIONS, note: "La demande contient le thème de la conférence, l'intervenant et le résumé de chaque séquence (citations, diapos, question, diagramme) ; la réponse suit un schéma (titre, sous-titre, texte, points)." },
  "seminario-agent": { id: "seminario-agent", usageTag: "(seminarioAgent)", legacyUsage: ["Cohérence, questions et diagrammes (RAG)", "Questions et diagrammes"], estimate: { inputTokens: 1150, outputTokens: 580, callsPerRun: 6 }, name: "Compositeur de séquences", role: "choisit les matériaux cohérents, la question et le diagramme de chaque séquence", model: "analytique", instructions: SEMINARIO_INSTRUCTIONS, note: "La réponse suit un schéma (question, intention, nœuds et liens du diagramme)." },
  "image-describer-agent": { id: "image-describer-agent", usageTag: "(imageDescriberAgent)", estimate: { inputTokens: 1500, outputTokens: 400, callsPerRun: 3200 }, name: "Descripteur d'images", role: "analyse les images des pages annotées avec Diigo (index RAG)", model: "vision", instructions: IMAGE_DESCRIBER_INSTRUCTIONS, note: "La demande contient l'image (vignette Omeka S) et le titre de la page ; la réponse suit un schéma (titre, mots-clés, description, texte visible)." },
  "slide-describer-agent": { id: "slide-describer-agent", usageTag: "(slideDescriberAgent)", legacyUsage: ["Description des diapos (vision)"], estimate: { inputTokens: 1500, outputTokens: 300, callsPerRun: 6 }, name: "Descripteur de diapositives", role: "décrit les diapos à partir de leur copie d'écran", model: "vision", instructions: SLIDE_DESCRIBER_INSTRUCTIONS, note: "La demande contient la copie d'écran et le texte de la diapo ; la réponse suit un schéma (titre, mots-clés, description)." },
  "editor-agent": { id: "editor-agent", usageTag: "(editorAgent)", legacyUsage: ["Raccourcissement des questions"], estimate: { inputTokens: 80, outputTokens: 25, callsPerRun: 6 }, name: "Correcteur d'écran", role: "raccourcit les questions trop longues pour l'écran", model: "vision", instructions: EDITOR_INSTRUCTIONS, note: "La demande est la question à raccourcir." },
  "contradictor-agent": { id: "contradictor-agent", usageTag: "(contradictorAgent)", estimate: { inputTokens: 4000, outputTokens: 900, callsPerRun: 1 }, name: "Contradicteur", role: "rédige une réponse contradictoire argumentée aux mails reçus par le mailbot d'une adresse autorisée (brouillon validé par l'administrateur)", model: "analytique", instructions: CONTRADICTOR_INSTRUCTIONS, prompt: CONTRADICTOR_PROMPT,
    promptHelp: "Variables : {{correspondant}} (auteur du mail et chercheur dont l'historique est archivé), {{message}} (mail à contredire), {{fil}} (messages précédents du fil), {{extraits}} (RAG, numérotés), {{references}} (notices de la collection Zotero). La réponse suit un schéma (sujet, corps, objections et extraits utilisés)." },
  "mail-composer-agent": { id: "mail-composer-agent", usageTag: "(mailComposerAgent)", estimate: { inputTokens: 4500, outputTokens: 600, callsPerRun: 1 }, name: "Rédacteur de courriels", role: "écrit au groupe de chercheurs à l'initiative de mailbot, selon la planification", model: "analytique", instructions: MAIL_COMPOSER_INSTRUCTIONS, prompt: MAIL_COMPOSER_PROMPT,
    promptHelp: "Variables : {{correspondant}} (groupe et chercheur), {{consigne}} (Réglages › Mails planifiés), {{archives}} (derniers échanges du mailbot), {{historique}} (derniers échanges de l'historique du chercheur), {{extraits}} (RAG, numérotés), {{references}} (notices de la collection Zotero, les moins citées d'abord). La réponse suit un schéma (sujet, corps)." },
};

export const DIAGRAMS: Record<"paper" | "explo" | "chaoticum" | "mailbot", WorkflowDiagram> = {
  paper: {
    workflowId: "academic-paper-factory",
    title: "Atelier d'articles",
    stages: [
      [
        { id: "analyze-cfp", label: "Analyse de l'appel", description: "Attendus de l'appel à propositions (AttenduAPP)", agents: ["aap-analyst-agent"] },
        { id: "fetch-literature", label: "Collection Zotero", description: "Documents, annotations et notes, enregistrés dans Omeka S" },
      ],
      [
        { id: "build-wiki", label: "Graphe de concepts", description: "Extraction des concepts des annotations et des textes (appel direct au modèle, prompt intégré au programme)", model: "rapide" },
        { id: "kappa-analysis", label: "Accord inter-juges", description: "Kappa de Fleiss / Cohen sur les annotations codées", agents: ["kappa-analyst-agent"] },
      ],
      [{ id: "normalize-okf", label: "Normalisation", description: "Nettoyage du graphe, export Open Knowledge et Omeka S" }],
      [{ id: "draft-paper", label: "Rédaction", description: "Proposition d'article (PropAPP) selon le plan", agents: ["writer-agent"] }],
      [{ id: "review-paper", label: "Relecture", description: "Critique de la proposition au regard de l'appel", agents: ["epistemologist-agent"] }],
    ],
    outside: [],
  },
  explo: {
    workflowId: "explo-zotero-anno",
    title: "exploZoteroAnno",
    stages: [
      [{ id: "fetch-literature", label: "Collection Zotero", description: "Documents, annotations (auteur, couleur), notes et marqueurs, enregistrés dans Omeka S" }],
      [
        { id: "participation", label: "Participation", description: "Par collaborateur, document, couleur de la grille et semaine" },
        { id: "collaboration", label: "Collaborations", description: "Passages communs, convergences, divergences, tension des lectures, kappa, réseau" },
        { id: "rag-index", label: "Indexation RAG", description: "Dépôt des textes dans les collections privées Albert" },
      ],
      [{ id: "themes", label: "Thèmes de discussion", description: "Thèmes pour une séance collective, à partir des passages et de leur tension", agents: ["discussion-agent"] }],
    ],
    outside: [{ id: "rag-query", label: "Interroger la collection", description: "Onglet RAG : recherche dans Albert puis réponse à partir des extraits", agents: ["rag-assistant"] }],
  },
  chaoticum: {
    workflowId: "chaoticum-seminario",
    title: "chaoticumSeminario",
    stages: [
      [{ id: "material", label: "Matière de la partition", description: "Écrans prévus ; citations et diapos choisies selon le thème (index RAG ou tirage au hasard)", agents: ["curator-agent", "seminario-agent", "editor-agent"] }],
      [{ id: "compose", label: "Composition", description: "Description des diapos, question et diagramme de chaque séquence, questions raccourcies pour l'écran", agents: ["slide-describer-agent", "seminario-agent", "editor-agent"] }],
      [{ id: "frame", label: "Cadre de la séance", description: "Écrans d'introduction, d'argumentaire général et de conclusion (remerciements), rédigés à partir de toute la partition", agents: ["frame-agent"] }],
    ],
    outside: [
      { id: "index", label: "Indexation des diapos", description: "Bouton « Indexer les diapos » : description des diapos pour l'index RAG", agents: ["slide-describer-agent"] },
      { id: "index-diigo", label: "Indexation des annotations Diigo", description: "Bouton « Indexer les annotations Diigo » : pages, passages surlignés, texte des médias et analyse des images", agents: ["image-describer-agent"] },
      { id: "regenerate", label: "Éditeur d'écran", description: "Nouvelle question, nouveau diagramme ou nouveau texte de cadre pour un écran ; ajout des écrans de cadre à une partition existante", agents: ["seminario-agent", "editor-agent", "frame-agent"] },
    ],
  },
  mailbot: {
    workflowId: "mailbot",
    title: "mailbot",
    stages: [
      [{ id: "fetch-mails", label: "Boîtes mail", description: "Historique du chercheur avec ses destinataires, puis échanges du mailbot avec les chercheurs (IMAP) ; pièces jointes enregistrées localement" }],
      [
        { id: "archive-omeka", label: "Archivage Omeka S", description: "Un item par message (identifiant = Message-ID), pièces jointes en médias" },
        { id: "zotero-attachments", label: "Pièces jointes Zotero", description: "Notice « courriel » et fichiers joints dans la collection Zotero" },
        { id: "mail-rag-index", label: "Indexation RAG", description: "Messages et texte des pièces jointes dans la collection privée Albert" },
      ],
      [{ id: "draft-replies", label: "Brouillons de réponse", description: "Argumentation contradictoire pour chaque nouveau mail reçu par le mailbot d'une adresse autorisée, soumise à l'administrateur", agents: ["contradictor-agent"] }],
      [{ id: "compose-mail", label: "Mail planifié", description: "Tâche « envoi » : mail au groupe rédigé à partir des archives, du RAG et de la collection, envoyé ou soumis à validation", agents: ["mail-composer-agent"] }],
    ],
    outside: [
      { id: "regenerate", label: "Nouvelle proposition", description: "Onglet Brouillons : nouvelle rédaction d'un brouillon avec une précision de l'administrateur", agents: ["contradictor-agent", "mail-composer-agent"] },
    ],
  },
};
