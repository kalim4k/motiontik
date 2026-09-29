import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Captions } from "../lib/Captions";
import { clamp, EASE_IN, mix, prog } from "../lib/ease";
import { DrawPath, ICONS, Phone } from "../lib/Graphics";
import { SceneTrack } from "../lib/SceneTrack";
import { Backdrop, Camera, Grain, MotionBlur, Music, Sfx } from "../lib/Stage";
import { MaskReveal, Odometer, Slam, Sticker } from "../lib/Text";
import { fontFamily, theme } from "../lib/theme";
import { timeOf, type VideoProps } from "../lib/timing";

/** `at("mot")` = frame (locale à la scène) où le mot est prononcé. */
type SceneProps = { at: (word: string, occ?: number) => number };

// ─── Scène 1 : « Tu passes trois heures par jour sur ton téléphone. » ───────────
const ScreenTime: React.FC<{ minutes: number; barsAt: number }> = ({ minutes, barsAt }) => {
  const frame = useCurrentFrame();
  const bars = [0.5, 0.68, 0.42, 0.78, 0.6, 0.88, 1];
  const apps: [string, number][] = [
    ["#ff2d55", 0.92],
    ["#7c5cff", 0.58],
    ["#25d366", 0.34],
  ];
  return (
    <div style={{ padding: "84px 30px 0", fontFamily, color: theme.text }}>
      <div style={{ fontSize: 20, color: theme.muted, fontWeight: 800, letterSpacing: "0.1em" }}>
        TEMPS D'ÉCRAN
      </div>
      <div
        style={{
          fontSize: 92,
          fontWeight: 900,
          letterSpacing: "-0.05em",
          lineHeight: 1.05,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.floor(minutes / 60)}
        <span style={{ fontSize: 44, color: theme.muted }}> h </span>
        {String(minutes % 60).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 20, color: theme.muted, fontWeight: 500 }}>Moyenne quotidienne</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 220, marginTop: 40 }}>
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${b * prog(frame, barsAt + i * 2, 16) * 100}%`,
              borderRadius: 9,
              background: i === 6 ? theme.accent : "#2c2c31",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        {[..."LMMJVSD"].map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 16, color: theme.muted, fontWeight: 800 }}>
            {d}
          </div>
        ))}
      </div>
      {apps.map(([c, w], i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: i === 0 ? 36 : 18 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: c }} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 11,
                width: `${w * prog(frame, barsAt + 8 + i * 3, 18) * 100}%`,
                borderRadius: 6,
                background: "#3a3a40",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const SceneHours: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const inP = prog(frame, 0, 24);
  const minutes = Math.round(
    interpolate(frame, [at("trois"), at("jour") + 6], [0, 180], { ...clamp, easing: Easing.out(Easing.cubic) })
  );
  const float = Math.sin(frame / 14) * 8;
  return (
    <AbsoluteFill>
      <MaskReveal text="3H" at={at("trois")} top={140} size={520} color={theme.accent} tracking={-0.07} />
      <div
        style={{
          position: "absolute",
          top: 640,
          left: "50%",
          marginLeft: -180,
          transform: `perspective(1600px) translateY(${(1 - inP) * 1300 + float}px) rotateX(${mix(inP, 35, 8)}deg) rotateY(${mix(inP, -30, -12)}deg) rotateZ(${mix(inP, 10, 3)}deg)`,
        }}
      >
        <Phone width={360}>
          <ScreenTime minutes={minutes} barsAt={at("heures")} />
        </Phone>
      </div>
      <Sticker text="PAR JOUR" at={at("jour")} top={600} left={610} rotate={-8} />
    </AbsoluteFill>
  );
};

// ─── Scène 2 : « Sur une année, ça fait plus de mille heures. » ───────────────
const SceneYear: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const count = Math.floor(
    interpolate(frame, [at("annee"), at("mille") - 2], [0, 365], { ...clamp, easing: Easing.inOut(Easing.quad) })
  );
  const focus = prog(frame, at("mille"), 14);
  const COLS = 19;
  const STEP = 44;
  return (
    <AbsoluteFill>
      <MaskReveal text="SUR 1 AN" at={2} top={200} size={58} color={theme.muted} weight={800} tracking={0.12} />
      <div
        style={{
          position: "absolute",
          top: 330,
          left: (1080 - COLS * STEP) / 2,
          width: COLS * STEP,
          height: 20 * STEP,
          opacity: 1 - focus * 0.78,
          filter: `blur(${focus * 7}px)`,
          transform: `scale(${1 - focus * 0.07})`,
        }}
      >
        {Array.from({ length: 365 }, (_, i) => {
          const built = prog(frame, i * 0.07, 10);
          const lit = i < count;
          const flash = lit ? Math.max(0, 1 - (count - i) / 30) : 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (i % COLS) * STEP + 10,
                top: Math.floor(i / COLS) * STEP + 10,
                width: 24,
                height: 24,
                borderRadius: 7,
                background: lit ? theme.accent : "#26262b",
                transform: `scale(${built * (1 + flash * 0.45)})`,
                boxShadow: flash > 0.2 ? `0 0 ${flash * 30}px ${theme.accent}` : "none",
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1250,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: "0.12em",
          color: theme.muted,
          opacity: prog(frame, at("annee"), 8) * (1 - focus),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        JOUR {Math.max(1, count)} / 365
      </div>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Odometer text="1 000" prefix="+" suffix="H" at={at("mille")} size={260} />
      </div>
      <MaskReveal text="HEURES PAR AN" at={at("heures")} top={860} size={66} weight={800} tracking={0.02} />
    </AbsoluteFill>
  );
};

// ─── Scène 3 : « Mille heures, c'est assez pour apprendre un nouveau métier. » ─
const SKILLS: [string, keyof typeof ICONS][] = [
  ["CODE", "code"],
  ["DESIGN", "design"],
  ["VIDÉO", "video"],
  ["MARKETING", "chart"],
];

const SceneSkills: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const learn = at("apprendre");
  const done = at("metier");
  const progress = interpolate(frame, [learn, done], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const doneP = prog(frame, done, 16);
  const scanning = frame >= learn && frame < done ? Math.floor(progress * 4) : -1;
  const CARD = 260;
  const GAP = 28;
  const gridLeft = (1080 - (CARD * 2 + GAP)) / 2;
  const barIn = prog(frame, learn - 6, 12);

  return (
    <AbsoluteFill>
      <MaskReveal text="1 000 HEURES," at={0} top={140} size={100} color={theme.accent} />
      <MaskReveal text="C'EST ASSEZ POUR APPRENDRE" at={at("c'est")} top={272} size={50} weight={800} stagger={2} />

      {SKILLS.map(([label, icon], i) => {
        const p = prog(frame, 4 + i * 4, 18);
        const active = i === scanning || doneP > 0;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: gridLeft + (i % 2) * (CARD + GAP),
              top: 400 + Math.floor(i / 2) * (CARD + GAP),
              width: CARD,
              height: CARD,
              borderRadius: 40,
              background: theme.surface,
              border: `3px solid ${active ? theme.accent : theme.line}`,
              boxShadow: active ? `0 0 60px ${theme.accent}55` : "0 30px 60px rgba(0,0,0,.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              opacity: p,
              transform: `translateY(${(1 - p) * 90}px) scale(${mix(p, 0.8, 1) * (1 - doneP * 0.06)})`,
            }}
          >
            <svg width={110} height={110} viewBox="0 0 24 24">
              {ICONS[icon].map((d, k) => (
                <DrawPath
                  key={k}
                  d={d}
                  progress={prog(frame, 10 + i * 4 + k * 4, 22)}
                  stroke={active ? theme.accent : theme.text}
                  strokeWidth={1.6}
                />
              ))}
            </svg>
            <div style={{ fontFamily, fontWeight: 800, fontSize: 26, letterSpacing: "0.12em", color: theme.muted }}>
              {label}
            </div>
          </div>
        );
      })}

      {doneP > 0 && (
        <div
          style={{
            position: "absolute",
            left: 540 - 150,
            top: 400 + CARD + GAP / 2 - 150,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: theme.accent,
            transform: `scale(${mix(doneP, 0.3, 1)})`,
            boxShadow: `0 0 120px ${theme.accent}`,
          }}
        >
          <svg width={300} height={300} viewBox="0 0 24 24">
            <DrawPath d={ICONS.check[0]} progress={prog(frame, done + 3, 12)} stroke={theme.ink} strokeWidth={2.4} />
          </svg>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 980,
          left: 160,
          right: 160,
          opacity: barIn,
          transform: `translateY(${(1 - barIn) * 30}px)`,
          fontFamily,
          fontWeight: 800,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: theme.muted, letterSpacing: "0.1em" }}>
          <span>APPRENTISSAGE</span>
          <span style={{ color: theme.text, fontVariantNumeric: "tabular-nums" }}>{Math.round(progress * 100)}%</span>
        </div>
        <div style={{ height: 20, borderRadius: 10, background: "#232327", marginTop: 14, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              borderRadius: 10,
              background: `linear-gradient(90deg, ${theme.accent}99, ${theme.accent})`,
              boxShadow: `0 0 24px ${theme.accent}`,
            }}
          />
        </div>
      </div>

      <MaskReveal text="NOUVEAU MÉTIER." at={at("nouveau")} top={1110} size={116} highlight={["MÉTIER."]} stagger={6} />
    </AbsoluteFill>
  );
};

// ─── Scène 4 : « Alors pose ce téléphone… » ──────────────────────────────────
const Notif: React.FC<{ color: string; at: number }> = ({ color, at }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, 14);
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        padding: 16,
        marginBottom: 14,
        borderRadius: 22,
        background: "#1f1f23",
        opacity: p,
        transform: `translateY(${(1 - p) * -60}px) scale(${mix(p, 0.9, 1)})`,
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 13, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 11, width: "55%", borderRadius: 6, background: "#4a4a52" }} />
        <div style={{ height: 9, width: "85%", borderRadius: 6, background: "#333338", marginTop: 10 }} />
      </div>
    </div>
  );
};

const ScenePut: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const pose = at("pose");
  const buzz = frame < pose && frame % 18 < 7 ? Math.sin(frame * 2.6) * 2.5 : 0;
  const lift = prog(frame, pose, 6);
  const drop = prog(frame, pose + 5, 18, EASE_IN);
  return (
    <AbsoluteFill>
      <MaskReveal text="POSE CE" at={pose} top={170} size={130} />
      <MaskReveal text="TÉLÉPHONE." at={at("telephone", 1)} top={300} size={130} color={theme.accent} />
      <div
        style={{
          position: "absolute",
          top: 520,
          left: "50%",
          marginLeft: -180,
          transform: `translateY(${-lift * 50 + drop * 2200}px) rotate(${buzz + drop * 38}deg)`,
        }}
      >
        <Phone width={360}>
          <div style={{ padding: "90px 18px 0" }}>
            <Notif color="#ff2d55" at={2} />
            <Notif color="#7c5cff" at={8} />
            <Notif color="#25d366" at={14} />
            <Notif color="#ffb800" at={20} />
          </div>
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scène 5 : « …et commence aujourd'hui. » ─────────────────────────────────
const SceneCTA: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const today = at("aujourd'hui");
  return (
    <AbsoluteFill style={{ background: theme.accent }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540,
            top: 820,
            width: 700 + i * 380,
            height: 700 + i * 380,
            marginLeft: -(350 + i * 190),
            marginTop: -(350 + i * 190),
            borderRadius: "50%",
            border: "3px solid rgba(0,0,0,.12)",
            transform: `scale(${1 + frame * 0.004 * (i + 1)})`,
          }}
        />
      ))}
      <Slam text="COMMENCE" at={at("commence")} top={650} size={158} color={theme.ink} />
      <Slam text="AUJOURD'HUI." at={today} top={830} size={118} color={theme.text} />
      <svg style={{ position: "absolute", left: 160, top: 960 }} width={760} height={70} viewBox="0 0 760 70">
        <DrawPath d="M10 50 C 200 12, 520 10, 750 34" progress={prog(frame, today + 7, 14)} stroke={theme.ink} strokeWidth={14} />
      </svg>
    </AbsoluteFill>
  );
};

// ─── Montage ────────────────────────────────────────────────────────────────
export const Demo: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const local = (from: number) => (w: string, occ = 0) => f(w, occ) - from;

  const S2 = f("sur", 1);
  const S3 = f("mille", 1);
  const S4 = f("alors");
  const S5 = f("et") - 4;

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      <Music slug={slug} />
      <Sfx at={0} name="whoosh" volume={0.45} />
      <Sfx at={f("trois")} name="impact" volume={0.5} />
      <Sfx at={f("trois")} name="tick" volume={0.25} />
      <Sfx at={f("jour")} name="pop" volume={0.55} />
      <Sfx at={S2 - 5} name="whoosh" volume={0.55} />
      <Sfx at={f("annee")} name="tick" volume={0.3} />
      <Sfx at={f("mille")} name="impact" volume={0.6} />
      <Sfx at={S3 - 6} name="whoosh_big" volume={0.45} />
      <Sfx at={f("apprendre")} name="riser" volume={0.3} />
      <Sfx at={f("metier")} name="ding" volume={0.5} />
      <Sfx at={S4 - 5} name="whoosh" volume={0.55} />
      <Sfx at={f("pose") + 5} name="whoosh" volume={0.5} />
      <Sfx at={S5 - 4} name="whoosh_big" volume={0.45} />
      <Sfx at={f("commence")} name="impact" volume={0.7} />
      <Sfx at={f("aujourd'hui")} name="pop" volume={0.45} />

      <MotionBlur>
        <AbsoluteFill>
          <Backdrop />
          <Camera shakes={[f("trois"), f("mille"), f("commence")]}>
            <SceneTrack
              scenes={[
                { from: 0, render: <SceneHours at={local(0)} /> },
                { from: S2, transition: "whip", render: <SceneYear at={local(S2)} /> },
                { from: S3, transition: "zoom", render: <SceneSkills at={local(S3)} /> },
                { from: S4, transition: "whip", render: <ScenePut at={local(S4)} /> },
                { from: S5, transition: "wipe", push: 0.03, render: <SceneCTA at={local(S5)} /> },
              ]}
            />
            <Captions words={timing.words} hide={[[S5, durationInFrames]]} />
          </Camera>
        </AbsoluteFill>
      </MotionBlur>
      <Grain />
    </AbsoluteFill>
  );
};
