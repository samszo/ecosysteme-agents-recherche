import { createStep } from "@mastra/core/workflows";
import fs from "fs/promises";
import { aapAnalystAgent } from "../agents/aapAnalystAgent";
import { fetchCfp } from "../tools/fetchCfp";
import { getZoteroCollections } from "../tools/zoteroCollections";
import { attachDocuments } from "./importSynthesis";
import { workflowConfig } from "../config";
import { recordUsage } from "../usage";

// 1. Appel à propositions : enregistrement dans Omeka S et analyse des attendus (AttenduAPP)
export const analyzeCfpStep = createStep({
  id: "analyze-cfp",
  execute: async ({ inputData, runId }) => {
    const collectionItemId = await (await getZoteroCollections()).itemId(inputData.zoteroCollection).catch(() => null);
    const cfp = await fetchCfp.execute({ data: { url: inputData.cfpUrl || undefined, file: inputData.cfpFile || undefined, text: inputData.cfpText, collectionItemId } });

    console.log("🧠 Agent : Analyse des attendus de l'appel à propositions...");
    const res = await aapAnalystAgent.generate(`Titre : ${cfp.title}\n${cfp.url ? `Source : ${cfp.url}\n` : ""}\nTexte de l'appel :\n${cfp.text}`);
    recordUsage("Attendus de l'appel (aapAnalystAgent)", workflowConfig.models.analytics, (res as any).totalUsage ?? res.usage);
    const expectations = `# Attendus de l'appel : ${cfp.title}\n\n${cfp.url ? `Source : <${cfp.url}>\n\n` : ""}${res.text.replace(/^#\s+Attendus[^\n]*\n+/i, "")}`;

    // AttenduAPP : enregistré localement et dans l'item Omeka de l'appel
    const file = workflowConfig.proposal.expectationsFile;
    await fs.writeFile(file, expectations);
    await attachDocuments(cfp.aapItemId, [{ filePath: `./${file}`, title: "AttenduAPP – Analyse des attendus de l'appel" }], runId, null)
      .catch(e => console.warn("⚠️ AttenduAPP non importé dans Omeka S :", (e as Error).message));

    return { cfpAnalysis: expectations, aapItemId: cfp.aapItemId, aapTitle: cfp.title, aapUrl: cfp.url };
  }
});
