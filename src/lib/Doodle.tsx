import { evolvePath } from "@remotion/paths";
import { Img, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, EASE_IN, EASE_OUT, prog } from "./ease";
import { captionFont, stick } from "./Stick";
import { fontFamily } from "./theme";

// Éléments illustrés « papier + encre » pour le style bonhomme bâton : tout a un contour noir épais,
// des couleurs plates, et entre/sort en ressort pour enchaîner beaucoup de visuels rapidement.

export const ink = stick.ink;
export const col = {
  yellow: "#ffd23f",
  green: "#35c46a",
  red: "#ff4d4d",
  blue: "#3d7bff",
  purple: "#6c63ff",
  orange: "#ff9f1c",
  gold: "#ffcb3d",
  pink: "#fe2c55",
};

type From = "scale" | "up" | "down" | "left" | "right";

/**
 * Pose un élément centré en (x, y) : entrée en ressort à `at` (dépassement + rotation),
 * sortie express à `out`. `float` = flottement vertical (px), `wiggle` = frame d'un petit tremblement.
 */
export const Pop: React.FC<{
  at: number;
  x: number;
  y: number;
  out?: number;
  rotate?: number;
  float?: number;
  from?: From;
  wiggle?: number;
  z?: number;
  children: React.ReactNode;
}> = ({ at, x, y, out, rotate = 0, float = 0, from = "scale", wiggle, z, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 190 } });
  const o = out === undefined ? 0 : prog(frame, out, 7, EASE_IN);
  if (o >= 1) return null;
  const slide = 1 - Math.min(1, s);
  const tx = from === "left" ? -slide * 900 : from === "right" ? slide * 900 : 0;
  const ty = from === "up" ? slide * 1200 : from === "down" ? -slide * 1200 : 0;
  const scale = (from === "scale" ? s : 1) * (1 - o);
  const fl = float ? Math.sin((frame - at) / 14 + x * 0.01) * float : 0;
  const wg = wiggle !== undefined && frame >= wiggle ? Math.sin((frame - wiggle) * 1.6) * 7 * Math.max(0, 1 - (frame - wiggle) / 14) : 0;
  const spin = from === "scale" ? (1 - s) * -22 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: z,
        transform: `translate(-50%, -50%) translate(${tx}px, ${ty + fl}px) rotate(${rotate + spin + wg}deg) scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
};

/** Étiquette BD : boîte à contour épais, texte Comic en majuscules. */
export const Tag: React.FC<{ text: string; bg?: string; color?: string; size?: number }> = ({
  text,
  bg = "#fff",
  color = ink,
  size = 52,
}) => (
  <div
    style={{
      padding: `${size * 0.22}px ${size * 0.45}px`,
      background: bg,
      color,
      border: `${Math.max(4, size * 0.1)}px solid ${ink}`,
      borderRadius: size * 0.3,
      boxShadow: `${size * 0.1}px ${size * 0.12}px 0 ${ink}`,
      fontFamily: captionFont,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1,
      whiteSpace: "nowrap",
      textTransform: "uppercase",
    }}
  >
    {text}
  </div>
);

/** Explosion BD (étoile à pointes) avec du contenu au centre. */
export const Burst: React.FC<{ size: number; fill?: string; spikes?: number; children?: React.ReactNode }> = ({
  size,
  fill = col.yellow,
  spikes = 14,
  children,
}) => {
  const frame = useCurrentFrame();
  const pts = Array.from({ length: spikes * 2 }, (_, i) => {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 ? 36 + random(`b${i}`) * 4 : 50;
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg viewBox="-4 -4 108 108" width={size} height={size} style={{ position: "absolute", transform: `rotate(${Math.sin(frame / 10) * 3}deg)` }}>
        <polygon points={pts} fill={fill} stroke={ink} strokeWidth={2.2} strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
};

/** Rayons BD qui tournent derrière une scène (moments forts). */
export const SpeedLines: React.FC<{ cx?: number; cy?: number; color?: string; count?: number }> = ({
  cx = 540,
  cy = 900,
  color = "#f3ebcf",
  count = 18,
}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${cx} ${cy}) rotate(${frame * 0.6})`}>
        {Array.from({ length: count }, (_, i) => {
          const a = (i / count) * Math.PI * 2;
          const b = a + (Math.PI / count) * 0.9;
          return <polygon key={i} points={`0,0 ${Math.cos(a) * 2200},${Math.sin(a) * 2200} ${Math.cos(b) * 2200},${Math.sin(b) * 2200}`} fill={color} />;
        })}
      </g>
    </svg>
  );
};

