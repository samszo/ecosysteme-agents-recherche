// Expressions cron à 5 champs (minute heure jour-du-mois mois jour-de-la-semaine) : *, listes, intervalles, pas
// Utilisées par la planification de mailbot (heure locale du serveur)

const FIELDS = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // heure
  { min: 1, max: 31 }, // jour du mois
  { min: 1, max: 12 }, // mois
  { min: 0, max: 7 }, // jour de la semaine (0 et 7 = dimanche)
];

function parseField(expr: string, { min, max }: { min: number; max: number }): Set<number> {
  const out = new Set<number>();
  for (const part of expr.split(",")) {
    const m = /^(\*|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/.exec(part.trim());
    if (!m) throw new Error(`champ cron invalide : « ${part} »`);
    const step = m[4] ? Number(m[4]) : 1;
    const from = m[1] === "*" ? min : Number(m[2]);
    const to = m[1] === "*" ? max : m[3] ? Number(m[3]) : m[4] ? max : from;
    if (from < min || to > max || from > to || step < 1) throw new Error(`champ cron hors limites : « ${part} » (${min}-${max})`);
    for (let v = from; v <= to; v += step) out.add(v);
  }
  return out;
}

export function parseCron(expr: string) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`expression cron à 5 champs attendue : « ${expr} »`);
  const [minute, hour, dom, month, dow] = parts.map((p, i) => parseField(p, FIELDS[i]!));
  if (dow!.has(7)) dow!.add(0);
  // usage cron : si jour du mois et jour de la semaine sont tous deux restreints, l'un ou l'autre suffit
  const domAny = parts[2] === "*", dowAny = parts[4] === "*";
  return (d: Date) => {
    const dayOk = domAny || dowAny ? dom!.has(d.getDate()) && dow!.has(d.getDay()) : dom!.has(d.getDate()) || dow!.has(d.getDay());
    return minute!.has(d.getMinutes()) && hour!.has(d.getHours()) && month!.has(d.getMonth() + 1) && dayOk;
  };
}

// prochaine minute qui correspond à l'expression (recherche minute par minute, sur un an au plus)
export function nextRun(expr: string, from = new Date()): Date | null {
  const match = parseCron(expr);
  const d = new Date(from);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  for (let i = 0; i < 366 * 24 * 60; i++) {
    if (match(d)) return d;
    d.setMinutes(d.getMinutes() + 1);
  }
  return null;
}

export const cronError = (expr: string) => { try { parseCron(expr); return null; } catch (e) { return (e as Error).message; } };
