// Affichage des résultats d'une analyse exploZoteroAnno (participation, collaborations, grille de couleurs),
// partagé par la page de l'application (explo.html) et la page publique des analyses (explo-public.html)

export const el = (tag, props = {}, ...children) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const c of children.flat()) if (c != null && c !== false) e.append(c);
  return e;
};
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const fmtPct = x => x === null || x === undefined ? "—" : `${Math.round(x * 100)} %`;
// couleurs des collaborateurs (distinctes de celles de la grille)
const PEOPLE_COLORS = ["#2f6db0", "#d0602e", "#2e8b57", "#8a4fb8", "#c0392b", "#1f8a8a", "#b8860b", "#c2477d", "#5d6d7e", "#7a8b1f"];
const personColor = (names, n) => PEOPLE_COLORS[names.indexOf(n) % PEOPLE_COLORS.length] ?? "#888";
// couleur d'une tension (0 : gris, 1 : rouge), la même que dans le réseau
export const tensionColor = t => `color-mix(in srgb, #d0312d ${Math.round(Math.max(0, Math.min(1, t)) * 100)}%, #9aa0aa)`;
export const tensionBadge = (t, title = "") => t == null ? el("span", { className: "muted", textContent: "—" }) : el("span", { className: "tbadge", style: `background:${tensionColor(t)}`, textContent: t.toFixed(2), title });
export const dot = c => el("i", { className: "sw", style: `background:${c}` });
// interprétation de Landis et Koch (1977), comme interpretKappa côté serveur
const interpretKappa = k => k <= 0 ? "Aucun accord (pas mieux que le hasard)" : k <= 0.2 ? "Accord léger" : k <= 0.4 ? "Accord passable" : k <= 0.6 ? "Accord modéré" : k <= 0.8 ? "Accord substantiel" : "Accord presque parfait";
// kappas : chacun avec sa propre interprétation (Cohen seulement pour deux personnes)
const kappaTiles = k => k.fleiss == null ? [["—", `kappa (${k.interpretation})`]]
  : [[k.fleiss, `kappa de Fleiss (${interpretKappa(k.fleiss)})`], ...(k.cohen != null ? [[k.cohen, `kappa de Cohen (${interpretKappa(k.cohen)})`]] : [])];
const tile = ([v, l]) => el("div", { className: "tile" }, el("div", { className: "v", textContent: v }), el("div", { className: "l", textContent: l }));

// ==========================================
// Grille de couleurs d'une analyse (significations, consignes, tensions)
// ==========================================
// grid : { title, introduction, positions: [{ color, name, position, instruction }], tolerance } ; matrix : tensionMatrix du serveur
export function gridCard(grid, matrix) {
  const card = el("section", { className: "card" }, el("h2", { textContent: grid.title || "Grille de couleurs" }));
  if (grid.introduction) card.append(el("p", { className: "lead", textContent: grid.introduction }));
  card.append(el("div", { className: "table-wrap" }, el("table", { className: "data" },
    el("thead", {}, el("tr", {}, ["Couleur", "Nom", "Signification", "Quand l'utiliser"].map(h => el("th", { textContent: h })))),
    el("tbody", {}, grid.positions.map(p => el("tr", {},
      el("td", {}, el("span", { className: "swatch", style: `background:${p.color}`, title: p.color })),
      el("td", { textContent: p.name || p.color }),
      el("td", { style: "font-weight:600", textContent: p.position }),
      el("td", { textContent: p.instruction || "—" })))))));
  if (grid.tolerance != null) card.append(el("p", { className: "help", textContent: `Une couleur de surlignage est rattachée à la grille si elle est à moins de ${grid.tolerance} (distance RVB) d'une couleur de la grille ; au-delà, elle est comptée « hors grille ».` }));
  if (matrix?.positions?.length) {
    const head = p => el("span", { className: "tension-h" }, dot(p.color), p.position);
    card.append(el("h3", { textContent: "Tensions entre les significations" }),
      el("p", { className: "lead", textContent: "Quand deux personnes surlignent le même passage avec deux couleurs différentes, leurs lectures sont plus ou moins en tension (0 : aucune, 1 : maximale), selon le rapport des couleurs sur le cercle chromatique ou une valeur fixée pour la paire." }),
      el("div", { className: "table-wrap" }, el("table", { className: "data matrix tension" },
        el("thead", {}, el("tr", {}, el("th"), matrix.positions.map(p => el("th", {}, head(p))))),
        el("tbody", {}, matrix.positions.map((a, i) => el("tr", {}, el("th", {}, head(a)), matrix.cells[i].map((c, j) => i === j || !c
          ? el("td", { className: "cell muted", textContent: "·" })
          : el("td", { className: "cell", title: `${a.position} – ${matrix.positions[j].position} : couleurs ${c.label}, tension ${c.tension}`,
              style: `background:color-mix(in srgb, #d0312d ${Math.round(c.tension * 60)}%, transparent)`, textContent: c.tension.toFixed(2) }))))))));
  }
  return card;
}

