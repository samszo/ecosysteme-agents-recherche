// Page HTML autonome d'un graphe orienté par les forces (d3.js) : reprend le module de l'interface
// (src/ui/public/forceGraph.js), inclus dans la page, avec les données du graphe
import fs from "fs";
import path from "path";
import type { VizNode, VizEdge } from "./graphViz";

export interface ForceEdge extends VizEdge { weight?: number; tension?: number }

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function generateForceGraphHtml(
  graph: { nodes: VizNode[]; edges: ForceEdge[] },
  options: { title?: string; omekaAdminUrl?: string; nodeLabel?: string } = {}
): string {
  const title = options.title ?? "Réseau";
  const module = fs.readFileSync(path.join(__dirname, "../../ui/public/forceGraph.js"), "utf-8");
  // "</script>" ne doit apparaître ni dans les données ni dans le module inclus
  const json = JSON.stringify(graph).replace(/</g, "\\u003c");
  const opts = JSON.stringify({ title, omekaAdminUrl: options.omekaAdminUrl ?? "", nodeLabel: options.nodeLabel ?? "nœud" }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { --bg: #fbfaf7; --panel: #ffffff; --ink: #1d1f24; --muted: #6b6f78; --line: #e2e0d9; --accent: #2f5d8a; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #15171b; --panel: #1d2026; --ink: #e8e9ec; --muted: #9aa0aa; --line: #2e323a; --accent: #7fb0e0; }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: var(--bg); color: var(--ink); font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
  #app .fg { border: 0; border-radius: 0; height: 100vh; }
</style>
</head>
<body>
<div id="app"></div>
<script type="application/json" id="graph-data">${json}</script>
<script type="module">
${module.replace(/<\/script/gi, "<\\/script")}
forceGraph(document.getElementById("app"), JSON.parse(document.getElementById("graph-data").textContent), ${opts});
</script>
</body>
</html>
`;
}
