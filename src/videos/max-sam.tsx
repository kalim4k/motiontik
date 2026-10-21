import { AbsoluteFill, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { col, ink } from "../lib/Doodle";
import { comic } from "../lib/Promo";

// Vidéo de l'utilisateur (homme sur un âne-moto) + deux étiquettes fléchées qui suivent les persos :
// « MAX » → l'âne-moto, « SAM » → l'homme. Positions relevées à la main toutes les 0,5 s (px de la vidéo 768×1344).

const T = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7];
/** Tête de l'âne */
const MAX: [number, number][] = [
  [400, 636], [412, 620], [400, 600], [452, 630], [508, 690], [490, 770], [542, 800], [584, 860],
  [616, 900], [638, 920], [700, 940], [662, 960], [644, 960], [696, 980], [708, 980],
];
/** Tête de l'homme */
const SAM: [number, number][] = [
  [394, 604], [382, 576], [364, 510], [344, 486], [368, 466], [460, 464], [492, 464], [520, 480],
  [560, 476], [568, 450], [570, 440], [562, 430], [584, 430], [616, 420], [648, 390],
];
/** Taille approximative de la tête (rayon en px) : sert à arrêter la flèche juste avant. */
const R = [16, 18, 22, 28, 34, 42, 50, 58, 64, 70, 76, 78, 80, 82, 84];

const track = (pts: [number, number][], t: number): [number, number] => [
  interpolate(t, T, pts.map((p) => p[0]), { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  interpolate(t, T, pts.map((p) => p[1]), { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
];

/** Étiquette + flèche courbe. `dir` = -1 : étiquette au-dessus (flèche vers le bas), +1 : en dessous. */
const Pointer: React.FC<{ name: string; bg: string; target: [number, number]; radius: number; dir: 1 | -1; at: number; side: number }> = ({
  name,
  bg,
  target,
  radius,
  dir,
  at,
  side,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 170 } });
  if (frame < at) return null;
  const [tx, ty] = target;
  // Étiquette décalée en diagonale, gardée dans le cadre
  const lx = Math.min(width - 120, Math.max(120, tx + side * 150));
  const ly = ty + dir * (radius + 190);
  // Flèche : du bord de l'étiquette jusqu'à juste avant la tête
  const x1 = lx;
  const y1 = ly - dir * 46;
  const ang = Math.atan2(ty - y1, tx - x1);
  const x2 = tx - Math.cos(ang) * (radius + 14);
  const y2 = ty - Math.sin(ang) * (radius + 14);
  const cx = (x1 + x2) / 2 + Math.sin(ang) * 40 * side;
  const cy = (y1 + y2) / 2 - Math.cos(ang) * 40 * side;
  const ha = Math.atan2(y2 - cy, x2 - cx);
  const head = (a: number) => `${x2 - Math.cos(ha + a) * 34} ${y2 - Math.sin(ha + a) * 34}`;
  const d = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2} M${head(0.5)} L${x2} ${y2} L${head(-0.5)}`;
  const draw = Math.min(1, Math.max(0, (frame - at - 3) / 8));
  return (
    <>
      <svg style={{ position: "absolute", inset: 0 }} width="100%" height="100%">
        <path d={d} fill="none" stroke={ink} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        <path d={d} fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: lx,
          top: ly,
          transform: `translate(-50%, -50%) rotate(${side * -4}deg) scale(${s})`,
          padding: "10px 30px",
          background: bg,
          border: `7px solid ${ink}`,
          borderRadius: 18,
          boxShadow: `6px 8px 0 ${ink}`,
          ...comic(62, "#fff"),
          WebkitTextStroke: `2px ${ink}`,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>
    </>
  );
};

export const MaxSam: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const radius = interpolate(t, T, R, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile("max-sam/source.mp4")} style={{ width: "100%", height: "100%" }} />
      <Pointer name="SAM" bg={col.blue} target={track(SAM, t)} radius={radius * 0.9} dir={-1} at={4} side={-1} />
      <Pointer name="MAX" bg={col.red} target={track(MAX, t)} radius={radius} dir={1} at={10} side={-1} />
    </AbsoluteFill>
  );
};
