// Export PDF d'une séance chaoticumSeminario (ou de la partition seule) : page HTML autonome — bilan, déroulé prévu
// et réel, un chapitre par écran (contenu, copie d'écran, diagramme, contributions, transcription, annotations),
// coût — imprimée par Chromium (Playwright)
import type { Partition, Screen } from "./partition";

const LABELS: Record<string, string> = { citation: "Citation", diapo: "Diapo", question: "Question", contribution: "Contributions", diagramme: "Diagramme", introduction: "Introduction", argumentaire: "Argumentaire", conclusion: "Conclusion" };
const STATUS: Record<string, string> = { ok: "dans le temps", warning: "dépassé", danger: "très dépassé" };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const mmss = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.round(Math.max(0, s) % 60)).padStart(2, "0")}`;
const date = (iso?: string) => (iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : "—");
const hhmm = (iso: string, t0: number) => mmss((new Date(iso).getTime() - t0) / 1000);
const http = (u: unknown) => (typeof u === "string" && /^https?:\/\//.test(u) ? u : null);
const cost = (c: any) => (c ? `${Number(c.energyWh ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Wh · ${Number(c.co2g ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} g CO₂e · ${Number(c.apiCost ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 4 })} ${c.currency ?? "€"}` : "—");

export interface PdfInput {
  partition: Partition & Record<string, any>;
  // séance enregistrée (participation) ; absente : partition seule
  participation?: any;
  // copies d'écran des diapos (nom du fichier → data URI)
  images: Map<string, string>;
}

function screenContent(s: Screen, images: Map<string, string>): string {
  if (s.cadre) {
    const f = s.cadre;
    return `<div class="cadre"><div class="cadre-title">${esc(f.title)}</div>${f.subtitle ? `<p class="sub">${esc(f.subtitle)}</p>` : ""}${f.credits ? `<p class="credits">${esc(f.credits)}</p>` : ""}
      ${f.text ? `<p>${esc(f.text)}</p>` : ""}${f.points?.length ? `<${s.type === "argumentaire" ? "ol" : "ul"}>${f.points.map(x => `<li>${esc(x)}</li>`).join("")}</${s.type === "argumentaire" ? "ol" : "ul"}>` : ""}
      ${f.thanks ? `<p class="thanks">${esc(f.thanks)}</p>` : ""}</div>`;
  }
  if (s.citation) {
    const c = s.citation;
    const ref = [c.source?.creators, c.source?.year, c.source?.title].filter(Boolean).join(", ");
    const img = http(c.image?.url);
    return `<div class="${img ? "cite-media" : ""}">${img ? `<img src="${esc(img)}" alt="">` : ""}<div><blockquote>${esc(c.text)}</blockquote>
      ${c.comment ? `<p class="comment">${esc(c.comment)}</p>` : ""}<p class="ref">${esc(ref)}${c.page ? `, p. ${esc(c.page)}` : ""}${c.author ? ` · surligné par ${esc(c.author)}` : ""}${http(c.source?.url) ? ` · <a href="${esc(c.source!.url)}">source</a>` : ""}</p></div></div>`;
  }
  if (s.diapo) {
    const d = s.diapo;
    const img = d.screenshot ? images.get(d.screenshot) : null;
    return `${img ? `<img class="shot" src="${img}" alt="">` : ""}<p class="ref"><a href="${esc(d.url)}">${esc(d.name)}, diapo ${esc(d.diapo)}${d.max ? ` / ${esc(d.max)}` : ""}</a></p>${d.description ? `<p class="muted">${esc(d.description)}</p>` : ""}`;
  }
  if (s.question) return `<p class="question">${esc(s.question.text)}</p>${s.question.intention ? `<p class="muted">${esc(s.question.intention)}</p>` : ""}`;
  if (s.diagramme) return `<p class="dtitle">${esc(s.diagramme.title)}</p><pre class="mermaid">${esc(s.diagramme.mermaid)}</pre>`;
  if (s.type === "contribution") return `<p>${s.contribution?.instruction ? esc(s.contribution.instruction) : "Adresses web proposées par le public (formulaire Grist)."}</p>`;
  return `<p class="muted">Contenu non généré.</p>`;
}

export function sessionHtml({ partition: p, participation: r, images }: PdfInput): string {
  const t0 = r ? new Date(r.startedAt).getTime() : 0;
  const events: any[] = r?.events ?? [];
  const overrides = new Map<string, any>((r?.overrides ?? []).map((o: any) => [o.id, o]));
  const contributions = (r?.contributions ?? []).filter((c: any) => !overrides.get(c.id)?.deleted).map((c: any) => ({ ...c, url: overrides.get(c.id)?.url ?? c.url }));
  const transcript: any[] = r?.transcript ?? [];
  const annotations: any[] = r?.annotations ?? [];
  const worst = (list: any[]) => (list.some(e => e.status === "danger") ? "danger" : list.some(e => e.status === "warning") ? "warning" : list.length ? "ok" : "");
  const real = (i: number) => events.filter(e => e.index === i);

  const contribList = (list: any[]) => `<ul class="contribs">${list.map(c => `<li><a href="${esc(http(c.url) ?? "#")}">${esc(c.url)}</a> — ${esc(c.name || "anonyme")}${c.receivedAt ? ` <span class="muted">(${hhmm(c.receivedAt, t0)}${c.shownAt || c.shows?.length ? ", affichée" : ""})</span>` : ""}</li>`).join("")}</ul>`;
  const byPosition = (list: any[]) => [...list.reduce((m, a) => m.set(a.position || a.color, { color: a.color, n: (m.get(a.position || a.color)?.n ?? 0) + 1 }), new Map<string, { color: string; n: number }>())]
    .map(([k, v]) => `<span class="tag"><i style="background:${esc(v.color)}"></i>${esc(k)} (${v.n})</span>`).join(" ");

  const sections = p.screens.map((s, i) => {
    const ev = real(i);
    const seconds = ev.reduce((n, e) => n + (Number(e.seconds) || 0), 0);
    const recv = contributions.filter((c: any) => c.screenIndex === i);
    const segs = transcript.filter(x => x.screen === i);
    const anns = annotations.filter(a => a.screen === i);
    const highlights = anns.filter(a => a.kind === "highlight" && a.text);
    return `<section class="screen">
      <h2><span class="badge t-${esc(s.type)}">${esc(LABELS[s.type] ?? s.type)}</span> Écran ${i + 1}
        <span class="when">prévu ${mmss(s.start)} – ${mmss(s.start + s.duration)} (${mmss(s.duration)})${r ? ` · ${ev.length ? `réel ${mmss(seconds)}${ev.length > 1 ? ` en ${ev.length} passages` : ""} · <b class="st-${worst(ev)}">${STATUS[worst(ev)]}</b>` : "non parcouru"}` : ""}</span></h2>
      ${screenContent(s, images)}
      ${recv.length ? `<h3>Contributions reçues (${recv.length})</h3>${contribList(recv)}` : ""}
      ${anns.length ? `<h3>Annotations du public (${anns.length})</h3><p>${byPosition(anns)}</p>${highlights.map(h => `<p class="hl" style="border-color:${esc(h.color)}">« ${esc(h.text)} » — ${esc(h.position)}${h.author?.name ? `, ${esc(h.author.name)}` : ""}</p>`).join("")}` : ""}
      ${segs.length ? `<h3>Transcription</h3>${segs.map(x => `<p class="seg"><span class="muted">${hhmm(x.at, t0)}</span> ${esc(x.text)}</p>`).join("")}` : ""}
    </section>`;
  }).join("\n");

  const planned = p.screens.reduce((n, s) => n + s.duration, 0);
  const edit = p.editCost;
  const intro = p.screens.find(s => s.type === "introduction")?.cadre;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(p.title)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm 18mm; }
  body { font: 10.5pt/1.45 "Helvetica Neue", Arial, sans-serif; color: #1d1d1f; margin: 0; }
  h1 { font-size: 22pt; margin: 0 0 4pt; } h2 { font-size: 12.5pt; margin: 0 0 8pt; display: flex; gap: 8pt; align-items: baseline; flex-wrap: wrap; }
  h3 { font-size: 10pt; margin: 10pt 0 4pt; color: #555; text-transform: uppercase; letter-spacing: .04em; }
  a { color: #8a2c55; text-decoration: none; word-break: break-all; }
  .muted, .when { color: #6b6b70; } .when { font-size: 9pt; font-weight: 400; }
  .cover { border-bottom: 2px solid #a23b62; padding-bottom: 10pt; margin-bottom: 12pt; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6pt; margin: 10pt 0; }
  .stats div { background: #f4f1f3; border-radius: 6pt; padding: 6pt 8pt; } .stats b { display: block; font-size: 14pt; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; } th, td { text-align: left; padding: 3pt 5pt; border-bottom: 1px solid #ddd; vertical-align: top; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  /* couverture (bilan, déroulé, coût) seule sur sa page ; un écran n'est pas coupé entre deux pages s'il y tient */
  .cover { break-after: page; border-bottom: 0; }
  .screen { break-inside: avoid; border-top: 1px solid #e3dde0; padding-top: 10pt; margin-top: 12pt; }
  .screen:first-of-type { border-top: 0; margin-top: 0; padding-top: 0; }
  .badge { font-size: 8.5pt; color: #fff; border-radius: 99pt; padding: 1pt 7pt; background: #777; }
  .t-citation { background: #2f6db0; } .t-diapo { background: #2e8b57; } .t-question { background: #c2477d; } .t-contribution { background: #d0802e; }
  .t-diagramme { background: #7a5bb5; } .t-introduction { background: #2f9693; } .t-argumentaire { background: #9a7a2e; } .t-conclusion { background: #b5544a; }
  .st-ok { color: #2e7d4f; } .st-warning { color: #b9770e; } .st-danger { color: #c0392b; }
  blockquote { font: italic 13pt/1.45 Georgia, serif; margin: 0; } blockquote::before { content: "« "; } blockquote::after { content: " »"; }
  .cite-media { display: grid; grid-template-columns: 38% 1fr; gap: 10pt; align-items: start; } .cite-media img { width: 100%; border-radius: 4pt; }
  .comment { border-left: 3px solid #2f6db0; padding-left: 8pt; } .ref { color: #555; font-size: 9.5pt; }
  img.shot { width: 100%; border: 1px solid #ddd; border-radius: 4pt; }
  .question { font-size: 16pt; font-weight: 650; margin: 0 0 4pt; } .dtitle { font-weight: 650; margin: 0 0 4pt; }
  pre.mermaid { background: none; text-align: center; margin: 0; } pre.mermaid svg { max-width: 100%; max-height: 150mm; }
  .cadre-title { font-size: 18pt; font-weight: 700; } .sub { font-size: 12pt; color: #555; margin: 2pt 0; } .credits { color: #a23b62; }
  .thanks { font-size: 15pt; font-weight: 700; color: #b5544a; }
  .contribs { padding-left: 14pt; } .contribs li { margin: 2pt 0; }
  .tag { display: inline-flex; align-items: center; gap: 3pt; border: 1px solid #ddd; border-radius: 99pt; padding: 0 6pt; font-size: 8.5pt; } .tag i { width: 7pt; height: 7pt; border-radius: 50%; display: inline-block; }
  .hl { border-left: 3px solid; padding-left: 6pt; margin: 3pt 0; font-size: 9.5pt; } .seg { margin: 2pt 0; font-size: 9.5pt; }
</style></head><body>
<div class="cover">
  <h1>${esc(p.title)}</h1>
  ${intro?.subtitle ? `<p class="sub">${esc(intro.subtitle)}</p>` : ""}${intro?.credits ? `<p class="credits">${esc(intro.credits)}</p>` : ""}
  <p class="muted">${r ? `Séance ${r.mode === "replay" ? "rejouée" : "en direct"} du ${date(r.startedAt)}` : `Partition du ${date(p.createdAt)} (non jouée)`} · graine ${esc(p.seed)}</p>
  ${p.description ? `<p>${esc(p.description)}</p>` : ""}
  <div class="stats">
    <div><b>${p.screens.length}</b>écrans</div>
    <div><b>${mmss(planned)}</b>durée prévue</div>
    ${r ? `<div><b>${mmss(r.elapsedSeconds ?? 0)}</b>durée réelle (${(r.elapsedSeconds ?? 0) >= planned ? "+" : "−"}${mmss(Math.abs((r.elapsedSeconds ?? 0) - planned))})</div>
    <div><b>${contributions.length}</b>contribution(s)${annotations.length ? ` · ${annotations.length} annotation(s)` : ""}${transcript.length ? ` · ${transcript.length} passage(s) transcrits` : ""}</div>` : `<div><b>${p.screens.filter(s => s.type === "contribution").length}</b>appels à contributions</div><div><b>${p.screens.filter(s => s.citation).length} / ${p.screens.filter(s => s.diapo).length}</b>citations / diapos</div>`}
  </div>
  <h3>Déroulé</h3>
  <table><thead><tr><th>#</th><th>Type</th><th>Contenu</th><th class="num">Début</th><th class="num">Prévu</th>${r ? `<th class="num">Réel</th><th>Statut</th>` : ""}</tr></thead><tbody>
  ${p.screens.map((s, i) => {
    const ev = real(i), secs = ev.reduce((n, e) => n + (Number(e.seconds) || 0), 0);
    const what = s.cadre?.title ?? s.question?.text ?? s.diagramme?.title ?? (s.citation ? `« ${s.citation.text.slice(0, 70)}${s.citation.text.length > 70 ? "…" : ""} »` : s.diapo ? `${s.diapo.name}, diapo ${s.diapo.diapo}` : s.contribution?.instruction ?? "");
    return `<tr><td>${i + 1}</td><td>${esc(LABELS[s.type] ?? s.type)}</td><td>${esc(what)}</td><td class="num">${mmss(s.start)}</td><td class="num">${mmss(s.duration)}</td>${r ? `<td class="num">${ev.length ? mmss(secs) : "—"}</td><td class="st-${worst(ev)}">${STATUS[worst(ev)] ?? "non parcouru"}</td>` : ""}</tr>`;
  }).join("")}
  </tbody></table>
  <h3>Coût</h3>
  <p>Génération : ${cost(p.impact)}${edit ? ` · éditeur IA (${edit.treatments} traitement(s)) : ${cost(edit)}` : ""}</p>
</div>
${sections}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
<script>
  // diagrammes rendus avant l'impression ; window.__ready est attendu par l'export
  (async () => {
    try { if (window.mermaid) { mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" }); await mermaid.run({ querySelector: "pre.mermaid" }); } }
    catch (e) { console.warn(e); }
    await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
    window.__ready = true;
  })();
</script>
</body></html>`;
}

// impression en PDF (A4, numéros de page) ; diagrammes et images chargés avant l'impression (20 s au plus)
export async function renderPdf(html: string, footer: string): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });
    await page.waitForFunction("window.__ready === true", null, { timeout: 20000 }).catch(() => {});
    return await page.pdf({
      format: "A4", printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="font:8px Arial,sans-serif;color:#888;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>${esc(footer)}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    });
  } finally {
    await browser.close();
  }
}
