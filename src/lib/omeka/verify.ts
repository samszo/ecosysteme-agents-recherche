// src/omekaVerify.ts
import { getOmk } from "./omk";

export async function verifyRecentOmekaItems(limit: number = 5) {
  try {
    const omk = await getOmk();
    console.log(`\n🔍 Vérification des ${limit} derniers items dans Omeka S...`);
    // Requête pour obtenir les X derniers items créés (triés par date de création décroissante)
    const items = await omk.searchItems({ sort_by: "created", sort_order: "desc", per_page: limit });

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

        // Ignorer les champs JSON-LD et techniques qui ne sont pas des listes de valeurs (@context, @id, @type, thumbnail_display_urls…)
        if (!Array.isArray(propertyValues)) continue;

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