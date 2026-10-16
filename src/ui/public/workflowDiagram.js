// Diagramme du workflow de l'application (étapes dans l'ordre, étapes en parallèle, agents impliqués) ; un clic sur un
// agent ouvre le formulaire de ses instructions, de sa demande et de son modèle, enregistrés dans agents.config.json
// (/api/workflow). Coût estimé de chaque agent (par appel, par traitement) et du traitement complet, d'après la
// consommation des exécutions passées et les hypothèses de coût de la configuration (énergie, carbone, prix).
// Utilisé par paper.html, explo.html et chaoticum.html.

const CSS = `
.wf-models { font-size: 12.5px; color: var(--muted); margin: 0 0 12px; }
.wf-models code { font-size: 12px; }
.wf-flow { display: flex; align-items: stretch; gap: 0; overflow-x: auto; padding: 4px 2px 10px; }
.wf-stage { display: flex; flex-direction: column; justify-content: center; gap: 10px; flex: 1 1 0; min-width: 150px; max-width: 260px; }
.wf-stage.parallel { border: 1px dashed var(--line); border-radius: 10px; padding: 18px 8px 8px; position: relative; }
.wf-stage.parallel::before { content: "en parallèle"; position: absolute; top: 2px; left: 10px; font-size: 11px; color: var(--muted); }
.wf-arrow { flex: 0 0 28px; display: flex; align-items: center; justify-content: center; color: var(--muted); }
.wf-arrow svg { width: 26px; height: 14px; }
.wf-step { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; }
.wf-step h4 { margin: 0; font-size: 14px; }
.wf-step .wf-id { font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); }
.wf-step p { margin: 4px 0 0; font-size: 12.5px; color: var(--muted); line-height: 1.4; }
.wf-agents { display: flex; flex-direction: column; gap: 5px; margin-top: 8px; }
.wf-agent { display: flex; align-items: center; gap: 7px; width: 100%; text-align: left; font: inherit; font-size: 13px; color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-left: 4px solid var(--c); border-radius: 7px; padding: 5px 8px; cursor: pointer; }
.wf-agent:hover { border-color: var(--c); }
.wf-agent.active { background: color-mix(in srgb, var(--c) 24%, var(--bg)); border-color: var(--c); font-weight: 600; box-shadow: 0 0 0 1px var(--c); }
.wf-agent .wf-mod { margin-left: auto; font-size: 11px; color: var(--accent); }
.wf-model { display: inline-block; margin-top: 8px; font-size: 11.5px; color: var(--muted); border: 1px dashed var(--line); border-radius: 999px; padding: 1px 8px; }
.wf-lane { margin-top: 14px; }
.wf-lane h3 { font-size: 13px; color: var(--muted); font-weight: 600; margin: 0 0 8px; }
.wf-lane .wf-row { display: flex; flex-wrap: wrap; gap: 10px; }
.wf-editor { margin-top: 16px; border: 1px solid var(--c, var(--accent)); border-top-width: 4px; border-radius: 10px; padding: 12px 14px; background: var(--panel); }
.wf-editor h3 { margin: 0; font-size: 16px; }
.wf-editor .wf-meta { font-size: 12.5px; color: var(--muted); margin: 4px 0 10px; display: flex; flex-wrap: wrap; gap: 4px 14px; }
.wf-editor label { display: block; font-size: 13px; font-weight: 600; margin: 10px 0 4px; }
.wf-editor textarea { width: 100%; box-sizing: border-box; font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 8px; resize: vertical; }
.wf-editor .wf-help { font-size: 12px; color: var(--muted); margin-top: 3px; }
.wf-editor .wf-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; }
.wf-btn { font: inherit; font-size: 14px; border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 6px; padding: 6px 14px; cursor: pointer; }
.wf-btn.primary { background: var(--accent); color: var(--accent-ink, #fff); border-color: var(--accent); font-weight: 600; }
.wf-btn:disabled { opacity: .5; cursor: default; }
.wf-state { font-size: 12.5px; color: var(--muted); }
.wf-agent .wf-cost { margin-left: auto; font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.wf-agent .wf-mod + .wf-cost { margin-left: 6px; }
.wf-total { display: flex; flex-wrap: wrap; gap: 4px 18px; align-items: baseline; border: 1px solid var(--line); border-radius: 10px; padding: 8px 12px; margin: 0 0 12px; font-size: 13px; }
.wf-total strong { font-size: 15px; }
.wf-total .wf-help { font-size: 12px; color: var(--muted); }
.wf-editor input.wf-model-input { width: 100%; max-width: 460px; box-sizing: border-box; font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 6px 8px; }
.wf-costs { width: 100%; max-width: 640px; border-collapse: collapse; font-size: 13px; margin-top: 4px; }
.wf-costs th, .wf-costs td { text-align: right; padding: 4px 8px; border-bottom: 1px solid var(--line); font-variant-numeric: tabular-nums; }
.wf-costs th:first-child, .wf-costs td:first-child { text-align: left; }
.wf-costs th { font-size: 12px; color: var(--muted); font-weight: 600; }
@media (max-width: 700px) {
  .wf-flow { flex-direction: column; align-items: stretch; overflow: visible; }
  .wf-arrow { flex-basis: 26px; } .wf-arrow svg { transform: rotate(90deg); }
  .wf-stage { max-width: none; }
}
`;
const PALETTE = ["#2f6db0", "#d0602e", "#2e8b57", "#8a4fb8", "#c0392b", "#1f8a8a", "#b8860b", "#c2477d"];

