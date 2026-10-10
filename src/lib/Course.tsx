import { AbsoluteFill, Freeze, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, EASE_IN_OUT, EASE_OUT, prog } from "./ease";
import { fontFamily } from "./theme";
import type { Word } from "./timing";

// Habillage « cours en ligne » 16:9 (formations longues) : sobre, couleurs de la marque présentée.

export const C = {
  red: "#e3262b",
  redDark: "#b3161b",
  redSoft: "#fde8e8",
  ink: "#141416",
  text: "#1d1d20",
  muted: "#6e6e75",
  line: "#e4e4e7",
  bg: "#f6f6f4",
  white: "#ffffff",
  green: "#1fa463",
  dark: "#0f0f11",
};
export const font = fontFamily;
export const W = 1920;
export const H = 1080;

/** Entrée en fondu + glissement à la frame `at` (relative à la séquence), sortie optionnelle à `out`. */
export const Reveal: React.FC<{
  at: number;
  out?: number;
  dy?: number;
  dx?: number;
  scale?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, out, dy = 30, dx = 0, scale, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 16, stiffness: 160 } });
  const o = out === undefined ? 0 : prog(frame, out, 8, EASE_IN_OUT);
  if (o >= 1) return null;
  return (
    <div
      style={{
        ...style,
        opacity: Math.min(1, s * 1.4) * (1 - o),
        transform: `translate(${(1 - s) * dx}px, ${(1 - s) * dy}px) ${scale ? `scale(${0.85 + s * 0.15})` : ""}`,
      }}
    >
      {children}
    </div>
  );
};

/** Carte blanche à bord fin et ombre douce. */
export const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode; accent?: string }> = ({ style, children, accent }) => (
  <div
    style={{
      background: C.white,
      borderRadius: 28,
      border: `2px solid ${C.line}`,
      boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
      padding: "34px 40px",
      fontFamily: font,
      color: C.text,
      borderTop: accent ? `8px solid ${accent}` : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Petite étiquette en capitales. */
export const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.red }) => (
  <div style={{ fontFamily: font, fontWeight: 800, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color }}>{children}</div>
);

/** Titre de scène (haut gauche de la zone de contenu). */
export const SceneTitle: React.FC<{ kicker?: string; title: string; at?: number }> = ({ kicker, title, at = 0 }) => (
  <Reveal at={at} style={{ position: "absolute", left: 120, top: 120 }}>
    {kicker && <Kicker>{kicker}</Kicker>}
    <div style={{ fontFamily: font, fontWeight: 900, fontSize: 64, color: C.ink, marginTop: 8, letterSpacing: -1 }}>{title}</div>
  </Reveal>
);

/** Nombre qui défile de `from` à `to` à partir de `at`. */
export const Count: React.FC<{ to: number; from?: number; at: number; dur?: number; prefix?: string; suffix?: string; style?: React.CSSProperties }> = ({
  to,
  from = 0,
  at,
  dur = 24,
  prefix = "",
  suffix = "",
  style,
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [at, at + dur], [from, to], { ...clamp, easing: EASE_OUT });
  return (
    <span style={style}>
      {prefix}
      {Math.round(v).toLocaleString("fr-FR").replace(/[  ]/g, " ")}
      {suffix}
    </span>
  );
};

/** Fond clair du cours, avec une très légère trame. */
export const Backdrop: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <AbsoluteFill
    style={{
      background: dark ? C.dark : C.bg,
      backgroundImage: dark
        ? "radial-gradient(circle at 80% 10%, rgba(227,38,43,0.25), transparent 45%)"
        : "radial-gradient(rgba(0,0,0,0.045) 1.5px, transparent 1.5px)",
      backgroundSize: dark ? undefined : "34px 34px",
    }}
  />
);

