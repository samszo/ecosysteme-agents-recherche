// Diagramme du workflow de l'application (étapes dans l'ordre, étapes en parallèle, agents impliqués) ; un clic sur un
// agent ouvre le formulaire de ses instructions et de sa demande, enregistrées dans agents.config.json (/api/workflow).
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
  let data, selected = null, dirty = false;

  async function load() {
    data = await request("/api/workflow");
    render();
  }

  const color = id => PALETTE[Object.keys(data.agents).indexOf(id) % PALETTE.length];
  const usedBy = id => [...data.stages.flat(), ...data.outside].filter(s => s.agents?.includes(id)).map(s => s.label);

  function step(s) {
    return h("div", { className: "wf-step" },
      h("h4", { textContent: s.label }), h("div", { className: "wf-id", textContent: s.id }),
      h("p", { textContent: s.description }),
      s.agents?.length ? h("div", { className: "wf-agents" }, s.agents.map(id => {
        const a = data.agents[id];
        return h("button", { type: "button", className: `wf-agent${selected === id ? " active" : ""}`, style: `--c:${color(id)}`, title: `Modifier les instructions de « ${a.name} »`, onclick: () => open(id) },
          h("span", { textContent: a.name }), a.modified ? h("span", { className: "wf-mod", textContent: "modifié" }) : null);
      })) : null,
      s.model ? h("span", { className: "wf-model", textContent: `modèle ${s.model} (sans agent)` }) : null);
  }

  function render() {
    const flow = h("div", { className: "wf-flow" });
    data.stages.forEach((stage, i) => {
      if (i) flow.append(h("div", { className: "wf-arrow", innerHTML: ARROW }));
      flow.append(h("div", { className: `wf-stage${stage.length > 1 ? " parallel" : ""}` }, stage.map(step)));
    });
    container.replaceChildren(...[
      h("p", { className: "wf-models" }, "Modèles : ", ...Object.entries(data.models).flatMap(([role, m], i) => [i ? " · " : "", `${role} `, h("code", { textContent: m })]),
        ` — textes modifiés enregistrés dans ${data.configFile}.`),
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
    const update = () => {
      dirty = fields.instructions.value !== a.instructions || (fields.prompt && fields.prompt.value !== a.prompt);
      save.disabled = !dirty;
      const custom = fields.instructions.value !== a.defaults.instructions || (fields.prompt && fields.prompt.value !== a.defaults.prompt);
      state.textContent = `${dirty ? "modifications non enregistrées · " : ""}${custom ? "différent des textes par défaut" : "textes par défaut"}`;
    };
    const area = (key, rows) => (fields[key] = h("textarea", { rows, value: a[key] ?? "", spellcheck: false, oninput: update }));

    save.onclick = async () => {
      try {
        await request("/api/workflow/agent", { id, instructions: fields.instructions.value, ...(fields.prompt ? { prompt: fields.prompt.value } : {}) });
        dirty = false; toast(`Instructions de « ${a.name} » enregistrées`); await load();
      } catch (e) { toast("Erreur : " + e.message); }
    };
    const reset = h("button", { type: "button", className: "wf-btn", textContent: "Rétablir les textes par défaut", onclick: async () => {
      if (!confirm(`Rétablir les textes par défaut de « ${a.name} » ?`)) return;
      try { await request("/api/workflow/agent", { id, reset: true }); dirty = false; toast("Textes par défaut rétablis"); await load(); }
      catch (e) { toast("Erreur : " + e.message); }
    } });
    const close = h("button", { type: "button", className: "wf-btn", textContent: "Fermer", onclick: () => open(id) });

    const box = h("div", { className: "wf-editor", style: `--c:${color(id)}` },
      h("h3", { textContent: a.name }),
      h("div", { className: "wf-meta" },
        h("span", { textContent: a.role }),
        h("span", { textContent: `Étapes : ${usedBy(id).join(", ")}` }),
        h("span", {}, "Modèle : ", h("code", { textContent: `${a.model} (${data.models[a.model]})` })),
        a.tools?.length ? h("span", { textContent: `Outils : ${a.tools.join(", ")}` }) : null,
        h("span", { className: "wf-id", textContent: `id : ${id}` })),
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