const h = (tag, props = {}, ...children) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const c of children.flat()) if (c != null && c !== false) e.append(c);
  return e;
};
const ARROW = '<svg viewBox="0 0 26 14" aria-hidden="true"><path d="M1 7h21M16 1l7 6-7 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

// ==========================================
// Coût estimé : mêmes hypothèses que le rapport de traitement (src/lib/metrics/impact.ts)
// ==========================================
// identifiants de modèle comparés sans l'éditeur ni la ponctuation (« mistralai/Mistral-Small-3.2-24B… » = « mistral-small-3-2-24b… »)
const norm = m => String(m ?? "").toLowerCase().replace(/^.*\//, "").replace(/[^a-z0-9]/g, "");
function costOf(costs, model, inputTokens, outputTokens) {
  const known = costs.models.find(x => norm(x.model) === norm(model));
  const p = known ?? costs.fallback;
  const { flopsPerJoule, utilization, pue } = costs.hardware;
  const wh = ((inputTokens + outputTokens) * (2 * p.activeParamsB * 1e9) / (flopsPerJoule * utilization) * pue) / 3600;
  return { eur: (inputTokens * p.inputPricePerM + outputTokens * p.outputPricePerM) / 1e6, wh, co2: (wh / 1000) * costs.carbonIntensity, known: !!known };
}
const addCost = (a, b) => ({ eur: a.eur + b.eur, wh: a.wh + b.wh, co2: a.co2 + b.co2, known: a.known && b.known });
const scale = (c, n) => ({ ...c, eur: c.eur * n, wh: c.wh * n, co2: c.co2 * n });
const ZERO = { eur: 0, wh: 0, co2: 0, known: true };
const nf = (v, d) => v.toLocaleString("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
// montants : quatre chiffres significatifs sous l'euro, « < 0,0001 » pour les coûts infimes
const fmtEur = (v, cur) => (v > 0 && v < 0.0001 ? `< 0,0001 ${cur}` : `${v.toLocaleString("fr-FR", v >= 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumSignificantDigits: 2 })} ${cur}`);
const fmtWh = v => (v >= 1000 ? `${nf(v / 1000, 2)} kWh` : `${nf(v, v < 1 ? 3 : 1)} Wh`);
const fmtCo2 = v => (v >= 1000 ? `${nf(v / 1000, 2)} kg CO₂e` : `${nf(v, v < 1 ? 3 : 1)} g CO₂e`);

async function request(url, body) {
  const res = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// container : élément où dessiner ; options.toast : fonction d'affichage des messages de la page
export async function workflowDiagram(container, options = {}) {
  if (!document.getElementById("wf-style")) document.head.append(h("style", { id: "wf-style", textContent: CSS }));
  const toast = options.toast ?? (m => console.log(m));
  let data, selected = null, dirty = false, albertModels = null;
  // liste des modèles Albert (choix du modèle d'un agent), chargée une fois
  const loadModels = async () => { albertModels ??= await request("/api/albert/models").catch(() => []); return albertModels; };

  async function load() {
    data = await request("/api/workflow");
    render();
  }

  const color = id => PALETTE[Object.keys(data.agents).indexOf(id) % PALETTE.length];
  const usedBy = id => [...data.stages.flat(), ...data.outside].filter(s => s.agents?.includes(id)).map(s => s.label);
  // coût d'un appel et d'un traitement pour un agent (modèle choisi, ou un autre en cours de choix)
  const agentCost = (a, model = a.modelId) => {
    const unit = costOf(data.costs, model, a.usage.inputTokens, a.usage.outputTokens);
    return { unit, run: scale(unit, a.usage.callsPerRun) };
  };
  // traitement complet : agents du workflow et traitements sans agent (extraction, vectorisation…)
  const totalCost = () => {
    const agents = Object.values(data.agents).filter(a => a.inWorkflow).reduce((t, a) => addCost(t, agentCost(a).run), ZERO);
    const other = data.other.entries.reduce((t, e) => addCost(t, costOf(data.costs, e.model, e.inputTokens, e.outputTokens)), ZERO);
    return { agents, other, total: addCost(agents, other) };
  };

  function step(s) {
    return h("div", { className: "wf-step" },
      h("h4", { textContent: s.label }), h("div", { className: "wf-id", textContent: s.id }),
      h("p", { textContent: s.description }),
      s.agents?.length ? h("div", { className: "wf-agents" }, s.agents.map(id => {
        const a = data.agents[id];
        const c = agentCost(a);
        return h("button", { type: "button", className: `wf-agent${selected === id ? " active" : ""}`, style: `--c:${color(id)}`,
          title: `Modifier « ${a.name} » (modèle ${a.modelId}) — coût estimé : ${fmtEur(c.unit.eur, data.costs.currency)} par appel, ${fmtEur(c.run.eur, data.costs.currency)} pour ${nf(a.usage.callsPerRun, 1)} appel(s) par traitement`, onclick: () => open(id) },
          h("span", { textContent: a.name }), a.modified ? h("span", { className: "wf-mod", textContent: "modifié" }) : null,
          h("span", { className: "wf-cost", textContent: `≈ ${fmtEur(c.run.eur, data.costs.currency)}` }));
      })) : null,
      s.model ? h("span", { className: "wf-model", textContent: `modèle ${s.model} (sans agent)` }) : null);
  }

  function render() {
    const flow = h("div", { className: "wf-flow" });
    data.stages.forEach((stage, i) => {
      if (i) flow.append(h("div", { className: "wf-arrow", innerHTML: ARROW }));
      flow.append(h("div", { className: `wf-stage${stage.length > 1 ? " parallel" : ""}` }, stage.map(step)));
    });
    const t = totalCost(), cur = data.costs.currency;
    const runsBasis = Math.max(data.other.runs, ...Object.values(data.agents).filter(a => a.inWorkflow).map(a => a.usage.runs));
    container.replaceChildren(...[
      h("p", { className: "wf-models" }, "Modèles par défaut : ", ...Object.entries(data.models).flatMap(([role, m], i) => [i ? " · " : "", `${role} `, h("code", { textContent: m })]),
        ` — textes et modèles modifiés enregistrés dans ${data.configFile}.`),
      h("div", { className: "wf-total" },
        h("span", {}, "Coût estimé d'un traitement : ", h("strong", { textContent: fmtEur(t.total.eur, cur) })),
        h("span", { textContent: `${fmtWh(t.total.wh)} · ${fmtCo2(t.total.co2)}` }),
        h("span", { className: "wf-help", textContent: `agents ${fmtEur(t.agents.eur, cur)}${t.other.eur ? `, autres traitements (extraction, vectorisation…) ${fmtEur(t.other.eur, cur)}` : ""} · ${runsBasis ? `d'après les ${runsBasis} dernière(s) exécution(s)` : "estimation par défaut (aucune exécution connue)"}${t.total.known ? "" : " · tarif par défaut pour un modèle absent de la table des coûts"}` })),
      flow,
      data.outside.length ? h("div", { className: "wf-lane" }, h("h3", { textContent: "Hors du workflow : actions de l'interface et autres traitements" }), h("div", { className: "wf-row" }, data.outside.map(step))) : null,
      selected ? editor(selected) : null].filter(Boolean));
  }

  function open(id) {
    if (dirty && !confirm("Les modifications en cours n'ont pas été enregistrées. Les abandonner ?")) return;
    dirty = false;
    selected = selected === id ? null : id;
    render();
    container.querySelector(".wf-editor")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function editor(id) {
    const a = data.agents[id];
    const state = h("span", { className: "wf-state" });
    const fields = {};
    const save = h("button", { type: "button", className: "wf-btn primary", textContent: "Enregistrer", disabled: true });
    const modelOf = () => fields.model.value.trim() || a.defaults.model;
    const costBox = h("div");
    const renderCost = () => {
      const c = agentCost(a, modelOf()), cur = data.costs.currency, u = a.usage;
      const row = (label, x, tokens) => h("tr", {}, h("td", { textContent: label }), h("td", { textContent: tokens }), h("td", { textContent: fmtEur(x.eur, cur) }), h("td", { textContent: fmtWh(x.wh) }), h("td", { textContent: fmtCo2(x.co2) }));
      costBox.replaceChildren(
        h("table", { className: "wf-costs" },
          h("thead", {}, h("tr", {}, ["", "Tokens (entrée + sortie)", "Coût", "Énergie", "Carbone"].map(x => h("th", { textContent: x })))),
          h("tbody", {},
            row("Par appel", c.unit, `${nf(u.inputTokens, 0)} + ${nf(u.outputTokens, 0)}`),
            row(`Par traitement (${nf(u.callsPerRun, 1)} appel${u.callsPerRun > 1 ? "s" : ""})`, c.run, nf((u.inputTokens + u.outputTokens) * u.callsPerRun, 0)))),
        h("div", { className: "wf-help", textContent: `${u.basis === "historique" ? `Consommation moyenne des ${u.runs} dernière(s) exécution(s) où l'agent a été appelé` : "Estimation par défaut : aucune exécution connue pour cet agent"} ; coût au prix du marché de référence du modèle « ${modelOf()} »${c.unit.known ? "" : " (absent de la table des coûts : tarif par défaut)"}. ${a.inWorkflow ? "Compté dans le coût d'un traitement." : "Hors du workflow : non compté dans le coût d'un traitement."}` }));
    };
    const update = () => {
      dirty = fields.instructions.value !== a.instructions || (fields.prompt && fields.prompt.value !== a.prompt) || modelOf() !== a.modelId;
      save.disabled = !dirty;
      const custom = fields.instructions.value !== a.defaults.instructions || (fields.prompt && fields.prompt.value !== a.defaults.prompt) || modelOf() !== a.defaults.model;
      state.textContent = `${dirty ? "modifications non enregistrées · " : ""}${custom ? "différent des réglages par défaut" : "réglages par défaut"}`;
      renderCost();
    };
    const listId = `wf-models-${id}`;
    fields.model = h("input", { className: "wf-model-input", value: a.modelId === a.defaults.model ? "" : a.modelId, placeholder: `${a.defaults.model} (par défaut)`, spellcheck: false, oninput: update });
    fields.model.setAttribute("list", listId);
    const datalist = h("datalist", { id: listId });
    loadModels().then(ms => datalist.replaceChildren(...ms.map(m => h("option", { value: m.id, label: m.type ?? "" }))));
    const area = (key, rows) => (fields[key] = h("textarea", { rows, value: a[key] ?? "", spellcheck: false, oninput: update }));

    save.onclick = async () => {
      try {
        await request("/api/workflow/agent", { id, instructions: fields.instructions.value, model: fields.model.value.trim(), ...(fields.prompt ? { prompt: fields.prompt.value } : {}) });
        dirty = false; toast(`Réglages de « ${a.name} » enregistrés`); await load();
      } catch (e) { toast("Erreur : " + e.message); }
    };
    const reset = h("button", { type: "button", className: "wf-btn", textContent: "Rétablir les réglages par défaut", onclick: async () => {
      if (!confirm(`Rétablir les textes et le modèle par défaut de « ${a.name} » ?`)) return;
      try { await request("/api/workflow/agent", { id, reset: true }); dirty = false; toast("Textes par défaut rétablis"); await load(); }
      catch (e) { toast("Erreur : " + e.message); }
    } });
    const close = h("button", { type: "button", className: "wf-btn", textContent: "Fermer", onclick: () => open(id) });

    const box = h("div", { className: "wf-editor", style: `--c:${color(id)}` },
      h("h3", { textContent: a.name }),
      h("div", { className: "wf-meta" },
        h("span", { textContent: a.role }),
        h("span", { textContent: `Étapes : ${usedBy(id).join(", ")}` }),
        h("span", {}, "Modèle : ", h("code", { textContent: a.modelId }), a.modelId !== a.defaults.model ? ` (par défaut : ${a.defaults.model})` : ` (${a.model})`),
        a.tools?.length ? h("span", { textContent: `Outils : ${a.tools.join(", ")}` }) : null,
        h("span", { className: "wf-id", textContent: `id : ${id}` })),
      h("label", { textContent: "Modèle" }), fields.model, datalist,
      h("div", { className: "wf-help", textContent: "Identifiant d'un modèle Albert (liste proposée) ; vide : modèle par défaut de l'agent. Vaut pour les prochains appels de l'agent." }),
      h("label", { textContent: "Coût estimé" }), costBox,
      h("label", { textContent: "Instructions (prompt système)" }), area("instructions", 12),
      h("div", { className: "wf-help", textContent: "Rôle, consignes et format de la réponse. Valent pour les prochains appels de l'agent." }),
      a.prompt !== undefined ? [h("label", { textContent: "Demande envoyée à chaque exécution" }), area("prompt", 14), h("div", { className: "wf-help", textContent: a.promptHelp ?? "" })] : null,
      a.note ? h("div", { className: "wf-help", style: "margin-top:8px", textContent: a.note }) : null,
      h("div", { className: "wf-bar" }, save, reset, close, state));
    update();
    return box;
  }

  try { await load(); }
  catch (e) { container.textContent = "Workflow indisponible : " + e.message; }
}
