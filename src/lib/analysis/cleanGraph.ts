// Nettoyage du graphe de concepts produit par buildLLMWiki :
// 1. passe déterministe (markdown, identifiants, boucles, doublons)
// 2. passe LLM avec le modèle analytique (libellés corrigés, doublons fusionnés, concepts incohérents supprimés)
import { z } from "zod";
import { generateObject } from "ai";
import { ALBERT_MODEL_ANALYTICS } from "../../config/models";
import { workflowConfig } from "../../config";
import { recordUsage } from "../metrics/usage";

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  // item Omeka S du concept s'il existe déjà (concept rechargé)
  omekaId?: number;
  // clés Zotero des pièces jointes d'où provient le concept
  sources?: string[];
  // concept fixé par le chercheur (marqueur Zotero) : jamais renommé ni supprimé par le nettoyage
  locked?: boolean;
}
export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const CleanBatchSchema = z.object({
  nodes: z.array(z.object({
    id: z.string().describe("Identifiant d'origine du nœud, recopié à l'identique"),
    label: z.string().describe("Libellé corrigé : français correct, sans markdown, concis"),
    category: z.string().describe("Catégorie corrigée : 'concept', 'auteur', 'methode', 'oeuvre', 'institution', etc."),
    keep: z.boolean().describe("false si le concept est incohérent, vide de sens ou trop générique"),
    mergeInto: z.string().nullable().describe("Identifiant d'un autre nœud de la liste qui désigne le même concept, sinon null")
  }))
});

