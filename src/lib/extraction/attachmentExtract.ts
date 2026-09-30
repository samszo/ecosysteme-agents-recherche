// Extraction du texte, des annotations et des images d'une pièce jointe Zotero, quel que soit son type
import path from "path";
import { extractPdf, type PdfAnnotation } from "./pdfExtract";
import { isZip, readZip } from "./zip";

export interface AttachmentImage {
  page: number; // page (PDF) ou rang du fichier/chapitre (autres formats)
  width: number;
  height: number;
  data: Buffer;
  type: string;
  fileName: string;
}

export interface AttachmentExtraction {
  format: string; // pdf, html, text, docx, odt, epub, image, other
  text: string;
  annotations: PdfAnnotation[];
  images: AttachmentImage[];
  // fichier à déposer dans Omeka (pour un snapshot : la page HTML plutôt que l'archive)
  file: { buffer: Buffer; fileName: string; type: string };
}

const MIN_IMAGE_SIZE = 40;

const IMAGE_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function extractAttachment(buffer: Buffer, contentType: string, fileName: string): Promise<AttachmentExtraction> {
  const ext = path.extname(fileName).toLowerCase();
  const file = { buffer, fileName, type: contentType || "application/octet-stream" };
  const empty = { text: "", annotations: [], images: [] };

  if (contentType === "application/pdf" || ext === ".pdf") {
    const pdf = await extractPdf(buffer);
    return {
      format: "pdf",
      text: pdf.text,
      annotations: pdf.annotations,
      images: pdf.images.map((img, i) => ({
        page: img.page, width: img.width, height: img.height, data: img.png, type: "image/png",
        fileName: `${path.basename(fileName, ext)}_p${img.page}_${i + 1}.png`,
      })),
      file,
    };
  }

  if (contentType === "text/html" || contentType === "application/xhtml+xml" || ext === ".html" || ext === ".htm") {
    // les snapshots Zotero sont téléchargés sous forme d'archive (page + ressources)
    if (isZip(buffer)) return extractHtmlSnapshot(readZip(buffer), fileName);
    return { format: "html", text: htmlToText(mainContent(buffer.toString("utf8"))), annotations: [], images: [], file };
  }

  if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === ".docx") {
    return { format: "docx", ...extractDocx(readZip(buffer)), file };
  }

  if (contentType === "application/vnd.oasis.opendocument.text" || ext === ".odt") {
    return { format: "odt", ...extractOdt(readZip(buffer)), file };
  }

  if (contentType === "application/epub+zip" || ext === ".epub") {
    return { format: "epub", ...extractEpub(readZip(buffer)), file };
  }

  if (contentType.startsWith("text/") || [".txt", ".md", ".csv", ".json", ".xml"].includes(ext)) {
    return { format: "text", text: buffer.toString("utf8").trim(), annotations: [], images: [], file };
  }

  if (contentType.startsWith("image/")) {
    const size = imageSize(buffer);
    return {
      format: "image",
      ...empty,
      images: size ? [{ page: 1, ...size, data: buffer, type: contentType, fileName }] : [],
      file,
    };
  }

  // autre format : on dépose seulement le fichier
  return { format: "other", ...empty, file };
}

// ==========================================
// HTML
// ==========================================

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»",
  hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  eacute: "é", egrave: "è", ecirc: "ê", agrave: "à", acirc: "â", ccedil: "ç", ocirc: "ô",
  ucirc: "û", ugrave: "ù", icirc: "î", iuml: "ï", euml: "ë", oelig: "œ", Eacute: "É",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

// renvoie l'élément complet (balises imbriquées comprises) qui commence au premier match de openTag
function extractElement(html: string, openTag: RegExp): string | null {
  const m = openTag.exec(html);
  if (!m) return null;
  const tag = m[1]!.toLowerCase();
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  re.lastIndex = m.index;
  let depth = 0, t: RegExpExecArray | null;
  while ((t = re.exec(html))) {
    depth += t[1] ? -1 : 1;
    if (depth === 0) return html.slice(m.index, re.lastIndex);
  }
  return html.slice(m.index);
}

