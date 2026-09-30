import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { getOmk } from "../lib/omeka/omk";
import { extractAttachment, decodeEntities } from "../lib/extraction/attachmentExtract";
import { workflowConfig } from "../config";

export const CFP_TYPE = "Appel à propositions";

const CfpSchema = z.object({
  // lien vers l'appel (page web ou PDF)
  url: z.string().optional(),
  // fichier local de l'appel (PDF, HTML, DOCX…), quand le site bloque le téléchargement automatique
  file: z.string().optional(),
  // texte de l'appel, seul ou en complément du document en ligne
  text: z.string().optional(),
  // item Omeka de la collection Zotero traitée (lien dcterms:relation)
  collectionItemId: z.number().nullable().optional(),
});

// extrait le texte de l'appel selon son format (HTML, PDF, DOCX…)
async function extract(buffer: Buffer, contentType: string, fileName: string, fallbackTitle: string) {
  const extracted = await extractAttachment(buffer, contentType, fileName);
  // titre : <title> d'une page web, sinon première ligne du texte
  const clean = (s: string) => decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  // un titre exploitable : au moins 12 caractères et des lettres (écarte « 1 », « Accueil »…)
  const meaningful = (s: string | undefined) => !!s && s.length >= 12 && /\p{L}{3}/u.test(s);
  // page web : titre de partage (og:title), puis premier <h1>, puis <title> ; sinon première ligne significative du texte
  const html = extracted.format === "html" ? buffer.toString("utf8") : "";
  const candidates = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1],
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i.exec(html)?.[1],
    /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1],
    /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1],
    ...extracted.text.split("\n").slice(0, 40),
  ].map(c => (c ? clean(c) : ""));
  const title = (candidates.find(meaningful) ?? candidates.find(Boolean) ?? fallbackTitle).slice(0, 250);
  return { title, text: extracted.text, file: extracted.file, format: extracted.format };
}

// télécharge l'appel en ligne
async function download(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (ecosysteme-agents-recherche)" }, redirect: "follow" });
  if (!res.ok) {
    // page de vérification anti-robots (Cloudflare…) : seul un navigateur peut l'afficher
    const body = await res.text().catch(() => "");
    const challenge = /cloudflare/i.test(res.headers.get("server") ?? "") || /just a moment|cf-challenge|captcha/i.test(body);
    throw new Error(challenge
      ? `le site protège la page contre les accès automatiques (${res.status}). Enregistrer la page depuis un navigateur (PDF ou HTML) et l'indiquer comme fichier de l'appel (cfpFile), ou coller son texte (cfpText).`
      : `téléchargement impossible (${res.status} ${res.statusText}).`);
  }
  const contentType = (res.headers.get("content-type") ?? "").split(";")[0]!.trim();
  const buffer = Buffer.from(await res.arrayBuffer());
  const fileName = decodeURIComponent(path.basename(new URL(res.url || url).pathname)) || "appel";
  return extract(buffer, contentType, fileName, url);
}

// lit un fichier local de l'appel (le type est déduit de l'extension)
async function readLocal(filePath: string) {
  const full = path.resolve(process.cwd(), filePath);
  const buffer = await fs.readFile(full);
  const ext = path.extname(full).toLowerCase();
  const types: Record<string, string> = { ".pdf": "application/pdf", ".html": "text/html", ".htm": "text/html", ".txt": "text/plain", ".md": "text/markdown" };
  return extract(buffer, types[ext] ?? "", path.basename(full), path.basename(full));
}