/** Téléphone « dessiné » (coque blanche, contour épais) ; `children` = écran. */
export const InkPhone: React.FC<{ width: number; children?: React.ReactNode; screen?: string }> = ({ width, children, screen = "#fff" }) => {
  const b = Math.max(5, width * 0.018);
  return (
    <div
      style={{
        position: "relative",
        width,
        height: width * 2.05,
        background: "#fff",
        border: `${b}px solid ${ink}`,
        borderRadius: width * 0.15,
        padding: width * 0.035,
        boxShadow: `${b * 1.6}px ${b * 2}px 0 ${ink}`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: width * 0.1,
          border: `${b * 0.6}px solid ${ink}`,
          background: screen,
          overflow: "hidden",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: width * 0.03,
            left: "50%",
            width: width * 0.22,
            height: width * 0.055,
            marginLeft: -width * 0.11,
            borderRadius: 999,
            background: ink,
          }}
        />
      </div>
    </div>
  );
};

/** Écran d'accueil de téléphone : grille d'icônes pastel qui apparaissent à `at`. */
export const HomeScreen: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const colors = ["#ffd6a5", "#caffbf", "#9bf6ff", "#bdb2ff", "#ffc6ff", "#fdffb6"];
  return (
    <div style={{ position: "absolute", inset: 0, padding: "70px 26px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22, alignContent: "start" }}>
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: "1",
            borderRadius: 16,
            background: colors[i % colors.length],
            border: `4px solid ${ink}`,
            transform: `scale(${prog(frame, at + 4 + i * 0.6, 8)})`,
          }}
        />
      ))}
    </div>
  );
};

/** Rond « doigt qui tape » (encre) centré en (x, y) à `at`. */
export const InkTap: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + 20) return null;
  const p = prog(frame, at, 16);
  return (
    <>
      <div style={{ position: "absolute", left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: 40, background: "rgba(27,27,27,.25)", transform: `scale(${1 - p * 0.3})`, opacity: 1 - p }} />
      <div style={{ position: "absolute", left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: 40, border: `6px solid ${ink}`, transform: `scale(${1 + p * 1.5})`, opacity: 1 - p }} />
    </>
  );
};

/** Clip gameplay qui remplit l'écran d'un InkPhone. */
export const ScreenVideo: React.FC<{ src: string; trim?: number }> = ({ src, trim = 0 }) => (
  <OffthreadVideo
    src={staticFile(src)}
    muted
    trimBefore={trim}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
  />
);

/**
 * Capture de 824 px de large qui remplit un écran de `width` px ; `scroll` = décalage vertical (px capture).
 * `children` sont positionnés en coordonnées de la capture (overlays).
 */
export const ScreenShot: React.FC<{ src: string; width: number; scroll?: number; children?: React.ReactNode; base?: number }> = ({
  src,
  width,
  scroll = 0,
  children,
  base = 824,
}) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: base, transformOrigin: "0 0", transform: `scale(${width / base}) translateY(${-scroll}px)` }}>
    <Img src={staticFile(src)} style={{ width: base, display: "block" }} />
    {children}
  </div>
);

/** Largeur intérieure de l'écran d'un InkPhone de largeur `w`. */
export const screenW = (w: number) => w - 2 * w * 0.035 - 2 * Math.max(5, w * 0.018) - 2 * Math.max(5, w * 0.018) * 0.6;

/** Pièce d'or « F » (vue de face ; `spin` 0→1 la fait tourner). */
export const Coin: React.FC<{ size: number; spin?: number }> = ({ size, spin = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `scaleX(${Math.cos(spin * Math.PI * 2)})`, overflow: "visible" }}>
    <circle cx={50} cy={50} r={45} fill={col.gold} stroke={ink} strokeWidth={6} />
    <circle cx={50} cy={50} r={32} fill="none" stroke="#e0a800" strokeWidth={5} />
    <text x={50} y={66} textAnchor="middle" fontFamily={captionFont} fontWeight={700} fontSize={46} fill="#b07800">
      F
    </text>
  </svg>
);

