import { getInfo as comicNeue } from "@remotion/google-fonts/ComicNeue";
import { getInfo as comicRelief } from "@remotion/google-fonts/ComicRelief";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "./ease";
import { loadLocalFont } from "./fonts";
import type { Word } from "./timing";

export const { fontFamily: comicFont } = loadLocalFont(comicNeue, { weights: ["700"], subsets: ["latin"] });
/** Police des sous-titres, la plus proche de la réf (lettrage BD type Comic Sans gras). */
export const { fontFamily: captionFont } = loadLocalFont(comicRelief, { weights: ["700"], subsets: ["latin"] });

/** Palette du style « bonhomme bâton » (réf. vidéo L'ennemi public). */
export const stick = {
  paper: "#fbfbf9",
  ink: "#1b1b1b",
  skin: "#fde3cf",
  ground: "#d9cf9f",
  dirt: "#8a5a35",
};

// ─── Personnage ─────────────────────────────────────────────────────────────
// Dessiné d'après le perso de référence (capture utilisateur) : unités pour 320 de haut,
// pieds en y = 0. « full » = narrateur (tête peau, gros corps blanc), « stick » = petit perso de scène.

/** Angles en degrés : 0 = vers le bas, 90 = à l'horizontale vers l'extérieur, 180 = vers le haut. `reach` allonge le bras. */
type Limb = [upper: number, lower: number, reach?: number];
type PoseDef = { armR: Limb; armL: Limb; legR: Limb; legL: Limb };

export type PoseName =
  | "idle"
  | "point"
  | "present"
  | "raise"
  | "think"
  | "shrug"
  | "cheer"
  | "hips"
  | "wave"
  | "walk"
  | "sit"
  | "phone"
  | "chill";
export type Expression = "neutral" | "happy" | "angry" | "sad" | "surprised" | "smug";
type Variant = "stick" | "full";

const FULL = {
  headR: 55,
  headY: -265,
  shoulder: [31, -211] as const,
  hip: [20, -86] as const,
  arm: 56,
  leg: 43,
  sw: 5.2,
  idleArm: [18, -15] as Limb,
  legSplay: 0,
  // Bras levés : écartés pour ne pas passer derrière la tête
  raise: [140, 38] as Limb,
  cheer: [145, 15] as Limb,
  // Main sur le côté de la tête (le menton est trop près de l'épaule sur ce perso)
  think: [83, 123] as Limb,
};
const STICK = {
  headR: 58,
  headY: -262,
  shoulder: [0, -180] as const,
  hip: [0, -104] as const,
  arm: 46,
  leg: 54.5,
  sw: 6,
  idleArm: [24, -8] as Limb,
  legSplay: 17,
  raise: [110, 55, 1.1] as Limb,
  cheer: [125, 25, 1.1] as Limb,
  think: [94, 146] as Limb,
};

const legs = (splay: number, r: Limb = [0, 0], l: Limb = [0, 0]) => ({
  legR: [splay + r[0], r[1]] as Limb,
  legL: [splay + l[0], l[1]] as Limb,
});

const poseAt = (name: PoseName, frame: number, v: Variant): PoseDef => {
  const g = v === "full" ? FULL : STICK;
  const idle = g.idleArm;
  const sway = Math.sin(frame / 20) * 1.5;
  const rest: Limb = [idle[0] + sway, idle[1]];
  const base = { armR: rest, armL: rest, ...legs(g.legSplay) };
  switch (name) {
    case "idle":
      return base;
    case "point":
      return { ...base, armR: [86, -4, 1.3] };
    case "present":
      return { ...base, armR: [58, 22] };
    case "raise":
      return { ...base, armR: g.raise };
    case "think":
      return { ...base, armR: g.think };
    case "shrug":
      return { ...base, armR: [62, 98], armL: [62, 98] };
    case "cheer":
      return { ...base, armR: g.cheer, armL: g.cheer, ...legs(g.legSplay + 5) };
    case "hips":
      return { ...base, armR: [50, -100], armL: [50, -100], ...legs(g.legSplay + 6) };
    case "wave":
      return { ...base, armR: [g.raise[0], g.raise[1] - 12 + Math.sin(frame / 3) * 24, g.raise[2]] };
    case "walk": {
      const s = Math.sin(frame / 4.5);
      // Narrateur : jambes raides qui balancent (comme la réf) ; petit perso : genoux qui plient
      const knee = v === "full" ? 0 : 26;
      return {
        armR: [idle[0] + s * 22, -8],
        armL: [idle[0] - s * 22, -8],
        ...legs(v === "full" ? 0 : 4, [s * (v === "full" ? 14 : 24), -Math.max(0, s) * knee], [-s * (v === "full" ? 14 : 24), -Math.max(0, -s) * knee]),
      };
    }
    case "sit":
      return { armR: [40, 55], armL: [40, 55], ...legs(0, [85, -85], [80, -80]) };
    case "phone":
      // Main droite levée à hauteur du visage (tient un téléphone, cf. handPos)
      return { ...base, armR: v === "full" ? [30, 150] : [40, 120] };
    case "chill":
      // Assis, boisson portée à la bouche, l'autre bras posé
      return { armR: v === "full" ? [30, 150] : [40, 120], armL: [40, 55], ...legs(0, [85, -85], [80, -80]) };
  }
};

