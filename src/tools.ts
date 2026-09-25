import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import pdf from "pdf-parse";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";

export const fetchZoteroData = new Tool({
  name: "fetch-zotero-data",
  description: "Récupère les métadonnées et extrait le texte intégral des PDFs d'une collection Zotero.",
  schema: z.object({
    collectionId: z.string(),
  }),
  execute: async ({ data }) => {
    const { collectionId } = data;
    
    const userId = process.env.ZOTERO_USER_ID;
    const apiKey = process.env.ZOTERO_API_KEY;

    if (!userId || !apiKey) {
      throw new Error("Les identifiants Zotero (ZOTERO_USER_ID, ZOTERO_API_KEY) sont manquants dans le .env");
    }

    const headers = {
      "Zotero-API-Version": "3",
      "Authorization": `Bearer ${apiKey}`,
    };

    console.log(`📥 Interrogation de Zotero pour la collection : ${collectionId}...`);

    // 1. Récupérer tous les items de la collection
    // On demande le format JSON pour lire les métadonnées
    const itemsUrl = `https://api.zotero.org/users/${userId}/collections/${collectionId}/items?format=json`;
    const itemsResponse = await fetch(itemsUrl, { headers });
    
    if (!itemsResponse.ok) {
      throw new Error(`Erreur API Zotero: ${itemsResponse.statusText}`);
    }

    const items = await itemsResponse.json();

    // 2. Filtrer pour ne garder que les attachements de type PDF
    const pdfAttachments = items.filter((item: any) => 
      item.data.itemType === "attachment" && 
      item.data.contentType === "application/pdf"
    );

    console.log(`📄 ${pdfAttachments.length} PDF(s) trouvé(s). Début de l'extraction textuelle...`);

    const extractedArticles = [];

    // 3. Télécharger et parser chaque PDF
    for (const attachment of pdfAttachments) {
      const fileUrl = `https://api.zotero.org/users/${userId}/items/${attachment.key}/file`;
      
      try {
        const fileResponse = await fetch(fileUrl, { headers });
        if (!fileResponse.ok) {
          console.warn(`⚠️ Impossible de télécharger le PDF ${attachment.key}`);
          continue;
        }

        // Conversion du flux binaire en Buffer Node.js
        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extraction du texte via pdf-parse
        const pdfData = await pdf(buffer);
        
        extractedArticles.push({
          zoteroKey: attachment.key,
          parentItemKey: attachment.data.parentItem,
          title: attachment.data.title,
          text: pdfData.text,
          pages: pdfData.numpages
        });
        
        console.log(`✅ Extraction réussie : ${attachment.data.title} (${pdfData.numpages} pages)`);
        
      } catch (error) {
        console.error(`❌ Erreur lors de l'extraction de ${attachment.key}:`, error);
      }
    }

    // Le résultat sera injecté dans la mémoire de l'agent "Architecte des Connaissances"
    return { 
      status: "success", 
      totalExtracted: extractedArticles.length,
      articles: extractedArticles 
    };
  },
});


// 2. Définition stricte du schéma attendu pour un Graphe
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