/** Pluie de pièces qui tournent, à partir de `at`. */
export const CoinRain: React.FC<{ at: number; count?: number; size?: number; seed?: string }> = ({ at, count = 22, size = 90, seed = "c" }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const t = frame - at - random(`${seed}d${i}`) * 18;
        if (t < 0) return null;
        const x = 40 + random(`${seed}x${i}`) * 1000;
        const y = -120 + t * (22 + random(`${seed}v${i}`) * 10) + t * t * 0.35;
        if (y > 2000) return null;
        const s = size * (0.7 + random(`${seed}s${i}`) * 0.6);
        return (
          <div key={i} style={{ position: "absolute", left: x - s / 2, top: y, transform: `rotate(${(random(`${seed}r${i}`) - 0.5) * 60}deg)` }}>
            <Coin size={s} spin={t / 20 + random(`${seed}p${i}`)} />
          </div>
        );
      })}
    </>
  );
};

/** Gerbe de pièces qui jaillissent de (x, y) puis retombent. */
export const CoinBurst: React.FC<{ at: number; x: number; y: number; count?: number; size?: number; seed?: string }> = ({
  at,
  x,
  y,
  count = 12,
  size = 80,
  seed = "cb",
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 60) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = -Math.PI / 2 + (random(`${seed}a${i}`) - 0.5) * 2.6;
        const v = 26 + random(`${seed}v${i}`) * 18;
        const px = x + Math.cos(a) * v * t;
        const py = y + Math.sin(a) * v * t + 1.6 * t * t;
        return (
          <div key={i} style={{ position: "absolute", left: px - size / 2, top: py - size / 2 }}>
            <Coin size={size} spin={t / 16 + i * 0.13} />
          </div>
        );
      })}
    </>
  );
};