// ==========================================
// Participation : chiffres clés, barres empilées par couleur de la grille, chronologie, documents
// ==========================================
export function renderParticipation(box, p) {
  box.className = "";
  const t = p.totals, grid = p.grid;
  const tiles = el("div", { className: "tiles" },
    [[t.collaborators, "collaborateurs"], [t.annotations, "surlignages"], [t.notes, "notes"], [`${t.annotatedDocuments}/${t.documents}`, "documents annotés"], [t.offGrid, "couleurs hors grille"], ...(t.mergedDuplicates ? [[t.mergedDuplicates, "doublons fusionnés"]] : [])].map(tile));

  const legend = el("div", { className: "legend" }, grid.map(g => el("span", {}, el("i", { className: "sw", style: `background:${g.color}` }), g.position)),
    el("span", {}, el("i", { className: "sw offgrid-fill" }), "couleur hors grille"), el("span", {}, el("i", { className: "sw notes-fill" }), "notes"));
  const max = Math.max(1, ...p.collaborators.map(c => c.annotations + c.notes));
  const bars = el("div", { className: "bars" }, p.collaborators.map(c => {
    const total = c.annotations + c.notes;
    const segs = [...grid.map(g => [c.positions[g.position] ?? 0, g.color, g.position, ""]), [c.offGrid, "", "couleur hors grille", "offgrid-fill"], [c.notes, "", "notes", "notes-fill"]]
      .filter(([n]) => n > 0).map(([n, color, label, cls]) => el("span", { className: cls, style: `width:${(n / max) * 100}%;${color ? `background:${color}` : ""}`, title: `${label} : ${n}` }));
    return el("div", { className: "row" }, el("span", { className: "name", textContent: c.name, title: c.name }), el("div", { className: "track" }, segs), el("span", { className: "total", textContent: total }));
  }));

  box.replaceChildren(tiles,
    el("section", { className: "card" }, el("h2", { textContent: "Annotations par collaborateur" }), el("p", { className: "lead", textContent: "Chaque barre est découpée selon la signification des couleurs de la grille." }), legend, bars),
    timelineCard(p),
    el("section", { className: "card" }, el("h2", { textContent: "Détail par collaborateur" }),
      el("div", { className: "table-wrap" }, el("table", { className: "data" },
        el("thead", {}, el("tr", {}, ["Collaborateur", "Surlignages", "Notes", "Commentaires", "Mots surlignés", "Documents", "Part", "Jours actifs", "Première", "Dernière"].map(h => el("th", { textContent: h })))),
        el("tbody", {}, p.collaborators.map(c => el("tr", {},
          el("td", { textContent: c.name }), ...[c.annotations, c.notes, c.comments, c.words, c.documents].map(v => el("td", { className: "num", textContent: v })),
          el("td", { className: "num", textContent: fmtPct(c.share) }), el("td", { className: "num", textContent: c.activeDays }),
          el("td", { textContent: c.firstDate ? new Date(c.firstDate).toLocaleDateString("fr-FR") : "—" }), el("td", { textContent: c.lastDate ? new Date(c.lastDate).toLocaleDateString("fr-FR") : "—" })))))))),
    el("section", { className: "card" }, el("h2", { textContent: "Documents" }), el("p", { className: "lead", textContent: "Couverture de la collection : qui a annoté quoi." }),
      el("div", { className: "table-wrap" }, el("table", { className: "data" },
        el("thead", {}, el("tr", {}, ["Document", "Surlignages", "Notes", "Collaborateurs"].map(h => el("th", { textContent: h })))),
        el("tbody", {}, p.documents.map(d => el("tr", {},
          el("td", {}, d.title, d.duplicates?.length ? el("span", { className: "chip", style: "margin-left:6px", title: `Exemplaires fusionnés : ${[d.zoteroKey, ...d.duplicates.map(x => x.zoteroKey)].join(", ")}`, textContent: `${d.duplicates.length + 1} exemplaires fusionnés` }) : null), el("td", { className: "num", textContent: d.annotations }), el("td", { className: "num", textContent: d.notes }),
          el("td", {}, d.collaborators.length ? d.collaborators.map(x => el("span", { className: "chip", textContent: `${x.name} · ${x.count}` })) : el("span", { className: "muted", textContent: "aucune annotation" }))))))));
}

