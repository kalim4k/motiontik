import { staticFile } from "remotion";

export type Word = { text: string; start: number; end: number };
export type Timing = { duration: number; words: Word[] };
export type VideoProps = { slug: string; timing: Timing | null };

export const loadTiming = async (slug: string): Promise<Timing> => {
  const res = await fetch(staticFile(`${slug}/timing.json`));
  return res.json();
};

const clean = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9']/g, "");

/** Seconde où est prononcé le mot `needle` (n-ième occurrence, à partir de 0). */
export const timeOf = (timing: Timing, needle: string, occurrence = 0): number => {
  const target = clean(needle);
  let n = 0;
  for (const w of timing.words) {
    if (clean(w.text) === target && n++ === occurrence) return w.start;
  }
  throw new Error(`Mot introuvable dans la voix : "${needle}"`);
};

/** Décale de `gap` secondes tous les mots prononcés après `at` (pour insérer une pause). */
export const insertGap = (timing: Timing, at: number, gap: number): Timing => ({
  duration: timing.duration + gap,
  words: timing.words.map((w) => (w.start >= at ? { ...w, start: w.start + gap, end: w.end + gap } : w)),
});
