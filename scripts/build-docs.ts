// Génère la documentation HTML (docs/html/*.html) à partir des fichiers markdown de docs/
// Lancement : npm run docs
import fs from "fs";
import path from "path";
import { Marked } from "marked";

const DOCS = path.resolve(__dirname, "..", "docs");
const OUT = path.join(DOCS, "html");

// ordre et titres des pages dans la navigation
const PAGES = [
  { file: "README.md", html: "index.html", title: "Accueil" },
  { file: "installation.md", html: "installation.html", title: "Installation" },
  { file: "utilisateur.md", html: "utilisateur.html", title: "Utilisateur" },
  { file: "technique.md", html: "technique.html", title: "Technique" },
];
const htmlName = new Map(PAGES.map(p => [p.file, p.html]));

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function render(markdown: string) {
  const toc: { level: number; text: string; id: string }[] = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      // blocs mermaid rendus dans le navigateur
      code({ text, lang }) {
        if (lang === "mermaid") return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
        return `<pre><code class="language-${escapeHtml(lang ?? "")}">${escapeHtml(text)}</code></pre>\n`;
      },
      // titres avec ancre, collectés pour la table des matières
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = slug(text);
        // texte déjà échappé par marked : seules les balises (code, liens) sont retirées
        if (depth === 2 || depth === 3) toc.push({ level: depth, text: text.replace(/<[^>]+>/g, ""), id });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}">#</a>${text}</h${depth}>\n`;
      },
      // liens entre fichiers markdown → pages HTML
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const [file, hash] = href.split("#");
        const target = htmlName.get(file ?? "") ? `${htmlName.get(file!)}${hash ? "#" + hash : ""}` : href;
        const external = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : "";
        return `<a href="${escapeHtml(target)}"${title ? ` title="${escapeHtml(title)}"` : ""}${external}>${text}</a>`;
      },
    },
  });
  const body = marked.parse(markdown) as string;
  return { body, toc };
}

function page(current: (typeof PAGES)[number], body: string, toc: { level: number; text: string; id: string }[], docTitle: string) {
  const nav = PAGES.map(p => `<a href="${p.html}"${p === current ? ' aria-current="page"' : ""}>${p.title}</a>`).join("");
  const tocHtml = toc.length
    ? `<nav class="toc"><strong>Sur cette page</strong>${toc.map(t => `<a class="l${t.level}" href="#${t.id}">${t.text}</a>`).join("")}</nav>`
    : "";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(docTitle)} – Écosystème d'agents</title>
<style>
  :root { --bg: #f6f5f1; --panel: #ffffff; --ink: #1d1f24; --muted: #6b6f78; --line: #e2e0d9; --accent: #2f5d8a; --code: #f0eee8; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #15171b; --panel: #1d2026; --ink: #e8e9ec; --muted: #9aa0aa; --line: #2e323a; --accent: #7fb0e0; --code: #111317; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  header { background: var(--panel); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 2; }
  header .bar { max-width: 1180px; margin: 0 auto; padding: 10px 16px; display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
  header .brand { font-weight: 650; }
  header nav { display: flex; gap: 4px; flex-wrap: wrap; }
  header nav a { color: var(--muted); text-decoration: none; padding: 4px 10px; border-radius: 6px; }
  header nav a[aria-current] { color: var(--ink); background: var(--bg); }
  .layout { max-width: 1180px; margin: 0 auto; padding: 24px 16px 80px; display: grid; grid-template-columns: minmax(0, 1fr) 230px; gap: 32px; }
  main { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 8px 32px 32px; min-width: 0; }
  .toc { position: sticky; top: 70px; align-self: start; font-size: 13.5px; display: flex; flex-direction: column; gap: 4px; max-height: calc(100vh - 90px); overflow: auto; }
  .toc strong { margin-bottom: 4px; }
  .toc a { color: var(--muted); text-decoration: none; }
  .toc a.l3 { padding-left: 12px; }
  .toc a:hover { color: var(--accent); }
  h1 { font-size: 28px; line-height: 1.25; }
  h2 { font-size: 21px; margin-top: 36px; padding-top: 8px; border-top: 1px solid var(--line); }
  h3 { font-size: 17px; margin-top: 26px; }
  .anchor { color: var(--line); text-decoration: none; margin-right: 6px; font-weight: 400; }
  h2:hover .anchor, h3:hover .anchor { color: var(--accent); }
  a { color: var(--accent); }
  code { background: var(--code); padding: 1px 5px; border-radius: 4px; font-size: .9em; }
  pre { background: var(--code); padding: 12px 14px; border-radius: 8px; overflow: auto; font-size: 13.5px; line-height: 1.45; }
  pre code { background: none; padding: 0; }
  pre.mermaid { background: var(--panel); border: 1px solid var(--line); text-align: center; }
  table { border-collapse: collapse; width: 100%; font-size: 14.5px; margin: 12px 0 20px; display: block; overflow-x: auto; }
  th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: var(--bg); }
  blockquote { margin: 12px 0; padding: 4px 14px; border-left: 3px solid var(--accent); color: var(--muted); background: var(--bg); border-radius: 0 6px 6px 0; }
  @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .toc { display: none; } main { padding: 4px 16px 24px; } }
</style>
</head>
<body>
<header><div class="bar"><span class="brand">Écosystème d'agents – documentation</span><nav>${nav}</nav></div></header>
<div class="layout">
<main>
${body}
</main>
${tocHtml}
</div>
<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
mermaid.initialize({ startOnLoad: true, theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default", flowchart: { htmlLabels: true } });
</script>
</body>
</html>
`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const p of PAGES) {
  const md = fs.readFileSync(path.join(DOCS, p.file), "utf-8");
  const { body, toc } = render(md);
  const docTitle = /^#\s+(.+)$/m.exec(md)?.[1] ?? p.title;
  fs.writeFileSync(path.join(OUT, p.html), page(p, body, toc, docTitle));
  console.log(`📄 ${p.file} → docs/html/${p.html}`);
}
