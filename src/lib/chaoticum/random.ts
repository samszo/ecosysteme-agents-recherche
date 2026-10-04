// Tirage aléatoire reproductible : une même graine redonne la même partition
import crypto from "crypto";

export type Rng = () => number;

// générateur mulberry32 initialisé par l'empreinte de la graine
export function seededRandom(seed: string): Rng {
  let a = crypto.createHash("sha256").update(seed).digest().readUInt32LE(0);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randomInt = (rng: Rng, max: number) => Math.floor(rng() * (max + 1)); // 0..max inclus
export const pick = <T>(rng: Rng, list: T[]): T => list[Math.floor(rng() * list.length)]!;
export const newSeed = () => crypto.randomBytes(6).toString("hex");
// mélange reproductible (Fisher-Yates)
export function shuffle<T>(rng: Rng, list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}
