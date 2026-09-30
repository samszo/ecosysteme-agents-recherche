import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import { positionForColor } from "../lib/analysis/annotationPositions";
import { exploConfig, exploGrid } from "../config/explo";

const ParticipationSchema = z.object({
  // articles produits par fetch-literature (fetchZoteroData) : annotations avec auteur, couleur, date
  articles: z.array(z.any()),
});

// lundi de la semaine d'une date (AAAA-MM-JJ), pour la chronologie
function weekOf(date: string): string | null {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

const countWords = (s: string) => (s.match(/\p{L}[\p{L}'’-]*/gu) ?? []).length;

export const computeParticipation = new Tool({
  name: "compute-participation",
  description: "Mesure la participation de chaque collaborateur à l'annotation collective d'une collection Zotero : annotations, notes, documents couverts, répartition par couleur de la grille, chronologie.",
  schema: ParticipationSchema,
  execute: async ({ data }) => {
    const { articles } = data as z.infer<typeof ParticipationSchema>;
    const grid = exploGrid();
    const unassigned = exploConfig.analysis.unassignedLabel;
    const positions = grid.positions.map(p => p.position);

    const people = new Map<string, any>();
    const person = (name: string) => {
      if (!people.has(name)) {
        people.set(name, {
          name, annotations: 0, notes: 0, words: 0, comments: 0,
          documents: new Set<string>(), days: new Set<string>(),
          positions: Object.fromEntries(positions.map(p => [p, 0])), offGrid: 0,
          firstDate: null as string | null, lastDate: null as string | null,
        });
      }
      return people.get(name);
    };
    const positionTotals: Record<string, number> = Object.fromEntries(positions.map(p => [p, 0]));
    let offGridTotal = 0;
    const weeks = new Map<string, Map<string, number>>();
    const documents: any[] = [];

    for (const a of articles) {
      const docPeople = new Map<string, number>();
      let docAnnotations = 0, docNotes = 0;
      for (const ann of a.annotations ?? []) {
        const who = ann.author || unassigned;
        const p = person(who);
        const isNote = ann.type === "Note" || !ann.phrase;
        if (isNote) { p.notes++; docNotes++; } else {
          p.annotations++; docAnnotations++;
          p.words += countWords(ann.phrase);
          if (ann.note) p.comments++;
          // couleur de surlignage → signification de la grille
          const pos = positionForColor(ann.color?.hex, grid)?.position;
          if (pos) { p.positions[pos]++; positionTotals[pos]!++; } else { p.offGrid++; offGridTotal++; }
        }
        p.documents.add(a.zoteroKey);
        docPeople.set(who, (docPeople.get(who) ?? 0) + 1);
        if (ann.date) {
          const day = String(ann.date).slice(0, 10);
          p.days.add(day);
          if (!p.firstDate || ann.date < p.firstDate) p.firstDate = ann.date;
          if (!p.lastDate || ann.date > p.lastDate) p.lastDate = ann.date;
          const w = weekOf(ann.date);
          if (w) {
            if (!weeks.has(w)) weeks.set(w, new Map());
            weeks.get(w)!.set(who, (weeks.get(w)!.get(who) ?? 0) + 1);
          }
        }
      }
      documents.push({
        zoteroKey: a.zoteroKey, title: a.title, omekaItemId: a.omekaItemId ?? null,
        // autres exemplaires fusionnés dans ce document (doublons de la collection)
        duplicates: a.duplicates ?? [],
        annotations: docAnnotations, notes: docNotes,
        collaborators: [...docPeople].sort((x, y) => y[1] - x[1]).map(([name, n]) => ({ name, count: n })),
      });
    }

    const total = [...people.values()].reduce((n, p) => n + p.annotations + p.notes, 0);
    const collaborators = [...people.values()]
      .map(p => ({
        name: p.name, annotations: p.annotations, notes: p.notes, words: p.words, comments: p.comments,
        documents: p.documents.size, activeDays: p.days.size, firstDate: p.firstDate, lastDate: p.lastDate,
        positions: p.positions, offGrid: p.offGrid,
        share: total ? (p.annotations + p.notes) / total : 0,
      }))
      .sort((x, y) => y.annotations + y.notes - (x.annotations + x.notes));

    const weekList = [...weeks.keys()].sort();
    const timeline = {
      weeks: weekList,
      series: Object.fromEntries(collaborators.map(c => [c.name, weekList.map(w => weeks.get(w)?.get(c.name) ?? 0)])),
    };

    const result = {
      totals: {
        collaborators: collaborators.filter(c => c.name !== unassigned).length,
        annotations: collaborators.reduce((n, c) => n + c.annotations, 0),
        notes: collaborators.reduce((n, c) => n + c.notes, 0),
        documents: articles.length,
        annotatedDocuments: documents.filter(d => d.annotations + d.notes > 0).length,
        offGrid: offGridTotal,
        // exemplaires en double fusionnés (non comptés comme documents)
        mergedDuplicates: articles.reduce((n: number, a: any) => n + (a.duplicates?.length ?? 0), 0),
      },
      grid: grid.positions,
      positions: grid.positions.map(p => ({ position: p.position, color: p.color, count: positionTotals[p.position] ?? 0 })),
      collaborators,
      documents: documents.sort((x, y) => y.annotations + y.notes - (x.annotations + x.notes)),
      timeline,
    };
    console.log(`👥 Participation : ${result.totals.collaborators} collaborateur(s), ${result.totals.annotations} surlignage(s), ${result.totals.notes} note(s) sur ${result.totals.annotatedDocuments}/${result.totals.documents} document(s)`);
    return result;
  },
});
