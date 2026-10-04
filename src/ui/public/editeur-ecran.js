// Éditeur d'un écran de partition chaoticumSeminario (page de configuration et lecteur)
// Outils par type : citation (recherche dans l'index de la bibliothèque), diapo (présentation, navigation, aperçu,
// recherche dans l'index des diapos), question (compteur, nouvelle proposition), diagramme (éditeur visuel des idées et
// des liens ou code Mermaid, aperçu, réparation, nouvelle proposition), contributions (consigne) ; durée, type et
// structure (insérer, dupliquer, déplacer, supprimer).

const TYPES = ["citation", "diapo", "question", "contribution", "diagramme"];
const LABELS = { citation: "Citation", diapo: "Diapo", question: "Question", contribution: "Contributions", diagramme: "Diagramme" };

const el = (tag, props = {}, ...children) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const c of children.flat()) if (c != null && c !== false) e.append(c);
  return e;
};
const api = async (url, opts = {}) => {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts, body: opts.body && JSON.stringify(opts.body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};
const words = s => String(s ?? "").trim().split(/\s+/).filter(Boolean).length;

// ==========================================
// Diagrammes : nœuds et liens ↔ Mermaid (même format que src/lib/chaoticum/mermaid.ts)
// ==========================================
const lab = (s, max = 70) => { const t = String(s ?? "").replace(/["“”]/g, "'").replace(/[|\r\n]+/g, " ").replace(/\s+/g, " ").trim(); return t.length > max ? `${t.slice(0, max - 1)}…` : t; };
export function buildMermaid(nodes, edges, direction = "TD") {
  const ids = new Map(), lines = [`flowchart ${direction}`];
  const add = (id, text) => { const k = String(id).trim(); if (!ids.has(k)) { ids.set(k, `n${ids.size + 1}`); lines.push(`    ${ids.get(k)}["${lab(text || k)}"]`); } return ids.get(k); };
  for (const n of nodes) if (n.label.trim()) add(n.id, n.label);
  for (const e of edges) { if (!e.from || !e.to || !ids.has(e.from) || !ids.has(e.to)) continue; const l = lab(e.label ?? "", 40); lines.push(`    ${ids.get(e.from)} -->${l ? `|"${l}"|` : ""} ${ids.get(e.to)}`); }
  return lines.join("\n");
}
// diagramme au format construit (nœuds n["…"], liens a -->|"…"| b) : décomposé pour l'éditeur visuel, sinon null
export function parseMermaid(code) {
  const lines = String(code ?? "").split("\n").map(l => l.trim()).filter(Boolean);
  if (!/^(flowchart|graph)\s+(TD|TB|LR|RL|BT)\b/.test(lines[0] ?? "")) return null;
  const nodes = [], edges = [];
  for (const l of lines.slice(1)) {
    let m;
    if ((m = /^([\w-]+)\["(.*)"\]$/.exec(l))) nodes.push({ id: m[1], label: m[2] });
    else if ((m = /^([\w-]+)\s*-->(?:\|"(.*?)"\|)?\s*([\w-]+)$/.exec(l))) edges.push({ from: m[1], to: m[3], label: m[2] ?? "" });
    else return null;
  }
  return { direction: lines[0].split(/\s+/)[1], nodes, edges };
}
export function repairMermaid(code) {
  let m = String(code ?? "").replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!/^(flowchart|graph|mindmap)\b/.test(m)) m = `flowchart TD\n${m}`;
  if (/^(flowchart|graph)\b/.test(m)) {
    m = m.replace(/(-->|---|-\.->|==>)\s*([\w-]+):::[\w-]+\s+"([^"]*)"/g, (_s, arrow, id, l) => `${arrow}|"${lab(l, 40)}"| ${id}`)
      .replace(/:::[\w-]+/g, "").replace(/^\s*classDef\b.*$/gm, "")
      .replace(/(\b[\w-]+)\[(?!")([^\]\n]*)\]/g, (_s, id, l) => `${id}["${String(l).replace(/"/g, "'")}"]`)
      .replace(/(\b[\w-]+)\((?![("])([^)\n]*)\)(?!\))/g, (_s, id, l) => `${id}("${String(l).replace(/"/g, "'")}")`);
  }
  return m;
}
let mermaidLib = null;
async function renderMermaid(code) {
  mermaidLib ??= (await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs")).default;
  mermaidLib.initialize({ startOnLoad: false, securityLevel: "strict" });
  return (await mermaidLib.render(`ed${Date.now()}${Math.floor(Math.random() * 1e6)}`, code)).svg;
}

// ==========================================
// Éditeur
// ==========================================
let slidesCache = null;

/**
 * Ouvre l'éditeur de l'écran `index` dans `container`.
 * opts : { container, runId, partition, onSaved(partition, index), onClose(), toast(message) }
 */
export function openScreenEditor(opts) {
  const { container, runId } = opts;
  const toast = opts.toast ?? (m => console.log(m));
  let P = opts.partition, index = opts.index;
  const s = () => P.screens[index];
  let type = s().type, state = {};
  const field = (label, input, wide = false, help = "") => el("div", { className: `ed-field${wide ? " wide" : ""}` }, el("label", { textContent: label }), input, help ? el("span", { className: "ed-help", textContent: help }) : null);

  const save = async changes => {
    const r = await api("/api/chaoticum/partition/screen", { method: "POST", body: { run: runId, index, changes } });
    P = r.partition;
    toast(`Écran ${index + 1} enregistré${r.omeka === "ok" ? " (et dans Omeka S)" : r.omeka ? ` — Omeka S : ${r.omeka}` : ""}`);
    opts.onSaved?.(P, index);
  };
  const structure = async (op, extra = {}) => {
    const r = await api("/api/chaoticum/partition/structure", { method: "POST", body: { run: runId, op, index, ...extra } });
    P = r.partition;
    const next = op === "delete" ? Math.min(index, P.screens.length - 1) : op === "move" ? extra.to : op === "insert" || op === "duplicate" ? index + 1 : index;
    toast({ delete: "Écran supprimé", duplicate: "Écran dupliqué", insert: "Écran inséré", move: "Écran déplacé" }[op]);
    opts.onSaved?.(P, next);
    index = next; type = s().type; render();
  };

  // ---------- contenus par type ----------
  const sections = {
    citation() {
      const c = s().citation ?? { source: {} };
      const I = state.I = {
        text: el("textarea", { rows: 4, value: c.text ?? "" }), comment: el("textarea", { rows: 2, value: c.comment ?? "" }),
        creators: el("input", { value: c.source?.creators ?? "" }), year: el("input", { value: c.source?.year ?? "" }),
        title: el("input", { value: c.source?.title ?? "" }), page: el("input", { value: c.page ?? "" }),
      };
      const results = el("div", { className: "ed-results" });
      const q = el("input", { placeholder: "mots à chercher dans les passages, notes, titres, mots-clés…" });
      const search = async () => {
        results.replaceChildren(el("span", { className: "ed-help", textContent: "Recherche…" }));
        try {
          const list = await api(`/api/chaoticum/index/search?kind=citation&q=${encodeURIComponent(q.value)}`);
          results.replaceChildren(...(list.length ? list.map(x => el("button", { className: "ed-result", type: "button", onclick: () => {
            I.text.value = x.text; I.comment.value = x.comment ?? ""; I.creators.value = x.source.creators ?? ""; I.year.value = x.source.year ?? ""; I.title.value = x.source.title ?? ""; I.page.value = x.page ?? "";
            state.pick = x; toast("Citation reprise (enregistrer pour confirmer)");
          } }, el("span", { textContent: `« ${x.text.slice(0, 160)}${x.text.length > 160 ? "…" : ""} »` }), el("small", { textContent: ` — ${[x.source.creators, x.source.year, x.source.title].filter(Boolean).join(", ")}` }))) : [el("span", { className: "ed-help", textContent: "Aucun résultat (l'index de la bibliothèque est-il construit ?)" })]));
        } catch (e) { results.replaceChildren(el("span", { className: "ed-help", textContent: e.message })); }
      };
      q.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); search(); } };
      return [field("Citation", I.text, true), field("Commentaire", I.comment, true), field("Auteurs", I.creators), field("Année", I.year), field("Titre de la référence", I.title), field("Page", I.page),
        el("div", { className: "ed-field wide" }, el("label", { textContent: "Choisir une autre citation dans l'index de la bibliothèque" }), el("div", { className: "ed-row" }, q, el("button", { type: "button", className: "ed-btn", textContent: "Chercher", onclick: search })), results)];
    },
    diapo() {
      const d = s().diapo ?? {};
      const I = state.I = { path: el("select"), diapo: el("input", { type: "number", min: 0, step: 1, value: d.diapo ?? 0 }) };
      const max = el("span", { className: "ed-help", textContent: d.max != null ? `sur ${d.max}` : "" });
      const frame = el("iframe", { className: "ed-frame" });
      const preview = () => { frame.src = `${String(P.siteUrl).replace(/\/?$/, "/")}${I.path.value}?diapo=${I.diapo.value}`; };
      (slidesCache ??= api("/api/chaoticum/slides").catch(() => [])).then(list => {
        const paths = list.map(x => x.path);
        if (d.path && !paths.includes(d.path)) paths.unshift(d.path);
        I.path.replaceChildren(...paths.map(p => el("option", { value: p, textContent: p.replace(/\/slide\.html$/, ""), selected: p === d.path })));
        preview();
      });
      const step = k => { I.diapo.value = Math.max(0, Number(I.diapo.value) + k); preview(); };
      I.path.onchange = () => { I.diapo.value = 0; max.textContent = ""; preview(); };
      I.diapo.onchange = preview;
      const results = el("div", { className: "ed-thumbs" });
      const q = el("input", { placeholder: "mots à chercher dans les descriptions des diapos indexées…" });
      const search = async () => {
        results.replaceChildren(el("span", { className: "ed-help", textContent: "Recherche…" }));
        try {
          const list = await api(`/api/chaoticum/index/search?kind=diapo&q=${encodeURIComponent(q.value)}`);
          results.replaceChildren(...(list.length ? list.map(x => el("button", { className: "ed-thumb", type: "button", title: x.description, onclick: () => {
            if (![...I.path.options].some(o => o.value === x.path)) I.path.append(el("option", { value: x.path, textContent: x.name }));
            I.path.value = x.path; I.diapo.value = x.diapo; max.textContent = `sur ${x.max}`; preview();
          } }, x.thumb ? el("img", { src: x.thumb, loading: "lazy", alt: "" }) : null, el("small", { textContent: `${x.name} ${x.diapo} · ${x.title}` }))) : [el("span", { className: "ed-help", textContent: "Aucun résultat (l'index des diapos est-il construit ?)" })]));
        } catch (e) { results.replaceChildren(el("span", { className: "ed-help", textContent: e.message })); }
      };
      q.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); search(); } };
      return [field("Présentation", I.path), el("div", { className: "ed-field" }, el("label", { textContent: "Diapo" }), el("div", { className: "ed-row" },
          el("button", { type: "button", className: "ed-btn", textContent: "◀", onclick: () => step(-1) }), I.diapo, el("button", { type: "button", className: "ed-btn", textContent: "▶", onclick: () => step(1) }), max)),
        el("div", { className: "ed-field wide" }, frame, el("span", { className: "ed-help", textContent: "Une diapo de l'index reprend sa description et sa copie d'écran ; sinon elles sont effacées." })),
        el("div", { className: "ed-field wide" }, el("label", { textContent: "Chercher une diapo dans l'index" }), el("div", { className: "ed-row" }, q, el("button", { type: "button", className: "ed-btn", textContent: "Chercher", onclick: search })), results)];
    },
    question() {
      const qn = s().question ?? {};
      const I = state.I = { text: el("textarea", { rows: 2, value: qn.text ?? "" }), intention: el("textarea", { rows: 2, value: qn.intention ?? "" }) };
      const count = el("span", { className: "ed-help" });
      const upd = () => { const n = words(I.text.value); count.textContent = `${n} mot(s)${n > 15 ? " — plus de 15 : difficile à lire d'un coup d'œil" : ""}`; count.style.color = n > 15 ? "var(--err, #b3261e)" : ""; };
      I.text.oninput = upd; upd();
      const hint = el("input", { placeholder: "facultatif : orientation souhaitée (ex. plus provocante, sur l'écologie…)" });
      const info = el("span", { className: "ed-help" });
      const regen = el("button", { type: "button", className: "ed-btn", textContent: "Proposer une autre question (Albert)", onclick: async () => {
        regen.disabled = true; info.textContent = "Proposition en cours…";
        try { const r = await api("/api/chaoticum/partition/regenerate", { method: "POST", body: { run: runId, index, what: "question", hint: hint.value } }); I.text.value = r.question.text; I.intention.value = r.question.intention; upd(); info.textContent = `Proposition (non enregistrée) · ${r.tokens} tokens · ${Number(r.impact.energyWh).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} Wh`; }
        catch (e) { info.textContent = e.message; } finally { regen.disabled = false; }
      } });
      return [el("div", { className: "ed-field wide" }, el("label", { textContent: "Question" }), I.text, count), field("Intention", I.intention, true),
        el("div", { className: "ed-field wide" }, el("label", { textContent: "Nouvelle proposition à partir des citations et diapos du cycle" }), el("div", { className: "ed-row" }, hint, regen), info)];
    },
    diagramme() {
      const dg = s().diagramme ?? { title: "", mermaid: "flowchart TD" };
      const parsed = parseMermaid(dg.mermaid);
      state.mode = parsed ? "visuel" : "code";
      state.graph = parsed ?? { direction: "TD", nodes: [], edges: [] };
      const I = state.I = { title: el("input", { value: dg.title ?? "" }), code: el("textarea", { rows: 10, value: dg.mermaid ?? "", className: "ed-code" }) };
      const preview = el("div", { className: "ed-preview" }), visual = el("div"), info = el("span", { className: "ed-help" });
      const code = () => (state.mode === "visuel" ? buildMermaid(state.graph.nodes, state.graph.edges, state.graph.direction) : I.code.value);
      let timer = null;
      const refresh = () => { clearTimeout(timer); timer = setTimeout(async () => {
        try { preview.innerHTML = await renderMermaid(code()); }
        catch (e) {
          const fixed = repairMermaid(I.code.value);
          preview.replaceChildren(el("p", { className: "ed-help", style: "color:var(--err,#b3261e)", textContent: `Diagramme invalide : ${String(e.message).split("\n")[0]}` }),
            state.mode === "code" && fixed !== I.code.value ? el("button", { type: "button", className: "ed-btn", textContent: "Réparer automatiquement", onclick: () => { I.code.value = fixed; refresh(); } }) : null);
        }
      }, 300); };
      const drawVisual = () => {
        const g = state.graph;
        const nodeSelect = (value, onchange) => el("select", { onchange }, el("option", { value: "", textContent: "—" }), g.nodes.map(n => el("option", { value: n.id, textContent: n.label || n.id, selected: n.id === value })));
        visual.replaceChildren(
          el("div", { className: "ed-row" }, el("label", { textContent: "Sens" }), el("select", { onchange: e => { g.direction = e.target.value; refresh(); } }, ["TD", "LR"].map(d => el("option", { value: d, textContent: d === "TD" ? "de haut en bas" : "de gauche à droite", selected: g.direction === d })))),
          el("label", { textContent: "Idées (nœuds)" }),
          ...g.nodes.map((n, i) => el("div", { className: "ed-row" },
            el("input", { value: n.label, placeholder: "idée courte", oninput: e => { n.label = e.target.value; refresh(); } }),
            el("button", { type: "button", className: "ed-btn", textContent: "×", title: "Retirer l'idée et ses liens", onclick: () => { g.edges = g.edges.filter(x => x.from !== n.id && x.to !== n.id); g.nodes.splice(i, 1); drawVisual(); refresh(); } }))),
          el("button", { type: "button", className: "ed-link", textContent: "+ idée", onclick: () => { let k = g.nodes.length + 1; while (g.nodes.some(n => n.id === `n${k}`)) k++; g.nodes.push({ id: `n${k}`, label: "" }); drawVisual(); } }),
          el("label", { textContent: "Liens" }),
          ...g.edges.map((e, i) => el("div", { className: "ed-row" },
            nodeSelect(e.from, ev => { e.from = ev.target.value; refresh(); }), el("span", { textContent: "→" }), nodeSelect(e.to, ev => { e.to = ev.target.value; refresh(); }),
            el("input", { value: e.label ?? "", placeholder: "relation (facultatif)", oninput: ev => { e.label = ev.target.value; refresh(); } }),
            el("button", { type: "button", className: "ed-btn", textContent: "×", onclick: () => { g.edges.splice(i, 1); drawVisual(); refresh(); } }))),
          el("button", { type: "button", className: "ed-link", textContent: "+ lien", onclick: () => { g.edges.push({ from: g.nodes[0]?.id ?? "", to: g.nodes[1]?.id ?? "", label: "" }); drawVisual(); refresh(); } }));
      };
      const modeBar = el("div", { className: "ed-row" });
      const setMode = mode => {
        if (mode === "code" && state.mode === "visuel") I.code.value = code();
        if (mode === "visuel" && state.mode === "code") { const p = parseMermaid(I.code.value); if (!p) { toast("Ce code n'est pas au format de l'éditeur visuel : le modifier en code, ou demander une nouvelle proposition"); return; } state.graph = p; }
        state.mode = mode;
        modeBar.replaceChildren(...["visuel", "code"].map(m => el("button", { type: "button", className: `ed-btn${state.mode === m ? " on" : ""}`, textContent: m === "visuel" ? "Éditeur visuel" : "Code Mermaid", onclick: () => setMode(m) })));
        visual.hidden = mode !== "visuel"; I.code.hidden = mode !== "code";
        if (mode === "visuel") drawVisual();
        refresh();
      };
      I.code.oninput = refresh;
      state.getCode = code;
      const hint = el("input", { placeholder: "facultatif : orientation souhaitée" });
      const regen = el("button", { type: "button", className: "ed-btn", textContent: "Proposer un autre diagramme (Albert)", onclick: async () => {
        regen.disabled = true; info.textContent = "Proposition en cours…";
        try {
          const r = await api("/api/chaoticum/partition/regenerate", { method: "POST", body: { run: runId, index, what: "diagramme", hint: hint.value } });
          I.title.value = r.diagramme.title; I.code.value = r.diagramme.mermaid;
          const p = parseMermaid(r.diagramme.mermaid); if (p) { state.graph = p; state.mode = "code"; setMode("visuel"); } else setMode("code");
          info.textContent = `Proposition (non enregistrée) · ${r.tokens} tokens · ${Number(r.impact.energyWh).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} Wh`;
        } catch (e) { info.textContent = e.message; } finally { regen.disabled = false; }
      } });
      setTimeout(() => setMode(state.mode));
      return [field("Titre", I.title, true), el("div", { className: "ed-field wide" }, modeBar, visual, I.code), el("div", { className: "ed-field wide" }, el("label", { textContent: "Aperçu" }), preview),
        el("div", { className: "ed-field wide" }, el("label", { textContent: "Nouvelle proposition" }), el("div", { className: "ed-row" }, hint, regen), info)];
    },
    contribution() {
      const I = state.I = { instruction: el("input", { value: s().contribution?.instruction ?? "", placeholder: "ex. Proposez une page web qui prolonge la question" }) };
      return [field("Consigne affichée au public", I.instruction, true, "Le QR code du formulaire et les URL proposées s'affichent avec cette consigne.")];
    },
  };

  const changesOf = () => {
    const I = state.I ?? {}, v = k => I[k]?.value;
    const ch = { duration: Number(durationInput.value), ...(type !== s().type ? { type } : {}) };
    if (type === "citation") ch.citation = { text: v("text"), comment: v("comment"), creators: v("creators"), year: v("year"), title: v("title"), page: v("page") };
    if (type === "diapo") ch.diapo = { path: v("path"), diapo: Number(v("diapo")) };
    if (type === "question") ch.question = { text: v("text"), intention: v("intention") };
    if (type === "diagramme") ch.diagramme = { title: v("title"), mermaid: state.getCode?.() ?? v("code") };
    if (type === "contribution") ch.contribution = { instruction: v("instruction") };
    return ch;
  };

  let durationInput;
  function render() {
    state = {};
    const sc = s();
    durationInput = el("input", { type: "number", min: 5, step: 5, value: sc.duration });
    const typeSelect = el("select", { onchange: e => { type = e.target.value; body.replaceChildren(...sections[type]()); } }, TYPES.map(t => el("option", { value: t, textContent: LABELS[t], selected: t === type })));
    const body = el("div", { className: "ed-grid" }, ...sections[type]());
    const info = el("span", { className: "ed-help" });
    const insertType = el("select", {}, TYPES.map(t => el("option", { value: t, textContent: LABELS[t] })));
    const n = P.screens.length;
    container.replaceChildren(
      el("div", { className: "ed-head" }, el("strong", { textContent: `Écran ${index + 1} / ${n}` }),
        el("div", { className: "ed-row" }, el("label", { textContent: "Type" }), typeSelect, el("label", { textContent: "Durée (s)" }), durationInput)),
      body,
      el("div", { className: "ed-row ed-actions" },
        el("button", { type: "button", className: "ed-btn primary", textContent: "Enregistrer l'écran", onclick: async () => { info.textContent = "Enregistrement…"; try { await save(changesOf()); info.textContent = "Enregistré."; type = s().type; render(); } catch (e) { info.textContent = "Erreur : " + e.message; } } }),
        el("button", { type: "button", className: "ed-btn", textContent: "Fermer", onclick: () => opts.onClose?.() }), info),
      el("div", { className: "ed-row ed-structure" },
        el("span", { className: "ed-help", textContent: "Structure :" }),
        el("button", { type: "button", className: "ed-btn", textContent: "↑", title: "Avancer l'écran", disabled: index === 0, onclick: () => structure("move", { to: index - 1 }).catch(e => toast(e.message)) }),
        el("button", { type: "button", className: "ed-btn", textContent: "↓", title: "Reculer l'écran", disabled: index === n - 1, onclick: () => structure("move", { to: index + 1 }).catch(e => toast(e.message)) }),
        el("button", { type: "button", className: "ed-btn", textContent: "Dupliquer", onclick: () => structure("duplicate").catch(e => toast(e.message)) }),
        el("button", { type: "button", className: "ed-btn", textContent: "Insérer après :", onclick: () => structure("insert", { type: insertType.value, duration: 60 }).catch(e => toast(e.message)) }), insertType,
        el("button", { type: "button", className: "ed-btn danger", textContent: "Supprimer", disabled: n <= 1, onclick: () => { if (confirm(`Supprimer l'écran ${index + 1} ?`)) structure("delete").catch(e => toast(e.message)); } })));
  }
  render();
  return { open(i) { index = i; type = s().type; render(); }, get index() { return index; } };
}

// styles de l'éditeur (variables de couleur de la page hôte)
export const editorCss = `
.ed-head { display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; margin-bottom:10px; }
.ed-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px 14px; }
.ed-field { display:flex; flex-direction:column; gap:4px; min-width:0; }
.ed-field.wide { grid-column:1/-1; }
.ed-field label, .ed-row label { font-size:13px; font-weight:600; }
.ed-help { font-size:12px; color:var(--muted); }
.ed-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.ed-row > input, .ed-row > select { flex:1; min-width:90px; }
.ed-actions { margin-top:12px; } .ed-structure { margin-top:8px; padding-top:8px; border-top:1px solid var(--line); }
.ed-btn { font:inherit; font-size:13px; border:1px solid var(--line); background:var(--panel); color:var(--ink); border-radius:6px; padding:5px 10px; cursor:pointer; }
.ed-btn.primary { background:var(--accent); color:var(--accent-ink, #fff); border-color:var(--accent); font-weight:600; }
.ed-btn.on { border-color:var(--accent); color:var(--accent); font-weight:600; }
.ed-btn.danger { color:var(--err, #b3261e); } .ed-btn:disabled { opacity:.45; cursor:default; }
.ed-link { display:block; background:none; border:0; color:var(--accent); cursor:pointer; font:inherit; font-size:13px; padding:2px 0 8px; text-align:left; }
.ed-field > div > label { display:block; margin-top:8px; }
.ed-frame { width:100%; height:300px; border:1px solid var(--line); border-radius:8px; background:#fff; }
.ed-preview { background:#fff; color:#111; border-radius:8px; padding:8px; overflow:auto; max-height:360px; }
.ed-preview svg { max-width:100%; height:auto; }
.ed-code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; }
.ed-results { display:flex; flex-direction:column; gap:4px; max-height:240px; overflow:auto; }
.ed-result { text-align:left; font:inherit; font-size:13px; border:1px solid var(--line); background:var(--bg); color:var(--ink); border-radius:6px; padding:6px 8px; cursor:pointer; }
.ed-result small { color:var(--muted); }
.ed-thumbs { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:6px; max-height:300px; overflow:auto; }
.ed-thumb { font:inherit; font-size:11px; border:1px solid var(--line); background:var(--bg); color:var(--ink); border-radius:6px; padding:4px; cursor:pointer; text-align:left; }
.ed-thumb img { width:100%; display:block; border-radius:4px; margin-bottom:3px; }
.ed-grid input, .ed-grid select, .ed-grid textarea, .ed-head input, .ed-head select { font:inherit; color:var(--ink); background:var(--bg); border:1px solid var(--line); border-radius:6px; padding:6px 8px; min-width:0; }
.ed-grid textarea { width:100%; resize:vertical; }
`;
