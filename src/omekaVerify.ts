// src/omekaVerify.ts

export async function verifyRecentOmekaItems(limit: number = 5) {
  const apiUrl = process.env.OMEKA_S_API_URL;
  const keyId = process.env.OMEKA_S_KEY_IDENTITY;
  const keyCred = process.env.OMEKA_S_KEY_CREDENTIAL;

  if (!apiUrl || !keyId || !keyCred) {
    console.error("⚠️ Identifiants Omeka S manquants pour la vérification.");
    return;
  }

  // Requête pour obtenir les X derniers items créés (triés par date de création décroissante)
  const queryUrl = `${apiUrl}/items?key_identity=${keyId}&key_credential=${keyCred}&sort_by=created&sort_order=desc&per_page=${limit}`;

  try {
    console.log(`\n🔍 Vérification des ${limit} derniers items dans Omeka S...`);
    const response = await fetch(queryUrl);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const items = await response.json();

    if (items.length === 0) {
      console.log("   Aucun item trouvé dans l'instance Omeka S.");
      return;
    }

    // Analyse de chaque item
    items.forEach((item: any) => {
      const id = item["o:id"];
      const title = item["o:title"] || "Sans titre";
      
      console.log(`\n📄 Item ID ${id} : "${title}"`);

      // Filtrer toutes les propriétés pour trouver celles de type "resource" (qui lient deux items)
      let hasRelations = false;
      
      for (const [propertyKey, propertyValues] of Object.entries(item)) {
        // Ignorer les propriétés internes d'Omeka (qui commencent par o:)
        if (propertyKey.startsWith("o:")) continue;

        const values = propertyValues as any[];
        const linkedResources = values.filter(v => v.type === "resource");

        if (linkedResources.length > 0) {
          hasRelations = true;
          linkedResources.forEach(link => {
            const linkedId = link.value_resource_id;
            const linkedName = link.value_resource_name || "Nom inconnu";
            console.log(`   🔗 [${propertyKey}] -> pointe vers l'Item ID ${linkedId} ("${linkedName}")`);
          });
        }
      }

      if (!hasRelations) {
        console.log("   ⚠️ Aucun lien sémantique (RDF) détecté pour cet item.");
      }
    });

    console.log("\n✅ Vérification terminée.");

  } catch (error) {
    console.error("❌ Échec de la vérification Omeka S :", (error as Error).message);
  }
}