// retire la mise en forme markdown et les espaces superflus
export function stripMarkdown(s: string): string {
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // liens
    .replace(/[*_`#~]+/g, " ")
    .replace(/^\s*[-•>]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// identifiant en minuscule, sans accents ni ponctuation : 'Écosystème info' → 'ecosysteme_info'
export function normalizeId(s: string): string {
  return stripMarkdown(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// reconstruit les liens après renommage/fusion : supprime les boucles, les doublons et les liens orphelins
function rebuildEdges(edges: GraphEdge[], idMap: Map<string, string>, nodeIds: Set<string>): GraphEdge[] {
  const seen = new Set<string>();
  const out: GraphEdge[] = [];
  for (const e of edges) {
    const source = idMap.get(e.source) ?? e.source;
    const target = idMap.get(e.target) ?? e.target;
    const relation = normalizeId(e.relation) || "relation";
    if (source === target || !nodeIds.has(source) || !nodeIds.has(target)) continue;
    const sig = `${source}-${relation}-${target}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push({ source, target, relation });
  }
  return out;
}

// fusionne le nœud `from` dans `into` (sources réunies, identifiant Omeka conservé)
function absorb(into: GraphNode, from: GraphNode) {
  into.sources = [...new Set([...(into.sources ?? []), ...(from.sources ?? [])])];
  if (into.omekaId === undefined && from.omekaId !== undefined) into.omekaId = from.omekaId;
  if (from.locked && !into.locked) Object.assign(into, { label: from.label, category: from.category, locked: true });
}

// suppression des nœuds sans aucune relation (sauf les concepts déjà présents dans Omeka)
function removeIsolated(graph: Graph): Graph {
  const linked = new Set(graph.edges.flatMap(e => [e.source, e.target]));
  return { nodes: graph.nodes.filter(n => linked.has(n.id) || n.omekaId !== undefined || n.locked), edges: graph.edges };
}

// ==========================================
// PASSE 1 : nettoyage déterministe
// ==========================================
export function cleanGraphDeterministic(graph: Graph): Graph {
  const idMap = new Map<string, string>();
  const nodes = new Map<string, GraphNode>();

  for (const n of graph.nodes) {
    const label = stripMarkdown(n.label);
    const id = normalizeId(n.id) || normalizeId(label);
    if (!id || !label) continue;
    idMap.set(n.id, id);
    // deux ids qui se normalisent pareil désignent le même concept : on garde le premier (ou celui déjà dans Omeka)
    // la catégorie et le libellé d'un marqueur Zotero sont conservés tels quels
    const node: GraphNode = { ...n, id, label, category: n.locked ? n.category : normalizeId(n.category) || "concept", sources: [...(n.sources ?? [])] };
    const existing = nodes.get(id);
    if (!existing) nodes.set(id, node);
    else if ((existing.omekaId === undefined && node.omekaId !== undefined) || (node.locked && !existing.locked)) {
      absorb(node, existing);
      nodes.set(id, node);
    } else absorb(existing, node);
  }

  return {
    nodes: [...nodes.values()],
    edges: rebuildEdges(graph.edges, idMap, new Set(nodes.keys())),
  };
}

// ==========================================
// PASSE 2 : nettoyage sémantique par le modèle analytique
// ==========================================
export async function cleanGraphWithLLM(graph: Graph, batchSize = workflowConfig.cleaning.batchSize): Promise<Graph> {
  // les concepts déjà présents dans Omeka ont été nettoyés lors d'un passage précédent,
  // les marqueurs Zotero sont fixés par le chercheur : ni les uns ni les autres ne sont soumis au modèle
  const isKnown = (n: GraphNode) => n.omekaId !== undefined || !!n.locked;
  const known = graph.nodes.filter(isKnown);
  // tri par identifiant pour que les doublons probables tombent dans le même lot
  const sorted = graph.nodes.filter(n => !isKnown(n)).sort((a, b) => a.id.localeCompare(b.id));
  const byId = new Map([...known, ...sorted].map(n => [n.id, n]));
  const idMap = new Map<string, string>();
  const removed = new Set<string>();

  for (let i = 0; i < sorted.length; i += batchSize) {
    const batch = sorted.slice(i, i + batchSize);
    console.log(`   🧹 Nettoyage sémantique des concepts ${i + 1}-${i + batch.length}/${sorted.length}...`);
    try {
      const { object, usage } = await generateObject({
        model: ALBERT_MODEL_ANALYTICS,
        schema: CleanBatchSchema,
        prompt: `Tu es un ontologue relisant un graphe de concepts extrait automatiquement d'articles en sciences humaines.
        Pour chaque nœud ci-dessous :
        - corrige le libellé (orthographe française, pas de markdown, pas de mélange de langues, formulation concise et intelligible) ;
        - corrige la catégorie si besoin ;
        - mets keep à false si le concept est incohérent, vide de sens, tronqué ou trop générique pour être utile ;
        - si deux nœuds désignent le même concept, mets dans mergeInto l'identifiant du nœud à conserver (qui lui garde mergeInto à null).
        Recopie les identifiants à l'identique et renvoie tous les nœuds.

        Nœuds (id | libellé | catégorie) :
        ${batch.map(n => `${n.id} | ${n.label} | ${n.category}`).join("\n        ")}`
      });
      recordUsage("Nettoyage du graphe (cleanGraph)", workflowConfig.models.analytics, usage);

      for (const c of object.nodes) {
        const node = byId.get(c.id);
        if (!node || isKnown(node)) continue; // identifiant inventé par le modèle ou concept déjà dans Omeka
        if (!c.keep) {
          removed.add(c.id);
          continue;
        }
        const label = stripMarkdown(c.label);
        if (label) node.label = label;
        node.category = normalizeId(c.category) || node.category;
        if (c.mergeInto && c.mergeInto !== c.id && byId.has(c.mergeInto)) idMap.set(c.id, c.mergeInto);
      }
    } catch (error) {
      console.error(`   ❌ Échec du nettoyage sémantique de ce lot, il est conservé tel quel :`, (error as Error).message);
    }
  }

  // résolution des fusions en chaîne (a → b → c) et des fusions vers un nœud supprimé
  const resolve = (id: string) => {
    const visited = new Set<string>();
    while (idMap.has(id) && !visited.has(id)) {
      visited.add(id);
      id = idMap.get(id)!;
    }
    return id;
  };
  for (const id of idMap.keys()) idMap.set(id, resolve(id));

  // les sources des nœuds fusionnés passent au nœud conservé
  for (const [from, to] of idMap) {
    if (!removed.has(to)) absorb(byId.get(to)!, byId.get(from)!);
  }

  const nodes = [...known, ...sorted.filter(n => !removed.has(n.id) && !idMap.has(n.id) && !removed.has(resolve(n.id)))];
  console.log(`   🧹 ${removed.size} concept(s) supprimé(s), ${idMap.size} fusionné(s), ${known.length} déjà dans Omeka ou marqueur(s) conservé(s).`);
  return { nodes, edges: rebuildEdges(graph.edges, idMap, new Set(nodes.map(n => n.id))) };
}

export async function cleanGraph(graph: Graph): Promise<Graph> {
  const before = `${graph.nodes.length} concepts, ${graph.edges.length} relations`;
  let g = cleanGraphDeterministic(graph);
  g = await cleanGraphWithLLM(g);
  g = removeIsolated(g);
  console.log(`🧹 Nettoyage du graphe : ${before} → ${g.nodes.length} concepts, ${g.edges.length} relations.`);
  return g;
}
