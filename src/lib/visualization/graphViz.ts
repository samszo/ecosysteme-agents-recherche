// Visualisation du graphe de concepts avec sigma.js (https://github.com/jacomyal/sigma.js) :
// export au format graphology et page HTML autonome (bibliothèques chargées depuis jsDelivr)

export interface VizNode {
  id: string;
  label: string;
  category: string;
  omekaId?: number;
  sources?: string[];
}
export interface VizEdge {
  source: string;
  target: string;
  relation: string;
}

// graphe sérialisé au format graphology (https://graphology.github.io/serialization.html)
export function toGraphologyJSON(graph: { nodes: VizNode[]; edges: VizEdge[] }, omekaIds: Record<string, number> = {}) {
  const ids = new Set(graph.nodes.map(n => n.id));
  return {
    attributes: {},
    options: { type: "directed", multi: true, allowSelfLoops: false },
    nodes: graph.nodes.map(n => ({
      key: n.id,
      attributes: {
        label: n.label,
        category: n.category,
        sources: n.sources ?? [],
        ...(n.omekaId ?? omekaIds[n.id] ? { omekaId: n.omekaId ?? omekaIds[n.id] } : {}),
      },
    })),
    edges: graph.edges
      .filter(e => ids.has(e.source) && ids.has(e.target) && e.source !== e.target)
      .map(e => ({ source: e.source, target: e.target, attributes: { relation: e.relation } })),
  };
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// page HTML autonome : ForceAtlas2, taille par degré, couleur par catégorie, recherche, fiche du concept
export function generateGraphHtml(
  graph: { nodes: VizNode[]; edges: VizEdge[] },
  options: { title?: string; omekaAdminUrl?: string; omekaIds?: Record<string, number> } = {}
): string {
  const data = toGraphologyJSON(graph, options.omekaIds);
  const title = options.title ?? "Graphe de concepts";
  // "</script>" ne doit pas apparaître dans les données incluses
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

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
  #app { display: grid; grid-template-columns: 1fr 300px; height: 100%; }
  #graph { position: relative; min-height: 300px; }
  aside { background: var(--panel); border-left: 1px solid var(--line); padding: 14px; overflow: auto; }
  h1 { font-size: 15px; margin: 0 0 4px; }
  .muted { color: var(--muted); font-size: 12.5px; }
  input[type=search] { width: 100%; font: inherit; color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 6px 8px; margin: 10px 0; }
  .legend { display: flex; flex-direction: column; gap: 4px; margin: 8px 0 14px; }
  .legend label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; flex: none; }
  .legend .count { margin-left: auto; color: var(--muted); font-size: 12px; }
  #details h2 { font-size: 15px; margin: 14px 0 2px; }
  #details ul { padding-left: 16px; margin: 6px 0; }
  #details li { margin: 2px 0; overflow-wrap: anywhere; }
  #details a { color: var(--accent); }
  .rel { color: var(--muted); font-style: italic; }
  .controls { position: absolute; left: 10px; bottom: 10px; display: flex; gap: 6px; }
  .controls button { font: inherit; border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 6px; padding: 4px 10px; cursor: pointer; }
  #loading { position: absolute; inset: 0; display: grid; place-items: center; color: var(--muted); }
  @media (max-width: 700px) { #app { grid-template-columns: 1fr; grid-template-rows: 60vh auto; } aside { border-left: 0; border-top: 1px solid var(--line); } }
</style>
</head>
<body>
<div id="app">
  <div id="graph">
    <div id="loading">Calcul de la mise en page…</div>
    <div class="controls">
      <button id="zoom-in" title="Zoomer">+</button>
      <button id="zoom-out" title="Dézoomer">−</button>
      <button id="zoom-reset" title="Vue d'ensemble">Recentrer</button>
    </div>
  </div>
  <aside>
    <h1>${escapeHtml(title)}</h1>
    <div class="muted" id="stats"></div>
    <input type="search" id="search" list="labels" placeholder="Rechercher un concept…">
    <datalist id="labels"></datalist>
    <div class="legend" id="legend"></div>
    <div id="details" class="muted">Survoler un concept pour voir ses voisins, cliquer pour afficher sa fiche.</div>
  </aside>
</div>
<script type="application/json" id="graph-data">${json}</script>
<script type="module">
import Graph from "https://cdn.jsdelivr.net/npm/graphology@0.26.0/+esm";
import Sigma from "https://cdn.jsdelivr.net/npm/sigma@3.0.3/+esm";
import forceAtlas2 from "https://cdn.jsdelivr.net/npm/graphology-layout-forceatlas2@0.10.1/+esm";
import { circular } from "https://cdn.jsdelivr.net/npm/graphology-layout@0.6.1/+esm";

const OMEKA_ADMIN = ${JSON.stringify(options.omekaAdminUrl ?? "")};
const PALETTE = ["#2f6db0", "#d0602e", "#2e8b57", "#8a4fb8", "#c0392b", "#b8860b", "#1f8a8a", "#c2477d", "#5d6d7e", "#7a8b1f"];
const dark = matchMedia("(prefers-color-scheme: dark)").matches;

const graph = Graph.from(JSON.parse(document.getElementById("graph-data").textContent));

// couleur par catégorie (les plus fréquentes d'abord), taille par nombre de relations
const counts = {};
graph.forEachNode((_, a) => counts[a.category] = (counts[a.category] ?? 0) + 1);
const categories = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
const color = Object.fromEntries(categories.map((c, i) => [c, PALETTE[i % PALETTE.length]]));
const maxDegree = Math.max(1, ...graph.nodes().map(n => graph.degree(n)));
graph.forEachNode((n, a) => graph.mergeNodeAttributes(n, {
  color: color[a.category],
  size: 4 + 14 * Math.sqrt(graph.degree(n) / maxDegree),
}));
const edgeColor = dark ? "#565c66" : "#b9b6ad";
graph.forEachEdge((e, a) => graph.mergeEdgeAttributes(e, { label: a.relation.replace(/_/g, " "), size: 1.2, type: "arrow", color: edgeColor }));

// mise en page : cercle initial puis ForceAtlas2
circular.assign(graph);
forceAtlas2.assign(graph, { iterations: graph.order > 500 ? 200 : 400, settings: { ...forceAtlas2.inferSettings(graph), barnesHutOptimize: graph.order > 300 } });
document.getElementById("loading").remove();

document.getElementById("stats").textContent = \`\${graph.order} concepts · \${graph.size} relations\`;

// état de l'interface
let hovered = null, selected = null, query = "";
const hidden = new Set();
const focus = () => selected ?? hovered;
const neighbors = n => new Set(graph.neighbors(n));

const renderer = new Sigma(graph, document.getElementById("graph"), {
  renderEdgeLabels: true,
  defaultEdgeType: "arrow",
  labelColor: { color: dark ? "#e8e9ec" : "#1d1f24" },
  edgeLabelColor: { color: dark ? "#9aa0aa" : "#6b6f78" },
  labelRenderedSizeThreshold: 8,
  zIndex: true,
  nodeReducer: (n, a) => {
    const res = { ...a };
    const f = focus();
    if (hidden.has(a.category)) { res.hidden = true; return res; }
    if (f && n !== f && !neighbors(f).has(n)) { res.color = dark ? "#3a3e46" : "#dcdad3"; res.label = ""; res.zIndex = 0; }
    else if (f) { res.forceLabel = true; res.zIndex = 1; }
    if (query && a.label.toLowerCase().includes(query)) { res.highlighted = true; res.forceLabel = true; }
    return res;
  },
  edgeReducer: (e, a) => {
    const res = { ...a };
    const [s, t] = graph.extremities(e);
    if (hidden.has(graph.getNodeAttribute(s, "category")) || hidden.has(graph.getNodeAttribute(t, "category"))) { res.hidden = true; return res; }
    const f = focus();
    // étiquettes des relations seulement autour du concept survolé ou sélectionné
    if (f && s !== f && t !== f) res.hidden = true;
    else if (!f) res.label = "";
    else { res.size = 2.5; res.color = dark ? "#9aa0aa" : "#6b6f78"; }
    return res;
  },
});

// légende : cliquer une catégorie la masque ou l'affiche
const legend = document.getElementById("legend");
for (const c of categories) {
  const row = document.createElement("label");
  row.innerHTML = \`<input type="checkbox" checked><span class="dot" style="background:\${color[c]}"></span><span></span><span class="count">\${counts[c]}</span>\`;
  row.querySelector("span:nth-of-type(2)").textContent = c;
  row.querySelector("input").onchange = e => { e.target.checked ? hidden.delete(c) : hidden.add(c); renderer.refresh(); };
  legend.append(row);
}

// fiche d'un concept
const details = document.getElementById("details");
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const link = n => \`<a href="#" data-node="\${esc(n)}">\${esc(graph.getNodeAttribute(n, "label"))}</a>\`;
function showDetails(n) {
  if (!n) { details.className = "muted"; details.textContent = "Survoler un concept pour voir ses voisins, cliquer pour afficher sa fiche."; return; }
  const a = graph.getNodeAttributes(n);
  const rel = e => esc(graph.getEdgeAttribute(e, "relation").replace(/_/g, " "));
  const out = graph.outEdges(n).map(e => \`<li><span class="rel">\${rel(e)}</span> → \${link(graph.target(e))}</li>\`);
  const inc = graph.inEdges(n).map(e => \`<li>\${link(graph.source(e))} <span class="rel">\${rel(e)}</span> →</li>\`);
  details.className = "";
  details.innerHTML = \`<h2>\${esc(a.label)}</h2>
    <div class="muted"><span class="dot" style="display:inline-block;background:\${color[a.category]}"></span> \${esc(a.category)} · \${graph.degree(n)} relation(s)\${a.sources?.length ? \` · \${a.sources.length} document(s)\` : ""}</div>
    \${a.omekaId && OMEKA_ADMIN ? \`<p><a href="\${OMEKA_ADMIN}\${a.omekaId}" target="_blank" rel="noopener">Voir l'item Omeka S #\${a.omekaId}</a></p>\` : ""}
    \${out.length ? \`<strong>Relations sortantes</strong><ul>\${out.join("")}</ul>\` : ""}
    \${inc.length ? \`<strong>Relations entrantes</strong><ul>\${inc.join("")}</ul>\` : ""}\`;
  details.querySelectorAll("a[data-node]").forEach(el => el.onclick = e => { e.preventDefault(); select(el.dataset.node); });
}
function select(n) {
  selected = n;
  showDetails(n);
  renderer.refresh();
  if (n) {
    const { x, y } = renderer.getNodeDisplayData(n);
    renderer.getCamera().animate({ x, y, ratio: Math.min(renderer.getCamera().ratio, 0.5) }, { duration: 400 });
  }
}

renderer.on("enterNode", ({ node }) => { hovered = node; renderer.refresh(); });
renderer.on("leaveNode", () => { hovered = null; renderer.refresh(); });
renderer.on("clickNode", ({ node }) => select(node));
renderer.on("clickStage", () => select(null));

// recherche
const labels = document.getElementById("labels");
graph.forEachNode((n, a) => { const o = document.createElement("option"); o.value = a.label; labels.append(o); });
document.getElementById("search").oninput = e => {
  query = e.target.value.trim().toLowerCase();
  const exact = graph.findNode((_, a) => a.label.toLowerCase() === query);
  if (exact) select(exact); else renderer.refresh();
};

// zoom
const camera = renderer.getCamera();
document.getElementById("zoom-in").onclick = () => camera.animatedZoom({ duration: 300 });
document.getElementById("zoom-out").onclick = () => camera.animatedUnzoom({ duration: 300 });
document.getElementById("zoom-reset").onclick = () => camera.animatedReset({ duration: 300 });
</script>
</body>
</html>
`;
}
