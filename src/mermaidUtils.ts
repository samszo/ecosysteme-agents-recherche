// src/mermaidUtils.ts

export function generateMermaid(conceptGraph: { nodes: any[], edges: any[] }): string {
  if (!conceptGraph || !conceptGraph.nodes || !conceptGraph.edges) {
    return "<!-- Graphe vide ou invalide -->";
  }

  // Initialisation du graphe orienté de haut en bas (Top-Down)
  let mermaidStr = "```mermaid\ngraph TD\n\n";
  mermaidStr += "    %% Définition des nœuds\n";

  // Création des nœuds
  conceptGraph.nodes.forEach(node => {
    // Sécurisation de l'ID (lettres, chiffres, underscores uniquement)
    const safeId = node.id.replace(/[^a-zA-Z0-9_]/g, '');
    // Échappement des guillemets pour le texte affiché
    const safeLabel = node.label.replace(/"/g, '&quot;');
    
    // Style différencié selon la catégorie (optionnel, pour plus de lisibilité)
    if (node.category === 'auteur') {
      mermaidStr += `    ${safeId}(["👤 ${safeLabel}"])\n`; // Bords arrondis
    } else {
      mermaidStr += `    ${safeId}["${safeLabel}"]\n`; // Bords carrés
    }
  });

  mermaidStr += "\n    %% Définition des relations\n";

  // Création des liens (edges)
  conceptGraph.edges.forEach(edge => {
    const safeSource = edge.source.replace(/[^a-zA-Z0-9_]/g, '');
    const safeTarget = edge.target.replace(/[^a-zA-Z0-9_]/g, '');
    const safeRelation = edge.relation.replace(/"/g, '&quot;');
    
    mermaidStr += `    ${safeSource} -->|"${safeRelation}"| ${safeTarget}\n`;
  });

  mermaidStr += "```\n";

  return mermaidStr;
}