const mixPose = (a: PoseDef, b: PoseDef, t: number): PoseDef => {
  const m = (x: Limb, y: Limb): Limb => [
    x[0] + (y[0] - x[0]) * t,
    x[1] + (y[1] - x[1]) * t,
    (x[2] ?? 1) + ((y[2] ?? 1) - (x[2] ?? 1)) * t,
  ];
  return { armR: m(a.armR, b.armR), armL: m(a.armL, b.armL), legR: m(a.legR, b.legR), legL: m(a.legL, b.legL) };
};

/** Point final d'un segment partant de (x, y), angle `a` (0 = bas), côté `side` (+1 droite / -1 gauche). */
const seg = (x: number, y: number, a: number, len: number, side: number): [number, number] => {
  const r = (a * Math.PI) / 180;
  return [x + Math.sin(r) * len * side, y + Math.cos(r) * len];
};

/** Membre souple : courbe qui passe par l'épaule, le coude et la main (pas d'angle vif, comme la réf). */
const limbPath = (x: number, y: number, [u, l, reach = 1]: Limb, len: number, side: number) => {
  const [ex, ey] = seg(x, y, u, len * reach, side);
  const [hx, hy] = seg(ex, ey, u + l, len * reach, side);
  const cx = 2 * ex - (x + hx) / 2;
  const cy = 2 * ey - (y + hy) / 2;
  return { d: `M${x} ${y} Q${cx} ${cy} ${hx} ${hy}`, end: [hx, hy] as [number, number], angle: u + l };
};

/** Petit pied tourné vers l'extérieur, au bout de la jambe. */
const footPath = ([fx, fy]: [number, number], angle: number, side: number) => {
  const r = (angle * Math.PI) / 180;
  return `M${fx} ${fy} L${fx + Math.cos(r) * 8 * side + Math.sin(r) * 1.5 * side} ${fy - Math.sin(r) * 8 + Math.cos(r) * 1.5}`;
};

/** Corps du narrateur : sac blanc, épaules arrondies sous la tête, bas large aux coins ronds. */
const BODY =
  "M0 -218 C17 -218 29 -213 31 -200 C35 -170 39 -138 39 -112 C39 -95 32 -86 17 -86 L-17 -86 C-32 -86 -39 -95 -39 -112 C-39 -138 -35 -170 -31 -200 C-29 -213 -17 -218 0 -218 Z";