// chronologie : colonnes empilées par semaine et par collaborateur (SVG)
function timelineCard(p) {
  const card = el("section", { className: "card" }, el("h2", { textContent: "Chronologie" }));
  const weeks = p.timeline.weeks, names = Object.keys(p.timeline.series);
  if (!weeks.length) { card.append(el("p", { className: "lead", textContent: "Aucune date d'annotation disponible (annotations importées sans date)." })); return card; }
  const W = 900, H = 220, pad = { l: 34, r: 8, t: 10, b: 36 };
  const totals = weeks.map((_, i) => names.reduce((n, k) => n + p.timeline.series[k][i], 0));
  const max = Math.max(1, ...totals);
  // colonnes de 60 px au plus, centrées quand il y a peu de semaines
  const slot = (W - pad.l - pad.r) / weeks.length, bw = Math.min(slot, 60), x0 = pad.l + (slot - bw) / 2;
  const y = v => H - pad.b - (v / max) * (H - pad.t - pad.b);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Annotations par semaine">`;
  for (const v of [0, Math.round(max / 2), max]) svg += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" stroke-opacity=".12"/><text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  weeks.forEach((w, i) => {
    let acc = 0;
    for (const n of names) {
      const v = p.timeline.series[n][i];
      if (!v) continue;
      svg += `<rect x="${x0 + i * slot + 2}" y="${y(acc + v)}" width="${Math.max(2, bw - 4)}" height="${y(acc) - y(acc + v)}" fill="${personColor(names, n)}" rx="2"><title>${esc(n)} — semaine du ${new Date(w).toLocaleDateString("fr-FR")} : ${v}</title></rect>`;
      acc += v;
    }
    if (weeks.length <= 16 || i % Math.ceil(weeks.length / 16) === 0) svg += `<text x="${x0 + i * slot + bw / 2}" y="${H - pad.b + 16}" text-anchor="middle">${new Date(w).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</text>`;
  });
  svg += "</svg>";
  card.append(el("p", { className: "lead", textContent: "Annotations et notes par semaine (lundi indiqué)." }),
    el("div", { className: "legend" }, names.map(n => el("span", {}, el("i", { className: "sw", style: `background:${personColor(names, n)}` }), n))),
    el("div", { className: "chart", innerHTML: svg }));
  return card;
}

