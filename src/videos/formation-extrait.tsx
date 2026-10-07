import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, Card, font, Icon, Kicker, Reveal, Subtitles } from "../lib/Course";
import { clamp, EASE_IN_OUT, EASE_OUT, prog } from "../lib/ease";
import { timeOf, type VideoProps } from "../lib/timing";

// Extrait de 9 s pour la formation Adsterra (16:9, même habillage) : motion design seul, sans visage.

const big = (size: number, color: string = C.ink): React.CSSProperties => ({ fontFamily: font, fontWeight: 900, fontSize: size, color, letterSpacing: -1, lineHeight: 1.02 });
const body = (size: number, color: string = C.text): React.CSSProperties => ({ fontFamily: font, fontWeight: 700, fontSize: size, color, lineHeight: 1.25 });

/** Transition d'entrée : volet qui glisse depuis la droite. */
const Wipe: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, 0, 12, EASE_IN_OUT);
  return <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` }}>{children}</AbsoluteFill>;
};

// 1. « …encore moins de cette opportunité »
const Opportunity: React.FC = () => {
  const frame = useCurrentFrame();
  const word = "OPPORTUNITÉ".split("");
  return (
    <AbsoluteFill>
      <Backdrop dark />
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", gap: 4 }}>
        {word.map((l, i) => {
          const s = prog(frame, 6 + i * 1.6, 10, EASE_OUT);
          return (
            <div key={i} style={{ ...big(150, C.white), opacity: s, transform: `translateY(${(1 - s) * 60}px)` }}>
              {l}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: "50%", top: 560, height: 12, borderRadius: 6, background: C.red, width: interpolate(frame, [20, 40], [0, 900], { ...clamp, easing: EASE_OUT }), transform: "translateX(-50%)" }} />
      <Reveal at={24} style={{ position: "absolute", left: 0, right: 0, top: 620, textAlign: "center" }}>
        <div style={body(40, "#c9c9cf")}>Encore très peu connue en Afrique francophone</div>
      </Reveal>
    </AbsoluteFill>
  );
};

// 2. « Je fais donc cette formation 100 % gratuite »
const Free: React.FC<{ at: (w: string) => number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const pct = Math.round(interpolate(frame, [at("cent"), at("gratuite")], [0, 100], { ...clamp, easing: EASE_OUT }));
  const stamp = prog(frame, at("gratuite"), 7, EASE_IN_OUT);
  return (
    <Wipe>
      <Backdrop />
      <Reveal at={4} style={{ position: "absolute", left: 160, top: 240 }}>
        <Kicker>Formation Adsterra</Kicker>
        <div style={{ ...big(84), marginTop: 10 }}>Je t'offre cette formation</div>
      </Reveal>
      <div style={{ position: "absolute", left: 160, top: 430, ...big(260, C.red) }}>{pct} %</div>
      {frame >= at("gratuite") && (
        <div
          style={{
            position: "absolute",
            left: 980,
            top: 520,
            padding: "18px 44px",
            border: `12px solid ${C.green}`,
            borderRadius: 24,
            transform: `rotate(-8deg) scale(${interpolate(stamp, [0, 1], [2.2, 1])})`,
            opacity: Math.min(1, stamp * 2),
            ...big(120, C.green),
          }}
        >
          GRATUITE
        </div>
      )}
    </Wipe>
  );
};

// 3. « …pour vous apprendre tout ce qu'il faut savoir sur Adsterra »
const Learn: React.FC<{ at: (w: string) => number }> = ({ at }) => {
  const items = ["Comment fonctionne Adsterra", "Créer son compte", "Retirer son argent", "Les pièges à éviter"];
  const start = at("apprendre");
  return (
    <Wipe>
      <Backdrop />
      <Reveal at={4} style={{ position: "absolute", left: 160, top: 170 }}>
        <Kicker>Au programme</Kicker>
        <div style={{ ...big(80), marginTop: 10 }}>
          Tout savoir sur <span style={{ color: C.red }}>Adsterra</span>
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 160, top: 400, width: 1100, display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((t, i) => (
          <Reveal key={t} at={start + i * 9} dx={-50} dy={0}>
            <Card style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 30px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: C.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={40} color={C.white} />
              </div>
              <div style={body(40)}>{t}</div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Wipe>
  );
};

// 4. « …et comment commencer à gagner vos premiers gains »
const Gains: React.FC<{ at: (w: string) => number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const grow = prog(frame, at("commencer"), 30, EASE_OUT);
  const bars = [0.18, 0.3, 0.42, 0.58, 0.76, 1];
  return (
    <Wipe>
      <Backdrop dark />
      <Reveal at={4} style={{ position: "absolute", left: 160, top: 200 }}>
        <Kicker>Objectif</Kicker>
        <div style={{ ...big(96, C.white), marginTop: 10 }}>Tes premiers gains</div>
      </Reveal>
      <div style={{ position: "absolute", left: 1000, bottom: 230, display: "flex", alignItems: "flex-end", gap: 26 }}>
        {bars.map((h, i) => {
          const g = Math.max(0, Math.min(1, grow * bars.length - i));
          return <div key={i} style={{ width: 90, height: 460 * h * g, borderRadius: "14px 14px 0 0", background: i === bars.length - 1 ? C.red : "#3a3a40" }} />;
        })}
      </div>
      {[0, 1, 2, 3, 4].map((i) => {
        const t = prog(frame, at("gagner") + i * 5, 22, EASE_OUT);
        if (t <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: 1040 + i * 115, top: 300 - t * 120 + Math.sin(frame / 6 + i) * 6, opacity: Math.min(1, t * 2) }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: "#f5b800", border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", ...big(38, C.ink) }}>$</div>
          </div>
        );
      })}
      <Reveal at={at("premiers")} style={{ position: "absolute", left: 160, top: 420 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: "16px 30px", borderRadius: 999, background: C.green, ...body(38, C.white) }}>
          <Icon name="money" size={46} color={C.white} /> Commence dès maintenant
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 160, top: 560, ...body(30, "#a9a9b0"), opacity: interpolate(frame, [at("premiers") + 12, at("premiers") + 24], [0, 1], clamp) }}>Sans dépenser 1 franc</div>
    </Wipe>
  );
};

const KEYWORDS = /^(Adsterra|opportunité|gratuite|gains|formation)[.,!?…:;]*$/i;

export const FormationExtrait: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string) => Math.round(timeOf(timing, w) * fps);
  const S = [0, f("je") - 2, f("apprendre") - 8, f("et") - 3, durationInFrames];
  const rel = (from: number) => (w: string) => f(w) - from;
  const scenes = [() => <Opportunity />, () => <Free at={rel(S[1])} />, () => <Learn at={rel(S[2])} />, () => <Gains at={rel(S[3])} />];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      <Audio src={staticFile(`${slug}/music.mp3`)} volume={(fr) => interpolate(fr, [0, 10, durationInFrames - 15, durationInFrames], [0, 0.045, 0.045, 0], clamp)} />
      {scenes.map((Scene, i) => (
        <Sequence key={i} from={S[i]} durationInFrames={S[i + 1] - S[i] + (i < 3 ? 12 : 0)}>
          <Scene />
        </Sequence>
      ))}
      <Subtitles words={timing.words} keywords={KEYWORDS} />
    </AbsoluteFill>
  );
};