/** Trait dessiné progressivement (flèche facultative au bout). */
export const Ink: React.FC<{ d: string; at: number; dur?: number; width?: number; color?: string; arrow?: boolean }> = ({
  d,
  at,
  dur = 10,
  width = 10,
  color = ink,
  arrow,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, dur, EASE_OUT);
  if (p <= 0) return null;
  const { strokeDasharray, strokeDashoffset } = evolvePath(Math.max(0.0001, p), d);
  // Pointe de flèche : orientée selon les deux derniers points du chemin
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const [x2, y2, x1, y1] = [nums.at(-2)!, nums.at(-1)!, nums.at(-4)!, nums.at(-3)!];
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = width * 3.2;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
      {arrow && p > 0.95 && (
        <path
          d={`M${x2 + Math.cos(a + 2.5) * h} ${y2 + Math.sin(a + 2.5) * h} L${x2} ${y2} L${x2 + Math.cos(a - 2.5) * h} ${y2 + Math.sin(a - 2.5) * h}`}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

/** Nombre qui compte de 0 à `to` (espaces des milliers), police BD. */
export const CountUp: React.FC<{ to: number; at: number; dur?: number; size: number; suffix?: string; color?: string }> = ({
  to,
  at,
  dur = 20,
  size,
  suffix = "",
  color = ink,
}) => {
  const frame = useCurrentFrame();
  const v = Math.round(interpolate(frame, [at, at + dur], [0, to], { ...clamp, easing: EASE_OUT }));
  return (
    <div style={{ fontFamily: captionFont, fontWeight: 700, fontSize: size, color, lineHeight: 1, whiteSpace: "nowrap", WebkitTextStroke: `${size * 0.02}px ${color}` }}>
      {v.toLocaleString("fr-FR").replace(/ | /g, " ")}
      {suffix}
    </div>
  );
};

/** Icône Play Store stylisée (triangle 4 couleurs dans un carré arrondi). */
export const PlayIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect x={4} y={4} width={92} height={92} rx={24} fill="#fff" stroke={ink} strokeWidth={5} />
    <polygon points="30,20 30,80 50,50" fill="#00a0ff" />
    <polygon points="30,20 50,50 62,39" fill="#00d26a" />
    <polygon points="62,39 50,50 62,61 80,50" fill="#ffc400" />
    <polygon points="30,80 62,61 50,50" fill="#ff3a44" />
    <polygon points="30,20 30,80 80,50" fill="none" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

/** Loupe. */
export const Magnifier: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <line x1={62} y1={62} x2={90} y2={90} stroke={ink} strokeWidth={14} strokeLinecap="round" />
    <circle cx={40} cy={40} r={30} fill="rgba(170,220,255,.55)" stroke={ink} strokeWidth={8} />
    <path d="M26 30 Q30 22 40 20" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
  </svg>
);

/** Rond vert avec flèche de téléchargement. */
export const DownloadIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy={50} r={44} fill={col.green} stroke={ink} strokeWidth={6} />
    <path d="M50 24 V62 M34 48 L50 64 L66 48 M30 74 H70" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Rangée d'étoiles qui apparaissent une à une. */
export const Stars: React.FC<{ at: number; size: number; count?: number }> = ({ at, size, count = 5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: size * 0.1 }}>
      {Array.from({ length: count }, (_, i) => {
        const s = frame < at + i * 3 ? 0 : spring({ frame: frame - at - i * 3, fps, config: { damping: 8, stiffness: 220 } });
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 100 100" style={{ transform: `scale(${s}) rotate(${(1 - s) * 90}deg)` }}>
            <path d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36 Z" fill={col.yellow} stroke={ink} strokeWidth={6} strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
};

/** Petites étincelles jaunes autour d'un point. */
export const Sparkles: React.FC<{ at: number; cx: number; cy: number; r?: number; n?: number }> = ({ at, cx, cy, r = 220, n = 6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.4;
        const s = frame < at + i * 2 ? 0 : spring({ frame: frame - at - i * 2, fps, config: { damping: 8 } });
        const rr = r + (i % 2) * r * 0.25;
        return (
          <svg
            key={i}
            width={64}
            height={64}
            viewBox="-10 -10 20 20"
            style={{ position: "absolute", left: cx + Math.cos(a) * rr - 32, top: cy + Math.sin(a) * rr - 32, transform: `scale(${s}) rotate(${frame * 3 + i * 40}deg)` }}
          >
            <path d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z" fill={col.yellow} stroke={ink} strokeWidth={1.2} />
          </svg>
        );
      })}
    </>
  );
};

/** Fenêtre de chat façon ChatGPT (illustration) : message tapé, puis réponse en lignes grises. */
export const ChatWindow: React.FC<{ width: number; height: number; prompt: string; typeAt: number; cps?: number; answerAt?: number }> = ({
  width,
  height,
  prompt,
  typeAt,
  cps = 1.6,
  answerAt,
}) => {
  const frame = useCurrentFrame();
  const shown = prompt.slice(0, Math.max(0, Math.floor((frame - typeAt) * cps)));
  const done = shown.length >= prompt.length;
  const fs = width * 0.042;
  return (
    <div
      style={{
        width,
        height,
        background: "#fff",
        border: `7px solid ${ink}`,
        borderRadius: 34,
        boxShadow: `12px 14px 0 ${ink}`,
        overflow: "hidden",
        fontFamily,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 28px", borderBottom: `5px solid ${ink}`, background: "#f4f4f2" }}>
        <div style={{ width: fs * 1.6, height: fs * 1.6, borderRadius: "50%", background: ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={fs} height={fs} viewBox="0 0 24 24">
            <path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z" fill="#fff" />
          </svg>
        </div>
        <div style={{ fontWeight: 800, fontSize: fs * 1.2, color: ink }}>ChatGPT</div>
      </div>
      <div style={{ flex: 1, padding: 28, display: "flex", flexDirection: "column", gap: 22 }}>
        {shown.length > 0 && (
          <div
            style={{
              alignSelf: "flex-end",
              maxWidth: "82%",
              padding: "18px 24px",
              background: "#ececec",
              border: `4px solid ${ink}`,
              borderRadius: 26,
              fontSize: fs,
              fontWeight: 600,
              color: ink,
              lineHeight: 1.25,
            }}
          >
            {shown}
            {!done && <span style={{ opacity: frame % 14 < 8 ? 1 : 0 }}>|</span>}
          </div>
        )}
        {answerAt !== undefined &&
          frame >= answerAt &&
          [0.92, 0.7, 0.84, 0.5].map((w, i) => (
            <div
              key={i}
              style={{
                height: fs * 0.7,
                width: `${w * 100 * prog(frame, answerAt + i * 3, 10)}%`,
                borderRadius: 999,
                background: i === 0 ? col.green : "#d6d6d2",
              }}
            />
          ))}
      </div>
    </div>
  );
};

/** Barre de commentaire façon TikTok : texte tapé, bouton envoyer. */
export const CommentBar: React.FC<{ width: number; text: string; typeAt: number; cps?: number }> = ({ width, text, typeAt, cps = 0.7 }) => {
  const frame = useCurrentFrame();
  const shown = text.slice(0, Math.max(0, Math.floor((frame - typeAt) * cps)));
  const done = shown.length >= text.length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, width }}>
      <div
        style={{
          flex: 1,
          height: 110,
          display: "flex",
          alignItems: "center",
          padding: "0 34px",
          background: "#fff",
          border: `7px solid ${ink}`,
          borderRadius: 999,
          boxShadow: `8px 10px 0 ${ink}`,
          fontFamily,
          fontSize: 46,
          fontWeight: 700,
          color: shown ? ink : "#9a9a9a",
        }}
      >
        {shown || "Ajouter un commentaire..."}
        {shown && !done && <span style={{ opacity: frame % 14 < 8 ? 1 : 0 }}>|</span>}
      </div>
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: done ? col.pink : "#ddd",
          border: `7px solid ${ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${done ? 1 + 0.12 * Math.max(0, Math.sin(frame / 3)) : 1})`,
        }}
      >
        <svg width={52} height={52} viewBox="0 0 24 24">
          <path d="M3 11 L21 3 L14 21 L11 13 Z" fill="#fff" stroke={ink} strokeWidth={1.6} strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

/** Commentaire publié (avatar + pseudo + texte + cœur). */
export const CommentCard: React.FC<{ text: string; name?: string }> = ({ text, name = "toi" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 22,
      padding: "22px 30px",
      background: "#fff",
      border: `6px solid ${ink}`,
      borderRadius: 30,
      boxShadow: `8px 10px 0 ${ink}`,
      fontFamily,
    }}
  >
    <div style={{ width: 84, height: 84, borderRadius: "50%", background: stick.skin, border: `5px solid ${ink}` }} />
    <div>
      <div style={{ fontSize: 30, color: "#8a8a8a", fontWeight: 700 }}>{name}</div>
      <div style={{ fontSize: 50, color: ink, fontWeight: 800 }}>{text}</div>
    </div>
    <svg width={60} height={60} viewBox="0 0 24 24" style={{ marginLeft: 20 }}>
      <path d="M12 21 C5 15 2 12 2 8 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8 C22 12 19 15 12 21 Z" fill={col.pink} stroke={ink} strokeWidth={1.6} />
    </svg>
  </div>
);

/** Cœurs qui montent (réactions). */
export const Hearts: React.FC<{ at: number; x: number; y: number; n?: number }> = ({ at, x, y, n = 7 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const t = frame - at - i * 4;
        if (t < 0 || t > 40) return null;
        const px = x + Math.sin(t / 6 + i) * 30 + (random(`h${i}`) - 0.5) * 160;
        const py = y - t * 12;
        const s = 50 + random(`hs${i}`) * 30;
        return (
          <svg key={i} width={s} height={s} viewBox="0 0 24 24" style={{ position: "absolute", left: px, top: py, opacity: 1 - t / 40 }}>
            <path d="M12 21 C5 15 2 12 2 8 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8 C22 12 19 15 12 21 Z" fill={col.pink} stroke={ink} strokeWidth={1.6} />
          </svg>
        );
      })}
    </>
  );
};

