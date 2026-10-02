// Consultation du RAG Albert depuis l'application exploZoteroAnno : modèles de prompt (Omeka S), recherche dans la
// collection Albert de la collection Zotero, réponse du modèle, coût, enregistrement de la réponse dans Omeka S
import { Albert, type AlbertSearchResult, type AlbertUsage } from "../albert/albert";
import type { Omk } from "../omeka/omk";
import { estimateImpact, type ImpactSummary } from "../metrics/impact";
import type { UsageEntry, UsageSummary } from "../metrics/usage";
import { estimateTokens } from "./ragIndex";
import { defaultExploConfig } from "../../config/explo";
import { defaultWorkflowConfig } from "../../config";

type RagConfig = typeof defaultExploConfig.rag;
type Costs = typeof defaultWorkflowConfig.costs;

export interface PromptTemplate {
  id: number;
  title: string;
  description: string;
  template: string;
}

const val = (it: any, term: string) => it?.[term]?.[0]?.["@value"] ?? "";

// ==========================================
// Modèles de prompt (items Omeka S de type rag.promptType)
// ==========================================

export async function listPrompts(omk: Omk, rag: RagConfig): Promise<PromptTemplate[]> {
  const items = await omk.getAllItems(`property[0][property]=dcterms:type&property[0][type]=eq&property[0][text]=${encodeURIComponent(rag.promptType)}&sort_by=title`);
  return items.map((it: any) => ({ id: it["o:id"], title: val(it, "dcterms:title") || it["o:title"] || `Modèle ${it["o:id"]}`, description: val(it, "dcterms:abstract"), template: val(it, "dcterms:description") }));
}

// crée ou modifie un modèle (le gabarit est dans dcterms:description, sa présentation dans dcterms:abstract)
export async function savePrompt(omk: Omk, rag: RagConfig, p: { id?: number | null; title: string; description?: string; template: string }): Promise<PromptTemplate> {
  if (!p.title?.trim() || !p.template?.trim()) throw new Error("Titre et gabarit du modèle obligatoires");
  const data = {
    "dcterms:title": p.title.trim(),
    "dcterms:abstract": (p.description ?? "").trim() || p.title.trim(),
    "dcterms:description": p.template,
    "dcterms:type": rag.promptType,
  };
  const item = p.id
    ? await omk.updateResource(p.id, data, "items", "PATCH")
    : await omk.createItem({ ...(omk.getClassByTerm(rag.promptClass) ? { "o:resource_class": rag.promptClass } : {}), ...data });
  return { id: item["o:id"], title: data["dcterms:title"], description: data["dcterms:abstract"], template: p.template };
}

// modèles par défaut de la configuration absents d'Omeka S (comparaison sur le titre)
export async function createDefaultPrompts(omk: Omk, rag: RagConfig) {
  const existing = new Set((await listPrompts(omk, rag)).map(p => p.title.toLowerCase()));
  const created: PromptTemplate[] = [];
  for (const p of rag.defaultPrompts) if (!existing.has(p.title.toLowerCase())) created.push(await savePrompt(omk, rag, p));
  return created;
}

// ==========================================
// Collection Albert d'une collection Zotero (même nom)
// ==========================================

export async function albertCollectionByName(albert: Albert, name: string) {
  return (await albert.collections({ name, visibility: "private" })).filter(c => c.name === name).sort((a, b) => a.id - b.id)[0] ?? null;
}

// ==========================================
// Consultation
// ==========================================

export interface RagSource {
  n: number;
  score: number;
  title: string;
  creators: string | null;
  year: string | null;
  omekaId: number | null;
  zoteroKey: string | null;
  albertDocumentId: number;
  chunkId: number;
  content: string;
}

export interface RagAnswer {
  question: string;
  collection: { key: string; name: string; albertId: number };
  prompt: { id: number | null; title: string };
  model: string;
  params: { limit: number; method: string; scoreThreshold: number };
  answer: string;
  sources: RagSource[];
  filledPrompt: string;
  usage: UsageSummary;
  // consommation et impacts déclarés par Albert (0 si la plateforme ne les facture pas)
  albert: { cost: number; kWh: number; kgCO2eq: number };
  impact: ImpactSummary;
  date: string;
  durationMs: number;
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in values ? values[k]! : m));

