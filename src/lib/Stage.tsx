import { CameraMotionBlur } from "@remotion/motion-blur";
import { noise2D } from "@remotion/noise";
import {
  AbsoluteFill,
  Audio,
  getInputProps,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./theme";

/** Fond sombre : lueur d'accent, grille qui défile, vignette. */
export const Backdrop: React.FC<{ glow?: string }> = ({ glow = theme.accent }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 45% at 50% ${8 + Math.sin(frame / 50) * 4}%, ${glow}26, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.04) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.04) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `45px ${-frame * 0.8}px`,
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 45%, #000 20%, transparent 85%)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.65))" }}
      />
    </AbsoluteFill>
  );
};

/** Grain pellicule animé, à poser par-dessus tout. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Caméra : secousse amortie à chaque frame listée dans `shakes`. */
export const Camera: React.FC<{ shakes?: number[]; children: React.ReactNode }> = ({
  shakes = [],
  children,
}) => {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  let r = 0;
  for (const s of shakes) {
    const d = frame - s;
    if (d < 0 || d > 16) continue;
    const amp = Math.pow(1 - d / 16, 2) * 26;
    x += noise2D("x", s, d * 0.7) * amp;
    y += noise2D("y", s, d * 0.7) * amp;
    r += noise2D("r", s, d * 0.7) * amp * 0.04;
  }
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) rotate(${r}deg)` }}>{children}</AbsoluteFill>
  );
};

/** Gain global des bruitages (retour utilisateur : ils couvraient trop la voix). */
export const SFX_GAIN = 0.4;

/** Bruitage de la banque public/sfx/ joué à la frame `at`. */
export const Sfx: React.FC<{ at: number; name: string; volume?: number }> = ({
  at,
  name,
  volume = 0.6,
}) => (
  <Sequence from={Math.max(0, at)} layout="none">
    <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume * SFX_GAIN} />
  </Sequence>
);

/** Volume de la musique de fond (retour utilisateur : 0.14 était encore trop fort). */
export const MUSIC_VOLUME = 0.06;

/** Musique de fond public/<slug>/music.mp3, avec fondu d'entrée et de sortie. */
export const Music: React.FC<{ slug: string }> = ({ slug }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <Audio
      src={staticFile(`${slug}/music.mp3`)}
      volume={(fr) =>
        interpolate(fr, [0, 12, durationInFrames - 30, durationInFrames], [0, MUSIC_VOLUME, MUSIC_VOLUME, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  );
};

/**
 * Motion blur caméra, activé seulement en rendu HQ (`npm run render -- <slug> --hq`),
 * car il multiplie le temps de rendu par le nombre d'échantillons.
 */
export const MotionBlur: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const samples = Number(getInputProps().blur ?? 0);
  if (samples < 2) return <>{children}</>;
  return (
    <CameraMotionBlur samples={samples} shutterAngle={200}>
      {children}
    </CameraMotionBlur>
  );
};

/** Voix off ; avec `cut`/`gap` (frames), insère un silence de `gap` frames à la frame `cut`. */
export const Voice: React.FC<{ slug: string; cut?: number; gap?: number }> = ({ slug, cut, gap = 0 }) => {
  const src = staticFile(`${slug}/voice.mp3`);
  if (cut === undefined || gap <= 0) return <Audio src={src} />;
  return (
    <>
      <Sequence durationInFrames={cut} layout="none">
        <Audio src={src} />
      </Sequence>
      <Sequence from={cut + gap} layout="none">
        <Audio src={src} trimBefore={cut} />
      </Sequence>
    </>
  );
};
