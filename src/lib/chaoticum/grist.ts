// Contributions du public : lecture de la table des réponses d'un formulaire Grist (export CSV)
import crypto from "crypto";
import dns from "dns/promises";
import net from "net";

export interface Contribution {
  id: string;
  // identifiant de la ligne dans Grist (lecture par l'API), absent pour une lecture CSV
  rowId?: number;
  name: string;
  url: string;
  date: string;
  row: Record<string, string>;
}

// analyse CSV (guillemets, virgules et retours à la ligne dans les champs)
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(f => f !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some(f => f !== "")) rows.push(row);
  return rows;
}

type Columns = { urlColumn: string; nameColumn: string; dateColumn: string };

// document et table Grist d'après le lien de la table des réponses (export CSV ou API des enregistrements)
export function gristTable(responsesUrl: string): { base: string; docId: string; tableId: string } | null {
  try {
    const u = new URL(responsesUrl);
    const doc = /\/api\/docs\/([^/]+)/.exec(u.pathname)?.[1];
    const table = u.searchParams.get("tableId") ?? /\/tables\/([^/]+)/.exec(u.pathname)?.[1];
    return doc && table ? { base: `${u.origin}/api/docs/${doc}/tables/${encodeURIComponent(table)}/records`, docId: doc, tableId: table } : null;
  } catch { return null; }
}

const gristHeaders = (apiKey?: string) => ({ "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) });
const deniedHint = (status: number) => (status === 401 || status === 403 ? " (document privé ou clé sans droit d'écriture : renseigner GRIST_API_KEY)" : "");

// réponses du formulaire : API des enregistrements de Grist (identifiant de ligne stable, modifiable), sinon export CSV
// (identifiant = empreinte de la ligne)
export async function readContributions(responsesUrl: string, columns: Columns, apiKey?: string): Promise<Contribution[]> {
  const table = gristTable(responsesUrl);
  if (table) {
    const res = await fetch(table.base, { headers: gristHeaders(apiKey) });
    if (res.ok) {
      const records: any[] = (await res.json()).records ?? [];
      return records.map(r => {
        const f = r.fields ?? {};
        const d = f[columns.dateColumn];
        const date = typeof d === "number" ? new Date(d * 1000).toISOString() : String(d ?? "");
        const row = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, String(v ?? "")]));
        return { id: `grist-${r.id}`, rowId: r.id, url: String(f[columns.urlColumn] ?? "").trim(), name: String(f[columns.nameColumn] ?? "").trim(), date, row };
      }).filter(c => /^https?:\/\//i.test(c.url));
    }
    if (res.status !== 404) throw new Error(`Grist ${res.status} sur la table des réponses${deniedHint(res.status)}`);
  }
  const res = await fetch(responsesUrl, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} });
  if (!res.ok) throw new Error(`Grist ${res.status} sur la table des réponses${deniedHint(res.status)}`);
  const [header = [], ...lines] = parseCsv(await res.text());
  const idx = (name: string) => header.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
  const [iu, iname, idate] = [idx(columns.urlColumn), idx(columns.nameColumn), idx(columns.dateColumn)];
  if (iu < 0) throw new Error(`Colonne « ${columns.urlColumn} » absente de la table des réponses (colonnes : ${header.join(", ")})`);
  const seen = new Map<string, number>();
  return lines.map(cells => {
    const row = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
    const base = crypto.createHash("sha1").update(cells.join("\u0001")).digest("hex").slice(0, 16);
    // deux lignes identiques gardent des identifiants distincts
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return { id: n ? `${base}-${n}` : base, url: (cells[iu] ?? "").trim(), name: iname >= 0 ? (cells[iname] ?? "").trim() : "", date: idate >= 0 ? (cells[idate] ?? "").trim() : "", row };
  }).filter(c => /^https?:\/\//i.test(c.url));
}

// modification de l'URL d'une réponse dans Grist (clé avec droit d'écriture)
export async function updateContribution(responsesUrl: string, columns: Columns, rowId: number, url: string, apiKey: string) {
  const table = gristTable(responsesUrl);
  if (!table) throw new Error("Lien de la table des réponses non reconnu (API Grist)");
  const res = await fetch(table.base, { method: "PATCH", headers: gristHeaders(apiKey), body: JSON.stringify({ records: [{ id: rowId, fields: { [columns.urlColumn]: url } }] }) });
  if (!res.ok) throw new Error(`Grist ${res.status} : modification refusée${deniedHint(res.status)}`);
}

// suppression d'une réponse dans Grist (clé avec droit d'écriture)
export async function deleteContribution(responsesUrl: string, rowId: number, apiKey: string) {
  const table = gristTable(responsesUrl);
  if (!table) throw new Error("Lien de la table des réponses non reconnu (API Grist)");
  const res = await fetch(`${table.base.replace(/\/records$/, "")}/data/delete`, { method: "POST", headers: gristHeaders(apiKey), body: JSON.stringify([rowId]) });
  if (!res.ok) throw new Error(`Grist ${res.status} : suppression refusée${deniedHint(res.status)}`);
}

// adresse privée, locale ou réservée : le serveur ne la consulte pas (URL proposée par le public)
function privateAddress(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number) as [number, number];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:");
}

// la page accepte-t-elle d'être affichée dans un iframe ? (X-Frame-Options, CSP frame-ancestors)
// chaque redirection est suivie à la main pour contrôler son adresse (l'URL vient du public)
export async function frameable(url: string): Promise<{ frameable: boolean; reason?: string; finalUrl?: string }> {
  let u: URL;
  try { u = new URL(url); } catch { return { frameable: false, reason: "adresse invalide" }; }
  try {
    for (let hop = 0; hop < 5; hop++) {
      if (!/^https?:$/.test(u.protocol)) return { frameable: false, reason: "protocole non autorisé" };
      const addresses = await dns.lookup(u.hostname, { all: true }).catch(() => []);
      if (!addresses.length) return { frameable: false, reason: "serveur introuvable" };
      if (addresses.some(a => privateAddress(a.address))) return { frameable: false, reason: "adresse locale ou privée" };
      const res = await fetch(u, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "chaoticumSeminario" } });
      res.body?.cancel().catch(() => {});
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) { u = new URL(location, u); continue; }
      const xfo = (res.headers.get("x-frame-options") ?? "").toLowerCase();
      if (xfo.includes("deny") || xfo.includes("sameorigin")) return { frameable: false, reason: `X-Frame-Options: ${xfo}` };
      const fa = /frame-ancestors([^;]*)/i.exec(res.headers.get("content-security-policy") ?? "")?.[1]?.trim();
      if (fa && !/(^|\s)\*(\s|$)/.test(fa)) return { frameable: false, reason: `frame-ancestors ${fa}` };
      return { frameable: true, finalUrl: u.href };
    }
    return { frameable: false, reason: "trop de redirections" };
  } catch (e) {
    return { frameable: false, reason: (e as Error).message };
  }
}
