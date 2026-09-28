// Enregistrement dans Omeka S de la configuration de chaque exécution du workflow
import { getOmk } from "../tools/omk";
import { workflowConfig } from "../config";
import { getZoteroCollections } from "../tools/zoteroCollections";
import { zoteroWebUrl } from "../tools/zotero";

// crée l'item décrivant l'exécution et renvoie son identifiant Omeka
export async function saveWorkflowConfig(runId: string, input: { cfpUrl?: string; cfpFile?: string; cfpText: string; zoteroCollection: string }): Promise<number> {
  const omk = await getOmk();
  const now = new Date().toISOString();
  const config = { ...workflowConfig, input, runId, startedAt: now };
  const zUserId = process.env.ZOTERO_USER_ID;
  // la configuration est rattachée à l'item de la collection Zotero traitée
  const collectionItemId = await (await getZoteroCollections()).itemId(input.zoteroCollection).catch(() => null);

  const { configClass } = workflowConfig.omeka;
  const item = await omk.createItem({
    ...(omk.getClassByTerm(configClass) ? { "o:resource_class": configClass } : {}),
    "dcterms:title": `Configuration ${workflowConfig.workflowId} – ${now}`,
    "dcterms:type": "Configuration de workflow",
    "dcterms:identifier": runId,
    "dcterms:date": now,
    "dcterms:description": JSON.stringify(config, null, 2),
    ...(zUserId ? { "dcterms:source": { u: zoteroWebUrl(`collections/${input.zoteroCollection}`), l: `Collection Zotero ${input.zoteroCollection}` } } : {}),
    ...(collectionItemId ? { "dcterms:isPartOf": { rid: collectionItemId } } : {}),
    "curation:status": "running",
    "curation:dateStart": now,
  });
  console.log(`🗂️ [OMEKA] Configuration du workflow enregistrée (Item ID ${item["o:id"]})`);
  return item["o:id"];
}

// statut final de l'exécution et tokens consommés (curation:data, JSON)
export async function updateWorkflowStatus(
  itemId: number,
  status: string,
  usage?: { calls: number; inputTokens: number; outputTokens: number; totalTokens: number },
  impact?: { energyWh: number; co2g: number; electricityCost: number; apiCost: number; currency: string }
) {
  const omk = await getOmk();
  await omk.updateResource(itemId, {
    "curation:status": status,
    "curation:dateEnd": new Date().toISOString(),
    ...(usage && omk.getPropByTerm("curation:data")
      ? { "curation:data": JSON.stringify({
          tokens: { calls: usage.calls, input: usage.inputTokens, output: usage.outputTokens, total: usage.totalTokens },
          ...(impact ? { impact: { energyWh: impact.energyWh, co2g: impact.co2g, electricityCost: impact.electricityCost, apiCost: impact.apiCost, currency: impact.currency } } : {}),
        }) }
      : {}),
  }, "items", "PATCH");
}
