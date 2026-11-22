// Configuration du workflow mailbot : historique des échanges d'un chercheur avec d'autres chercheurs (boîte du
// chercheur) et interactions du mailbot avec les chercheurs (boîte du mailbot : réponses argumentées, mails planifiés)
// Valeurs par défaut ; l'application cliente enregistre les modifications dans mailbot.config.json
import path from "path";
import { mergeConfig, readConfigOverride } from "./store";
import { workflowConfig } from ".";

export const MAILBOT_CONFIG_FILE = path.resolve(process.cwd(), process.env.MAILBOT_CONFIG_FILE || "mailbot.config.json");

// profil d'un chercheur dont l'historique est archivé : sa boîte « historique » (connexion HISTORY_<ID>_IMAP_* dans
// ⚙ Paramètres), ses destinataires, ses collections Zotero et Albert
export interface MailbotProfile {
  // identifiant court (minuscules et chiffres) : clés de connexion, archive, filtres
  id: string;
  researcher: {
    email: string;
    name: string;
    // présentation transmise aux agents (discipline, positions connues, ton des échanges)
    description: string;
  };
  // adresses des chercheurs destinataires (mails du chercheur vers eux et leurs réponses)
  recipients: string[];
  // dossiers parcourus ; vide = boîte de réception + dossier des messages envoyés (attribut \Sent du serveur)
  folders: string[];
  // date de début de l'historique (AAAA-MM-JJ) ; vide = tout l'historique
  since: string;
  // clé de la collection Zotero des pièces jointes ; vide = collection nommée zotero.collectionName, créée au besoin
  zoteroCollection: string;
}

export const PROFILE_ID = /^[a-z0-9]{1,20}$/;
export const emptyProfile = (id: string): MailbotProfile => ({ id, researcher: { email: "", name: "", description: "" }, recipients: [], folders: [], since: "", zoteroCollection: "" });

export const defaultMailbotConfig = {
  workflowId: "mailbot",

  // un profil par chercheur dont l'historique est archivé (boîte du chercheur lue sans modification ; seuls ses
  // échanges avec ses destinataires sont archivés) ; le tableau est remplacé en bloc par mailbot.config.json
  profiles: [emptyProfile("principal")] as MailbotProfile[],

  // boîte du mailbot, commune aux profils : lue en IMAP (BOT_IMAP_*), envoi en SMTP (SMTP_*) ; archive les échanges
  // avec les adresses autorisées et le groupe
  bot: {
    // adresses auxquelles le mailbot peut répondre (brouillons contradictoires validés par l'administrateur)
    allowed: [] as string[],
    // groupe de chercheurs destinataire des mails planifiés (un mail adressé à tout le groupe)
    group: [] as string[],
    // destinataires du groupe visibles de tous (« À ») ; false = copie cachée, chacun ne voit que le mailbot
    groupVisible: true,
    // dossiers parcourus ; vide = boîte de réception + dossier des messages envoyés
    folders: [] as string[],
    // copie des mails envoyés dans le dossier des envoyés de la boîte du mailbot (false si le serveur SMTP la fait déjà)
    appendSent: true,
  },

  // lecture des boîtes
  mailbox: {
    // nombre maximum de nouveaux messages archivés par boîte et par exécution (les plus anciens d'abord)
    maxNewMessages: 200,
    // retirer les citations du message précédent (lignes « > », « Le … a écrit : ») du texte archivé et indexé
    stripQuoted: true,
  },

  // pièces jointes déposées dans Zotero (clé API Zotero avec droit d'écriture) : une collection par profil, une pour
  // la boîte du mailbot
  zotero: {
    enabled: true,
    // nom de la collection d'un profil ({{chercheur}} = nom ou adresse du chercheur), créée au besoin
    collectionName: "Mailbot – {{chercheur}}",
    // collection de la boîte du mailbot : clé, sinon collection de ce nom créée au besoin
    botCollection: "",
    botCollectionName: "Mailbot – échanges du mailbot",
    // une notice « courriel » par message, pièces jointes en fichiers enfants ; false = pièces jointes seules
    emailItems: true,
    // taille maximale d'une pièce jointe déposée (Mo)
    maxAttachmentMb: 25,
  },

  // RAG Albert : chaque message et le texte de chaque pièce jointe dans une collection privée par profil, et une pour
  // la boîte du mailbot
  rag: {
    enabled: true,
    collectionName: "Mailbot – {{chercheur}}",
    botCollectionName: "Mailbot – échanges du mailbot",
    // découpage des textes par Albert (caractères)
    chunkSize: 2048,
    chunkOverlap: 200,
    // modèle de vectorisation (estimation du coût, costs.models)
    embeddingsModel: "BAAI/bge-m3",
    // extraits retrouvés pour rédiger un mail, méthode de recherche (hybrid, semantic, lexical)
    limit: 8,
    method: "hybrid",
  },

  // réponses aux nouveaux mails reçus par le mailbot (adresses de bot.allowed) : brouillon d'argumentation
  // contradictoire, envoyé après validation
  reply: {
    enabled: true,
    // seuls les mails reçus depuis moins de maxAgeDays jours et encore sans réponse reçoivent un brouillon
    maxAgeDays: 7,
    // messages du fil transmis à l'agent (les plus récents)
    threadMessages: 6,
    // notices de la collection Zotero transmises à l'agent
    zoteroItems: 6,
  },

  // mails envoyés au groupe (bot.group) à l'initiative de mailbot, selon la planification (schedule.compose)
  compose: {
    // false : envoi direct ; true : brouillon soumis à l'administrateur comme les réponses
    requireApproval: false,
    // consigne de rédaction (thème, intention) ; vide = relancer la discussion à partir des derniers échanges
    instruction: "",
    // derniers échanges du mailbot avec le groupe transmis à l'agent
    archiveMessages: 10,
    // derniers échanges de l'historique des chercheurs (tous profils) transmis à l'agent
    historyMessages: 6,
    // notices de la collection Zotero transmises (les moins citées dans les mails précédents d'abord)
    zoteroItems: 4,
  },

  // texte ajouté à la fin de chaque mail rédigé par un agent (transparence envers le correspondant)
  signature: "—\nMessage préparé avec l'assistance d'un agent IA (mailbot, Laboratoire Paragraphe, Université Paris 8).",

  // administrateur : validation des brouillons (onglet Brouillons) et notification des brouillons en attente
  admin: {
    // adresse prévenue à chaque nouveau brouillon ; vide = pas de notification
    email: "",
    notify: true,
  },

  // planification par le serveur (expressions cron à 5 champs : minute heure jour-du-mois mois jour-de-la-semaine)
  schedule: {
    // synchronisation : archivage, indexation, brouillons de réponse
    syncEnabled: false,
    sync: "0 * * * *",
    // mail rédigé et envoyé à l'initiative de mailbot (précédé d'une synchronisation)
    composeEnabled: false,
    compose: "0 9 * * 1",
  },

  // classes et types Omeka S des messages archivés
  omeka: {
    emailClass: "bibo:Email",
    emailType: "Courriel mailbot",
    // destinataires (propriété facultative : dcterms:audience si bibo:recipient manque)
    recipientTerm: "bibo:recipient",
  },

  models: {
    analytics: workflowConfig.models.analytics,
  },

  // dossier des fichiers produits (dans le répertoire de données)
  outputDir: "resultats/mailbot",
};

