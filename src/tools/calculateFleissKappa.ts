import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { CodedAnnotationSchema, type CodedAnnotation } from "./fetchOmekaAnnotations";
import { codeLabel } from "./codebook";
import { workflowConfig } from "../config";

const { targetKappa, csvPath: defaultCsvPath } = workflowConfig.kappa;

const KappaSchema = z.object({
  annotations: z.array(CodedAnnotationSchema),
  csvPath: z.string().optional(),
});

// interprétation de Landis et Koch (1977)
export function interpretKappa(kappa: number): string {
  if (kappa <= 0) return "Aucun accord (pas mieux que le hasard)";
  if (kappa <= 0.2) return "Accord léger";
  if (kappa <= 0.4) return "Accord passable";
  if (kappa <= 0.6) return "Accord modéré";
  if (kappa <= 0.8) return "Accord substantiel";
  return "Accord presque parfait";
}

// kappa de Fleiss généralisé à un nombre de juges variable selon les unités (Fleiss, 1971 ; Fleiss et al., 2003)
export function fleissKappa(units: Map<string, Map<string, number>>, categories: string[]): number {
  let sumPi = 0, totalRatings = 0;
  const catTotals = new Map(categories.map(c => [c, 0]));
  for (const counts of units.values()) {
    const n = [...counts.values()].reduce((a, b) => a + b, 0);
    const sumSq = [...counts.values()].reduce((a, b) => a + b * b, 0);
    sumPi += (sumSq - n) / (n * (n - 1));
    totalRatings += n;
    for (const [c, v] of counts) catTotals.set(c, (catTotals.get(c) ?? 0) + v);
  }
  const pMean = sumPi / units.size;
  const pE = [...catTotals.values()].reduce((a, v) => a + (v / totalRatings) ** 2, 0);
  // toutes les annotations dans la même catégorie : accord parfait, kappa indéfini
  if (pE === 1) return pMean === 1 ? 1 : 0;
  return (pMean - pE) / (1 - pE);
}

// kappa de Cohen entre deux juges, sur les unités codées par les deux
export function cohenKappa(pairs: [string, string][]): number {
  const n = pairs.length;
  const agree = pairs.filter(([a, b]) => a === b).length / n;
  const countA = new Map<string, number>(), countB = new Map<string, number>();
  for (const [a, b] of pairs) {
    countA.set(a, (countA.get(a) ?? 0) + 1);
    countB.set(b, (countB.get(b) ?? 0) + 1);
  }
  let pE = 0;
  for (const [c, v] of countA) pE += (v / n) * ((countB.get(c) ?? 0) / n);
  if (pE === 1) return agree === 1 ? 1 : 0;
  return (agree - pE) / (1 - pE);
}

const csvCell = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""').replace(/\s+/g, " ")}"`;

export const calculateFleissKappa = new Tool({
  name: "calculate-fleiss-kappa",
  description: "Calcule l'accord inter-juges (kappa de Fleiss, et de Cohen s'il y a deux juges) sur les annotations codées et exporte un fichier CSV répertoriant les désaccords d'annotation.",
  schema: KappaSchema,
  execute: async ({ data }) => {
    const { annotations, csvPath = defaultCsvPath } = data as z.infer<typeof KappaSchema>;
    const categories = [...new Set(annotations.map(a => a.code))].sort();
    const annotators = [...new Set(annotations.map(a => a.annotatorId))].sort();

    // unités (phrases) et codes attribués par chaque juge
    const byUnit = new Map<string, CodedAnnotation[]>();
    for (const a of annotations) {
      if (!byUnit.has(a.itemId)) byUnit.set(a.itemId, []);
      byUnit.get(a.itemId)!.push(a);
    }
    // seules les phrases codées par au moins deux juges permettent de mesurer l'accord
    const rated = [...byUnit].filter(([, anns]) => anns.length >= 2);
    const counts = new Map(rated.map(([key, anns]) => {
      const c = new Map<string, number>();
      for (const a of anns) c.set(a.code, (c.get(a.code) ?? 0) + 1);
      return [key, c];
    }));

    const empty = {
      kappa: 0, cohenKappa: null, interpretation: "Données insuffisantes (il faut au moins deux juges sur une même phrase)",
      validated: false, targetKappa, totalUnits: byUnit.size, ratedUnits: 0, totalRaters: annotators.length,
      meanRatersPerUnit: 0, conflicts: 0, categories: [], csvPath: "",
    };
    if (!rated.length || !categories.length) return empty;

    const kappa = fleissKappa(counts, categories);

    // deux juges : kappa de Cohen, recommandé par la grille d'annotation
    let cohen: number | null = null;
    if (annotators.length === 2) {
      const pairs = rated
        .map(([, anns]) => [anns.find(a => a.annotatorId === annotators[0])?.code, anns.find(a => a.annotatorId === annotators[1])?.code])
        .filter((p): p is [string, string] => !!p[0] && !!p[1]);
      if (pairs.length) cohen = cohenKappa(pairs);
    }

    // CSV des phrases, désaccords en tête
    const rows = rated.map(([key, anns]) => {
      const c = counts.get(key)!;
      const conflict = c.size > 1;
      return {
        conflict,
        line: [
          csvCell(key),
          csvCell(anns[0]!.documentTitle),
          csvCell(anns[0]!.phrase),
          conflict ? "OUI" : "NON",
          csvCell([...c].sort((a, b) => b[1] - a[1]).map(([code, n]) => `${code}:${n}`).join(" | ")),
          csvCell(anns.map(a => `${a.annotatorId}->${a.code}`).join(" / ")),
        ].join(";"),
      };
    }).sort((a, b) => Number(b.conflict) - Number(a.conflict));
    const conflicts = rows.filter(r => r.conflict).length;

    const absolutePath = path.resolve(process.cwd(), csvPath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(
      absolutePath,
      ["unite;document;phrase;desaccord;repartition_codes;details_annotations", ...rows.map(r => r.line)].join("\n"),
      "utf-8"
    );

    const reference = cohen ?? kappa;
    const result = {
      kappa: Number(kappa.toFixed(4)),
      cohenKappa: cohen === null ? null : Number(cohen.toFixed(4)),
      interpretation: interpretKappa(reference),
      validated: reference >= targetKappa,
      targetKappa,
      totalUnits: byUnit.size,
      ratedUnits: rated.length,
      totalRaters: annotators.length,
      meanRatersPerUnit: Number((rated.reduce((n, [, a]) => n + a.length, 0) / rated.length).toFixed(2)),
      conflicts,
      categories: categories.map(code => ({
        code,
        label: codeLabel(code),
        count: annotations.filter(a => a.code === code).length,
      })),
      csvPath: path.relative(process.cwd(), absolutePath),
    };
    console.log(`⚖️ Kappa de Fleiss = ${result.kappa}${cohen !== null ? `, Cohen = ${result.cohenKappa}` : ""} (${result.interpretation}), ${conflicts}/${rated.length} phrase(s) en désaccord → ${result.csvPath}`);
    return result;
  },
});
