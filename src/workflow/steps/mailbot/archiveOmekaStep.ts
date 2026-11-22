import { createStep } from "@mastra/core/workflows";
import fs from "fs";
import path from "path";
import { mailbotConfig } from "../../../config/mailbot";
import { getOmk } from "../../../lib/omeka/omk";
import { uploadWithFallback } from "../../runs/importSynthesis";
import { readMessages, writeMessages, type MessageUpdate } from "../../../lib/mail/store";

const who = (p: { address: string; name: string }) => (p.name ? `${p.name} <${p.address}>` : p.address);

// Omeka S : un item par message (identifiant = Message-ID), pièces jointes en médias ; reprend les messages pas encore archivés
export const archiveOmekaStep = createStep({
  id: "archive-omeka",
  execute: async () => {
    const config = mailbotConfig;
    const todo = readMessages(config).filter(m => !m.omekaItemId);
    if (!todo.length) {
      console.log("📤 [OMEKA] Aucun message à archiver.");
      return { archived: 0, existing: 0, media: 0, errors: [] as string[] };
    }
    let omk;
    try {
      omk = await getOmk();
    } catch (e) {
      // Omeka indisponible : les messages restent dans l'archive locale et seront repris à l'exécution suivante
      console.warn("⚠️ [OMEKA] Archivage impossible :", (e as Error).message);
      return { archived: 0, existing: 0, media: 0, errors: [(e as Error).message] };
    }
    const { emailClass, emailType, recipientTerm } = config.omeka;
    const hasClass = !!omk.getClassByTerm(emailClass);
    const recipient = omk.getPropByTerm(recipientTerm) ? recipientTerm : "dcterms:audience";
    const hasData = !!omk.getPropByTerm("curation:data");
    // items déjà connus (réponses : lien vers le message auquel elles répondent)
    const omekaIds = new Map(readMessages(config).filter(m => m.omekaItemId).map(m => [m.messageId, m.omekaItemId!]));
    console.log(`📤 [OMEKA] Archivage de ${todo.length} message(s)...`);
    const updates: MessageUpdate[] = [];
    const errors: string[] = [];
    let archived = 0, existing = 0, media = 0;
    for (const m of todo) {
      try {
        // idempotence : item déjà créé (exécution interrompue, autre poste) retrouvé par son identifiant
        let item = m.messageId ? (await omk.searchItemsByProp("dcterms:identifier", m.messageId))[0] : null;
        if (item) existing++;
        else {
          const parent = m.inReplyTo ? omekaIds.get(m.inReplyTo) : null;
          item = await omk.createItem({
            ...(hasClass ? { "o:resource_class": emailClass } : {}),
            "dcterms:title": m.subject || "(sans sujet)",
            "dcterms:type": emailType,
            "dcterms:identifier": m.messageId || m.id,
            "dcterms:date": m.date,
            "dcterms:creator": who(m.from),
            [recipient]: [...m.to, ...m.cc].map(who),
            "dcterms:description": m.text || "(message sans texte)",
            ...(parent ? { "dcterms:relation": { rid: parent } } : {}),
            ...(hasData ? { "curation:data": JSON.stringify({ id: m.id, box: m.box, profile: m.profile ?? null, messageId: m.messageId, inReplyTo: m.inReplyTo, references: m.references, folder: m.folder, direction: m.direction, draftId: m.draftId ?? null }) } : {}),
          });
          archived++;
        }
        const itemId: number = item["o:id"];
        omekaIds.set(m.messageId, itemId);
        const attachments = [];
        for (const a of m.attachments) {
          if (a.omekaMediaId) continue;
          try {
            const buffer = fs.readFileSync(path.resolve(process.cwd(), a.path));
            const { media: md } = await uploadWithFallback(omk, itemId, { buffer, fileName: a.fileName, type: a.contentType }, {
              "dcterms:title": a.fileName, "dcterms:format": a.contentType, "dcterms:identifier": `${m.id}/${a.sha1}`,
            });
            attachments.push({ sha1: a.sha1, fileName: a.fileName, omekaMediaId: md["o:id"] });
            media++;
          } catch (e) {
            console.warn(`   ⚠️ Pièce jointe ${a.fileName} non déposée dans Omeka S :`, (e as Error).message);
          }
        }
        updates.push({ id: m.id, omekaItemId: itemId, ...(attachments.length ? { attachments } : {}) });
      } catch (e) {
        errors.push(`${m.subject} : ${(e as Error).message}`);
        console.warn(`   ⚠️ Message « ${m.subject} » non archivé :`, (e as Error).message);
      }
    }
    if (updates.length) writeMessages(config, updates);
    console.log(`📤 [OMEKA] ${archived} item(s) créé(s), ${existing} déjà présent(s), ${media} pièce(s) jointe(s) déposée(s)`);
    return { archived, existing, media, errors };
  },
});