/** Visage du narrateur : yeux ovales verticaux rapprochés, sourcils en petits arcs, pas de bouche au repos. */
const FaceFull: React.FC<{ r: number; expression: Expression; blink: boolean; mouth: number; look: number }> = ({
  r,
  expression,
  blink,
  mouth,
  look,
}) => {
  const ex = r * 0.27;
  const ey = -r * 0.08;
  const lx = look * r * 0.1;
  const rx = r * 0.078;
  const ry = r * 0.145 * (expression === "surprised" ? 1.2 : expression === "smug" ? 0.78 : 1);
  const bw = r * 0.3;
  const lift = { neutral: 0, happy: 0.05, angry: 0.02, sad: 0.02, surprised: 0.12, smug: -0.07 }[expression] * r;
  const tilt = { neutral: 0, happy: 0, angry: 0.1, sad: -0.09, surprised: 0, smug: 0 }[expression] * r;
  const arch = { neutral: 0.05, happy: 0.07, angry: 0.015, sad: 0.03, surprised: 0.08, smug: 0.01 }[expression] * r;
  const by = -r * 0.36 - lift;
  const ink = { stroke: stick.ink, strokeLinecap: "round" as const, fill: "none" };
  return (
    <g>
      {[-1, 1].map((s) => {
        const cx = s * ex + lx;
        // Sourcil : extrémité intérieure (vers le nez) abaissée de `tilt` (colère) ou relevée (tristesse)
        const inner = s * (ex - bw / 2);
        const outer = s * (ex + bw / 2);
        return (
          <g key={s}>
            {expression === "happy" ? (
              <path d={`M${cx - rx * 1.7} ${ey + rx} Q${cx} ${ey - rx * 2.6} ${cx + rx * 1.7} ${ey + rx}`} {...ink} strokeWidth={r * 0.055} />
            ) : blink ? (
              <line x1={cx - rx * 1.5} y1={ey} x2={cx + rx * 1.5} y2={ey} {...ink} strokeWidth={r * 0.05} />
            ) : (
              <ellipse cx={cx} cy={ey} rx={rx} ry={ry} fill={stick.ink} />
            )}
            <path
              d={`M${inner} ${by + tilt + arch * 0.3} Q${s * ex} ${by - arch * 1.6} ${outer} ${by - tilt + arch * 0.5}`}
              {...ink}
              strokeWidth={r * 0.052}
            />
          </g>
        );
      })}
      {mouth > 0.08 && <ellipse cx={0} cy={r * 0.34} rx={r * 0.085} ry={r * 0.02 + mouth * r * 0.085} fill={stick.ink} />}
    </g>
  );
};

/** Visage du petit perso : deux traits verticaux rapprochés. */
const FaceStick: React.FC<{ r: number; expression: Expression; blink: boolean; mouth: number; look: number }> = ({
  r,
  expression,
  blink,
  mouth,
  look,
}) => {
  const ex = r * 0.17;
  const ey = -r * 0.04;
  const lx = look * r * 0.12;
  const h = r * 0.13;
  const ink = { stroke: stick.ink, strokeLinecap: "round" as const, fill: "none", strokeWidth: r * 0.075 };
  const brow = expression === "angry" ? 0.12 : expression === "sad" ? -0.1 : null;
  return (
    <g>
      {[-1, 1].map((s) => {
        const cx = s * ex + lx;
        return (
          <g key={s}>
            {expression === "happy" ? (
              <path d={`M${cx - h * 0.8} ${ey + h * 0.3} Q${cx} ${ey - h * 1.1} ${cx + h * 0.8} ${ey + h * 0.3}`} {...ink} />
            ) : blink ? (
              <line x1={cx - h * 0.6} y1={ey} x2={cx + h * 0.6} y2={ey} {...ink} />
            ) : expression === "surprised" ? (
              <circle cx={cx} cy={ey} r={h * 0.7} {...ink} />
            ) : (
              <line x1={cx} y1={ey - h} x2={cx} y2={ey + h} {...ink} />
            )}
            {brow !== null && (
              <line x1={s * r * 0.05} y1={-r * 0.3 + brow * r} x2={s * r * 0.35} y2={-r * 0.3 - brow * r} {...ink} strokeWidth={r * 0.06} />
            )}
          </g>
        );
      })}
      {mouth > 0.08 && <ellipse cx={0} cy={r * 0.34} rx={r * 0.1} ry={r * 0.02 + mouth * r * 0.1} fill={stick.ink} />}
    </g>
  );
};

export type PoseKey = [frame: number, pose: PoseName];

/** Position de la main droite (px, relative aux pieds) pour tenir un objet dans une pose. */
export const handPos = (variant: Variant, pose: PoseName, height: number, flip = false): [number, number] => {
  const g = variant === "full" ? FULL : STICK;
  const { end } = limbPath(g.shoulder[0], g.shoulder[1], poseAt(pose, 0, variant).armR, g.arm, 1);
  const k = height / 320;
  return [end[0] * k * (flip ? -1 : 1), end[1] * k];
};