// zones de contenu principal, de la plus spécifique à la plus générale
// (Cairn, OpenEdition, WordPress, sites de presse…, puis <article> et <main>)
const CONTENT_SELECTORS = [
  /<(section|div)\b[^>]*\bid=["'](?:article-texte|article-body|articleBody|text|corps)["'][^>]*>/i,
  /<(section|div)\b[^>]*\bclass=["'][^"']*\b(?:entry-content|post-content|article-body|article__body|article-content)\b[^"']*["'][^>]*>/i,
  /<(div|section)\b[^>]*\bitemprop=["']articleBody["'][^>]*>/i,
  /<(article)\b[^>]*>/i,
  /<(main)\b[^>]*>/i,
];

// isole le contenu principal d'une page web pour éviter menus, bandeaux et pieds de page
export function mainContent(html: string): string {
  const body = html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
  const bodyLength = htmlToText(body).length;
  for (const selector of CONTENT_SELECTORS) {
    const el = extractElement(body, selector);
    // on n'accepte la zone que si elle contient l'essentiel du texte
    if (el && htmlToText(el).length >= Math.min(1000, bodyLength * 0.3)) return el;
  }
  return body;
}

// texte lisible d'une page HTML : on retire scripts, styles et navigation, on garde les sauts de paragraphe
export function htmlToText(html: string): string {
  const body = html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
  return decodeEntities(
    body
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(script|style|noscript|svg|nav|header|footer|form|button|iframe)\b[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|h[1-6]|li|tr|blockquote|figcaption|dd|dt)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractHtmlSnapshot(files: Map<string, Buffer>, fileName: string): AttachmentExtraction {
  // page principale : celle qui porte le nom du fichier Zotero, sinon la plus volumineuse
  const htmlFiles = [...files.keys()].filter(f => /\.x?html?$/i.test(f));
  const main =
    htmlFiles.find(f => path.basename(f) === fileName) ??
    htmlFiles.sort((a, b) => files.get(b)!.length - files.get(a)!.length)[0];
  if (!main) return { format: "html", text: "", annotations: [], images: [], file: { buffer: Buffer.alloc(0), fileName, type: "text/html" } };

  const html = files.get(main)!.toString("utf8");
  const content = mainContent(html);
  // images réellement affichées dans le contenu principal (et non toutes les ressources de l'archive)
  const srcs = [...content.matchAll(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)].map(m => decodeURIComponent(decodeEntities(m[1]!)));
  const images = collectImages(files, srcs.map(src => path.posix.normalize(path.posix.join(path.posix.dirname(main), src))));

  return {
    format: "html",
    text: htmlToText(content),
    annotations: [],
    images,
    file: { buffer: files.get(main)!, fileName: path.basename(main), type: "text/html" },
  };
}

// ==========================================
// DOCX / ODT / EPUB
// ==========================================

function xmlText(xml: string, paragraphTag: RegExp): string {
  return decodeEntities(xml.replace(paragraphTag, "\n").replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractDocx(files: Map<string, Buffer>) {
  const doc = files.get("word/document.xml")?.toString("utf8") ?? "";
  const text = xmlText(doc.replace(/<w:tab\/>/g, "\t"), /<\/w:p>/g);

  // commentaires Word → annotations (note seule, le passage commenté n'est pas reconstruit)
  const comments = files.get("word/comments.xml")?.toString("utf8") ?? "";
  const annotations: PdfAnnotation[] = [...comments.matchAll(/<w:comment\b[^>]*>([\s\S]*?)<\/w:comment>/g)]
    .map(m => xmlText(m[1]!, /<\/w:p>/g))
    .filter(Boolean)
    .map(note => ({ page: 0, type: "Text", phrase: "", color: null, note }));

  const images = collectImages(files, [...files.keys()].filter(f => f.startsWith("word/media/")));
  return { text, annotations, images };
}

function extractOdt(files: Map<string, Buffer>) {
  let content = files.get("content.xml")?.toString("utf8") ?? "";
  // annotations ODT : <office:annotation> contient la note, on la retire du texte courant
  const annotations: PdfAnnotation[] = [...content.matchAll(/<office:annotation\b[^>]*>([\s\S]*?)<\/office:annotation>/g)]
    .map(m => xmlText(m[1]!.replace(/<dc:(creator|date)>[\s\S]*?<\/dc:\1>/g, ""), /<\/text:p>/g))
    .filter(Boolean)
    .map(note => ({ page: 0, type: "Text", phrase: "", color: null, note }));
  content = content.replace(/<office:annotation\b[\s\S]*?<\/office:annotation>/g, "");
  const text = xmlText(content, /<\/text:(p|h)>/g);
  const images = collectImages(files, [...files.keys()].filter(f => f.startsWith("Pictures/")));
  return { text, annotations, images };
}

function extractEpub(files: Map<string, Buffer>) {
  const container = files.get("META-INF/container.xml")?.toString("utf8") ?? "";
  const opfPath = container.match(/full-path="([^"]+)"/)?.[1] ?? [...files.keys()].find(f => f.endsWith(".opf")) ?? "";
  const opf = files.get(opfPath)?.toString("utf8") ?? "";
  const base = path.posix.dirname(opfPath);

  // manifeste : id → fichier ; la spine donne l'ordre de lecture
  const manifest = new Map<string, { href: string; type: string }>();
  for (const m of opf.matchAll(/<item\b[^>]*>/g)) {
    const id = m[0].match(/\bid="([^"]+)"/)?.[1];
    const href = m[0].match(/\bhref="([^"]+)"/)?.[1];
    const type = m[0].match(/\bmedia-type="([^"]+)"/)?.[1] ?? "";
    if (id && href) manifest.set(id, { href: path.posix.join(base, decodeURIComponent(href)), type });
  }
  const spine = [...opf.matchAll(/<itemref\b[^>]*\bidref="([^"]+)"/g)].map(m => manifest.get(m[1]!)?.href).filter((h): h is string => !!h);

  const text = spine
    .map(href => files.get(href)?.toString("utf8"))
    .filter((h): h is string => !!h)
    .map(htmlToText)
    .filter(Boolean)
    .join("\n\n");
  const images = collectImages(files, [...manifest.values()].filter(it => it.type.startsWith("image/")).map(it => it.href));
  return { text, annotations: [] as PdfAnnotation[], images };
}

// ==========================================
// IMAGES
// ==========================================

function collectImages(files: Map<string, Buffer>, paths: string[]): AttachmentImage[] {
  const images: AttachmentImage[] = [];
  const seen = new Set<string>();
  for (const p of paths) {
    const type = IMAGE_TYPES[path.extname(p).toLowerCase()];
    const data = files.get(p);
    if (!type || !data || seen.has(p)) continue;
    seen.add(p);
    const size = imageSize(data);
    if (!size || size.width < MIN_IMAGE_SIZE || size.height < MIN_IMAGE_SIZE) continue;
    images.push({ page: images.length + 1, ...size, data, type, fileName: path.basename(p) });
  }
  return images;
}

// dimensions lues dans l'en-tête PNG, JPEG, GIF ou WebP (sans décoder l'image)
export function imageSize(b: Buffer): { width: number; height: number } | null {
  if (b.length < 24) return null;
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.toString("ascii", 0, 3) === "GIF") return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    // parcours des segments JPEG jusqu'au marqueur SOF
    let p = 2;
    while (p + 9 < b.length) {
      if (b[p] !== 0xff) return null;
      const marker = b[p + 1]!;
      const len = b.readUInt16BE(p + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: b.readUInt16BE(p + 7), height: b.readUInt16BE(p + 5) };
      }
      p += 2 + len;
    }
  }
  return null;
}
