import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import { positionForColor } from "../lib/analysis/annotationPositions";
import { words, jaccard } from "./fetchOmekaAnnotations";
import { fleissKappa, cohenKappa, interpretKappa } from "./calculateFleissKappa";
import { exploConfig, exploGrid } from "../config/explo";

const CollaborationSchema = z.object({
  articles: z.array(z.any()),
});

interface UnitAnnotation { author: string; position: string | null; color: string | null; phrase: string; note: string; page: number }

export const analyzeCollaboration = new Tool({
  name: "analyze-collaboration",
  description: "Analyse les collaborations dans l'annotation collective : documents et passages annotés en commun, convergence ou divergence des couleurs de la grille sur un même passage, accord global (kappa), réseau collaborateurs–documents.",
  schema: CollaborationSchema,
  execute: async ({ data }) => {
    const { articles } = data as z.infer<typeof CollaborationSchema>;
    const grid = exploGrid();
    const { unitSimilarity, unassignedLabel, minPassagesForKappa } = exploConfig.analysis;

    // ==========================================
    // Passages : surlignages d'un même document regroupés par similarité des mots
    // ==========================================
    const units: { key: string; docKey: string; docTitle: string; phrase: string; words: Set<string>; annotations: UnitAnnotation[] }[] = [];
    const docsByPerson = new Map<string, Set<string>>();
    const annotationsByPersonDoc = new Map<string, number>();

    for (const a of articles) {
      const docUnits: typeof units = [];
      for (const ann of a.annotations ?? []) {
        const who = ann.author || unassignedLabel;
        if (!docsByPerson.has(who)) docsByPerson.set(who, new Set());
        docsByPerson.get(who)!.add(a.zoteroKey);
        annotationsByPersonDoc.set(`${who}|${a.zoteroKey}`, (annotationsByPersonDoc.get(`${who}|${a.zoteroKey}`) ?? 0) + 1);
        if (!ann.phrase) continue; // les notes ne portent pas sur un passage
        const w = words(ann.phrase);
        let unit = docUnits.find(u => jaccard(u.words, w) >= unitSimilarity);
        if (!unit) {
          unit = { key: `${a.zoteroKey}#${docUnits.length + 1}`, docKey: a.zoteroKey, docTitle: a.title, phrase: ann.phrase, words: w, annotations: [] };
          docUnits.push(unit);
        }
        // le passage le plus long sert de référence
        if (ann.phrase.length > unit.phrase.length) unit.phrase = ann.phrase;
        unit.annotations.push({
          author: who,
          position: positionForColor(ann.color?.hex, grid)?.position ?? null,
          color: ann.color?.hex ?? null,
          phrase: ann.phrase,
          note: ann.note ?? "",
          page: ann.page ?? 0,
        });
      }
      units.push(...docUnits);
    }

    // passages annotés par au moins deux personnes (une position par personne : la dernière)
    const shared = units
      .map(u => {
        const byPerson = new Map<string, UnitAnnotation>();
        for (const x of u.annotations) byPerson.set(x.author, x);
        return { ...u, people: [...byPerson.values()] };
      })
      .filter(u => u.people.filter(p => p.author !== unassignedLabel).length >= 2);

    // ==========================================
    // Paires de collaborateurs
    // ==========================================
    const names = [...docsByPerson.keys()].filter(n => n !== unassignedLabel).sort();
    const pairKey = (x: string, y: string) => (x < y ? `${x}|${y}` : `${y}|${x}`);
    const pairs = new Map<string, { a: string; b: string; sharedDocuments: number; sharedPassages: number; samePosition: number; differentPosition: number }>();
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = names[i]!, b = names[j]!;
        const docsA = docsByPerson.get(a)!, docsB = docsByPerson.get(b)!;
        pairs.set(pairKey(a, b), { a, b, sharedDocuments: [...docsA].filter(d => docsB.has(d)).length, sharedPassages: 0, samePosition: 0, differentPosition: 0 });
      }
    }
    for (const u of shared) {
      const ps = u.people.filter(p => p.author !== unassignedLabel);
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const pair = pairs.get(pairKey(ps[i]!.author, ps[j]!.author));
          if (!pair) continue;
          pair.sharedPassages++;
          if (ps[i]!.position && ps[i]!.position === ps[j]!.position) pair.samePosition++;
          else pair.differentPosition++;
        }
      }
    }
    const pairList = [...pairs.values()]
      .map(p => ({ ...p, agreement: p.sharedPassages ? p.samePosition / p.sharedPassages : null }))
      .sort((x, y) => y.sharedPassages - x.sharedPassages || y.sharedDocuments - x.sharedDocuments);

    // ==========================================
    // Accord global sur la signification des couleurs (kappa, réutilise calculateFleissKappa)
    // ==========================================
    const rated = shared.filter(u => u.people.filter(p => p.position).length >= 2);
    const counts = new Map(rated.map(u => {
      const c = new Map<string, number>();
      for (const p of u.people) if (p.position) c.set(p.position, (c.get(p.position) ?? 0) + 1);
      return [u.key, c];
    }));
    const categories = [...new Set(rated.flatMap(u => u.people.map(p => p.position).filter((x): x is string => !!x)))];
    let kappa: { fleiss: number | null; cohen: number | null; interpretation: string; passages: number } = { fleiss: null, cohen: null, interpretation: "Pas assez de passages annotés en commun", passages: rated.length };
    if (rated.length && rated.length < minPassagesForKappa) {
      kappa.interpretation = `Trop peu de passages annotés en commun (${rated.length} sur ${minPassagesForKappa} au minimum) pour un kappa interprétable`;
    } else if (rated.length && categories.length) {
      const fleiss = fleissKappa(counts, categories);
      let cohen: number | null = null;
      if (names.length === 2) {
        const pairsCodes = rated
          .map(u => [u.people.find(p => p.author === names[0])?.position, u.people.find(p => p.author === names[1])?.position])
          .filter((p): p is [string, string] => !!p[0] && !!p[1]);
        if (pairsCodes.length) cohen = cohenKappa(pairsCodes);
      }
      kappa = { fleiss: Number(fleiss.toFixed(4)), cohen: cohen === null ? null : Number(cohen.toFixed(4)), interpretation: interpretKappa(cohen ?? fleiss), passages: rated.length };
    }

    const describe = (u: (typeof shared)[number]) => ({
      document: u.docTitle, docKey: u.docKey, phrase: u.phrase,
      annotations: u.people.map(p => ({ author: p.author, position: p.position, color: p.color, note: p.note, page: p.page })),
    });
    const divergent = shared.filter(u => new Set(u.people.map(p => p.position ?? "hors grille")).size > 1).map(describe);
    const convergent = shared.filter(u => new Set(u.people.map(p => p.position ?? "hors grille")).size === 1).map(describe);

    // ==========================================
    // Réseau collaborateurs–documents (visualisation sigma.js)
    // ==========================================
    const graph = {
      nodes: [
        ...[...docsByPerson.keys()].map(n => ({ id: `c:${n}`, label: n, category: "collaborateur" })),
        ...articles.filter(a => (a.annotations ?? []).length).map(a => ({ id: `d:${a.zoteroKey}`, label: a.title, category: "document", ...(a.omekaItemId ? { omekaId: a.omekaItemId } : {}) })),
      ],
      edges: [
        ...[...annotationsByPersonDoc].map(([k, n]) => {
          const [who, doc] = k.split("|");
          return { source: `c:${who}`, target: `d:${doc}`, relation: `annote (${n})` };
        }),
        ...pairList.filter(p => p.sharedPassages).map(p => ({
          source: `c:${p.a}`, target: `c:${p.b}`,
          relation: `${p.sharedPassages} passage(s) commun(s), accord ${Math.round((p.agreement ?? 0) * 100)} %`,
        })),
      ],
    };

    const result = {
      collaborators: names,
      passages: { total: units.length, shared: shared.length, convergent: convergent.length, divergent: divergent.length },
      pairs: pairList,
      matrix: {
        names,
        sharedPassages: names.map(a => names.map(b => (a === b ? null : pairs.get(pairKey(a, b))?.sharedPassages ?? 0))),
        agreement: names.map(a => names.map(b => (a === b ? null : pairList.find(p => pairKey(p.a, p.b) === pairKey(a, b))?.agreement ?? null))),
      },
      kappa,
      divergent,
      convergent,
      graph,
    };
    console.log(`🤝 Collaborations : ${shared.length} passage(s) annoté(s) en commun (${convergent.length} convergent(s), ${divergent.length} divergent(s)), kappa ${kappa.fleiss ?? "—"}`);
    return result;
  },
});
