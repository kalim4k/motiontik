import { spring, useCurrentFrame } from "remotion";
import { mix, prog } from "./ease";
import { theme } from "./theme";

/** Ressort 0→1 démarrant à `at` (0 avant). */
export const pop = (frame: number, at: number, fps: number, damping = 11) =>
  frame < at ? 0 : spring({ frame: frame - at, fps, config: { damping, stiffness: 170 } });

/** Étoile façon Claude (8 rayons). */
export const Spark: React.FC<{ size: number; color?: string }> = ({ size, color = "#d97757" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return (
        <path
          key={i}
          d={`M${12 + Math.cos(a) * 2.5} ${12 + Math.sin(a) * 2.5} L${12 + Math.cos(a) * 10} ${12 + Math.sin(a) * 10}`}
          stroke={color}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      );
    })}
  </svg>
);

/** Rond "doigt qui tape" centré en (x, y), visible ~24 frames à partir de `at`. */
export const Tap: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + 24) return null;
  const p = prog(frame, at, 18);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 45,
          top: y - 45,
          width: 90,
          height: 90,
          borderRadius: 45,
          background: "rgba(255,255,255,.35)",
          border: "4px solid #fff",
          transform: `scale(${mix(prog(frame, at, 6), 1.4, 0.85)})`,
          opacity: 1 - prog(frame, at + 12, 10),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 45,
          top: y - 45,
          width: 90,
          height: 90,
          borderRadius: 45,
          border: `4px solid ${theme.accent}`,
          transform: `scale(${1 + p * 1.6})`,
          opacity: 1 - p,
        }}
      />
    </>
  );
};

/** Cadre lumineux qui entoure une zone (ex : un bouton dans une capture). */
export const Highlight: React.FC<{ at: number; x: number; y: number; w: number; h: number; radius?: number }> = ({
  at,
  x,
  y,
  w,
  h,
  radius = 20,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, 10);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 8,
        top: y - 8,
        width: w + 16,
        height: h + 16,
        borderRadius: radius,
        border: `5px solid ${theme.accent}`,
        boxShadow: `0 0 ${20 + Math.sin(frame / 4) * 10}px ${theme.accent}`,
        opacity: p,
        transform: `scale(${mix(p, 1.3, 1)})`,
      }}
    />
  );
};

/** Position à l'écran d'un point d'une capture 824 px de large affichée dans un <Phone>. */
export const inPhone = (phone: { left: number; top: number; width: number }, px: number, py: number) => {
  const pad = phone.width * 0.03;
  const k = (phone.width - pad * 2) / 824;
  return { x: phone.left + pad + px * k, y: phone.top + pad + py * k, k };
};
