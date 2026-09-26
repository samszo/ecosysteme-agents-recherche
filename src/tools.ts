import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { PDFParse } from 'pdf-parse';

export const fetchZoteroData = new Tool({
  name: "fetch-zotero-data",
  description: "Récupère les PDFs depuis Zotero ou depuis le cache Omeka S. Uploade physiquement le PDF dans Omeka s'il est nouveau.",
  schema: z.object({
    collectionId: z.string(),
  }),
  execute: async ({ data }) => {
    const { collectionId } = data;
    const zUserId = process.env.ZOTERO_USER_ID;
    const zApiKey = process.env.ZOTERO_API_KEY;
    const omekaUrl = process.env.OMKS_API_URL;
    const omekaKeyId = process.env.OMKS_KEY_IDENTITY;
    const omekaKeyCred = process.env.OMKS_KEY_CREDENTIAL;
    if (!zUserId || !zApiKey || !omekaUrl || !omekaKeyId || !omekaKeyCred) {
      throw new Error("Identifiants Zotero ou Omeka manquants dans le .env");
    }

    const zHeaders = { "Zotero-API-Version": "3", "Authorization": `Bearer ${zApiKey}` };
    const getOmekaAuth = (endpoint: string) => `${omekaUrl}${endpoint}?key_identity=${omekaKeyId}&key_credential=${omekaKeyCred}`;

    console.log(`\n📥 Interrogation de la collection Zotero : ${collectionId}...`);

    const itemsRes = await fetch(`https://api.zotero.org/users/${zUserId}/collections/${collectionId}/items?format=json`, { headers: zHeaders });
    const items = await itemsRes.json();
    const pdfAttachments = items.filter((item: any) => item.data.itemType === "attachment" && item.data.contentType === "application/pdf");

    const extractedArticles = [];

    for (const attachment of pdfAttachments) {
      const zoteroKey = attachment.key;
      const title = attachment.data.title;
      // Nettoyage du nom de fichier pour l'upload
      const safeFileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${zoteroKey}.pdf`;

      // 1. Vérification dans le cache Omeka S
      const searchUrl = `${getOmekaAuth('/items')}&property[0][property]=dcterms:identifier&property[0][type]=eq&property[0][text]=${zoteroKey}`;
      
      try {
        const searchRes = await fetch(searchUrl);
        const existingOmekaItems = await searchRes.json();

        if (existingOmekaItems && existingOmekaItems.length > 0) {
          console.log(`♻️ [CACHE OMEKA] Article et Media déjà présents : ${title}`);
          const cachedText = existingOmekaItems[0]["dcterms:description"]?.[0]?.["@value"] || "";
          
          extractedArticles.push({ zoteroKey, title, text: cachedText });
          continue; 
        }
      } catch (e) {
        console.warn(`⚠️ Impossible de vérifier le cache Omeka S pour ${title}.`);
      }

      // 2. Téléchargement depuis Zotero
      console.log(`⬇️ [ZOTERO] Téléchargement du nouveau PDF : ${title}`);
      const fileUrl = `https://api.zotero.org/users/${zUserId}/items/${zoteroKey}/file`;

      try {
        const fileRes = await fetch(fileUrl, { headers: zHeaders });
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

// 💡 LA MÉTHODE FORTE : On cache le "require" au transpileur tsx grâce à eval()
        // Node.js pur prend le relais et charge la fonction d'origine sans l'altérer.
        const pdfData = new PDFParse(buffer);
        const extractedText = pdfData.text;
        
        extractedArticles.push({ zoteroKey, title, text: extractedText });      

        // 3. Création de l'Item dans Omeka S
        console.log(`⬆️ [OMEKA] Création de la notice bibliographique...`);
        const itemPayload = {
          "@type": "o:Item",
          "dcterms:title": [{ "type": "literal", "@value": title }],
          "dcterms:identifier": [{ "type": "literal", "@value": zoteroKey }],
          "dcterms:description": [{ "type": "literal", "@value": extractedText }]
        };

        const createItemRes = await fetch(getOmekaAuth('/items'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemPayload)
        });

        if (!createItemRes.ok) throw new Error("Échec de la création de l'Item");
        
        const createdItem = await createItemRes.json();
        const omekaItemId = createdItem["o:id"];

        // 4. Upload physique du binaire en tant que Media Omeka S
        console.log(`📦 [OMEKA] Upload du fichier binaire attaché à l'Item ID ${omekaItemId}...`);
        
        const formData = new FormData();
        const fileBlob = new Blob([buffer], { type: 'application/pdf' });
        
        // 💡 CORRECTION : Ajout de la clé "file_index" exigée par le framework Laminas d'Omeka S
        const mediaMetadata = {
          "o:ingester": "upload",
          "file_index": "0", // <-- C'est ce qui manquait
          "o:item": { "o:id": omekaItemId },
          "dcterms:title": [{ "type": "literal", "@value": `PDF original de ${title}` }]
        };

        formData.append('data', JSON.stringify(mediaMetadata));
        
        // 💡 CORRECTION : Ajout de l'index [0] dans le nom du champ de fichier
        formData.append('file[0]', fileBlob, safeFileName);

        const mediaRes = await fetch(getOmekaAuth('/media'), {
          method: "POST",
          body: formData
        });

        if (mediaRes.ok) {
          console.log(`✅ [OMEKA] Media uploadé avec succès !`);
        } else {
          console.warn(`⚠️ [OMEKA] Échec de l'upload du media :`, await mediaRes.text());
        }

      } catch (error) {
        console.error(`❌ Erreur sur ${title} :`, (error as Error).message);
      }
    }

    return { articles: extractedArticles };
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
      
      // 💡 CORRECTION : Filtrage des documents sans texte
      if (!article.text || article.text.trim() === "") {
        console.warn(`   ⚠️ Aucun texte exploitable pour "${article.title}" (PDF scanné ou vide). Document ignoré.`);
        continue; // On passe au document suivant
      }

      const chunks = chunkText(article.text, 12000, 1000);
      
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
      console.log(itemPayload);
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
  // Sécurité anti-crash pour les PDFs vides
  if (!text || typeof text !== 'string') return [];
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  
  // On DÉCLARE la variable une seule fois ici
  let currentPosition = 0;

  while (currentPosition < text.length) {
    let chunkEnd = currentPosition + maxChars;

    if (chunkEnd >= text.length) {
      chunks.push(text.slice(currentPosition));
      break;
    }

    let slice = text.slice(currentPosition, chunkEnd);
    let cutIndex = slice.lastIndexOf("\n\n");

    if (cutIndex === -1) {
      cutIndex = slice.lastIndexOf(". "); 
    }
    if (cutIndex === -1) {
      cutIndex = slice.lastIndexOf(" ");  
    }
    
    const finalCut = cutIndex !== -1 ? currentPosition + cutIndex + 1 : chunkEnd;

    chunks.push(text.slice(currentPosition, finalCut).trim());

    // On MODIFIE la variable sans la redéclarer (pas de 'let' ici)
    currentPosition = finalCut - overlapChars;
    
    if (currentPosition <= (finalCut - maxChars)) {
       currentPosition = finalCut; 
    }
  }

  return chunks;
}