export type MailbotConfig = typeof defaultMailbotConfig;

// sous-dossiers de outputDir : archive des exécutions, brouillons, pièces jointes
export const RUNS_DIR = "executions";
export const DRAFTS_DIR = "brouillons";
export const ATTACHMENTS_DIR = "pieces";
// index local des messages archivés
export const MESSAGES_FILE = "messages.json";

// profils complétés (champs ajoutés depuis leur enregistrement) ; au moins un profil
export function normalizeMailbotConfig(config: MailbotConfig): MailbotConfig {
  const profiles = (Array.isArray(config.profiles) && config.profiles.length ? config.profiles : [emptyProfile("principal")])
    .map(p => ({ ...emptyProfile(p.id), ...p, researcher: { ...emptyProfile(p.id).researcher, ...(p.researcher ?? {}) } }));
  return { ...config, profiles };
}

// configuration effective : défauts + surcharges de mailbot.config.json
export const mailbotConfig: MailbotConfig = normalizeMailbotConfig(mergeConfig(defaultMailbotConfig, readConfigOverride(MAILBOT_CONFIG_FILE)));

// nom paramétré d'un profil ({{chercheur}} = nom, sinon adresse, sinon identifiant du profil)
export const fillName = (template: string, profile: MailbotProfile) =>
  template.replace(/\{\{\s*(chercheur|correspondant)\s*\}\}/g, profile.researcher.name || profile.researcher.email || profile.id).slice(0, 200);

// collections (Zotero, Albert) d'un profil, ou de la boîte du mailbot (profile = null)
export function collectionNames(config: MailbotConfig, profile: MailbotProfile | null) {
  return profile
    ? { zoteroKey: profile.zoteroCollection, zotero: fillName(config.zotero.collectionName, profile), rag: fillName(config.rag.collectionName, profile) }
    : { zoteroKey: config.zotero.botCollection, zotero: config.zotero.botCollectionName, rag: config.rag.botCollectionName };
}

export const profileById = (config: MailbotConfig, id: string | null | undefined) => config.profiles.find(p => p.id === id) ?? null;

// préfixe des clés de connexion de la boîte historique d'un profil (.env.mailbot)
export const historyEnvPrefix = (id: string) => `HISTORY_${id.toUpperCase()}_IMAP_`;

// adresses normalisées d'une liste (minuscules, sans doublon ni vide)
export const addressList = (list: string[]) => [...new Set(list.map(a => a.trim().toLowerCase()).filter(Boolean))];