/** Drapeaux (proportions simplifiées) : Togo, Bénin, Côte d'Ivoire. */
export type FlagName = "togo" | "benin" | "ci" | "vietnam";
// Fonctions (pas de JSX au niveau du module : le bundle Remotion n'a pas encore React à ce moment-là)
const FLAGS: Record<FlagName, () => React.ReactNode> = {
  togo: () => (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={0} y={i * 40} width={300} height={40} fill={i % 2 ? "#ffce00" : "#006a4e"} />
      ))}
      <rect x={0} y={0} width={120} height={120} fill="#d21034" />
      <path d="M60 28 L68 52 L93 52 L73 67 L80 91 L60 76 L40 91 L47 67 L27 52 L52 52 Z" fill="#fff" />
    </>
  ),
  benin: () => (
    <>
      <rect x={0} y={0} width={120} height={200} fill="#008751" />
      <rect x={120} y={0} width={180} height={100} fill="#fcd116" />
      <rect x={120} y={100} width={180} height={100} fill="#e8112d" />
    </>
  ),
  ci: () => (
    <>
      <rect x={0} y={0} width={100} height={200} fill="#f77f00" />
      <rect x={100} y={0} width={100} height={200} fill="#fff" />
      <rect x={200} y={0} width={100} height={200} fill="#009e60" />
    </>
  ),
  vietnam: () => (
    <>
      <rect x={0} y={0} width={300} height={200} fill="#da251d" />
      <path d="M150 45 L163 85 L205 85 L171 110 L184 150 L150 125 L116 150 L129 110 L95 85 L137 85 Z" fill="#ffcd00" />
    </>
  ),
};

