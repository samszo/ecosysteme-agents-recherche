// Extraction du texte, des annotations (surlignages + notes) et des images d'un PDF
// inspiré de extractNotes/index.html, adapté à Node.js (PDF.js legacy, encodage PNG via zlib au lieu d'un <canvas>)
import zlib from "zlib";

export interface PdfColor {
  css: string;
  hex: string;
}

export interface PdfAnnotation {
  page: number;
  type: string; // Highlight, Underline, StrikeOut, Squiggly, Text, FreeText
  phrase: string; // texte couvert par l'annotation (vide pour une note autonome)
  color: PdfColor | null;
  note: string;
  // marqueurs Zotero associés (notes et annotations du lecteur Zotero)
  tags?: string[];
  // code de la grille d'annotation attribué par le juge (marqueur ACC-S, DES-F…)
  code?: string;
  // auteur de l'annotation (juge)
  author?: string;
  // date de création (ISO), pour les annotations et notes Zotero
  date?: string;
}

export interface PdfImage {
  page: number;
  width: number;
  height: number;
  png: Buffer;
}

export interface PdfExtraction {
  numPages: number;
  text: string;
  pages: { page: number; text: string }[];
  annotations: PdfAnnotation[];
  images: PdfImage[];
}

export interface PdfExtractOptions {
  text?: boolean;
  annotations?: boolean;
  images?: boolean;
  minImageSize?: number; // les images plus petites (icônes, puces décoratives) sont ignorées
}

interface Rect {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// annotations qui marquent une portion de texte via des quadPoints
const MARKUP_TYPES = new Set(["Highlight", "Underline", "StrikeOut", "Squiggly"]);
// annotations qui portent seulement une note
const NOTE_TYPES = new Set(["Text", "FreeText"]);

// PDF.js est un module ES : on le charge dynamiquement (le projet est en CommonJS)
let pdfjsPromise: Promise<any> | null = null;
function getPdfjs() {
  if (!pdfjsPromise) pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjsPromise;
}

export async function extractPdf(buffer: Buffer | Uint8Array, options: PdfExtractOptions = {}): Promise<PdfExtraction> {
  const { text = true, annotations = true, images = true, minImageSize = 40 } = options;
  const pdfjs = await getPdfjs();
  // PDF.js détache le buffer fourni : on lui passe une copie
  const data = new Uint8Array(buffer);
  const pdf = await pdfjs.getDocument({ data, verbosity: 0, isEvalSupported: false }).promise;

  const result: PdfExtraction = { numPages: pdf.numPages, text: "", pages: [], annotations: [], images: [] };

  try {
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const textContent = text || annotations ? await page.getTextContent() : null;

      if (text && textContent) {
        result.pages.push({ page: p, text: textFromContent(textContent) });
      }
      if (annotations && textContent) {
        result.annotations.push(...(await extractAnnotationsFromPage(page, p, textContent)));
      }
      if (images) {
        result.images.push(...(await extractImagesFromPage(pdfjs, page, p, minImageSize)));
      }
      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }

  result.text = result.pages.map(pg => pg.text).join("\n\n");
  return result;
}

// ==========================================
// TEXTE
// ==========================================

function textFromContent(textContent: any): string {
  let out = "";
  for (const item of textContent.items) {
    if (!("str" in item)) continue;
    out += item.str;
    if (item.hasEOL) out += "\n";
  }
  return out.replace(/[ \t]+\n/g, "\n").trim();
}

// ==========================================
// ANNOTATIONS
// ==========================================

// quadPoints : tableau plat [x1,y1,...,x4,y4] par quadrilatère (PDF.js récent)
// ou tableau de tableaux de {x, y} (anciennes versions)
function quadRects(quadPoints: any): Rect[] {
  if (!quadPoints || !quadPoints.length) return [];
  let quads: number[][];
  if (typeof quadPoints[0] === "number") {
    quads = [];
    for (let i = 0; i + 7 < quadPoints.length; i += 8) quads.push(Array.from(quadPoints.slice(i, i + 8)));
  } else {
    quads = Array.from(quadPoints, (q: any) => (Array.isArray(q) && typeof q[0] === "object" ? q.flatMap((pt: any) => [pt.x, pt.y]) : Array.from(q)));
  }
  return quads.map(q => {
    const xs = q.filter((_, i) => i % 2 === 0);
    const ys = q.filter((_, i) => i % 2 === 1);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  });
}

function rectFromTextItem(item: any): Rect {
  const [a, b, c, d, e, f] = item.transform;
  const height = Math.hypot(b, d) || item.height || 1;
  const width = item.width || Math.hypot(a, c);
  return { minX: e, maxX: e + width, minY: f, maxY: f + height };
}

function colorToCss(color: any): PdfColor | null {
  if (!color || color.length < 3) return null;
  let [r, g, b] = Array.from(color as ArrayLike<number>) as [number, number, number];
  if (r <= 1 && g <= 1 && b <= 1) {
    r *= 255;
    g *= 255;
    b *= 255;
  }
  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);
  const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
  return { css: `rgb(${r}, ${g}, ${b})`, hex };
}

