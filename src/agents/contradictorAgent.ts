import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { overridable, overridableModel } from "./overrides";
import { workflowConfig } from "../config";

export const CONTRADICTOR_INSTRUCTIONS = `Tu es un interlocuteur scientifique exigeant qui correspond par mail avec des chercheurs.
Tu réponds au dernier message reçu par une argumentation contradictoire, au sens de la disputatio : tu identifies
les affirmations principales de son auteur et, pour chacune, tu proposes une objection, une hypothèse concurrente, un contre-exemple
ou une limite méthodologique, appuyés sur les sources fournies.
Règles :
- écris en français, sur le ton courtois et collégial d'un mail entre chercheurs (tutoiement ou vouvoiement comme dans le fil) ;
- reconnais d'abord brièvement ce qui est solide, puis développe deux à quatre objections argumentées ;
- appuie chaque objection sur les extraits des archives ou les références de la collection, cités par leur numéro [n]
  ou par auteur et année ; n'invente ni citation, ni référence, ni fait ;
- termine par une ou deux questions ouvertes qui relancent l'échange ;
- ne signe pas : la signature est ajoutée automatiquement.`;

// demande envoyée pour chaque nouveau mail ; variables : {{correspondant}}, {{message}}, {{fil}}, {{extraits}}, {{references}}
export const CONTRADICTOR_PROMPT = `Correspondant : {{correspondant}}

<message_a_contredire>
{{message}}
</message_a_contredire>

<fil_de_discussion description="messages précédents, du plus ancien au plus récent">
{{fil}}
</fil_de_discussion>

<extraits_des_archives description="RAG : messages et pièces jointes archivés, numérotés">
{{extraits}}
</extraits_des_archives>

<references description="notices de la collection Zotero">
{{references}}
</references>

Rédige la réponse : un sujet (« Re : … » si pertinent), le corps du mail, et la liste des objections avec les numéros des extraits qui les appuient.`;

export const contradictorSchema = z.object({
  subject: z.string().describe("Sujet du mail"),
  body: z.string().describe("Corps du mail, sans signature"),
  arguments: z.array(z.object({
    claim: z.string().describe("Affirmation du correspondant"),
    counter: z.string().describe("Objection proposée"),
    sources: z.array(z.number()).describe("Numéros des extraits utilisés"),
  })).describe("Objections développées dans le mail"),
});

// Brouillon de réponse contradictoire aux nouveaux mails du chercheur (mailbot), validé par l'administrateur
export const contradictorAgent = new Agent({
  id: "contradictor-agent",
  name: "Contradicteur",
  instructions: overridable("contradictor-agent", CONTRADICTOR_INSTRUCTIONS),
  model: overridableModel("contradictor-agent", rc => rc?.get?.("model") ?? workflowConfig.models.analytics),
});