// ==========================================
// Collaborations : chiffres clés, matrice, paires, passages divergents et convergents, réseau
// ==========================================
// options : { graphPageUrl (page autonome du réseau, analyses antérieures), omekaAdminUrl (liens des nœuds, vide = aucun) }
export function renderCollab(box, c, options = {}) {
  box.className = "";
  const k = c.kappa;
  const tiles = el("div", { className: "tiles" },
    [[c.passages.shared, "passages annotés en commun"], [c.passages.convergent, "convergents"], [c.passages.divergent, "divergents"], ...kappaTiles(k)]
      .concat(c.tension ? [[c.tension.mean != null ? c.tension.mean.toFixed(2) : "—", "tension moyenne des divergences"]] : []).map(tile));

  const names = c.matrix.names;
  const maxShared = Math.max(1, ...c.matrix.sharedPassages.flat().filter(v => v !== null));
  const matrix = el("table", { className: "data matrix" },
    el("thead", {}, el("tr", {}, el("th"), names.map(n => el("th", { textContent: n })))),
    el("tbody", {}, names.map((a, i) => el("tr", {}, el("th", { textContent: a }), names.map((b, j) => {
      const v = c.matrix.sharedPassages[i][j];
      if (v === null) return el("td", { className: "cell muted", textContent: "·" });
      const agr = c.matrix.agreement[i][j], ten = c.matrix.tension?.[i][j];
      return el("td", { className: "cell", title: `${a} – ${b} : ${v} passage(s) en commun, accord ${fmtPct(agr)}${ten != null ? `, tension ${ten.toFixed(2)}` : ""}`,
        style: v ? `background: color-mix(in srgb, var(--accent) ${Math.round(12 + (v / maxShared) * 55)}%, transparent)` : "",
        textContent: v ? `${v} · ${fmtPct(agr)}` : "0" });
    })))));

  const pairs = el("table", { className: "data" },
    el("thead", {}, el("tr", {}, ["Paire", "Documents en commun", "Passages en commun", "Même signification", "Accord", ...(c.tension ? ["Tension moyenne"] : [])].map(h => el("th", { textContent: h })))),
    el("tbody", {}, c.pairs.map(p => el("tr", {}, el("td", { textContent: `${p.a} – ${p.b}` }),
      ...[p.sharedDocuments, p.sharedPassages, p.samePosition].map(v => el("td", { className: "num", textContent: v })), el("td", { className: "num", textContent: fmtPct(p.agreement) }),
      c.tension ? el("td", { className: "num" }, tensionBadge(p.tension)) : null))));

  const quotes = list => list.slice(0, 30).map(u => el("div", { className: "quote" },
    el("div", { textContent: `« ${u.phrase} »` }),
    el("div", { className: "who" }, `${u.document}`, u.tension != null && u.tension > 0 ? tensionBadge(u.tension, `tension des lectures : couleurs ${u.relation}`) : null, " — ", u.annotations.map(a => el("span", { className: "chip" }, el("i", { className: "sw", style: `background:${a.color ?? "var(--line)"}` }), `${a.author} : ${a.position ?? "hors grille"}${a.note ? ` — « ${a.note} »` : ""}`)))));

  // réseau : dessiné ici avec d3.js ; les analyses antérieures (graphe absent des données) gardent leur page autonome
  const graphBox = c.graph?.nodes?.length ? el("div", { id: "collab-graph", className: "muted", textContent: "Chargement du réseau…" }) : null;
  const pageUrl = options.graphPageUrl;
  box.replaceChildren(tiles,
    el("section", { className: "card" }, el("h2", { textContent: "Matrice des passages en commun" }), el("p", { className: "lead", textContent: "Nombre de passages annotés par les deux personnes et part où elles leur donnent la même signification." }), el("div", { className: "table-wrap" }, matrix)),
    el("section", { className: "card" }, el("h2", { textContent: "Paires de collaborateurs" }), el("div", { className: "table-wrap" }, pairs)),
    el("section", { className: "card" }, el("h2", { textContent: `Passages aux lectures divergentes (${c.divergent.length})` }), el("p", { className: "lead", textContent: c.tension ? "Même passage, significations différentes, du plus tendu au moins tendu (tension selon le rapport entre les couleurs de la grille) : ce sont les meilleurs points de départ d'une discussion." : "Même passage, significations différentes : ce sont les meilleurs points de départ d'une discussion." }), c.divergent.length ? quotes(c.divergent) : el("p", { className: "muted", textContent: "Aucun." })),
    el("section", { className: "card" }, el("h2", { textContent: `Passages convergents (${c.convergent.length})` }), c.convergent.length ? quotes(c.convergent) : el("p", { className: "muted", textContent: "Aucun." })),
    graphBox || pageUrl ? el("section", { className: "card" }, el("h2", { textContent: "Réseau collaborateurs – documents" }),
      el("p", { className: "lead" }, "Glisser un nœud pour le déplacer, survoler pour voir ses voisins, cliquer pour afficher ses liens. L'épaisseur d'un lien suit le nombre d'annotations ou de passages communs ; la couleur des liens entre personnes, la tension de leurs lectures. ",
        pageUrl ? el("a", { href: pageUrl, target: "_blank", textContent: "Ouvrir en plein écran" }) : null),
      graphBox ?? el("iframe", { className: "frame", src: pageUrl, sandbox: "allow-scripts allow-popups allow-popups-to-escape-sandbox" })) : null);
  if (graphBox) drawGraph(graphBox, c.graph, options.omekaAdminUrl ?? c.graph.omekaAdminUrl ?? "");
}

// réseau d3.js (module voisin, partagé avec la page autonome reseau_collaborations.html)
let graphView = null;
async function drawGraph(container, graph, omekaAdminUrl) {
  graphView?.destroy();
  try {
    const { forceGraph } = await import(new URL("./forceGraph.js", import.meta.url).href);
    container.className = "";
    graphView = forceGraph(container, graph, { title: "Collaborations", omekaAdminUrl, height: 600 });
  } catch (e) { container.textContent = "Réseau indisponible : " + e.message; }
}