/** Drapeau qui flotte (ondulation par bandes verticales), contour encre. */
export const Flag: React.FC<{ name: FlagName; width: number }> = ({ name, width }) => {
  const frame = useCurrentFrame();
  const slices = 12;
  const h = (width * 2) / 3;
  return (
    <div style={{ position: "relative", width, height: h, filter: `drop-shadow(${width * 0.03}px ${width * 0.04}px 0 ${ink})` }}>
      {Array.from({ length: slices }, (_, i) => {
        const dy = Math.sin(frame / 5 - i * 0.7) * width * 0.025 * (i / slices);
        return (
          <svg
            key={i}
            viewBox={`${(i * 300) / slices} 0 ${300 / slices + 0.6} 200`}
            preserveAspectRatio="none"
            width={width / slices + 1}
            height={h}
            style={{ position: "absolute", left: (i * width) / slices, top: dy }}
          >
            {FLAGS[name]()}
            <rect x={0} y={0} width={300} height={200} fill="none" stroke={ink} strokeWidth={12} />
          </svg>
        );
      })}
    </div>
  );
};

/** Épingle de carte rouge. */
export const Pin: React.FC<{ size: number; color?: string }> = ({ size, color = col.red }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 100 130" style={{ overflow: "visible" }}>
    <path d="M50 124 C38 96 10 76 10 48 A40 40 0 0 1 90 48 C90 76 62 96 50 124 Z" fill={color} stroke={ink} strokeWidth={7} strokeLinejoin="round" />
    <circle cx={50} cy={47} r={15} fill="#fff" stroke={ink} strokeWidth={5} />
  </svg>
);

/** Soleil qui tourne. */
export const Sun: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="-60 -60 120 120" style={{ transform: `rotate(${frame * 0.8}deg)` }}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.cos(a) * 34} y1={Math.sin(a) * 34} x2={Math.cos(a) * 52} y2={Math.sin(a) * 52} stroke={ink} strokeWidth={6} strokeLinecap="round" />;
      })}
      <circle r={27} fill={col.yellow} stroke={ink} strokeWidth={6} />
    </svg>
  );
};

/** Appareil photo. */
export const CameraIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 100 80">
    <path d="M10 22 H30 L38 10 H62 L70 22 H90 V72 H10 Z" fill="#fff" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={50} cy={46} r={17} fill="#bfe3ff" stroke={ink} strokeWidth={6} />
    <circle cx={78} cy={32} r={4} fill={col.red} />
  </svg>
);

/** Flash blanc plein écran (capture d'écran). */
export const Flash: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const o = frame < at ? 0 : 1 - prog(frame, at, 9);
  if (o <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: o }} />;
};