const isLetter = (c: string | undefined) => !!c && /[\p{L}\p{N}’']/u.test(c);

// reconstruit la phrase couverte par les quadrilatères de l'annotation :
// pour chaque bloc de texte qui chevauche verticalement un quadrilatère,
// la portion horizontale commune est convertie en sous-chaîne (proportionnellement à la largeur du bloc)
function phraseFromQuads(rects: Rect[], textItems: { item: any; rect: Rect }[]): string {
  const matched: { str: string; x: number; y: number }[] = [];
  for (const { item, rect } of textItems) {
    const itemWidth = rect.maxX - rect.minX;
    const itemHeight = rect.maxY - rect.minY;
    for (const qr of rects) {
      const yOverlap = Math.max(0, Math.min(rect.maxY, qr.maxY) - Math.max(rect.minY, qr.minY));
      if (yOverlap / Math.max(Math.min(itemHeight, qr.maxY - qr.minY), 1) < 0.4) continue;

      const xStart = Math.max(rect.minX, qr.minX);
      const xEnd = Math.min(rect.maxX, qr.maxX);
      if (xEnd - xStart <= 0.5 || itemWidth <= 0) continue;

      const len = item.str.length;
      let idxStart = Math.max(0,Math.min(len, Math.round(((xStart - rect.minX) / itemWidth) * len)));
      let idxEnd = Math.max(idxStart, Math.min(len, Math.round(((xEnd - rect.minX) / itemWidth) * len)));
      // l'approximation proportionnelle peut couper un mot d'un caractère : on recale sur le mot
      if (idxStart > 0 && isLetter(item.str[idxStart - 1]) && isLetter(item.str[idxStart])) idxStart--;
      if (idxEnd < len && isLetter(item.str[idxEnd - 1]) && isLetter(item.str[idxEnd])) idxEnd++;
      const substr = item.str.slice(idxStart, idxEnd).trim();
      if (substr) matched.push({ str: substr, x: xStart, y: rect.minY });
      break;
    }
  }
  // ordre de lecture : de haut en bas (y décroissant dans l'espace PDF), puis de gauche à droite
  matched.sort((a, b) => (b.y - a.y > 2 ? 1 : a.y - b.y > 2 ? -1 : a.x - b.x));
  return matched.map(m => m.str).join(" ").replace(/\s+/g, " ").trim();
}

async function extractAnnotationsFromPage(page: any, pageNumber: number, textContent: any): Promise<PdfAnnotation[]> {
  const anns = await page.getAnnotations();
  const textItems = textContent.items
    .filter((it: any) => it.str && it.str.trim().length > 0)
    .map((it: any) => ({ item: it, rect: rectFromTextItem(it) }));

  const out: PdfAnnotation[] = [];
  for (const ann of anns) {
    const isMarkup = MARKUP_TYPES.has(ann.subtype);
    if (!isMarkup && !NOTE_TYPES.has(ann.subtype)) continue;
    const note = (ann.contentsObj?.str || ann.contents || "").trim();
    const phrase = isMarkup ? phraseFromQuads(quadRects(ann.quadPoints), textItems) : "";
    // une note autonome sans contenu n'apporte rien
    if (!isMarkup && !note) continue;
    // auteur inscrit dans l'annotation PDF (champ T)
    const author = (ann.titleObj?.str || ann.title || "").trim();
    out.push({
      page: pageNumber,
      type: ann.subtype,
      phrase: isMarkup ? phrase || "(texte non détecté)" : phrase,
      color: colorToCss(ann.color),
      note,
      ...(author ? { author } : {}),
    });
  }
  return out;
}

// ==========================================
// IMAGES
// ==========================================

async function extractImagesFromPage(pdfjs: any, page: any, pageNumber: number, minImageSize: number): Promise<PdfImage[]> {
  const opList = await page.getOperatorList();
  const imageOps = new Set([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintJpegXObject]);
  const seen = new Set<string>();
  const images: PdfImage[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    if (!imageOps.has(opList.fnArray[i])) continue;
    const imgId = opList.argsArray[i][0];
    if (!imgId || seen.has(imgId)) continue;
    seen.add(imgId);

    try {
      // les images partagées entre pages (logos…) sont dans commonObjs
      const objs = imgId.startsWith("g_") ? page.commonObjs : page.objs;
      const imgData: any = await new Promise(resolve => objs.get(imgId, resolve));
      if (!imgData || imgData.width < minImageSize || imgData.height < minImageSize) continue;
      const png = imageDataToPng(imgData);
      if (png) images.push({ page: pageNumber, width: imgData.width, height: imgData.height, png });
    } catch {
      // image non décodable (espace colorimétrique non géré, etc.) : on l'ignore
    }
  }
  return images;
}

// convertit les pixels décodés par PDF.js en RGBA
// kind : 1 = niveaux de gris 1 bit, 2 = RGB 24 bits, 3 = RGBA 32 bits
function imageDataToRgba(imgData: any): Uint8Array | null {
  const { width, height, data, kind } = imgData;
  if (!data || !width || !height) return null;
  const rgba = new Uint8Array(width * height * 4);

  if (kind === 1) {
    const rowBytes = (width + 7) >> 3;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bit = (data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
        const p = (y * width + x) * 4;
        rgba[p] = rgba[p + 1] = rgba[p + 2] = bit ? 255 : 0;
        rgba[p + 3] = 255;
      }
    }
    return rgba;
  }

  const channels = kind === 3 ? 4 : kind === 2 ? 3 : data.length / (width * height);
  if (channels === 4) {
    rgba.set(data.subarray(0, rgba.length));
  } else if (channels === 3) {
    for (let p = 0, s = 0; p < rgba.length; p += 4, s += 3) {
      rgba[p] = data[s];
      rgba[p + 1] = data[s + 1];
      rgba[p + 2] = data[s + 2];
      rgba[p + 3] = 255;
    }
  } else if (channels === 1) {
    for (let p = 0, s = 0; p < rgba.length; p += 4, s++) {
      rgba[p] = rgba[p + 1] = rgba[p + 2] = data[s];
      rgba[p + 3] = 255;
    }
  } else {
    return null;
  }
  return rgba;
}

function imageDataToPng(imgData: any): Buffer | null {
  const rgba = imageDataToRgba(imgData);
  return rgba ? encodePng(imgData.width, imgData.height, rgba) : null;
}

// encodeur PNG minimal (RGBA 8 bits, sans filtre)
function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const rowLen = width * 4;
  const raw = Buffer.alloc((rowLen + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowLen + 1)] = 0; // filtre "None"
    raw.set(rgba.subarray(y * rowLen, (y + 1) * rowLen), y * (rowLen + 1) + 1);
  }

  const chunk = (type: string, body: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const typeAndBody = Buffer.concat([Buffer.from(type, "ascii"), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(typeAndBody));
    return Buffer.concat([len, typeAndBody, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
