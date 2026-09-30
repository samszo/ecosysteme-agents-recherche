import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import { getOmk } from "../lib/omeka/omk";
import { workflowConfig } from "../config";
import { getConceptIndex } from "../lib/omeka/conceptIndex";

const { accessTerm, subjectTerm, relationTerm } = workflowConfig.omeka;

const ExportSchema = z.object({
  conceptGraph: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      category: z.string(),
      omekaId: z.number().optional(),
      sources: z.array(z.string()).optional()
    })),
    edges: z.array(z.object({
      source: z.string(),
      target: z.string(),
      relation: z.string()
    }))
  }),
  // pièces jointes Zotero enregistrées dans Omeka (clé Zotero → item Omeka)
  articles: z.array(z.object({
    zoteroKey: z.string(),
    omekaItemId: z.number().optional()
  })).optional(),
  // pièces jointes dont l'extraction sémantique vient d'être faite
  extractedKeys: z.array(z.string()).optional()
});

export const exportToOpenKnowledge = new Tool({
  name: "export-okf",
  description: "Exporte le graphe conceptuel vers Omeka S : concepts (skos:Concept), relations entre concepts (dcterms:relation), liens pièces jointes → concepts (dcterms:subject), puis date d'extraction (curation:access) des pièces jointes traitées.",
  schema: ExportSchema,
  execute: async ({ data }) => {
    const { conceptGraph, articles = [], extractedKeys = [] } = data as z.infer<typeof ExportSchema>;
    const omk = await getOmk();
    const index = await getConceptIndex(omk);
    const createdBefore = index.created;

    const omekaIdsMap = new Map<string, number>(); // Stocke la correspondance ID local -> ID Omeka

    console.log(`\n🌐 Début de l'ingestion dans Omeka S : ${conceptGraph.nodes.length} concepts...`);

    // ==========================================
    // PASSE 1 : CONCEPTS (réutilisés s'ils existent déjà par identifiant ou par titre, créés sinon)
    // ==========================================
    for (const node of conceptGraph.nodes) {
      if (node.omekaId) {
        omekaIdsMap.set(node.id, node.omekaId);
        continue;
      }
      try {
        // concept réutilisé s'il existe déjà avec le même identifiant ou le même titre
        omekaIdsMap.set(node.id, await index.getOrCreate(node));
      } catch (error) {
        console.error(`   ❌ Échec création ${node.label}:`, (error as Error).message);
      }
    }
    const created = index.created - createdBefore;

    // ==========================================
    // PASSE 2 : RELATIONS ENTRE CONCEPTS (dcterms:relation)
    // ==========================================
    console.log(`\n🔗 Création des liens sémantiques entre les concepts...`);

    // On regroupe les relations par nœud source pour faire une seule mise à jour par Item
    const relationsBySource = new Map<number, number[]>();
    for (const edge of conceptGraph.edges) {
      const sourceOmekaId = omekaIdsMap.get(edge.source);
      const targetOmekaId = omekaIdsMap.get(edge.target);
      if (sourceOmekaId && targetOmekaId) {
        if (!relationsBySource.has(sourceOmekaId)) relationsBySource.set(sourceOmekaId, []);
        relationsBySource.get(sourceOmekaId)!.push(targetOmekaId);
      }
    }
    for (const [omekaId, targets] of relationsBySource) {
      try {
        await omk.addLinks(omekaId, relationTerm, targets);
      } catch (error) {
        console.error(`   ❌ Échec de la mise à jour des liens pour l'item ID ${omekaId} :`, (error as Error).message);
      }
    }

    // ==========================================
    // PASSE 3 : PIÈCES JOINTES → CONCEPTS (dcterms:subject)
    // ==========================================
    console.log(`\n📚 Liaison des pièces jointes Zotero à leurs concepts...`);
    const articleIds = new Map(articles.filter(a => a.omekaItemId).map(a => [a.zoteroKey, a.omekaItemId!]));
    const subjectsByArticle = new Map<number, number[]>();
    for (const node of conceptGraph.nodes) {
      const conceptId = omekaIdsMap.get(node.id);
      if (!conceptId) continue;
      for (const key of node.sources ?? []) {
        const articleId = articleIds.get(key);
        if (!articleId) continue;
        if (!subjectsByArticle.has(articleId)) subjectsByArticle.set(articleId, []);
        subjectsByArticle.get(articleId)!.push(conceptId);
      }
    }
    for (const [articleId, conceptIds] of subjectsByArticle) {
      try {
        await omk.addLinks(articleId, subjectTerm, conceptIds);
        console.log(`   📚 Item ${articleId} : ${new Set(conceptIds).size} concept(s) liés`);
      } catch (error) {
        console.error(`   ❌ Échec de la liaison des concepts pour l'item ID ${articleId} :`, (error as Error).message);
      }
    }

    // ==========================================
    // PASSE 4 : DATE D'EXTRACTION (curation:access) des pièces jointes traitées
    // ==========================================
    const now = new Date().toISOString();
    let marked = 0;
    for (const key of extractedKeys) {
      const articleId = articleIds.get(key);
      if (!articleId) continue;
      try {
        await omk.updateResource(articleId, { [accessTerm]: now }, "items", "PATCH");
        marked++;
      } catch (error) {
        console.error(`   ❌ Échec de la mise à jour de ${accessTerm} pour l'item ID ${articleId} :`, (error as Error).message);
      }
    }
    if (extractedKeys.length) console.log(`🕒 ${accessTerm} = ${now} sur ${marked}/${extractedKeys.length} pièce(s) jointe(s).`);

    console.log(`✅ Export vers Omeka S terminé.`);

    return {
      status: "success",
      message: `${omekaIdsMap.size} concepts dans Omeka S (${created} créés), ${subjectsByArticle.size} pièce(s) jointe(s) liée(s), ${marked} marquée(s) comme extraite(s).`,
      // correspondance identifiant du concept → item Omeka (liens de la visualisation du graphe)
      omekaIds: Object.fromEntries(omekaIdsMap),
      stats: {
        concepts: omekaIdsMap.size,
        created,
        relations: [...relationsBySource.values()].reduce((n, t) => n + t.length, 0),
        linkedArticles: subjectsByArticle.size,
        marked,
        accessDate: now,
      }
    };
  },
});
