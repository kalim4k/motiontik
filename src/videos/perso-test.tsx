import { AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN_OUT, prog } from "../lib/ease";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Sfx } from "../lib/Stage";
import { ComicCaptions, Ground, Prop, StickMan, stick, ThoughtBubble } from "../lib/Stick";
import { timeOf, type VideoProps } from "../lib/timing";

type SceneProps = { at: (word: string, occ?: number) => number; slug: string; from: number };

const Controller: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.62} viewBox="0 0 100 62">
    <path d="M22 8 H78 C92 8 99 24 97 40 C95 56 84 60 76 50 L68 42 H32 L24 50 C16 60 5 56 3 40 C1 24 8 8 22 8 Z" fill="#6c63ff" stroke={stick.ink} strokeWidth={3} />
    <path d="M20 26 H32 M26 20 V32" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
    <circle cx={70} cy={22} r={5} fill="#ffd23f" stroke={stick.ink} strokeWidth={2} />
    <circle cx={80} cy={31} r={5} fill="#ff4d6d" stroke={stick.ink} strokeWidth={2} />
  </svg>
);

const Sparkles: React.FC<{ at: number; cx: number; cy: number }> = ({ at, cx, cy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        const s = frame < at + i * 2 ? 0 : spring({ frame: frame - at - i * 2, fps, config: { damping: 8 } });
        const r = 260 + (i % 2) * 70;
        return (
          <svg
            key={i}
            width={70}
            height={70}
            viewBox="-10 -10 20 20"
            style={{
              position: "absolute",
              left: cx + Math.cos(a) * r - 35,
              top: cy + Math.sin(a) * r - 35,
              transform: `scale(${s}) rotate(${frame * 3 + i * 40}deg)`,
            }}
          >
            <path d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z" fill="#ffd23f" stroke={stick.ink} strokeWidth={1} />
          </svg>
        );
      })}
    </>
  );
};

// Plan 1 : narrateur debout à droite, cadrage de la réf
const SceneFace: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const punch = prog(frame, at("ecoute"), 8, EASE_IN_OUT);
  return (
    <AbsoluteFill>
      <Ground none />
      <AbsoluteFill style={{ transform: `scale(${1 + punch * 0.22})`, transformOrigin: "73% 45%" }}>
        <StickMan
          x={785}
          y={1462}
          height={740}
          variant="full"
          flip
          expression={frame >= at("ecoute") ? "smug" : "neutral"}
          poses={[
            [0, "idle"],
            [at("jeu"), "raise"],
            [at("ecoute"), "point"],
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Plan 2 : scène au sol avec décor kie.ai + bulle de pensée
const SceneDesk: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground horizon={1150} />
    <Prop src={`${slug}/bureau.png`} x={700} y={1170} width={440} at={2} />
    <StickMan
      x={330}
      y={1160}
      height={330}
      expression="happy"
      poses={[
        [0, "idle"],
        [at("decris"), "point"],
      ]}
    />
    <ThoughtBubble x={400} y={720} size={260} at={at("idee")}>
      <Controller size={150} />
    </ThoughtBubble>
  </AbsoluteFill>
);

// Plan 3 : narrateur au centre, bras en l'air
const SceneMagic: React.FC<SceneProps> = ({ at }) => (
  <AbsoluteFill>
    <Ground none />
    <StickMan
      x={540}
      y={1462}
      height={740}
      variant="full"
      expression="happy"
      poses={[
        [0, "idle"],
        [at("magie") - 2, "cheer"],
      ]}
    />
    <Sparkles at={at("magie")} cx={540} cy={860} />
  </AbsoluteFill>
);

export const PersoTest: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number) => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug, from });
  const S2 = f("ouvre");
  const S3 = f("regarde");
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      <Sfx at={f("jeu")} name="pop" volume={0.5} />
      <Sfx at={f("ecoute")} name="impact" volume={0.45} />
      <Sfx at={S2 - 5} name="whoosh" volume={0.5} />
      <Sfx at={f("idee")} name="pop" volume={0.6} />
      <Sfx at={S3 - 5} name="whoosh" volume={0.5} />
      <Sfx at={f("magie")} name="ding" volume={0.6} />
      <Camera shakes={[f("ecoute")]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.04, render: <SceneFace {...scene(0)} /> },
            { from: S2, transition: "whip", push: 0.03, render: <SceneDesk {...scene(S2)} /> },
            { from: S3, transition: "zoom", push: 0.04, render: <SceneMagic {...scene(S3)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
