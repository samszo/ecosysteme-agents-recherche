// Diagrammes Mermaid des partitions : construits à partir d'une liste de nœuds et de liens (toujours valides),
// et réparation des diagrammes écrits directement par un modèle (partitions antérieures)

export interface DiagramNode { id: string; label: string }
export interface DiagramEdge { from: string; to: string; label?: string }

// libellé sûr entre guillemets : sans guillemets doubles, retours à la ligne ni barres verticales
const label = (s: string, max = 70) => {
  const t = String(s ?? "").replace(/["“”]/g, "'").replace(/[|\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

// flowchart à partir des nœuds et des liens ; identifiants renumérotés (n1, n2…), liens vers des nœuds inconnus créés
export function buildMermaid(nodes: DiagramNode[], edges: DiagramEdge[], direction = "TD") {
  const ids = new Map<string, string>();
  const lines = [`flowchart ${direction}`];
  const add = (id: string, text: string) => {
    const key = String(id).trim();
    if (!ids.has(key)) {
      ids.set(key, `n${ids.size + 1}`);
      lines.push(`    ${ids.get(key)}["${label(text || key)}"]`);
    }
    return ids.get(key)!;
  };
  for (const n of nodes) add(n.id, n.label);
  for (const e of edges) {
    if (!e.from || !e.to) continue;
    const a = add(e.from, e.from), b = add(e.to, e.to);
    const l = label(e.label ?? "", 40);
    lines.push(`    ${a} -->${l ? `|"${l}"|` : ""} ${b}`);
  }
  return lines.join("\n");
}

// diagramme écrit par un modèle : bloc de code retiré, type de diagramme en tête, libellés entre guillemets,
// et syntaxes invalides fréquentes corrigées (A --> B:::classe "libellé" → A -->|"libellé"| B)
export function repairMermaid(code: string) {
  let m = String(code ?? "").replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!/^(flowchart|graph|mindmap)\b/.test(m)) m = `flowchart TD\n${m}`;
  if (/^(flowchart|graph)\b/.test(m)) {
    m = m
      .replace(/(-->|---|-\.->|==>)\s*([\w-]+):::[\w-]+\s+"([^"]*)"/g, (_s, arrow, id, l) => `${arrow}|"${label(l, 40)}"| ${id}`)
      .replace(/:::[\w-]+/g, "")
      .replace(/^\s*classDef\b.*$/gm, "")
      .replace(/(\b[\w-]+)\[(?!")([^\]\n]*)\]/g, (_s, id, l) => `${id}["${String(l).replace(/"/g, "'")}"]`)
      .replace(/(\b[\w-]+)\((?![("])([^)\n]*)\)(?!\))/g, (_s, id, l) => `${id}("${String(l).replace(/"/g, "'")}")`);
  }
  return m;
}
