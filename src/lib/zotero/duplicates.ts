// Détection des documents en double dans une collection Zotero (ex. le même article ajouté par plusieurs
// membres d'un groupe) : les pièces jointes qui partagent un fichier, un DOI, une URL ou un titre et une année
// désignent le même document.
import { normalizeId } from "../analysis/cleanGraph";

export interface DuplicateGroup {
  // exemplaire retenu (enregistré dans Omeka S)
  primary: any;
  // autres exemplaires (leurs annotations, notes et marqueurs sont cumulés sur le principal)
  duplicates: any[];
  // critères communs ayant conduit au regroupement (fichier, DOI, URL, titre)
  reasons: string[];
}

const normalizeDoi = (doi: string) => doi.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:\s*/, "");
const normalizeUrl = (url: string) => url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/+$/, "");

// clés d'identité d'une pièce jointe (dans l'ordre de fiabilité)
function identityKeys(attachment: any, parent: any | null): { key: string; reason: string }[] {
  const a = attachment.data ?? {};
  const p = parent?.data ?? {};
  const keys: { key: string; reason: string }[] = [];
  if (a.md5) keys.push({ key: `md5:${a.md5}`, reason: "même fichier" });
  const doi = p.DOI || (/\b10\.\d{4,9}\/\S+/.exec(p.extra ?? "")?.[0] ?? "");
  if (doi) keys.push({ key: `doi:${normalizeDoi(doi)}`, reason: "même DOI" });
  const url = p.url || a.url;
  if (url) keys.push({ key: `url:${normalizeUrl(url)}`, reason: "même URL" });
  // titre de la notice (celui d'une pièce jointe isolée est souvent générique : « Snapshot », « Full Text PDF »)
  const title = normalizeId(parent ? p.title ?? "" : "");
  if (title.length >= 15) {
    const year = /\b(1[5-9]|20)\d{2}\b/.exec(p.date ?? "")?.[0] ?? "";
    keys.push({ key: `titre:${title}|${year}`, reason: "même titre" });
  }
  return keys;
}

// exemplaire principal : un fichier plutôt qu'un lien, un PDF de préférence, puis le plus ancien
function rank(attachment: any): [number, string] {
  const a = attachment.data ?? {};
  const type = a.linkMode === "linked_url" ? 3 : a.contentType === "application/pdf" ? 0 : a.contentType?.startsWith("text/html") ? 1 : 2;
  return [type, a.dateAdded ?? ""];
}

export function groupDuplicates(attachments: any[], parentOf: (attachment: any) => any | null): DuplicateGroup[] {
  // union-find : deux pièces jointes qui partagent une clé d'identité sont dans le même groupe
  const parentIdx = attachments.map((_, i) => i);
  const find = (i: number): number => (parentIdx[i] === i ? i : (parentIdx[i] = find(parentIdx[i]!)));
  const owner = new Map<string, number>();
  const reasonsOf = new Map<number, Set<string>>();

  attachments.forEach((att, i) => {
    for (const { key, reason } of identityKeys(att, parentOf(att))) {
      const j = owner.get(key);
      if (j === undefined) {
        owner.set(key, i);
        continue;
      }
      const ri = find(i), rj = find(j);
      if (ri !== rj) parentIdx[ri] = rj;
      const root = find(i);
      if (!reasonsOf.has(root)) reasonsOf.set(root, new Set());
      reasonsOf.get(root)!.add(reason);
    }
  });

  const groups = new Map<number, any[]>();
  attachments.forEach((att, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(att);
  });

  return [...groups.entries()].map(([root, members]) => {
    const sorted = [...members].sort((x, y) => {
      const [tx, dx] = rank(x), [ty, dy] = rank(y);
      return tx - ty || dx.localeCompare(dy);
    });
    // les raisons ont pu être notées sur une ancienne racine avant fusion : on les réunit
    const reasons = new Set<string>();
    for (const [r, set] of reasonsOf) if (find(r) === root) set.forEach(x => reasons.add(x));
    return { primary: sorted[0], duplicates: sorted.slice(1), reasons: [...reasons] };
  });
}