/** Carte de chapitre plein écran (fond rouge), affichée `len` frames. */
export const ChapterCard: React.FC<{ n: number; title: string; len: number }> = ({ n, title, len }) => {
  const frame = useCurrentFrame();
  const inP = prog(frame, 0, 14, EASE_IN_OUT);
  const outP = prog(frame, len - 12, 12, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{ clipPath: `inset(0 ${outP * 100}% 0 ${(1 - inP) * 100}%)`, background: C.red, fontFamily: font, color: C.white, zIndex: 55 }}>
      <div style={{ position: "absolute", right: 60, bottom: -120, fontSize: 760, fontWeight: 900, color: "rgba(255,255,255,0.12)", lineHeight: 1 }}>{n}</div>
      <div style={{ position: "absolute", left: 140, top: 380 }}>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 8, opacity: interpolate(frame, [8, 20], [0, 1], clamp) }}>MODULE {n}</div>
        <div
          style={{
            fontSize: 110,
            fontWeight: 900,
            letterSpacing: -2,
            marginTop: 12,
            transform: `translateX(${interpolate(frame, [10, 28], [-60, 0], { ...clamp, easing: EASE_OUT })}px)`,
            opacity: interpolate(frame, [10, 24], [0, 1], clamp),
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 26, height: 10, width: interpolate(frame, [18, 40], [0, 320], { ...clamp, easing: EASE_OUT }), background: C.white, borderRadius: 5 }} />
      </div>
    </AbsoluteFill>
  );
};