const sourceOf = (r: AlbertSearchResult, n: number): RagSource => {
  const m = r.chunk.metadata ?? {};
  const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : Number(v));
  return {
    n, score: r.score, content: r.chunk.content, albertDocumentId: r.chunk.document_id, chunkId: r.chunk.id,
    title: String(m.title ?? `Document ${r.chunk.document_id}`), creators: m.creators ? String(m.creators) : null, year: m.year ? String(m.year) : null,
    omekaId: num(m.omeka_id), zoteroKey: m.zotero_key ? String(m.zotero_key) : null,
  };
};

export async function queryRag(o: {
  albert: Albert;
  rag: RagConfig;
  costs: Costs;
  model: string;
  collection: { key: string; name: string };
  question: string;
  prompt: { id: number | null; title: string; template: string };
  limit?: number;
  method?: "hybrid" | "semantic" | "lexical";
  scoreThreshold?: number;
}): Promise<RagAnswer> {
  const started = Date.now();
  const question = o.question.trim();
  if (!question) throw new Error("Question vide");
  const target = await albertCollectionByName(o.albert, o.collection.name);
  if (!target) throw new Error(`La collection « ${o.collection.name} » n'est pas encore indexée dans Albert : lancer une analyse avec le RAG activé`);
  const params = { limit: o.limit ?? o.rag.limit, method: o.method ?? (o.rag.method as "hybrid"), scoreThreshold: o.scoreThreshold ?? o.rag.scoreThreshold };

  const search = await o.albert.search({ collectionIds: [target.id], query: question, limit: params.limit, method: params.method, scoreThreshold: params.scoreThreshold });
  const sources = search.data.map((r, i) => sourceOf(r, i + 1));
  const extraits = sources.length
    ? sources.map(s => `[${s.n}] « ${s.title} »${s.creators || s.year ? ` (${[s.creators, s.year].filter(Boolean).join(", ")})` : ""}\n${s.content.trim()}`).join("\n\n")
    : "(aucun extrait trouvé)";
  // gabarit sans {{extraits}} : les extraits sont ajoutés à la fin
  const template = /\{\{\s*extraits\s*\}\}/.test(o.prompt.template) ? o.prompt.template : `${o.prompt.template}\n\nExtraits :\n{{extraits}}`;
  const filledPrompt = fill(template, { question, extraits, collection: o.collection.name });

  const chat = await o.albert.chat({ model: o.model, messages: [{ role: "system", content: o.rag.system }, { role: "user", content: filledPrompt }] });

  // coût : recherche (vectorisation de la question) + complétion, estimé avec les hypothèses de config.costs
  const entry = (source: string, model: string, input: number, output: number, known: boolean): UsageEntry =>
    ({ source, model, calls: 1, inputTokens: input, outputTokens: output, reasoningTokens: 0, totalTokens: input + output, unknown: known ? 0 : 1 });
  const searchTokens = Number(search.usage?.prompt_tokens) || 0;
  const entries = [
    entry("Recherche RAG (vectorisation de la question)", o.rag.embeddingsModel, searchTokens || estimateTokens(question), 0, !!searchTokens),
    entry("Réponse RAG", o.model, Number(chat.usage?.prompt_tokens) || estimateTokens(o.rag.system + filledPrompt), Number(chat.usage?.completion_tokens) || estimateTokens(chat.text), !!chat.usage?.total_tokens),
  ];
  const sum = (k: keyof UsageEntry) => entries.reduce((n, e) => n + (e[k] as number), 0);
  const usage: UsageSummary = { entries, calls: sum("calls"), inputTokens: sum("inputTokens"), outputTokens: sum("outputTokens"), reasoningTokens: 0, totalTokens: sum("totalTokens"), unknown: sum("unknown") };
  const declared = [search.usage, chat.usage].filter(Boolean) as AlbertUsage[];

  return {
    question,
    collection: { ...o.collection, albertId: target.id },
    prompt: { id: o.prompt.id, title: o.prompt.title },
    model: o.model,
    params,
    answer: chat.text,
    sources,
    filledPrompt,
    usage,
    albert: {
      cost: declared.reduce((n, u) => n + (Number(u.cost) || 0), 0),
      kWh: declared.reduce((n, u) => n + (Number(u.impacts?.kWh) || 0), 0),
      kgCO2eq: declared.reduce((n, u) => n + (Number(u.impacts?.kgCO2eq) || 0), 0),
    },
    impact: estimateImpact(usage, o.costs),
    date: new Date().toISOString(),
    durationMs: Date.now() - started,
  };
}

// ==========================================
// Enregistrement d'une réponse (item bibo:Note + média Markdown)
// ==========================================

