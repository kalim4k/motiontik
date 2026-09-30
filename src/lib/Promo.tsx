import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Coin, col, ink, Pop, Tag } from "./Doodle";
import { EASE_IN, EASE_IN_OUT, prog } from "./ease";
import { captionFont, handPos, StickMan } from "./Stick";
import { fontFamily } from "./theme";

// Briques des vidéos « business jeux + AdSense » : texte BD, tampon, joueurs qui paient, sac, carte bio.


export const comic = (size: number, color = ink): React.CSSProperties => ({
  fontFamily: captionFont,
  fontWeight: 700,
  fontSize: size,
  color,
  lineHeight: 1,
  whiteSpace: "nowrap",
  WebkitTextStroke: `${size * 0.02}px ${color}`,
});

/** Tampon encreur qui s'écrase à `at` (grossit puis se plaque, légère rotation). */
export const Stamp: React.FC<{ text: string; at: number; color?: string; size?: number; rotate?: number }> = ({
  text,
  at,
  color = col.red,
  size = 90,
  rotate = -12,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = prog(frame, at, 6, EASE_IN);
  return (
    <div
      style={{
        transform: `rotate(${rotate}deg) scale(${interpolate(p, [0, 1], [2.4, 1])})`,
        opacity: Math.min(1, p * 2),
        padding: `${size * 0.14}px ${size * 0.34}px`,
        border: `${size * 0.1}px solid ${color}`,
        outline: `${size * 0.04}px solid ${color}`,
        outlineOffset: size * 0.06,
        borderRadius: size * 0.16,
        background: "rgba(255,255,255,.85)",
        ...comic(size, color),
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
};

/** Joueur avec téléphone dont une pièce vole vers `bag`. */
export const Player: React.FC<{ x: number; at: number; flip?: boolean; seed: number; bag: [number, number]; ground?: number }> = ({
  x,
  at,
  flip,
  seed,
  bag,
  ground = 1330,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const h = 290;
  const s = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 200 } });
  const [hx, hy] = handPos("stick", "phone", h, flip);
  const px = x + hx;
  const py = ground + hy;
  const t = prog(frame, at + 5, 11, EASE_IN_OUT);
  const cx = (1 - t) ** 2 * px + 2 * (1 - t) * t * ((px + bag[0]) / 2) + t * t * bag[0];
  const cy = (1 - t) ** 2 * py + 2 * (1 - t) * t * (Math.min(py, bag[1]) - 260) + t * t * bag[1];
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: `${x}px ${ground}px` }}>
        <StickMan x={x} y={ground} height={h} poses={[[0, "phone"]]} flip={flip} look={flip ? -0.6 : 0.6} expression="happy" seed={seed} />
        <div
          style={{
            position: "absolute",
            left: px - 20,
            top: py - 40,
            width: 40,
            height: 70,
            borderRadius: 9,
            background: col.blue,
            border: `5px solid ${ink}`,
            transform: `rotate(${flip ? 12 : -12}deg)`,
          }}
        />
      </div>
      {t > 0 && t < 1 && (
        <div style={{ position: "absolute", left: cx - 36, top: cy - 36 }}>
          <Coin size={72} spin={t * 2} />
        </div>
      )}
    </>
  );
};

/** Sac d'argent qui gonfle quand une pièce arrive, avec une étiquette. */
export const MoneyBag: React.FC<{ slug: string; x: number; y: number; hits: number[]; label: string; labelBg: string }> = ({ slug, x, y, hits, label, labelBg }) => {
  const frame = useCurrentFrame();
  const pulse = hits.reduce((m, a) => Math.max(m, 1 - Math.abs(frame - (a + 16)) / 5), 0);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 130,
          top: y - 150,
          width: 260,
          transform: `scale(${prog(frame, 0, 10) + Math.max(0, pulse) * 0.12})`,
          transformOrigin: "50% 100%",
        }}
      >
        <Img src={staticFile(`${slug}/sac.png`)} style={{ width: 260 }} />
      </div>
      <Pop at={3} x={x} y={y - 210} rotate={-4}>
        <Tag text={label} bg={labelBg} color="#fff" size={44} />
      </Pop>
    </>
  );
};

/** Carte « profil TikTok » avec le lien en bio. */
export const BioCard: React.FC<{ tapAt: number }> = ({ tapAt }) => {
  const frame = useCurrentFrame();
  const pressed = frame >= tapAt && frame < tapAt + 6;
  return (
    <div
      style={{
        width: 560,
        padding: 28,
        background: "#fff",
        border: `7px solid ${ink}`,
        borderRadius: 34,
        boxShadow: `12px 14px 0 ${ink}`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ width: 130, height: 130, borderRadius: "50%", background: col.yellow, border: `6px solid ${ink}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: 40, top: 22, width: 50, height: 50, borderRadius: "50%", border: `6px solid ${ink}`, background: "#fff" }} />
        <div style={{ position: "absolute", left: 20, top: 82, width: 90, height: 70, borderRadius: "45px 45px 0 0", border: `6px solid ${ink}`, background: "#fff" }} />
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: ink }}>@toncompte</div>
      <div style={{ fontSize: 26, color: "#555", fontWeight: 600 }}>Lance ton business de jeux</div>
      <div
        style={{
          marginTop: 6,
          padding: "14px 30px",
          borderRadius: 999,
          background: pressed ? "#d9e6ff" : "#eef3ff",
          border: `5px solid ${col.blue}`,
          color: col.blue,
          fontWeight: 800,
          fontSize: 32,
          transform: `scale(${pressed ? 0.94 : 1})`,
        }}
      >
        Lien dans la bio
      </div>
    </div>
  );
};
