import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";
import { fetchZoteroData, buildLLMWiki, exportToOpenKnowledge } from "./tools";

// 1. Ajoutez l'option compatibility: "compatible"
const albertProvider = createOpenAI({
  baseURL: "https://albert.api.etalab.gouv.fr/v1",
  apiKey: process.env.ALBERT_API_KEY,
  compatibility: "compatible", // 👈 CRUCIAL : Désactive les endpoints exclusifs à OpenAI
});

// 2. Utilisez explicitement .chat() au lieu de l'appel direct au provider
const ALBERT_MODEL_ANALYTICS = albertProvider.chat("openai/gpt-oss-120b");
const ALBERT_MODEL_FAST = albertProvider.chat("mistralai/Ministral-3-8B-Instruct-2512");


export const aapAnalystAgent = new Agent({
  name: "Analyste AAP",
  instructions: `Tu es un expert en ingénierie de la recherche. 
  Analyse le texte de l'appel à propositions fourni. 
  Extrais : 1. La problématique centrale. 2. Les axes thématiques. 3. Les contraintes formelles. 4. Les mots-clés incontournables.
  Renvoie un JSON structuré décrivant l'architecture attendue du papier.`,
  model: ALBERT_MODEL_ANALYTICS,
});

export const librarianAgent = new Agent({
  name: "Bibliothécaire",
  instructions: `Tu es un documentaliste scientifique. 
  Utilise l'outil Zotero pour récupérer la littérature pertinente. 
  Filtre les articles en fonction du bruit, résume leurs abstracts et prépare les textes intégraux.`,
  model: ALBERT_MODEL_FAST,
  tools: { fetchZoteroData }
});

export const wikiArchitectAgent = new Agent({
  name: "Architecte des Connaissances",
  instructions: `Tu es spécialisé en design des connaissances. 
  Prends les données brutes du Bibliothécaire et les directives de l'Analyste AAP. 
  Construis un index sémantique. Identifie les controverses et mappe les concepts clés.`,
  model: ALBERT_MODEL_ANALYTICS,
  tools: { buildLLMWiki }
});

export const ontologistAgent = new Agent({
  name: "Ontologue des Connaissances",
  instructions: `Prends le graphe de concepts brut généré par l'Architecte. 
  Mappe ces concepts sur des vocabulaires standards du web sémantique. 
  Prépare les métadonnées pour un export Open Knowledge Format / JSON-LD.`,
  model: ALBERT_MODEL_ANALYTICS,
  tools: { exportToOpenKnowledge }
});

export const writerAgent = new Agent({
  name: "Rédacteur Académique",
  instructions: `Tu es un chercheur rédigeant un article scientifique. 
  Utilise le LLM Wiki généré pour rédiger l'article section par section selon le plan de l'Analyste.
  Assure-toi de sourcer chaque affirmation avec les clés de citation exactes.`,
  model: ALBERT_MODEL_ANALYTICS,
});

export const epistemologistAgent = new Agent({
  name: "Épistémologue Critique",
  instructions: `Tu es un relecteur scientifique (peer-reviewer) spécialiste de la modélisation onto-éthique.
  Vérifie l'alignement avec l'appel à propositions et la validité des liens conceptuels.
  Propose des reformulations pour les passages manquant de profondeur critique.`,
  model: ALBERT_MODEL_ANALYTICS,
});