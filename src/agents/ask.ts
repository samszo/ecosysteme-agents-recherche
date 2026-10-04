// Appel d'un agent avec le modèle de la configuration (contexte de requête « model »), sortie structurée facultative
// (schéma zod) et comptage des tokens pour le rapport de coût
import type { Agent } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";
import type { z } from "zod";
import { recordUsage } from "../lib/metrics/usage";

type Message = { role: "user"; content: string | ({ type: "text"; text: string } | { type: "file"; data: Buffer | Uint8Array; mediaType: string; filename?: string })[] };

export async function askAgent<S extends z.ZodTypeAny | undefined = undefined>(
  agent: Agent<any, any, any>,
  o: { model: string; source: string; prompt: string | Message[]; schema?: S },
): Promise<{ object: S extends z.ZodTypeAny ? z.infer<S> : undefined; text: string; usage: any }> {
  const requestContext = new RequestContext();
  requestContext.set("model", o.model);
  const messages = typeof o.prompt === "string" ? [{ role: "user" as const, content: o.prompt }] : o.prompt;
  const res: any = await agent.generate(messages as any, { requestContext, ...(o.schema ? { structuredOutput: { schema: o.schema } } : {}) } as any);
  const usage = res.totalUsage ?? res.usage;
  recordUsage(o.source, o.model, usage);
  return { object: res.object, text: String(res.text ?? ""), usage };
}
