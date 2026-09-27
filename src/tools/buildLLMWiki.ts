import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import { generateObject } from "ai";
import { ALBERT_MODEL_FAST } from "../models";
import { chunkText } from "./chunkText";
import { cleanGraph, normalizeId, type GraphNode } from "./cleanGraph";
import { loadConceptGraph } from "./conceptStore";
import { getOmk } from "./omk";
import { workflowConfig } from "../config";
import { positionForColor } from "./annotationPositions";
import { recordUsage } from "../usage";

const { chunkSize, chunkOverlap, maxAnnotationChars } = workflowConfig.extraction;

// Définition stricte du schéma attendu pour un Graphe
const GraphSchema = z.object({
  nodes: z.array(z.object({
    id: z.string().describe("Identifiant unique en minuscule, ex: 'monade', 'ecosysteme_info'"),
    label: z.string().describe("Nom lisible du concept"),
    category: z.string().describe("Type : 'concept', 'auteur', 'methode', etc.")
  })),
  edges: z.array(z.object({
    source: z.string().describe("L'id du nœud source"),
    target: z.string().describe("L'id du nœud cible"),
    relation: z.string().describe("Nature de la relation : 'influence', 's_oppose_a', 'compose', etc.")
  }))
});

const AnnotationSchema = z.object({
  page: z.number(),
  type: z.string(),
  phrase: z.string(),
  note: z.string(),
  color: z.object({ hex: z.string(), css: z.string() }).nullable().optional(),
  tags: z.array(z.string()).optional()
});
type Annotation = z.infer<typeof AnnotationSchema>;

const ANNOTATION_LABELS: Record<string, string> = {
  Highlight: "surlignage",
  Underline: "soulignement",
  Squiggly: "soulignement ondulé",
  StrikeOut: "barré",
  Text: "note",
  FreeText: "note",
  Note: "note Zotero"
};

// concepts fixés par le chercheur : un nœud par marqueur Zotero
function tagNodes(tags: string[]): GraphNode[] {
  return tags
    .map(tag => ({ id: normalizeId(tag), label: tag, category: workflowConfig.tagCategory, locked: true }))
    .filter(n => n.id);
}

function formatTags(tags: string[]): string {
  return tags.map(t => `${normalizeId(t)} (« ${t} »)`).join(", ");
}

function formatAnnotation(a: Annotation): string {
  let line = `- ${a.page ? `p.${a.page} ` : ""}[${ANNOTATION_LABELS[a.type] ?? a.type}]`;
  if (a.phrase) line += ` « ${a.phrase} »`;
  if (a.note) line += ` — note du chercheur : ${a.note.length > 1500 ? a.note.slice(0, 1500) + "…" : a.note}`;
  if (a.tags?.length) line += ` — marqueurs : ${a.tags.join(", ")}`;
  return line;
}

// Mise en forme des annotations du chercheur pour le prompt, regroupées par positionnement
// (déduit de la couleur, cf. config.annotationPositions) et tronquées pour tenir dans le contexte
export function formatAnnotations(annotations: Annotation[], maxChars = maxAnnotationChars): string {
  const groups = new Map<string, { title: string; instruction: string; lines: string[] }>();
  for (const a of annotations) {
    const pos = positionForColor(a.color?.hex);
    const key = pos?.position ?? "";
    if (!groups.has(key)) {
      groups.set(key, pos
        ? { title: `${pos.position} (annotations de couleur ${pos.name})`, instruction: pos.instruction, lines: [] }
        : { title: "Sans positionnement (notes et annotations sans couleur reconnue)", instruction: "Extrais les concepts clés et relie-les aux autres passages.", lines: [] });
    }
    groups.get(key)!.lines.push(formatAnnotation(a));
  }

  // les groupes positionnés d'abord, dans l'ordre de la table de configuration
  const order = workflowConfig.annotationPositions.map(p => p.position as string);
  const sorted = [...groups.entries()].sort(([a], [b]) => (a ? order.indexOf(a) : order.length) - (b ? order.indexOf(b) : order.length));

  let out = "";
  for (const [, g] of sorted) {
    const header = `### ${g.title}\nConsigne : ${g.instruction}\n`;
    if (out.length + header.length > maxChars) break;
    out += header;
    for (const line of g.lines) {
      if (out.length + line.length > maxChars) {
        out += "- …\n";
        break;
      }
      out += line + "\n";
    }
    out += "\n";
  }
  return out.trim();
}

const WikiSchema = z.object({
  articles: z.array(z.object({
    title: z.string(),
    text: z.string(),
    zoteroKey: z.string(),
    annotations: z.array(AnnotationSchema).optional(),
    // marqueurs Zotero : chacun devient un concept
    tags: z.array(z.string()).optional(),
    omekaItemId: z.number().optional(),
    // date de la dernière extraction sémantique (curation:access) : si renseignée, l'article n'est pas retraité
    accessed: z.string().nullable().optional()
  }))
});

