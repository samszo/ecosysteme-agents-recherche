import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { overridable, overridableModel } from "./overrides";
import { workflowConfig } from "../config";

export const MAIL_COMPOSER_INSTRUCTIONS = `Tu animes une correspondance scientifique suivie avec un groupe de chercheurs.
À intervalles réguliers, tu écris au groupe de ta propre initiative pour faire avancer la réflexion commune :
reprendre un point resté en suspens, rapprocher deux idées échangées, signaler une référence de la collection
qui éclaire la discussion, ou poser une question nouvelle.
Règles :
- écris en français, sur le ton courtois et collégial d'un mail entre chercheurs, adressé à tout le groupe ;
- appuie-toi aussi sur l'historique des échanges du chercheur avec ses collègues, sans en divulguer d'éléments personnels ;
- un seul propos par mail, court (150 à 300 mots), avec un sujet explicite ;
- appuie-toi sur les archives (extraits numérotés [n]) et sur les références de la collection (auteur, année, titre) ;
  n'invente ni citation, ni référence, ni fait ;
- ne répète pas un mail déjà envoyé : varie les angles ;
- ne signe pas : la signature est ajoutée automatiquement.`;

// demande envoyée à chaque mail planifié ; variables : {{correspondant}}, {{consigne}}, {{archives}}, {{historique}}, {{extraits}}, {{references}}
export const MAIL_COMPOSER_PROMPT = `Correspondant : {{correspondant}}

Consigne : {{consigne}}

<derniers_echanges_du_mailbot description="avec le groupe, du plus ancien au plus récent">
{{archives}}
</derniers_echanges_du_mailbot>

<historique_du_chercheur description="échanges du chercheur avec ses collègues, du plus ancien au plus récent">
{{historique}}
</historique_du_chercheur>

<extraits_des_archives description="RAG : messages et pièces jointes archivés, numérotés">
{{extraits}}
</extraits_des_archives>

<references description="notices de la collection Zotero à mobiliser">
{{references}}
</references>

Rédige le mail : un sujet et le corps.`;

export const mailComposerSchema = z.object({
  subject: z.string().describe("Sujet du mail"),
  body: z.string().describe("Corps du mail, sans signature"),
  references: z.array(z.string()).describe("Clés Zotero des références citées").optional(),
});

// Mails envoyés au groupe à l'initiative de mailbot selon la planification (archives, RAG, collection Zotero)
export const mailComposerAgent = new Agent({
  id: "mail-composer-agent",
  name: "Rédacteur de courriels",
  instructions: overridable("mail-composer-agent", MAIL_COMPOSER_INSTRUCTIONS),
  model: overridableModel("mail-composer-agent", rc => rc?.get?.("model") ?? workflowConfig.models.analytics),
});
