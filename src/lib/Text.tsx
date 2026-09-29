import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN, mix, prog } from "./ease";
import { fontFamily, theme } from "./theme";

type TextStyle = {
  size: number;
  color?: string;
  weight?: number;
  /** Interlettrage en em (négatif = serré). */
  tracking?: number;
};

/** Mots qui montent depuis un masque, l'un après l'autre. Sortie optionnelle à `out`. */
export const MaskReveal: React.FC<
  TextStyle & {
    text: string;
    at: number;
    top: number;
    out?: number;
    stagger?: number;
    highlight?: string[];
    highlightColor?: string;
    lineHeight?: number;
  }
> = ({
  text,
  at,
  top,
  out,
  size,
  color = theme.text,
  weight = 900,
  tracking = -0.035,
  stagger = 3,
  highlight = [],
  highlightColor = theme.accent,
  lineHeight = 1,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        padding: "0 70px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: size * 0.26,
        fontFamily,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        letterSpacing: `${tracking}em`,
        color,
      }}
    >
      {text.split(" ").map((w, i) => {
        const p = prog(frame, at + i * stagger, 18);
        const o = out === undefined ? 0 : prog(frame, out + i * 2, 10, EASE_IN);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              padding: "0.14em 0.04em 0.06em",
              margin: "-0.14em -0.04em -0.06em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 115 - o * 115}%) rotate(${(1 - p) * 6}deg)`,
                color: highlight.includes(w) ? highlightColor : undefined,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Texte qui "claque" : arrive de très grand avec flou, se pose net. */
export const Slam: React.FC<TextStyle & { text: string; at: number; top: number }> = ({
  text,
  at,
  top,
  size,
  color = theme.text,
  weight = 900,
  tracking = -0.045,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = prog(frame, at, 9);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: `${tracking}em`,
        color,
        transform: `scale(${mix(p, 1.9, 1)})`,
        filter: `blur(${(1 - p) * 16}px)`,
        opacity: Math.min(1, p * 2.5),
      }}
    >
      {text}
    </div>
  );
};

/** Compteur à rouleaux : chaque chiffre défile jusqu'à sa valeur. */
export const Odometer: React.FC<
  TextStyle & { text: string; at: number; dur?: number; prefix?: string; suffix?: string; accent?: string }
> = ({
  text,
  at,
  dur = 24,
  size,
  color = theme.text,
  weight = 900,
  tracking = -0.05,
  prefix,
  suffix,
  accent = theme.accent,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const appear = prog(frame, at, 9);
  let col = 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        fontFamily,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: `${tracking}em`,
        fontVariantNumeric: "tabular-nums",
        color,
        transform: `scale(${mix(appear, 1.35, 1)})`,
        filter: `blur(${(1 - appear) * 12}px)`,
        opacity: Math.min(1, appear * 2),
      }}
    >
      {prefix && <span style={{ color: accent }}>{prefix}</span>}
      {[...text].map((c, i) => {
        if (!/\d/.test(c)) {
          return (
            <span key={i} style={{ whiteSpace: "pre", fontSize: "0.4em" }}>
              {c}
            </span>
          );
        }
        const k = col++;
        const target = Number(c) + 10 * (2 + k);
        const p = prog(frame, at + k * 3, dur);
        return (
          <span key={i} style={{ display: "inline-block", height: "1em", overflow: "hidden" }}>
            <span style={{ display: "block", transform: `translateY(${-target * p}em)` }}>
              {Array.from({ length: target + 1 }, (_, n) => (
                <span key={n} style={{ display: "block", height: "1em" }}>
                  {n % 10}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      {suffix && <span style={{ color: accent, fontSize: "0.45em", marginLeft: "0.15em", marginBottom: "0.08em" }}>{suffix}</span>}
    </div>
  );
};

/** Étiquette "sticker" qui rebondit. */
export const Sticker: React.FC<{
  text: string;
  at: number;
  top: number;
  left: number;
  rotate?: number;
  bg?: string;
  color?: string;
  size?: number;
}> = ({ text, at, top, left, rotate = -7, bg = theme.text, color = theme.ink, size = 52 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        padding: "12px 28px",
        background: bg,
        color,
        fontFamily,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "-0.02em",
        borderRadius: 16,
        transform: `rotate(${rotate + (1 - s) * -20}deg) scale(${s})`,
        boxShadow: "0 24px 50px rgba(0,0,0,.5)",
      }}
    >
      {text}
    </div>
  );
};

/** Portion de `text` tapée à la frame courante (`cps` = caractères par frame). */
export const typed = (text: string, frame: number, at: number, cps = 1) =>
  text.slice(0, Math.max(0, Math.floor((frame - at) * cps)));

/** Curseur clignotant pour les textes tapés. */
export const Caret: React.FC<{ color?: string }> = ({ color = theme.accent }) => {
  const frame = useCurrentFrame();
  return (
    <span
      style={{
        display: "inline-block",
        width: "0.08em",
        height: "1em",
        marginLeft: "0.06em",
        verticalAlign: "-0.12em",
        background: color,
        opacity: frame % 16 < 9 ? 1 : 0,
      }}
    />
  );
};

/** Pastille « ÉTAPE n/total » avec segments de progression. */
export const StepChip: React.FC<{ step: number; total: number; top?: number }> = ({
  step,
  total,
  top = 130,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, 0, 14);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * -40}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "12px 26px",
          borderRadius: 999,
          background: "rgba(255,255,255,.06)",
          border: "2px solid rgba(255,255,255,.1)",
          fontFamily,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: "0.12em",
          color: theme.text,
        }}
      >
        ÉTAPE {step}/{total}
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width: 34,
                height: 8,
                borderRadius: 4,
                background: i < step - 1 ? theme.accent : "#3a3a40",
                overflow: "hidden",
              }}
            >
              {i === step - 1 && (
                <div style={{ height: "100%", width: `${prog(frame, 6, 16) * 100}%`, background: theme.accent }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
