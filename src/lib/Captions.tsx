import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { prog } from "./ease";
import { fontFamily, theme } from "./theme";
import type { Word } from "./timing";

/** Découpe les mots en "pages" de sous-titres (max N mots, coupure sur ponctuation). */
const paginate = (words: Word[], max: number) => {
  const pages: Word[][] = [];
  let page: Word[] = [];
  for (const w of words) {
    page.push(w);
    if (page.length >= max || /[.,!?;:…]$/.test(w.text)) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length) pages.push(page);
  return pages;
};

/** Sous-titres : mot prononcé surligné d'un bloc d'accent. `hide` = plages de frames masquées. */
export const Captions: React.FC<{
  words: Word[];
  maxWords?: number;
  top?: number;
  hide?: [number, number][];
}> = ({ words, maxWords = 4, top = 1440, hide = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (hide.some(([a, b]) => frame >= a && frame < b)) return null;
  const t = frame / fps;
  const pages = paginate(words, maxWords);
  const page = pages.find((p, i) => {
    const next = pages[i + 1];
    return t >= p[0].start && (!next || t < next[0].start);
  });
  if (!page) return null;
  const inP = prog(frame, page[0].start * fps, 8);

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        padding: "0 90px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "4px 2px",
        opacity: inP,
        transform: `translateY(${(1 - inP) * 24}px)`,
      }}
    >
      {page.map((w, i) => {
        const active = t >= w.start && t < (page[i + 1]?.start ?? Infinity);
        const pop = spring({ frame: frame - w.start * fps, fps, config: { damping: 12, mass: 0.4 } });
        return (
          <span
            key={i}
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 54,
              letterSpacing: "-0.02em",
              padding: "2px 14px 6px",
              borderRadius: 14,
              color: active ? theme.ink : theme.text,
              background: active ? theme.accent : "transparent",
              transform: `scale(${active ? 1 + 0.07 * pop : 1})`,
              opacity: t >= w.start ? 1 : 0.4,
              textShadow: active ? "none" : "0 4px 18px rgba(0,0,0,.8)",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
