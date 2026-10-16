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
// formulaire de correction d'une entrée d'index (diapo, image Diigo) : champs, nouvelle analyse par le modèle de vision,
// enregistrement qui met à jour l'index et le document du RAG
function indexForm({ fields, analyze, save, toast, onClose }) {
  const inputs = {};
  const status = el("span", { className: "ed-help" });
  const box = el("div", { className: "ed-fix" },
    ...fields.map(f => {
      const v = f.list ? (f.value ?? []).join(" ; ") : f.value ?? "";
      inputs[f.key] = f.rows ? el("textarea", { rows: f.rows, value: v }) : el("input", { value: v });
      return el("label", {}, el("span", { textContent: f.label }), inputs[f.key]);
    }));
  const read = () => Object.fromEntries(fields.map(f => [f.key, f.list ? inputs[f.key].value.split(/[;,]/).map(x => x.trim()).filter(Boolean) : inputs[f.key].value.trim()]));
  const fill = o => { for (const f of fields) if (o[f.key] !== undefined) inputs[f.key].value = f.list ? o[f.key].join(" ; ") : o[f.key]; };
  const btn = (text, primary, onclick) => el("button", { type: "button", className: `ed-btn${primary ? " primary" : ""}`, textContent: text, onclick });
  const busy = async (label, fn) => {
    const buttons = box.querySelectorAll("button");
    buttons.forEach(b => (b.disabled = true)); status.textContent = label;
    try { await fn(); status.textContent = ""; } catch (e) { status.textContent = e.message; toast("Erreur : " + e.message); } finally { buttons.forEach(b => (b.disabled = false)); }
  };
  box.append(el("div", { className: "ed-row" },
    btn("Nouvelle analyse (modèle de vision)", false, () => busy("Analyse en cours…", async () => { fill(await analyze()); toast("Nouvelle analyse proposée : relire puis enregistrer"); })),
    btn("Enregistrer et mettre à jour le RAG", true, () => busy("Mise à jour de l'index et du RAG…", async () => { await save(read()); })),
    btn("Annuler", false, onClose), status));
  return box;
}

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
      // lien vers la page web et image de la citation (Diigo) : ceux de l'écran, puis ceux de la citation reprise
      const media = el("div", { className: "ed-cite-media" });
      const showMedia = () => {
        const x = state.pick ?? c, link = state.dropLink ? null : x.source?.url, img = state.dropImage ? null : x.image;
        media.replaceChildren(...[
          img?.url ? el("img", { src: img.url, alt: img.title || "image de la page", loading: "lazy" }) : null,
          el("div", {},
            link ? el("div", {}, el("a", { href: link, target: "_blank", rel: "noopener", textContent: "Page web ↗" }), " ", el("button", { type: "button", className: "ed-link", textContent: "retirer le lien", onclick: () => { state.dropLink = true; showMedia(); } })) : el("div", { className: "ed-help", textContent: "Pas de lien vers une page web." }),
            img?.url ? el("div", {}, el("button", { type: "button", className: "ed-link", textContent: "retirer l'image", onclick: () => { state.dropImage = true; showMedia(); } })) : el("div", { className: "ed-help", textContent: "Pas d'image." }))].filter(Boolean));
      };
      showMedia();
      const results = el("div", { className: "ed-results" });
      const q = el("input", { placeholder: "mots à chercher dans les passages, notes, titres, mots-clés, images…" });
      const source = el("select", { title: "Source des citations" },
        [["", "Toutes les sources"], ["zotero", "Zotero"], ["diigo", "Diigo (passages surlignés)"], ["diigo-images", "Images Diigo"]].map(([v, t]) => el("option", { value: v, textContent: t })));
      const search = async () => {
        results.replaceChildren(el("span", { className: "ed-help", textContent: "Recherche…" }));
        try {
          const list = await api(`/api/chaoticum/index/search?kind=citation&source=${source.value}&q=${encodeURIComponent(q.value)}`);
          const pick = x => {
            I.text.value = x.text; I.comment.value = x.comment ?? ""; I.creators.value = x.source.creators ?? ""; I.year.value = x.source.year ?? ""; I.title.value = x.source.title ?? ""; I.page.value = x.page ?? "";
            state.pick = x; state.dropLink = state.dropImage = false; showMedia();
            toast("Citation reprise (enregistrer pour confirmer)");
          };
          // images Diigo : fiches avec l'image et ses données d'indexation (titre, mots-clés, description, texte visible)
          if (source.value === "diigo-images") {
            results.className = "ed-imgcards";
            const card = x => {
              const box = el("div", { className: "ed-imgcard" });
              const show = () => box.replaceChildren(...body().filter(Boolean));
              const body = () => {
                const a = x.analysis ?? {};
                return [
                  x.image?.url ? el("a", { href: x.image.original || x.image.url, target: "_blank", rel: "noopener", title: "Image en grand" }, el("img", { src: x.image.url, alt: a.titre || "", loading: "lazy" })) : el("div", { className: "ed-help", textContent: "Image indisponible" }),
                  el("strong", { textContent: a.titre || "(sans titre)" }),
                  a.motsCles?.length ? el("div", { className: "ed-tags" }, a.motsCles.map(k => el("span", { textContent: k }))) : null,
                  a.description ? el("p", { textContent: a.description }) : null,
                  a.texte ? el("details", {}, el("summary", { textContent: `Texte visible (${a.texte.length} car.)` }), el("p", { className: "ed-visible", textContent: a.texte })) : el("div", { className: "ed-help", textContent: "Pas de texte visible." }),
                  el("small", {}, `${x.source.title}${x.source.creators ? ` — annotée par ${x.source.creators}` : ""}`, x.source.url ? [" · ", el("a", { href: x.source.url, target: "_blank", rel: "noopener", textContent: "page web ↗" })] : null),
                  el("small", { className: "ed-help", textContent: `média Omeka ${a.mediaId ?? x.image?.mediaId ?? "?"}${a.analyzedAt ? ` · analysée le ${new Date(a.analyzedAt).toLocaleDateString("fr-FR")}` : ""}${a.editedAt ? " · corrigée" : ""}` }),
                  el("div", { className: "ed-row" },
                    el("button", { type: "button", className: "ed-btn", textContent: "Reprendre cette image", onclick: () => pick(x) }),
                    el("button", { type: "button", className: "ed-btn", textContent: "Corriger l'index", onclick: () => box.replaceChildren(body()[0], indexForm({
                      toast, onClose: show,
                      fields: [{ key: "titre", label: "Titre", value: a.titre }, { key: "motsCles", label: "Mots-clés (séparés par ;)", value: a.motsCles, list: true },
                        { key: "description", label: "Description", value: a.description, rows: 5 }, { key: "texte", label: "Texte visible", value: a.texte, rows: 4 }],
                      analyze: () => api("/api/chaoticum/index/diigo-image/analyze", { method: "POST", body: { mediaId: a.mediaId } }),
                      save: async v => {
                        const r = await api("/api/chaoticum/index/diigo-image", { method: "POST", body: { mediaId: a.mediaId, ...v } });
                        x.analysis = { ...a, ...r.analysis };
                        // la citation reprise de cette image suit la correction
                        x.text = r.analysis.texte || r.analysis.description; x.comment = r.analysis.texte ? r.analysis.description : "";
                        show();
                        toast(`Index et RAG mis à jour (page « ${r.page.title.slice(0, 40)} », document Albert ${r.page.docId})`);
                      },
                    })) })),
                ];
              };
              show();
              return box;
            };
            results.replaceChildren(...(list.length ? list.map(card) : [el("span", { className: "ed-help", textContent: "Aucune image analysée ne correspond (l'index Diigo avec analyse des images est-il construit ?)" })]));
            return;
          }
          results.className = "ed-results";
          results.replaceChildren(...(list.length ? list.map(x => el("div", { className: `ed-result${x.image?.url ? " with-img" : ""}`, role: "button", tabIndex: 0, onclick: e => {
            if (!e.target.closest("a")) pick(x);
          } },
            x.image?.url ? el("img", { src: x.image.url, alt: x.image.title || "", loading: "lazy" }) : null,
            el("div", {},
              el("span", { textContent: `${x.kind === "image" ? "🖼 " : ""}« ${x.text.slice(0, 160)}${x.text.length > 160 ? "…" : ""} »` }),
              el("small", { textContent: ` — ${[x.source.creators, x.source.year, x.source.title].filter(Boolean).join(", ")}${x.source.diigo ? " (Diigo)" : ""}` }),
              x.source.url ? el("small", {}, " · ", el("a", { href: x.source.url, target: "_blank", rel: "noopener", textContent: "page web ↗" })) : null))) : [el("span", { className: "ed-help", textContent: "Aucun résultat (l'index de cette source est-il construit ?)" })]));
        } catch (e) { results.replaceChildren(el("span", { className: "ed-help", textContent: e.message })); }
      };
      q.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); search(); } };
      source.onchange = () => { if (q.value.trim()) search(); };
      return [field("Citation", I.text, true), field("Commentaire", I.comment, true), field("Auteurs", I.creators), field("Année", I.year), field("Titre de la référence", I.title), field("Page", I.page),
        el("div", { className: "ed-field wide" }, el("label", { textContent: "Lien et image (citations Diigo)" }), media),
        el("div", { className: "ed-field wide" }, el("label", { textContent: "Choisir une autre citation dans les index" }), el("div", { className: "ed-row" }, source, q, el("button", { type: "button", className: "ed-btn", textContent: "Chercher", onclick: search })), results)];
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
      const results = el("div", { className: "ed-imgcards" });
      const q = el("input", { placeholder: "mots à chercher dans les titres, mots-clés et descriptions des diapos indexées…" });
      const search = async () => {
        results.replaceChildren(el("span", { className: "ed-help", textContent: "Recherche…" }));
        try {
          const list = await api(`/api/chaoticum/index/search?kind=diapo&q=${encodeURIComponent(q.value)}`);
          const pick = x => {
            if (![...I.path.options].some(o => o.value === x.path)) I.path.append(el("option", { value: x.path, textContent: x.name }));
            I.path.value = x.path; I.diapo.value = x.diapo; max.textContent = `sur ${x.max}`; preview();
            toast(`Diapo ${x.name} ${x.diapo} reprise (enregistrer pour confirmer)`);
          };
          // fiches : copie d'écran et données d'indexation (titre, mots-clés, description, adresse, date), correction
          const card = x => {
            const box = el("div", { className: "ed-imgcard" });
            const show = () => box.replaceChildren(...body().filter(Boolean));
            const body = () => [
              x.thumb ? el("img", { src: x.thumb, loading: "lazy", alt: x.title || "" }) : el("div", { className: "ed-help", textContent: "Pas de copie d'écran" }),
              el("small", { textContent: `${x.name} · diapo ${x.diapo}${x.max != null ? ` / ${x.max}` : ""}` }),
              el("strong", { textContent: x.title || "(sans titre)" }),
              x.keywords?.length ? el("div", { className: "ed-tags" }, x.keywords.map(k => el("span", { textContent: k }))) : null,
              x.description ? el("p", { textContent: x.description }) : null,
              el("small", {}, x.url ? el("a", { href: x.url, target: "_blank", rel: "noopener", textContent: "voir la diapo ↗" }) : null,
                `${x.url ? " · " : ""}indexée le ${x.indexedAt ? new Date(x.indexedAt).toLocaleDateString("fr-FR") : "?"}${x.editedAt ? " · corrigée" : ""}${x.docId ? ` · document Albert ${x.docId}` : ""}`),
              el("div", { className: "ed-row" },
                el("button", { type: "button", className: "ed-btn", textContent: "Reprendre cette diapo", onclick: () => pick(x) }),
                el("button", { type: "button", className: "ed-btn", textContent: "Corriger l'index", onclick: () => box.replaceChildren(body()[0], indexForm({
                  toast, onClose: show,
                  fields: [{ key: "title", label: "Titre", value: x.title }, { key: "keywords", label: "Mots-clés (séparés par ;)", value: x.keywords, list: true }, { key: "description", label: "Description", value: x.description, rows: 6 }],
                  analyze: () => api("/api/chaoticum/index/slide/analyze", { method: "POST", body: { key: x.key } }),
                  save: async v => {
                    const r = await api("/api/chaoticum/index/slide", { method: "POST", body: { key: x.key, ...v } });
                    Object.assign(x, { title: r.entry.title, keywords: r.entry.keywords, description: r.entry.description, docId: r.entry.docId, indexedAt: r.entry.indexedAt, editedAt: r.entry.editedAt });
                    show();
                    toast(`Index et RAG mis à jour (document Albert ${r.entry.docId})`);
                  },
                })) })),
            ];
            show();
            return box;
          };
          results.replaceChildren(...(list.length ? list.map(card) : [el("span", { className: "ed-help", textContent: "Aucun résultat (l'index des diapos est-il construit ?)" })]));
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
    if (type === "citation") ch.citation = { text: v("text"), comment: v("comment"), creators: v("creators"), year: v("year"), title: v("title"), page: v("page"),
      ...(state.pick ? { pick: state.pick } : {}), ...(state.dropLink ? { dropLink: true } : {}), ...(state.dropImage ? { dropImage: true } : {}) };
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
.ed-imgcards { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:8px; max-height:520px; overflow:auto; }
.ed-imgcard { display:flex; flex-direction:column; gap:5px; border:1px solid var(--line); background:var(--bg); border-radius:8px; padding:8px; font-size:13px; }
.ed-imgcard img { width:100%; max-height:170px; object-fit:contain; background:#fff; border-radius:6px; display:block; }
.ed-imgcard p { margin:0; line-height:1.4; }
.ed-imgcard small { color:var(--muted); }
.ed-imgcard a { color:var(--accent); }
.ed-imgcard details summary { cursor:pointer; color:var(--muted); font-size:12px; }
.ed-imgcard .ed-visible { white-space:pre-wrap; font-size:12px; max-height:140px; overflow:auto; }
.ed-imgcard .ed-btn { align-self:flex-start; margin-top:auto; }
.ed-fix { display:flex; flex-direction:column; gap:6px; }
.ed-fix label { display:flex; flex-direction:column; gap:2px; font-size:12px; color:var(--muted); }
.ed-fix input, .ed-fix textarea { font:inherit; font-size:13px; color:var(--ink); background:var(--panel); border:1px solid var(--line); border-radius:6px; padding:5px 7px; }
.ed-fix .ed-row, .ed-imgcard .ed-row { flex-wrap:wrap; }
.ed-tags { display:flex; flex-wrap:wrap; gap:3px; }
.ed-tags span { font-size:11.5px; border:1px solid var(--line); border-radius:999px; padding:0 7px; color:var(--muted); }
.ed-link { display:block; background:none; border:0; color:var(--accent); cursor:pointer; font:inherit; font-size:13px; padding:2px 0 8px; text-align:left; }
.ed-field > div > label { display:block; margin-top:8px; }
.ed-frame { width:100%; height:300px; border:1px solid var(--line); border-radius:8px; background:#fff; }
.ed-preview { background:#fff; color:#111; border-radius:8px; padding:8px; overflow:auto; max-height:360px; }
.ed-preview svg { max-width:100%; height:auto; }
.ed-code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; }
.ed-results { display:flex; flex-direction:column; gap:4px; max-height:240px; overflow:auto; }
.ed-result { text-align:left; font:inherit; font-size:13px; border:1px solid var(--line); background:var(--bg); color:var(--ink); border-radius:6px; padding:6px 8px; cursor:pointer; }
.ed-result small { color:var(--muted); }
.ed-result.with-img { display:grid; grid-template-columns:96px 1fr; gap:8px; align-items:start; }
.ed-result img { width:96px; max-height:72px; object-fit:cover; border-radius:4px; background:#fff; }
.ed-result a, .ed-cite-media a { color:var(--accent); }
.ed-cite-media { display:flex; gap:12px; align-items:flex-start; font-size:13px; }
.ed-cite-media img { max-width:220px; max-height:160px; border-radius:6px; background:#fff; border:1px solid var(--line); }
.ed-link { background:none; border:0; padding:0; color:var(--muted); font:inherit; font-size:12px; text-decoration:underline; cursor:pointer; }
.ed-thumbs { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:6px; max-height:300px; overflow:auto; }
.ed-thumb { font:inherit; font-size:11px; border:1px solid var(--line); background:var(--bg); color:var(--ink); border-radius:6px; padding:4px; cursor:pointer; text-align:left; }
.ed-thumb img { width:100%; display:block; border-radius:4px; margin-bottom:3px; }
.ed-grid input, .ed-grid select, .ed-grid textarea, .ed-head input, .ed-head select { font:inherit; color:var(--ink); background:var(--bg); border:1px solid var(--line); border-radius:6px; padding:6px 8px; min-width:0; }
.ed-grid textarea { width:100%; resize:vertical; }
`;