/** Éditeur de code sombre dont les lignes s'écrivent (et défilent). */
export const CodeCard: React.FC<{ width: number; height: number; at: number; speed?: number }> = ({ width, height, at, speed = 1.4 }) => {
  const frame = useCurrentFrame();
  const palette = ["#ff7eb6", "#7ee787", "#79c0ff", "#ffa657", "#d2a8ff", "#e6edf3"];
  const n = Math.max(0, (frame - at) * speed * 0.35);
  const lineH = Math.max(18, height * 0.075);
  const visible = Math.max(1, Math.floor((height - lineH * 2) / lineH));
  const first = Math.max(0, Math.floor(n) - visible + 1);
  return (
    <div style={{ width, height, background: "#1e1f29", border: `7px solid ${ink}`, borderRadius: 26, boxShadow: `12px 14px 0 ${ink}`, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: lineH * 0.3, padding: `${lineH * 0.45}px ${lineH * 0.6}px` }}>
        {[col.red, col.yellow, col.green].map((c) => (
          <div key={c} style={{ width: lineH * 0.5, height: lineH * 0.5, borderRadius: "50%", background: c }} />
        ))}
      </div>
      <div style={{ padding: `0 ${lineH * 0.7}px` }}>
        {Array.from({ length: visible }, (_, k) => {
          const i = first + k;
          if (i > n) return null;
          const indent = [0, 1, 2, 2, 1, 2, 3, 3, 2, 1][i % 10];
          const parts = [0.18, 0.3, 0.12, 0.22].slice(0, 2 + (i % 3));
          const grow = Math.min(1, n - i);
          return (
            <div key={i} style={{ display: "flex", gap: lineH * 0.3, height: lineH, alignItems: "center", paddingLeft: indent * lineH * 0.8 }}>
              {parts.map((w, j) => (
                <div key={j} style={{ height: lineH * 0.42, width: `${w * 100 * grow}%`, borderRadius: 7, background: palette[(i + j * 2) % palette.length] }} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Étincelle orange de Claude. */
export const ClaudeSpark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    {Array.from({ length: 10 }, (_, i) => {
      const a = (i * Math.PI) / 5;
      return <path key={i} d={`M${12 + Math.cos(a) * 2} ${12 + Math.sin(a) * 2} L${12 + Math.cos(a) * 11} ${12 + Math.sin(a) * 11}`} stroke="#d97757" strokeWidth={2.6} strokeLinecap="round" />;
    })}
  </svg>
);

/**
 * Discussion façon Claude : capture jointe (`image`) à `attachAt`, message tapé à `typeAt`,
 * puis réponse avec du code (`codeAt`) et un aperçu du jeu (`previewAt`, `preview` = clip).
 */
export const ClaudeWindow: React.FC<{
  width: number;
  height: number;
  image: string;
  attachAt: number;
  prompt: string;
  typeAt: number;
  codeAt: number;
  previewAt: number;
  preview: string;
}> = ({ width, height, image, attachAt, prompt, typeAt, codeAt, previewAt, preview }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shown = prompt.slice(0, Math.max(0, Math.floor((frame - typeAt) * 1.8)));
  const att = frame < attachAt ? 0 : spring({ frame: frame - attachAt, fps, config: { damping: 11, stiffness: 190 } });
  const fs = width * 0.04;
  return (
    <div
      style={{
        width,
        height,
        background: "#faf9f5",
        border: `7px solid ${ink}`,
        borderRadius: 34,
        boxShadow: `12px 14px 0 ${ink}`,
        overflow: "hidden",
        fontFamily,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 28px", borderBottom: `5px solid ${ink}`, background: "#f0eee6" }}>
        <ClaudeSpark size={fs * 1.7} />
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: fs * 1.35, color: ink }}>Claude</div>
      </div>
      <div style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
        {att > 0 && (
          <div
            style={{
              alignSelf: "flex-end",
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 14,
              background: "#ece9df",
              border: `4px solid ${ink}`,
              borderRadius: 24,
              transform: `scale(${att})`,
              transformOrigin: "100% 0",
            }}
          >
            {shown && <div style={{ fontSize: fs, fontWeight: 700, color: ink, maxWidth: width * 0.5, textAlign: "right" }}>{shown}</div>}
            <Img src={staticFile(image)} style={{ width: width * 0.12, borderRadius: 12, border: `4px solid ${ink}`, display: "block" }} />
          </div>
        )}
        {frame >= codeAt && (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <ClaudeSpark size={fs * 1.4} />
            <div style={{ transform: `scale(${prog(frame, codeAt, 8)})`, transformOrigin: "0 0" }}>
              <CodeCard width={width * 0.5} height={height * 0.4} at={codeAt} speed={3} />
            </div>
            {frame >= previewAt && (
              <div
                style={{
                  position: "relative",
                  width: width * 0.22,
                  height: width * 0.4,
                  borderRadius: 18,
                  border: `5px solid ${ink}`,
                  boxShadow: `6px 8px 0 ${ink}`,
                  overflow: "hidden",
                  transform: `scale(${spring({ frame: frame - previewAt, fps, config: { damping: 10, stiffness: 200 } })})`,
                }}
              >
                <ScreenVideo src={preview} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