export const buildLLMWiki = new Tool({
  name: "build-llm-wiki",
  description: "Découpe les textes, extrait les concepts via LLM (Map) en tenant compte des annotations du chercheur, et fusionne le graphe (Reduce). Les articles déjà extraits (curation:access renseigné) ne sont pas retraités : leurs concepts sont relus dans Omeka S.",
  schema: WikiSchema,
  execute: async ({ data }) => {
    const { articles } = data as z.infer<typeof WikiSchema>;
    let allNodes = new Map<string, GraphNode>(); // Map pour dédoublonner via l'ID
    let allEdges = new Set<string>();      // Set pour dédoublonner les relations
    const edgesList: any[] = [];

    let totalChunksProcessed = 0;
    // pièces jointes dont l'extraction s'est déroulée sans erreur (leur curation:access sera renseigné après l'export)
    const extractedKeys: string[] = [];
    // pour le rapport de traitement : articles sans texte, en échec partiel, et nombre d'appels par article
    const emptyKeys: string[] = [];
    const failedKeys: string[] = [];
    const chunksByKey: Record<string, number> = {};

    // REDUCE : fusion à la volée de chaque sous-graphe dans le graphe global
    const mergeGraph = (subGraph: { nodes: GraphNode[]; edges: z.infer<typeof GraphSchema>["edges"] }, zoteroKey: string) => {
      // Fusion des nœuds (dédoublonnage) en notant la pièce jointe d'origine
      subGraph.nodes.forEach(node => {
        const existing = allNodes.get(node.id);
        if (!existing) {
          allNodes.set(node.id, { ...node, sources: [...new Set([...(node.sources ?? []), zoteroKey])] });
        } else {
          if (!existing.sources!.includes(zoteroKey)) existing.sources!.push(zoteroKey);
          if (existing.omekaId === undefined && node.omekaId !== undefined) existing.omekaId = node.omekaId;
          // un marqueur du chercheur prime sur un concept extrait du même nom
          if (node.locked && !existing.locked) Object.assign(existing, { label: node.label, category: node.category, locked: true });
        }
      });

      // Fusion des liens (dédoublonnage via une signature unique)
      subGraph.edges.forEach(edge => {
        const edgeSignature = `${edge.source}-${edge.relation}-${edge.target}`;
        if (!allEdges.has(edgeSignature)) {
          allEdges.add(edgeSignature);
          edgesList.push(edge);
        }
      });
    };

    // ==========================================
    // Marqueurs Zotero → concepts (pour tous les articles, même déjà extraits)
    // ==========================================
    for (const article of articles) {
      if (article.tags?.length) mergeGraph({ nodes: tagNodes(article.tags), edges: [] }, article.zoteroKey);
    }

    // ==========================================
    // Articles déjà extraits : relecture des concepts dans Omeka S
    // ==========================================
    const alreadyExtracted = articles.filter(a => a.accessed && a.omekaItemId);
    if (alreadyExtracted.length) {
      console.log(`\n♻️ ${alreadyExtracted.length} article(s) déjà extrait(s) : relecture de leurs concepts dans Omeka S...`);
      try {
        const omk = await getOmk();
        for (const article of alreadyExtracted) {
          const known = await loadConceptGraph(omk, [{ zoteroKey: article.zoteroKey, omekaItemId: article.omekaItemId! }]);
          console.log(`   ♻️ ${article.title} (extrait le ${article.accessed}) : ${known.nodes.length} concepts, ${known.edges.length} relations`);
          mergeGraph(known, article.zoteroKey);
        }
      } catch (error) {
        console.error(`   ❌ Relecture des concepts impossible :`, (error as Error).message);
      }
    }

    for (const article of articles) {
      if (article.accessed && article.omekaItemId) continue;
      console.log(`\n✂️ Traitement de l'article : ${article.title}`);
      let failures = 0;
      
      // 💡 CORRECTION : Filtrage des documents sans texte
      if (!article.text || article.text.trim() === "") {
        console.warn(`   ⚠️ Aucun texte exploitable pour "${article.title}" (PDF scanné ou vide). Document ignoré.`);
        emptyKeys.push(article.zoteroKey);
        continue; // On passe au document suivant
      }

      const chunks = chunkText(article.text, chunkSize, chunkOverlap);
      const annotationsBlock = formatAnnotations(article.annotations ?? []);
      const tagsBlock = formatTags(article.tags ?? []);
      const tagsInstruction = tagsBlock
        ? `Le chercheur a indexé ce document avec les marqueurs suivants (identifiant et libellé) : ${tagsBlock}.
            Ce sont des concepts à part entière : réutilise exactement ces identifiants et relie-leur les concepts extraits quand c'est pertinent.`
        : "";

      // ==========================================
      // PHASE 0 : Extraction depuis les annotations du chercheur
      // ==========================================
      if (annotationsBlock) {
        console.log(`   🖍️ Extraction sémantique des ${article.annotations!.length} annotation(s) et note(s)...`);
        try {
          const { object: subGraph, usage } = await generateObject({
            model: ALBERT_MODEL_FAST,
            schema: GraphSchema,
            prompt: `Tu es un ontologue extrayant des concepts philosophiques et structurels.
            Voici les passages que le chercheur a annotés dans l'article "${article.title}", ainsi que ses notes de lecture.
            Ce sont les idées qu'il juge essentielles : extrais-en les concepts clés sous forme de nœuds et relations.
            La couleur de chaque annotation indique le positionnement du chercheur : les annotations sont regroupées
            par positionnement, chaque groupe a sa consigne, respecte-la pour choisir les catégories et les relations.
            Les notes du chercheur (souvent préfixées par "//") désignent ses propres catégories d'analyse :
            crée un nœud pour chacune (catégorie 'concept') et relie-le aux concepts du passage annoté.
            Les marqueurs indiqués à la fin d'une annotation désignent des concepts : relie-leur les concepts de cette annotation.
            ${tagsInstruction}

            Annotations :
            ${annotationsBlock}`
          });
          recordUsage("Extraction : annotations et notes", workflowConfig.models.fast, usage);
          mergeGraph(subGraph, article.zoteroKey);
        } catch (error) {
          failures++;
          console.error(`   ❌ Échec de l'extraction sur les annotations :`, (error as Error).message);
        }
      }
      
      // ==========================================
      // PHASE 1 : MAP (Extraction par chunk)
      // ==========================================
      for (const [index, chunk] of chunks.entries()) {
        console.log(`   🧠 Extraction sémantique du chunk ${index + 1}/${chunks.length}...`);
        
        try {
          const { object: subGraph, usage } = await generateObject({
            model: ALBERT_MODEL_FAST,
            schema: GraphSchema,
            prompt: `Tu es un ontologue extrayant des concepts philosophiques et structurels.
            Lis cet extrait et extrais les concepts clés sous forme de nœuds et relations.
            Concentre-toi sur les modélisations conceptuelles et les auteurs.
            ${tagsInstruction}
            ${annotationsBlock ? `Privilégie les concepts en lien avec les passages annotés par le chercheur ci-dessous,
            en respectant son positionnement (consigne de chaque groupe) pour les relations,
            et réutilise les mêmes identifiants pour les concepts déjà désignés par ses notes.

            Annotations du chercheur :
            ${annotationsBlock}
            ` : ""}
            Extrait : 
            "${chunk}"`
          });
          recordUsage("Extraction : extraits de texte", workflowConfig.models.fast, usage);

          // PHASE 2 : REDUCE
          mergeGraph(subGraph, article.zoteroKey);

          totalChunksProcessed++;
        } catch (error) {
          failures++;
          console.error(`   ❌ Échec de l'extraction sur le chunk ${index + 1} :`, (error as Error).message);
        }
      }

      chunksByKey[article.zoteroKey] = chunks.length;
      if (failures) {
        failedKeys.push(article.zoteroKey);
        console.warn(`   ⚠️ ${failures} échec(s) : l'extraction de "${article.title}" sera relancée au prochain passage.`);
      } else extractedKeys.push(article.zoteroKey);
    }

    const rawGraph = {
      nodes: Array.from(allNodes.values()),
      edges: edgesList
    };
    console.log(`🧩 Graphe brut : ${rawGraph.nodes.length} concepts, ${rawGraph.edges.length} relations.`);

    // PHASE 3 : nettoyage (markdown, doublons, boucles, concepts incohérents) avec le modèle analytique
    const finalGraph = await cleanGraph(rawGraph);

    console.log(`✅ Graphe final construit : ${finalGraph.nodes.length} concepts, ${finalGraph.edges.length} relations.`);

    // On renvoie le graphe et ses métadonnées à l'agent Architecte 
    return { 
      wikiIndexId: `wiki_${Date.now()}`,
      metadata: {
        totalArticlesProcessed: articles.length,
        totalChunksProcessed,
        rawConcepts: rawGraph.nodes.length,
        rawRelations: rawGraph.edges.length,
        reusedKeys: alreadyExtracted.map(a => a.zoteroKey),
        emptyKeys,
        failedKeys,
        chunksByKey,
      },
      extractedKeys,
      conceptGraph: finalGraph 
    };
  },
});