export const fetchCfp = new Tool({
  name: "fetch-cfp",
  description: "Récupère l'appel à propositions (lien vers une page web ou un PDF, ou texte fourni), en extrait le texte et l'enregistre dans Omeka S (un item par appel, réutilisé d'une exécution à l'autre).",
  schema: CfpSchema,
  execute: async ({ data }) => {
    const { url, file: localFile, text: extraText = "", collectionItemId } = data as z.infer<typeof CfpSchema>;
    const omk = await getOmk();

    let title = "", text = "", file: { buffer: Buffer; fileName: string; type: string } | null = null;
    // contenu de l'appel : fichier local en priorité (enregistré depuis un navigateur), sinon téléchargement du lien
    let downloadError = "";
    try {
      let dl: Awaited<ReturnType<typeof extract>> | null = null;
      if (localFile) {
        console.log(`\n📣 Lecture du fichier de l'appel à propositions : ${localFile}`);
        dl = await readLocal(localFile);
      } else if (url) {
        console.log(`\n📣 Téléchargement de l'appel à propositions : ${url}`);
        dl = await download(url);
      }
      if (dl) {
        title = dl.title;
        text = dl.text;
        file = dl.file.buffer.length ? dl.file : null;
        console.log(`📣 ${dl.format.toUpperCase()} : ${text.length} caractères — ${title}`);
      }
    } catch (e) {
      downloadError = (e as Error).message;
      // le texte fourni en paramètre permet de continuer
      if (extraText.trim()) console.warn(`⚠️ Appel non récupéré (${downloadError}) Le texte fourni (cfpText) est utilisé.`);
    }
    // texte fourni en paramètre : seul, ou en complément du document
    if (extraText.trim()) text = text ? `${text}\n\n## Précisions\n\n${extraText.trim()}` : extraText.trim();
    if (!text) {
      throw new Error(downloadError
        ? `Appel à propositions non récupéré : ${downloadError}`
        : "Appel à propositions vide : renseigner un lien (cfpUrl), un fichier (cfpFile) ou un texte (cfpText).");
    }
    if (!title) title = text.split("\n").find(l => l.trim())!.slice(0, 120);

    // identifiant stable : l'URL, sinon une empreinte du texte
    const identifier = url || `aap-${crypto.createHash("sha1").update(text).digest("hex").slice(0, 12)}`;
    const existing = (await omk.searchItemsByProp("dcterms:identifier", identifier))
      .find((it: any) => it["dcterms:type"]?.some((v: any) => v["@value"] === CFP_TYPE));

    // classe de l'appel : celle de la configuration, sinon bibo:Document
    const { cfpClass } = workflowConfig.omeka;
    const resourceClass = omk.getClassByTerm(cfpClass) ? cfpClass : omk.getClassByTerm("bibo:Document") ? "bibo:Document" : null;
    if (resourceClass !== cfpClass) console.warn(`⚠️ [OMEKA] Classe ${cfpClass} absente de l'instance : l'appel est enregistré en ${resourceClass ?? "item sans classe"}.`);

    const metadata = {
      ...(resourceClass ? { "o:resource_class": resourceClass } : {}),
      "dcterms:title": title,
      "dcterms:identifier": identifier,
      "dcterms:type": CFP_TYPE,
      "dcterms:description": text,
      "dcterms:date": new Date().toISOString(),
      ...(url ? { "dcterms:source": { u: url, l: title } } : {}),
    };

    let aapItemId: number;
    if (existing) {
      aapItemId = existing["o:id"];
      // le texte de l'appel a pu être mis à jour depuis le dernier passage
      await omk.updateResource(aapItemId, metadata, "items", "PATCH", existing);
      console.log(`♻️ [OMEKA] Appel à propositions déjà enregistré, mis à jour (Item ID ${aapItemId})`);
    } else {
      const item = await omk.createItem(metadata);
      aapItemId = item["o:id"];
      console.log(`📣 [OMEKA] Appel à propositions enregistré (Item ID ${aapItemId})`);
      // document original (une seule fois)
      if (file) {
        await omk.uploadMedia(aapItemId, file, { "dcterms:title": `Document original de l'appel : ${title}` })
          .catch(e => console.warn(`⚠️ [OMEKA] Document de l'appel non importé :`, (e as Error).message));
      }
    }
    if (collectionItemId) await omk.addLinks(aapItemId, "dcterms:relation", [collectionItemId]).catch(() => {});

    return { aapItemId, title, text, url: url ?? null };
  },
});
