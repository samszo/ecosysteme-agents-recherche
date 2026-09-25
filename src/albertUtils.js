// src/albertUtils.ts

export async function listAlbertModels(): Promise<string[]> {
  const apiKey = process.env.ALBERT_API_KEY;
  
  if (!apiKey) {
    throw new Error("La clé ALBERT_API_KEY n'est pas définie dans l'environnement.");
  }

  // Interrogation de l'endpoint standard /v1/models
  const response = await fetch("https://albert.api.etalab.gouv.fr/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la requête à l'API Albert : ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // L'API retourne un objet contenant une propriété 'data' (un tableau d'objets modèles)
  // Nous extrayons uniquement l'identifiant (id) de chaque modèle.
  return data.data.map((model: { id: string }) => model.id);
}