export const buildLLMWiki = new Tool({
  name: "build-llm-wiki",
  description: "Découpe les textes, extrait les concepts via LLM (Map) et fusionne le graphe (Reduce).",
  schema: z.object({
    articles: z.array(z.object({
      title: z.string(),
      text: z.string(),
      zoteroKey: z.string()
    }))
  }),
  execute: async ({ data }) => {
    const { articles } = data;
    let allNodes = new Map<string, any>(); // Map pour dédoublonner via l'ID
    let allEdges = new Set<string>();      // Set pour dédoublonner les relations
    const edgesList: any[] = [];

    let totalChunksProcessed = 0;

    for (const article of articles) {
      console.log(`\n✂️ Traitement de l'article : ${article.title}`);
      const chunks = chunkText(article.text, 12000, 1000); // Fonction de chunking précédente
      
      // ==========================================
      // PHASE 1 : MAP (Extraction par chunk)
      // ==========================================
      for (const [index, chunk] of chunks.entries()) {
        console.log(`   🧠 Extraction sémantique du chunk ${index + 1}/${chunks.length}...`);
        
        try {
          const { object: subGraph } = await generateObject({
            model: ALBERT_MODEL_FAST,
            schema: GraphSchema,
            prompt: `Tu es un ontologue extrayant des concepts philosophiques et structurels.
            Lis cet extrait et extrais les concepts clés sous forme de nœuds et relations.
            Concentre-toi sur les modélisations conceptuelles et les auteurs.
            
            Extrait : 
            "${chunk}"`
          });

          // ==========================================
          // PHASE 2 : REDUCE (Fusion à la volée)
          // ==========================================
          
          // Fusion des nœuds (dédoublonnage)
          subGraph.nodes.forEach(node => {
            if (!allNodes.has(node.id)) {
              allNodes.set(node.id, node);
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

          totalChunksProcessed++;
        } catch (error) {
          console.error(`   ❌ Échec de l'extraction sur le chunk ${index + 1} :`, (error as Error).message);
        }
      }
    }

    const finalGraph = {
      nodes: Array.from(allNodes.values()),
      edges: edgesList
    };

    console.log(`✅ Graphe final construit : ${finalGraph.nodes.length} concepts, ${finalGraph.edges.length} relations.`);

    // On renvoie le graphe et ses métadonnées à l'agent Architecte 
    return { 
      wikiIndexId: `wiki_${Date.now()}`,
      metadata: {
        totalArticlesProcessed: articles.length,
        totalChunksProcessed,
      },
      conceptGraph: finalGraph 
    };
  },
});

export const exportToOpenKnowledge = new Tool({
  name: "export-okf",
  description: "Exporte le graphe conceptuel vers une instance Omeka S via son API REST.",
  schema: z.object({
    conceptGraph: z.object({
      nodes: z.array(z.object({
        id: z.string(),
        label: z.string(),
        category: z.string()
      })),
      edges: z.array(z.object({
        source: z.string(),
        target: z.string(),
        relation: z.string()
      }))
    })
  }),
  execute: async ({ data }) => {
    const { conceptGraph } = data;
    
    const apiUrl = process.env.OMEKA_S_API_URL;
    const keyId = process.env.OMEKA_S_KEY_IDENTITY;
    const keyCred = process.env.OMEKA_S_KEY_CREDENTIAL;

    if (!apiUrl || !keyId || !keyCred) {
      throw new Error("Identifiants Omeka S manquants dans le .env");
    }

    // Fonction utilitaire pour forger l'URL avec les clés API
    const getAuthUrl = (endpoint: string) => 
      `${apiUrl}${endpoint}?key_identity=${keyId}&key_credential=${keyCred}`;

    const omekaIdsMap = new Map<string, number>(); // Stocke la correspondance ID local -> ID Omeka

    console.log(`\n🌐 Début de l'ingestion dans Omeka S : ${conceptGraph.nodes.length} concepts à créer...`);

    // ==========================================
    // PASSE 1 : CRÉATION DES NŒUDS (ITEMS)
    // ==========================================
    for (const node of conceptGraph.nodes) {
      // Structure JSON-LD attendue par Omeka S
      const itemPayload = {
        "@type": "o:Item",
        "dcterms:title": [{ "type": "literal", "@value": node.label }],
        "dcterms:type": [{ "type": "literal", "@value": node.category }],
        "dcterms:identifier": [{ "type": "literal", "@value": node.id }]
      };

      try {
        const response = await fetch(getAuthUrl('/items'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemPayload)
        });

        if (response.ok) {
          const createdItem = await response.json();
          omekaIdsMap.set(node.id, createdItem["o:id"]);
          console.log(`   ✅ Concept créé : ${node.label} (Omeka ID: ${createdItem["o:id"]})`);
        } else {
          console.error(`   ❌ Échec création ${node.label}:`, await response.text());
        }
      } catch (error) {
        console.error(`   ❌ Erreur réseau pour ${node.label}`);
      }
    }

    // ==========================================
    // PASSE 2 : CRÉATION DES LIENS (EDGES)
    // ==========================================
    console.log(`\n🔗 Création des liens sémantiques entre les concepts...`);
    
    // On regroupe les relations par nœud source pour faire une seule mise à jour par Item
    const relationsBySource = new Map<string, any[]>();
    
    for (const edge of conceptGraph.edges) {
      const sourceOmekaId = omekaIdsMap.get(edge.source);
      const targetOmekaId = omekaIdsMap.get(edge.target);

      // Si les deux nœuds existent bien dans Omeka S
      if (sourceOmekaId && targetOmekaId) {
        if (!relationsBySource.has(edge.source)) {
          relationsBySource.set(edge.source, []);
        }
        
        // On construit le pointeur de ressource Omeka S
        relationsBySource.get(edge.source)?.push({
          "type": "resource",
          "property_label": edge.relation, 
          "value_resource_id": targetOmekaId
        });
      }
    }

    // Mise à jour (PATCH) des Items sources avec leurs nouvelles relations
    for (const [sourceId, relations] of relationsBySource.entries()) {
      const omekaId = omekaIdsMap.get(sourceId);
      
      const patchPayload = {
        "dcterms:relation": relations
      };

      try {
        await fetch(getAuthUrl(`/items/${omekaId}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchPayload)
        });
        console.log(`   🔗 Liens mis à jour pour l'item ID ${omekaId}`);
      } catch (error) {
        console.error(`   ❌ Échec de la mise à jour des liens pour l'item ID ${omekaId}`);
      }
    }

    console.log(`✅ Export vers Omeka S terminé.`);

    return { 
      status: "success", 
      message: `${omekaIdsMap.size} concepts intégrés et liés dans Omeka S.` 
    };
  },
});

// Une règle empirique est que 1 token ≈ 4 caractères en français.
// Pour une limite de 4000 tokens, on vise des chunks d'environ 16000 caractères.

function chunkText(text: string, maxChars: number = 15000, overlapChars: number = 1000): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    let chunkEnd = currentPosition + maxChars;

    // Si on dépasse la fin du texte, on prend le reste
    if (chunkEnd >= text.length) {
      chunks.push(text.slice(currentPosition));
      break;
    }

    // Chercher le meilleur point de coupure (paragraphe, puis phrase)
    let slice = text.slice(currentPosition, chunkEnd);
    let cutIndex = slice.lastIndexOf("\n\n");

    if (cutIndex === -1) {
      cutIndex = slice.lastIndexOf(". "); // Repli sur la fin d'une phrase
    }
    if (cutIndex === -1) {
      cutIndex = slice.lastIndexOf(" ");  // Repli sur un espace
    }
    
    // Si aucun point logique n'est trouvé, on coupe brutalement
    const finalCut = cutIndex !== -1 ? currentPosition + cutIndex + 1 : chunkEnd;

    chunks.push(text.slice(currentPosition, finalCut).trim());

    // On recule pour créer le chevauchement (overlap) et ne pas perdre de contexte
    currentPosition = finalCut - overlapChars;
    // Sécurité pour éviter les boucles infinies
    if (currentPosition <= chunks[chunks.length - 1].length - maxChars) {
       currentPosition = finalCut; 
    }
  }

  return chunks;
}