import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN_OUT, mix, prog } from "./ease";
import { HEIGHT } from "./theme";

export type Transition = "cut" | "whip" | "zoom" | "wipe";

const DUR: Record<Transition, number> = { cut: 0, whip: 10, zoom: 12, wipe: 14 };

export type SceneDef = {
  /** Frame absolue de début (souvent calée sur un mot de la voix). */
  from: number;
  /** Transition d'entrée de cette scène (et de sortie de la précédente). */
  transition?: Transition;
  /** Intensité du lent zoom caméra pendant la scène. */
  push?: number;
  render: React.ReactNode;
};

const Shell: React.FC<{
  inT: Transition;
  outT: Transition;
  outAt: number;
  len: number;
  push: number;
  children: React.ReactNode;
}> = ({ inT, outT, outAt, len, push, children }) => {
  const frame = useCurrentFrame();
  const p = DUR[inT] ? prog(frame, 0, DUR[inT], EASE_IN_OUT) : 1;
  const q = DUR[outT] ? prog(frame, outAt, DUR[outT], EASE_IN_OUT) : 0;

  const inStyle: React.CSSProperties =
    inT === "whip"
      ? { transform: `translateY(${(1 - p) * HEIGHT * 1.05}px)` }
      : inT === "zoom"
        ? { transform: `scale(${mix(p, 0.5, 1)})`, opacity: p }
        : inT === "wipe"
          ? { clipPath: `circle(${p * 90}% at 50% 50%)` }
          : {};
  const outStyle: React.CSSProperties =
    outT === "whip"
      ? { transform: `translateY(${-q * HEIGHT * 1.05}px)` }
      : outT === "zoom"
        ? { transform: `scale(${1 + q * 2.5})`, opacity: 1 - q }
        : {};

  return (
    <AbsoluteFill style={inStyle}>
      <AbsoluteFill style={outStyle}>
        <AbsoluteFill style={{ transform: `scale(${1 + push * Math.min(1, frame / len)})` }}>
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Enchaîne des scènes avec transitions synchronisées (la sortie de A = l'entrée de B). */
export const SceneTrack: React.FC<{ scenes: SceneDef[] }> = ({ scenes }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <>
      {scenes.map((s, i) => {
        const next = scenes[i + 1];
        const nextT = next?.transition ?? "whip";
        const end = next ? next.from + DUR[nextT] : durationInFrames;
        return (
          <Sequence key={i} from={s.from} durationInFrames={end - s.from}>
            <Shell
              inT={i === 0 ? "cut" : (s.transition ?? "whip")}
              outT={next ? nextT : "cut"}
              outAt={next ? next.from - s.from : Infinity}
              len={(next ? next.from : durationInFrames) - s.from}
              push={s.push ?? 0.05}
            >
              {s.render}
            </Shell>
          </Sequence>
        );
      })}
    </>
  );
};