/**
 * Perso de la réf, pieds en (x, y). `poses` = chronologie [frame, pose] (transition douce de 6 frames).
 * variant « full » = narrateur (tête couleur peau, gros corps blanc) ; « stick » = petit bonhomme bâton de scène.
 * `mouth` (0→1, ex. useVoiceLevel) : petite bouche qui n'apparaît que quand il parle.
 */
export const StickMan: React.FC<{
  x: number;
  y: number;
  height?: number;
  variant?: Variant;
  poses?: PoseKey[];
  expression?: Expression;
  mouth?: number;
  flip?: boolean;
  look?: number;
  seed?: number;
}> = ({ x, y, height = 320, variant = "stick", poses = [[0, "idle"]], expression = "neutral", mouth = 0, flip = false, look = 0, seed = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = height / 320;
  let idx = 0;
  poses.forEach(([f], i) => {
    if (frame >= f) idx = i;
  });
  const [since, name] = poses[idx];
  const prevName = idx > 0 ? poses[idx - 1][1] : name;
  const t = interpolate(frame, [since, since + 6], [0, 1], { ...clamp, easing: (v) => 1 - (1 - v) ** 3 });
  const pose = mixPose(poseAt(prevName, frame, variant), poseAt(name, frame, variant), t);
  const pop = idx > 0 ? spring({ frame: frame - since, fps, config: { damping: 9, stiffness: 220 } }) : 1;
  const squash = 1 + (1 - pop) * 0.05;
  const blink = (frame + seed * 37) % 97 < 4;
  const breathe = Math.sin((frame + seed * 11) / 18);
  const full = variant === "full";
  const g = full ? FULL : STICK;
  const [sx, sy] = g.shoulder;
  const [hx, hy] = g.hip;

  const R = limbPath(sx, sy, pose.armR, g.arm, 1);
  const L = limbPath(-sx, sy, pose.armL, g.arm, -1);
  const LR = limbPath(hx, hy, pose.legR, g.leg, 1);
  const LL = limbPath(-hx, hy, pose.legL, g.leg, -1);
  const Face = full ? FaceFull : FaceStick;

  return (
    <svg
      style={{ position: "absolute", left: x - 160 * k, top: y - 340 * k, overflow: "visible" }}
      width={320 * k}
      height={350 * k}
      viewBox="-160 -340 320 350"
    >
      <g transform={`${flip ? "scale(-1,1)" : ""} scale(${1 / squash} ${squash})`}>
        <g stroke={stick.ink} strokeWidth={g.sw} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d={LR.d} />
          <path d={LL.d} />
          {full && (
            <>
              <path d={footPath(LR.end, LR.angle, 1)} />
              <path d={footPath(LL.end, LL.angle, -1)} />
            </>
          )}
          <g transform={`translate(0 ${breathe * 0.8})`}>
            {full ? <path d={BODY} fill="#fff" /> : <line x1={0} y1={g.headY + g.headR - 2} x2={0} y2={hy} />}
            <path d={R.d} />
            <path d={L.d} />
          </g>
        </g>
        <g transform={`translate(0 ${g.headY + breathe * 1.4})`}>
          <circle r={g.headR} fill={full ? stick.skin : "#fff"} stroke={stick.ink} strokeWidth={g.sw} />
          <Face r={g.headR} expression={expression} blink={blink} mouth={mouth} look={look} />
        </g>
      </g>
    </svg>
  );
};

// ─── Décor ──────────────────────────────────────────────────────────────────
/** Fond papier + bande de sol (ou terre) à partir de `horizon`. */
export const Ground: React.FC<{ horizon?: number; dirt?: boolean; none?: boolean }> = ({ horizon = 1160, dirt, none }) => (
  <AbsoluteFill style={{ background: stick.paper }}>
    {!none && (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: horizon,
          bottom: 0,
          background: dirt
            ? `radial-gradient(circle at 20% 30%, #9a6a43 0 6%, transparent 7%), radial-gradient(circle at 70% 60%, #7c5030 0 5%, transparent 6%), ${stick.dirt}`
            : stick.ground,
        }}
      />
    )}
  </AbsoluteFill>
);

