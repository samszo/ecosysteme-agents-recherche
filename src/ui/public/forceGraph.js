// Graphe orienté par les forces avec d3.js (d'après https://observablehq.com/@d3/force-directed-graph/2) :
// couleur par catégorie, taille par degré, épaisseur des liens par poids, couleur des liens par tension,
// survol (voisins), clic (fiche), glisser-déposer, zoom, recherche, légende cliquable.
// Utilisé par explo.html et inclus tel quel dans la page autonome produite par src/lib/visualization/forceGraphHtml.ts.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const PALETTE = ["#2f6db0", "#d0602e", "#2e8b57", "#8a4fb8", "#c0392b", "#b8860b", "#1f8a8a", "#c2477d", "#5d6d7e", "#7a8b1f"];
const TENSION_LOW = "#9aa0aa", TENSION_HIGH = "#d0312d";

const CSS = `
.fg { display: grid; grid-template-columns: 1fr 280px; height: var(--fg-height, 560px); border: 1px solid var(--line, #e2e0d9); border-radius: 8px; overflow: hidden; background: var(--bg, #fbfaf7); color: var(--ink, #1d1f24); }
.fg-stage { position: relative; min-height: 300px; }
.fg-stage svg { display: block; width: 100%; height: 100%; cursor: grab; }
.fg-stage svg:active { cursor: grabbing; }
.fg aside { background: var(--panel, #fff); border-left: 1px solid var(--line, #e2e0d9); padding: 12px; overflow: auto; font-size: 13px; }
.fg h3 { font-size: 14px; margin: 0 0 2px; }
.fg .fg-muted { color: var(--muted, #6b6f78); font-size: 12.5px; }
.fg input[type=search] { width: 100%; font: inherit; color: inherit; background: var(--bg, #fbfaf7); border: 1px solid var(--line, #e2e0d9); border-radius: 6px; padding: 5px 8px; margin: 8px 0; }
.fg-legend { display: flex; flex-direction: column; gap: 3px; margin: 6px 0 10px; }
.fg-legend label { display: flex; align-items: center; gap: 7px; cursor: pointer; }
.fg-legend input { width: auto; margin: 0; }
.fg-legend .n { margin-left: auto; color: var(--muted, #6b6f78); font-size: 12px; }
.fg-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; display: inline-block; }
.fg-ramp { height: 8px; border-radius: 4px; margin: 4px 0 2px; background: linear-gradient(90deg, ${TENSION_LOW}, ${TENSION_HIGH}); }
.fg-ramp-l { display: flex; justify-content: space-between; color: var(--muted, #6b6f78); font-size: 11.5px; }
.fg-details ul { padding-left: 16px; margin: 4px 0 8px; }
.fg-details li { margin: 2px 0; overflow-wrap: anywhere; }
.fg-details a { color: var(--accent, #2f5d8a); }
.fg-rel { color: var(--muted, #6b6f78); font-style: italic; }
.fg-controls { position: absolute; left: 8px; bottom: 8px; display: flex; gap: 6px; }
.fg-controls button { font: inherit; font-size: 13px; border: 1px solid var(--line, #e2e0d9); background: var(--panel, #fff); color: inherit; border-radius: 6px; padding: 3px 10px; cursor: pointer; }
.fg text { font: 11.5px system-ui, -apple-system, "Segoe UI", sans-serif; fill: var(--ink, #1d1f24); paint-order: stroke; stroke: var(--bg, #fbfaf7); stroke-width: 3px; stroke-linejoin: round; pointer-events: none; }
@media (max-width: 700px) { .fg { grid-template-columns: 1fr; grid-template-rows: 60vh auto; height: auto; } .fg aside { border-left: 0; border-top: 1px solid var(--line, #e2e0d9); } }
`;

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const short = (s, n = 32) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// graph : { nodes: [{ id, label, category, omekaId? }], edges: [{ source, target, relation, weight?, tension? }] }
// options : { title, height, omekaAdminUrl, nodeLabel: "nœud" }
export function forceGraph(container, graph, options = {}) {
  if (!document.getElementById("fg-style")) document.head.append(Object.assign(document.createElement("style"), { id: "fg-style", textContent: CSS }));
  const { title = "", height = 560, omekaAdminUrl = "", nodeLabel = "nœud" } = options;

  // copies : la simulation remplace source et target par les nœuds
  const ids = new Set(graph.nodes.map(n => n.id));
  const nodes = graph.nodes.map(n => ({ ...n }));
  const links = graph.edges.filter(e => ids.has(e.source) && ids.has(e.target) && e.source !== e.target).map(e => ({ ...e }));
  const byId = new Map(nodes.map(n => [n.id, n]));
  const neighbors = new Map(nodes.map(n => [n.id, new Set()]));
  for (const l of links) { neighbors.get(l.source).add(l.target); neighbors.get(l.target).add(l.source); }

  // couleur par catégorie (les plus fréquentes d'abord), rayon par degré, épaisseur par poids, couleur par tension
  const counts = d3.rollup(nodes, v => v.length, n => n.category);
  const categories = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a));
  const color = d3.scaleOrdinal(categories, PALETTE);
  const maxDegree = Math.max(1, ...nodes.map(n => neighbors.get(n.id).size));
  const radius = n => 4 + 12 * Math.sqrt(neighbors.get(n.id).size / maxDegree);
  const maxWeight = Math.max(1, ...links.map(l => l.weight ?? 1));
  const width = l => 1 + 4 * Math.sqrt((l.weight ?? 1) / maxWeight);
  const hasTension = links.some(l => l.tension != null);
  const tensionColor = d3.scaleLinear([0, 1], [TENSION_LOW, TENSION_HIGH]).clamp(true).interpolate(d3.interpolateRgb);
  const linkColor = l => (l.tension != null ? tensionColor(l.tension) : "var(--line, #c9c6bd)");
  // étiquettes permanentes : les nœuds les plus reliés
  const labelDegree = d3.quantile(nodes.map(n => neighbors.get(n.id).size).sort(d3.ascending), 0.8) ?? 0;

  // structure : scène (svg) et panneau latéral
  container.replaceChildren();
  const root = d3.select(container).append("div").attr("class", "fg").style("--fg-height", `${height}px`);
  const stage = root.append("div").attr("class", "fg-stage");
  const aside = root.append("aside");
  aside.append("h3").text(title || "Réseau");
  aside.append("div").attr("class", "fg-muted").text(`${nodes.length} ${nodeLabel}(s) · ${links.length} lien(s)`);
  const search = aside.append("input").attr("type", "search").attr("placeholder", "Rechercher…");
  const legend = aside.append("div").attr("class", "fg-legend");
  if (hasTension) aside.append("div").html(`<div class="fg-muted">Tension des lectures (liens entre personnes)</div><div class="fg-ramp"></div><div class="fg-ramp-l"><span>0</span><span>0,5</span><span>1</span></div>`);
  const details = aside.append("div").attr("class", "fg-details fg-muted").style("margin-top", "10px");
  const controls = stage.append("div").attr("class", "fg-controls");

  const svg = stage.insert("svg", ":first-child");
  const view = svg.append("g");
  const link = view.append("g").attr("stroke-opacity", 0.75).selectAll("line").data(links).join("line")
    .style("stroke", linkColor).attr("stroke-width", width);
  link.append("title").text(l => `${byId.get(l.source).label} — ${byId.get(l.target).label} : ${l.relation}`);
  const node = view.append("g").selectAll("circle").data(nodes).join("circle")
    .attr("r", radius).attr("fill", n => color(n.category)).style("stroke", "var(--bg, #fff)").attr("stroke-width", 1.5).style("cursor", "pointer");
  node.append("title").text(n => `${n.label} (${n.category})`);
  const label = view.append("g").selectAll("text").data(nodes).join("text")
    .attr("dy", n => -radius(n) - 4).attr("text-anchor", "middle").text(n => short(n.label));

  // simulation (forceLink, forceManyBody, forceX/forceY comme dans l'exemple Observable, plus forceCollide)
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(n => n.id).distance(l => 50 + 40 / Math.sqrt(l.weight ?? 1)))
    .force("charge", d3.forceManyBody().strength(-220))
    .force("collide", d3.forceCollide(n => radius(n) + 3))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .on("tick", () => {
      link.attr("x1", l => l.source.x).attr("y1", l => l.source.y).attr("x2", l => l.target.x).attr("y2", l => l.target.y);
      node.attr("cx", n => n.x).attr("cy", n => n.y);
      label.attr("x", n => n.x).attr("y", n => n.y);
    });

  node.call(d3.drag()
    .on("start", event => { if (!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y; })
    .on("drag", event => { event.subject.fx = event.x; event.subject.fy = event.y; })
    .on("end", event => { if (!event.active) simulation.alphaTarget(0); event.subject.fx = null; event.subject.fy = null; }));

  // zoom et déplacement ; la vue est centrée sur l'origine
  const zoom = d3.zoom().scaleExtent([0.1, 8]).on("zoom", event => view.attr("transform", event.transform));
  svg.call(zoom).on("dblclick.zoom", null);
  { const { width: w, height: h } = svg.node().getBoundingClientRect(); svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2)); }
  const fit = () => {
    const { width: w, height: h } = svg.node().getBoundingClientRect();
    const [x0, x1] = d3.extent(nodes, n => n.x), [y0, y1] = d3.extent(nodes, n => n.y);
    if (x0 == null || !w) return;
    const k = Math.min(2, 0.9 / Math.max((x1 - x0 + 60) / w, (y1 - y0 + 60) / h));
    svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
  };
  simulation.on("end.fit", fit);
  [["+", "Zoomer", () => svg.transition().duration(300).call(zoom.scaleBy, 1.4)],
   ["−", "Dézoomer", () => svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.4)],
   ["Recentrer", "Vue d'ensemble", fit]].forEach(([t, tip, fn]) => controls.append("button").attr("type", "button").attr("title", tip).text(t).on("click", fn));

  // état : survol, sélection, recherche, catégories masquées
  let hovered = null, selected = null, query = "";
  const hidden = new Set();
  function render() {
    const f = selected ?? hovered;
    const near = f ? neighbors.get(f) : null;
    const visible = n => !hidden.has(n.category);
    const lit = n => !f || n.id === f || near.has(n.id);
    node.attr("display", n => (visible(n) ? null : "none"))
      .attr("opacity", n => (lit(n) ? 1 : 0.15))
      .style("stroke", n => (query && n.label.toLowerCase().includes(query) ? "var(--ink, #1d1f24)" : "var(--bg, #fff)"))
      .attr("stroke-width", n => (n.id === f || (query && n.label.toLowerCase().includes(query)) ? 3 : 1.5));
    link.attr("display", l => (visible(l.source) && visible(l.target) ? null : "none"))
      .attr("stroke-opacity", l => (!f ? 0.75 : l.source.id === f || l.target.id === f ? 1 : 0.06));
    label.attr("display", n => (!visible(n) ? "none" : f ? (lit(n) ? null : "none") : neighbors.get(n.id).size >= labelDegree || (query && n.label.toLowerCase().includes(query)) ? null : "none"));
  }
  render();

  // fiche du nœud sélectionné
  function showDetails(id) {
    if (!id) { details.attr("class", "fg-details fg-muted").text("Survoler un nœud pour voir ses voisins, cliquer pour afficher sa fiche."); return; }
    const n = byId.get(id);
    const own = links.filter(l => l.source.id === id || l.target.id === id);
    const item = l => { const o = l.source.id === id ? l.target : l.source; return `<li><a href="#" data-node="${esc(o.id)}">${esc(o.label)}</a> <span class="fg-rel">${esc(l.relation)}</span></li>`; };
    details.attr("class", "fg-details").html(`<h3>${esc(n.label)}</h3>
      <div class="fg-muted"><span class="fg-dot" style="background:${color(n.category)}"></span> ${esc(n.category)} · ${own.length} lien(s)</div>
      ${n.omekaId && omekaAdminUrl ? `<p><a href="${esc(omekaAdminUrl)}${n.omekaId}" target="_blank" rel="noopener">Voir l'item Omeka S #${n.omekaId}</a></p>` : ""}
      ${own.length ? `<ul>${own.map(item).join("")}</ul>` : ""}`);
    details.selectAll("a[data-node]").on("click", function (event) { event.preventDefault(); select(this.dataset.node); });
  }
  function select(id) {
    selected = id; showDetails(id); render();
    const n = id && byId.get(id);
    if (n) { const t = d3.zoomTransform(svg.node()); const { width: w, height: h } = svg.node().getBoundingClientRect(); svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(Math.max(t.k, 1.2)).translate(-n.x, -n.y)); }
  }
  showDetails(null);
  node.on("mouseenter", (_, n) => { hovered = n.id; render(); })
    .on("mouseleave", () => { hovered = null; render(); })
    .on("click", (event, n) => { event.stopPropagation(); select(n.id); });
  svg.on("click", () => { if (selected) select(null); });

  // légende : cliquer une catégorie la masque ou l'affiche
  for (const c of categories) {
    const row = legend.append("label");
    row.append("input").attr("type", "checkbox").property("checked", true).on("change", function () { this.checked ? hidden.delete(c) : hidden.add(c); render(); });
    row.append("span").attr("class", "fg-dot").style("background", color(c));
    row.append("span").text(c);
    row.append("span").attr("class", "n").text(counts.get(c));
  }

  // recherche : surligne les nœuds dont le nom contient le texte ; nom exact : sélection
  const listId = `fg-labels-${Math.random().toString(36).slice(2)}`;
  aside.append("datalist").attr("id", listId).selectAll("option").data(nodes).join("option").attr("value", n => n.label);
  search.attr("list", listId).on("input", function () {
    query = this.value.trim().toLowerCase();
    const exact = nodes.find(n => n.label.toLowerCase() === query);
    if (exact) select(exact.id); else render();
  });

  return { destroy: () => simulation.stop() };
}