/** Bandeau du haut : nom de la formation + modules (le module en cours est surligné). */
export const TopBar: React.FC<{ title: string; modules: { label: string; from: number; to: number }[] }> = ({ title, modules }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 76,
        display: "flex",
        alignItems: "center",
        padding: "0 48px",
        gap: 18,
        background: "rgba(255,255,255,0.92)",
        borderBottom: `1px solid ${C.line}`,
        fontFamily: font,
        zIndex: 50,
      }}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.red }} />
      <div style={{ fontWeight: 800, fontSize: 26, color: C.ink, marginRight: "auto" }}>{title}</div>
      {modules.map((m, i) => {
        const active = frame >= m.from && frame < m.to;
        const done = frame >= m.to;
        const p = active ? (frame - m.from) / (m.to - m.from) : done ? 1 : 0;
        return (
          <div key={m.label} style={{ width: 210 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: active ? C.red : done ? C.ink : C.muted, letterSpacing: 1 }}>
              {i + 1}. {m.label}
            </div>
            <div style={{ marginTop: 6, height: 5, borderRadius: 3, background: C.line, overflow: "hidden" }}>
              <div style={{ width: `${p * 100}%`, height: "100%", background: C.red }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Sous-titres phrase par phrase (bas d'écran), mots-clés en rouge. */
export const Subtitles: React.FC<{ words: Word[]; keywords: RegExp; bottom?: number; accent?: string }> = ({ words, keywords, bottom = 44, accent = "#ff6b6f" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // Lignes ≤ 62 caractères, coupées en priorité sur la ponctuation
  const lines = useLines(words);
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i][0].start - 0.05 <= t) idx = i;
    else break;
  }
  if (idx < 0) return null;
  const line = lines[idx];
  const last = line[line.length - 1];
  if (t > last.end + 1.2 && (!lines[idx + 1] || t < lines[idx + 1][0].start - 0.05)) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center", zIndex: 60, pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: 1500,
          padding: "14px 30px",
          borderRadius: 18,
          background: "rgba(15,15,17,0.86)",
          color: C.white,
          fontFamily: font,
          fontWeight: 700,
          fontSize: 40,
          lineHeight: 1.25,
          textAlign: "center",
        }}
      >
        {line.map((w, i) => (
          <span key={i} style={{ color: keywords.test(w.text) ? accent : undefined, opacity: t >= w.start - 0.05 ? 1 : 0.45 }}>
            {w.text}
            {i < line.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

const lineCache = new WeakMap<Word[], Word[][]>();
const useLines = (words: Word[]) => {
  const hit = lineCache.get(words);
  if (hit) return hit;
  const out: Word[][] = [];
  let cur: Word[] = [];
  let len = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const gap = cur.length ? w.start - cur[cur.length - 1].end : 0;
    if (cur.length && (len + w.text.length > 62 || gap > 0.9)) {
      out.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(w);
    len += w.text.length + 1;
    if (/[.!?…]$/.test(w.text) && len > 18) {
      out.push(cur);
      cur = [];
      len = 0;
    } else if (/[,;:]$/.test(w.text) && len > 40) {
      out.push(cur);
      cur = [];
      len = 0;
    }
  }
  if (cur.length) out.push(cur);
  lineCache.set(words, out);
  return out;
};

// ─── Enregistrements d'écran calés sur la voix ─────────────────────────────────────────

/** Un plan : à `at` (frame relative), joue la source de `from` à `to` (secondes) jusqu'au plan suivant ;
 *  `focus` = [cx, cy, zoom] en coordonnées 0–1 de la capture. */
export type Shot = { at: number; from: number; to: number; focus?: [number, number, number] };

const Clip: React.FC<{ src: string; from: number; to: number; len: number }> = ({ src, from, to, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const srcFrames = Math.max(1, (to - from) * fps);
  // Vitesse ajustée pour remplir le plan (0,6× à 3×) ; si la source est trop courte, la dernière image est figée
  const rate = Math.min(3, Math.max(0.6, srcFrames / len));
  const played = Math.floor(srcFrames / rate);
  const video = (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      trimBefore={Math.round(from * fps)}
      playbackRate={rate}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
  return frame >= played ? <Freeze frame={played - 1}>{video}</Freeze> : video;
};

/** Fenêtre de navigateur qui affiche une suite de plans d'un enregistrement, avec zooms doux. */
export const ScreenRec: React.FC<{ src: string; shots: Shot[]; len: number; width?: number; top?: number; url?: string }> = ({
  src,
  shots,
  len,
  width = 1560,
  top = 112,
  url,
}) => {
  const frame = useCurrentFrame();
  const h = (width * 9) / 16;
  // Zoom courant : transition de 18 frames entre le cadrage du plan précédent et celui du plan actif
  let idx = 0;
  shots.forEach((s, i) => {
    if (frame >= s.at) idx = i;
  });
  const fz = (s?: Shot): [number, number, number] => s?.focus ?? [0.5, 0.5, 1];
  const prev = fz(shots[idx - 1]);
  const cur = fz(shots[idx]);
  const p = idx > 0 ? prog(frame, shots[idx].at, 18, EASE_IN_OUT) : 1;
  const [cx, cy, z] = [0, 1, 2].map((k) => prev[k] + (cur[k] - prev[k]) * p);
  const tx = Math.min(0, Math.max(width - width * z, width / 2 - cx * width * z));
  const ty = Math.min(0, Math.max(h - h * z, h / 2 - cy * h * z));
  return (
    <div
      style={{
        position: "absolute",
        left: (W - width) / 2,
        top,
        width,
        borderRadius: 22,
        overflow: "hidden",
        background: C.white,
        boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
        border: `2px solid ${C.line}`,
      }}
    >
      <div style={{ height: 44, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "#ececec", borderBottom: `1px solid ${C.line}` }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
        {url && (
          <div style={{ marginLeft: 20, padding: "4px 18px", borderRadius: 8, background: C.white, fontFamily: font, fontSize: 18, color: C.muted }}>{url}</div>
        )}
      </div>
      <div style={{ position: "relative", width, height: h, overflow: "hidden", background: "#000" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width, height: h, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${z})` }}>
          {shots.map((s, i) => {
            const end = shots[i + 1]?.at ?? len;
            return (
              <Sequence key={i} from={s.at} durationInFrames={Math.max(1, end - s.at)} layout="none">
                <div style={{ position: "absolute", inset: 0 }}>
                  <Clip src={src} from={s.from} to={s.to} len={end - s.at} />
                </div>
              </Sequence>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Bulle d'information posée sur un enregistrement (coin, avec une barre rouge). */
export const Callout: React.FC<{ at: number; out?: number; x: number; y: number; title?: string; children: React.ReactNode; width?: number; tone?: "red" | "dark" }> = ({
  at,
  out,
  x,
  y,
  title,
  children,
  width = 520,
  tone = "red",
}) => (
  <Reveal at={at} out={out} dx={40} dy={0} style={{ position: "absolute", left: x, top: y, width, zIndex: 40 }}>
    <div
      style={{
        background: tone === "red" ? C.red : C.ink,
        color: C.white,
        borderRadius: 22,
        padding: "22px 28px",
        fontFamily: font,
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
      }}
    >
      {title && <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", opacity: 0.85 }}>{title}</div>}
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginTop: title ? 6 : 0 }}>{children}</div>
    </div>
  </Reveal>
);

/** Icône simple dessinée (trait), pour les cartes. */
export const Icon: React.FC<{ name: "check" | "cross" | "money" | "users" | "robot" | "click" | "link" | "calendar" | "globe" | "gift" | "lock"; size?: number; color?: string }> = ({
  name,
  size = 60,
  color = C.red,
}) => {
  const p: Record<string, React.ReactNode> = {
    check: <path d="M5 13 L10 18 L20 6" />,
    cross: <path d="M6 6 L18 18 M18 6 L6 18" />,
    money: (
      <>
        <rect x={2} y={6} width={20} height={12} rx={2} />
        <circle cx={12} cy={12} r={3} />
      </>
    ),
    users: (
      <>
        <circle cx={9} cy={8} r={3.5} />
        <path d="M2 20 C2 15 16 15 16 20" />
        <circle cx={17} cy={9} r={2.5} />
        <path d="M17 14 C20 14 22 16 22 19" />
      </>
    ),
    robot: (
      <>
        <rect x={4} y={8} width={16} height={12} rx={3} />
        <path d="M12 4 V8 M9 13 V14 M15 13 V14 M9 17 H15" />
      </>
    ),
    click: <path d="M8 3 L8 17 L11.5 13.5 L14 20 L16.5 19 L14 12.5 L19 12.5 Z" />,
    link: (
      <>
        <path d="M10 14 L14 10" />
        <path d="M9 7 L11 5 A4 4 0 0 1 19 13 L17 15" />
        <path d="M15 17 L13 19 A4 4 0 0 1 5 11 L7 9" />
      </>
    ),
    calendar: (
      <>
        <rect x={3} y={5} width={18} height={16} rx={2} />
        <path d="M3 10 H21 M8 3 V7 M16 3 V7" />
      </>
    ),
    globe: (
      <>
        <circle cx={12} cy={12} r={9} />
        <path d="M3 12 H21 M12 3 C8 8 8 16 12 21 C16 16 16 8 12 3" />
      </>
    ),
    gift: (
      <>
        <rect x={3} y={9} width={18} height={12} rx={1.5} />
        <path d="M3 13 H21 M12 9 V21 M12 9 C9 3 5 6 8 9 M12 9 C15 3 19 6 16 9" />
      </>
    ),
    lock: (
      <>
        <rect x={5} y={11} width={14} height={10} rx={2} />
        <path d="M8 11 V8 A4 4 0 0 1 16 8 V11" />
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
};

/** Capture d'écran (image) ajustée dans une zone, avec zooms doux : `zooms` = [frame, [cx, cy, zoom]] (coordonnées 0–1). */
export const Photo: React.FC<{
  src: string;
  ratio: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  zooms?: [number, [number, number, number]][];
}> = ({ src, ratio, at, out, x, y, w, h, zooms = [] }) => {
  const frame = useCurrentFrame();
  const iw = ratio > w / h ? w : h * ratio;
  const ih = ratio > w / h ? w / ratio : h;
  let idx = -1;
  zooms.forEach(([f], i) => {
    if (frame >= f) idx = i;
  });
  const fz = (i: number): [number, number, number] => (i < 0 ? [0.5, 0.5, 1] : zooms[i][1]);
  const p = idx >= 0 ? prog(frame, zooms[idx][0], 24, EASE_IN_OUT) : 1;
  const [cx, cy, z] = [0, 1, 2].map((k) => fz(idx - 1)[k] + (fz(idx)[k] - fz(idx - 1)[k]) * p);
  const tx = Math.min(0, Math.max(iw - iw * z, iw / 2 - cx * iw * z));
  const ty = Math.min(0, Math.max(ih - ih * z, ih / 2 - cy * ih * z));
  return (
    <Reveal at={at} out={out} scale style={{ position: "absolute", left: x + (w - iw) / 2, top: y + (h - ih) / 2, width: iw, height: ih }}>
      <div style={{ width: iw, height: ih, borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 70px rgba(0,0,0,0.22)", border: `2px solid ${C.line}`, background: C.white }}>
        <Img src={staticFile(src)} style={{ width: iw, height: ih, display: "block", transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${z})` }} />
      </div>
    </Reveal>
  );
};