export function answerMarkdown(a: RagAnswer) {
  const i = a.impact;
  return `# ${a.prompt.title} : ${a.question}

Collection « ${a.collection.name} » (Zotero \`${a.collection.key}\`, Albert ${a.collection.albertId}) · modèle \`${a.model}\` · ${a.params.limit} extrait(s), recherche ${a.params.method} · ${new Date(a.date).toLocaleString("fr-FR")}

## Réponse

${a.answer}

## Extraits

${a.sources.map(s => `**[${s.n}] ${s.title}**${s.creators || s.year ? ` (${[s.creators, s.year].filter(Boolean).join(", ")})` : ""} · score ${s.score.toFixed(3)}${s.omekaId ? ` · item Omeka ${s.omekaId}` : ""}\n\n> ${s.content.trim().replace(/\n+/g, "\n> ")}`).join("\n\n") || "(aucun)"}

## Coût

${a.usage.totalTokens.toLocaleString("fr-FR")} tokens · ${i.energyWh.toLocaleString("fr-FR", { maximumFractionDigits: 3 })} Wh · ${i.co2g.toLocaleString("fr-FR", { maximumFractionDigits: 3 })} g CO₂e · équivalent API ${i.apiCost.toLocaleString("fr-FR", { maximumFractionDigits: 5 })} ${i.currency}
`;
}

export async function saveAnswer(omk: Omk, rag: RagConfig, a: RagAnswer) {
  // item de la collection Zotero (créé par l'analyse) et documents sources
  const collectionItem = (await omk.searchItemsByProp("dcterms:identifier", a.collection.key, omk.getClassByTerm("bibo:Collection") ? `resource_class_id[]=${omk.getClassByTerm("bibo:Collection")["o:id"]}` : "").catch(() => []))[0];
  const sourceIds = [...new Set(a.sources.map(s => s.omekaId).filter((x): x is number => !!x))];
  const item = await omk.createItem({
    ...(omk.getClassByTerm(rag.answerClass) ? { "o:resource_class": rag.answerClass } : {}),
    "dcterms:title": `${a.prompt.title} : ${a.question}`.slice(0, 250),
    "dcterms:type": rag.answerType,
    "dcterms:abstract": a.question,
    "dcterms:description": a.answer,
    "dcterms:date": a.date,
    ...(a.prompt.id ? { "dcterms:source": { rid: a.prompt.id } } : {}),
    ...(sourceIds.length ? { "dcterms:references": sourceIds.map(rid => ({ rid })) } : {}),
    ...(collectionItem ? { "dcterms:isPartOf": { rid: collectionItem["o:id"] } } : {}),
    ...(omk.getPropByTerm("curation:data") ? { "curation:data": JSON.stringify({
      model: a.model, params: a.params, collection: a.collection, prompt: a.prompt,
      tokens: { input: a.usage.inputTokens, output: a.usage.outputTokens, total: a.usage.totalTokens },
      impact: { energyWh: a.impact.energyWh, co2g: a.impact.co2g, electricityCost: a.impact.electricityCost, apiCost: a.impact.apiCost, currency: a.impact.currency },
      albert: a.albert,
      sources: a.sources.map(({ content, ...s }) => s),
    }) } : {}),
  });
  const stamp = a.date.replace(/[:.]/g, "-");
  try {
    await omk.uploadMedia(item["o:id"], { buffer: Buffer.from(answerMarkdown(a), "utf-8"), fileName: `reponse_rag_${stamp}.md`, type: "text/markdown" }, { "dcterms:title": `Réponse RAG – ${a.date}`, "dcterms:format": "text/markdown" });
  } catch {
    // extension .md refusée par l'instance : la réponse reste dans dcterms:description
  }
  return item["o:id"] as number;
}

// réponses enregistrées pour une collection Zotero (les plus récentes d'abord)
export async function listAnswers(omk: Omk, rag: RagConfig, collectionKey: string) {
  const items = await omk.searchItems(`property[0][property]=dcterms:type&property[0][type]=eq&property[0][text]=${encodeURIComponent(rag.answerType)}&sort_by=created&sort_order=desc&per_page=50`);
  return items
    .map((it: any) => {
      let data: any = {};
      try { data = JSON.parse(val(it, "curation:data") || "{}"); } catch { /* données illisibles */ }
      return { id: it["o:id"], title: it["o:title"], question: val(it, "dcterms:abstract"), answer: val(it, "dcterms:description"), date: val(it, "dcterms:date"), collection: data.collection ?? null, tokens: data.tokens ?? null, impact: data.impact ?? null };
    })
    .filter((a: any) => !a.collection || a.collection.key === collectionKey);
}