/** Illustration kie.ai détourée (npm run image), posée par le bas au point (x, y) : y = niveau du sol. */
export const Prop: React.FC<{ src: string; x: number; y: number; width: number; at?: number; flip?: boolean }> = ({
  src,
  x,
  y,
  width,
  at = 0,
  flip,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const s = frame < at ? 0 : spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 180 } });
  return (
    <div style={{ position: "absolute", left: x - width / 2, bottom: height - y, width }}>
      <Img
        src={staticFile(src)}
        style={{
          width,
          display: "block",
          transformOrigin: "50% 100%",
          transform: `scale(${flip ? -s : s}, ${s})`,
        }}
      />
    </div>
  );
};

/** Bulle de pensée au-dessus de (x, y) ; `children` = contenu (icône, image). */
export const ThoughtBubble: React.FC<{ x: number; y: number; size?: number; at: number; children?: React.ReactNode }> = ({
  x,
  y,
  size = 220,
  at,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 180 } });
  const dots = [0, 1, 2].map((i) => Math.min(1, Math.max(0, (frame - at - i * 2) / 4)));
  return (
    <div style={{ position: "absolute", left: x, top: y - size, width: size, height: size }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: -18 - i * 16,
            top: size - 6 + i * 20,
            width: 20 - i * 5,
            height: 20 - i * 5,
            borderRadius: "50%",
            border: `4px solid ${stick.ink}`,
            background: "#fff",
            transform: `scale(${d})`,
          }}
        />
      ))}
      <svg viewBox="0 0 100 80" width={size} height={size * 0.8} style={{ position: "absolute", top: size * 0.1, transform: `scale(${s})`, overflow: "visible" }}>
        <path
          d="M20 62 C6 62 2 48 12 42 C2 32 12 16 26 22 C28 8 48 4 56 16 C64 4 86 8 84 24 C98 26 98 46 86 50 C92 64 72 72 62 64 C54 76 30 76 20 62 Z"
          fill="#fff"
          stroke={stick.ink}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: `${size * 0.22}px ${size * 0.18}px ${size * 0.18}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${s})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ─── Sous-titres BD ─────────────────────────────────────────────────────────
/**
 * Sous-titres façon référence : majuscules BD en haut à gauche, les mots s'ajoutent un à un,
 * nouvelle page à chaque phrase ; les lignes suivantes sont centrées sous la première.
 */
export const ComicCaptions: React.FC<{ words: Word[]; top?: number; left?: number; maxWords?: number; size?: number }> = ({
  words,
  top = 262,
  left = 116,
  maxWords = 8,
  size = 47,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pages: Word[][] = [];
  let page: Word[] = [];
  for (const w of words) {
    page.push(w);
    if (page.length >= maxWords || /[.,!?;:…]$/.test(w.text)) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length) pages.push(page);
  const current = pages.find((p, i) => t >= p[0].start && (!pages[i + 1] || t < pages[i + 1][0].start));
  if (!current) return null;
  const shown = current.filter((w) => t >= w.start);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        display: "inline-block",
        maxWidth: 1080 - left * 2 + 40,
        textAlign: "center",
        fontFamily: captionFont,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.08,
        color: stick.ink,
        textTransform: "uppercase",
        WebkitTextStroke: `${size * 0.025}px ${stick.ink}`,
      }}
    >
      {shown.map((w, i) => {
        const p = interpolate(frame, [w.start * fps, w.start * fps + 4], [0.6, 1], clamp);
        return (
          <span
            key={i}
            style={{ display: "inline-block", marginRight: i < shown.length - 1 ? "0.26em" : 0, transform: `scale(${p})`, transformOrigin: "50% 80%" }}
          >
            {w.text.replace(/[.,;:…]+$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/** Ouverture de bouche 0→1 d'après le volume de la voix. `offset` = frame de début de la scène. */
export const useVoiceLevel = (slug: string, offset = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audio = useAudioData(staticFile(`${slug}/voice.mp3`));
  if (!audio) return 0;
  const f = frame + offset;
  if (f / fps > audio.durationInSeconds) return 0;
  const v = visualizeAudio({ fps, frame: f, audioData: audio, numberOfSamples: 32 });
  const level = v.slice(1, 14).reduce((a, b) => a + b, 0) / 13;
  return Math.min(1, level * 7);
};
