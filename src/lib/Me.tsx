import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ink } from "./Doodle";
import { type PoseKey, StickMan, useVoiceLevel } from "./Stick";

// Le créateur en personne : ses têtes expressives générées par IA (npm run face) dans public/<slug>/<expression>.png,
// posées sur le corps du bonhomme bâton, façon « grosse tête » de mème.

export type Face = "choque" | "confiant" | "clin" | "reflexion" | "rire" | "argent" | "lunettes" | "malin" | "serieux";

/** Tête détourée qui parle (léger rebond sur la voix) et « pope » à chaque changement d'expression. */
export const Head: React.FC<{ slug: string; faces: [number, Face][]; width: number; tilt?: number; origin?: string }> = ({ slug, faces, width, tilt = 0, origin = "50% 50%" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const level = useVoiceLevel(slug);
  let idx = 0;
  faces.forEach(([f], i) => {
    if (frame >= f) idx = i;
  });
  const [since, face] = faces[idx];
  const pop = idx > 0 ? spring({ frame: frame - since, fps, config: { damping: 8, stiffness: 240 } }) : 1;
  const s = (0.85 + pop * 0.15) * (1 + level * 0.035);
  const r = tilt + Math.sin(frame / 9) * 2.5 + level * 3 * Math.sin(frame / 2);
  return (
    <Img
      src={staticFile(`${slug}/${face}.png`)}
      style={{ width, display: "block", transform: `rotate(${r}deg) scale(${s})`, transformOrigin: origin, filter: `drop-shadow(6px 8px 0 ${ink})` }}
    />
  );
};

/** Le créateur : corps de bonhomme + sa vraie tête (tête 1,9× celle du dessin, posée sur les épaules). */
export const Me: React.FC<{ slug: string; x: number; y: number; height: number; faces: [number, Face][]; poses: PoseKey[]; flip?: boolean }> = ({
  slug,
  x,
  y,
  height,
  faces,
  poses,
  flip,
}) => {
  const k = height / 320;
  const w = 110 * k * 1.9;
  // Le menton (bas de l'image détourée) se pose juste au-dessus des épaules du dessin
  const neck = y - 200 * k;
  return (
    <>
      <StickMan x={x} y={y} height={height} variant="full" poses={poses} flip={flip} />
      <div style={{ position: "absolute", left: x - w / 2, bottom: 1920 - neck, width: w, display: "flex", alignItems: "flex-end" }}>
        <Head slug={slug} faces={faces} width={w} origin="50% 100%" />
      </div>
    </>
  );
};
