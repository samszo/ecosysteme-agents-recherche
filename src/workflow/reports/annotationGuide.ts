// Guide d'annotation à partager avec les collaborateurs, généré à partir de la grille de couleurs
import type { ExploConfig } from "../../config/explo";

export function buildGuide(config: ExploConfig, collectionName?: string): string {
  const g = config.grid;
  return [
    `# ${g.title}`,
    "",
    collectionName ? `Collection Zotero : **${collectionName}** (\`${config.input.zoteroCollection}\`)` : `Collection Zotero : \`${config.input.zoteroCollection}\``,
    "",
    g.introduction,
    "",
    "## Couleurs de surlignage",
    "",
    "| Couleur | Signification | Quand l'utiliser |",
    "|---|---|---|",
    ...g.positions.map(p => `| <span style="display:inline-block;width:1em;height:1em;border-radius:3px;background:${p.color};vertical-align:middle"></span> ${p.name} (\`${p.color}\`) | **${p.position}** | ${p.instruction} |`),
    "",
    "## Consignes",
    "",
    "1. Travailler dans la **bibliothèque de groupe** Zotero : chaque annotation garde ainsi son auteur.",
    "2. Surligner dans le **lecteur de Zotero** en choisissant la couleur de la grille ; une couleur hors grille n'est pas interprétée.",
    "3. Ajouter un **commentaire** au surlignage pour expliciter sa lecture ; une **note** sur la notice pour une idée d'ensemble.",
    "4. Ajouter des **marqueurs** (tags) pour relier les passages à des concepts communs.",
    "5. Les passages annotés par plusieurs personnes, surtout avec des couleurs différentes, nourrissent les **thèmes de discussion**.",
    "",
  ].join("\n");
}
