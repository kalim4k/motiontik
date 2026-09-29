import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Captions } from "../lib/Captions";
import { clamp, EASE_IN_OUT, mix, prog } from "../lib/ease";
import { Browser, DrawPath, ICONS, MiniGame, Phone } from "../lib/Graphics";
import { SceneTrack } from "../lib/SceneTrack";
import { Backdrop, Camera, Grain, MotionBlur, Music, Sfx, Voice } from "../lib/Stage";
import { Caret, MaskReveal, Odometer, Slam, StepChip, Sticker, typed } from "../lib/Text";
import { fontFamily, theme } from "../lib/theme";
import { insertGap, timeOf, type VideoProps } from "../lib/timing";

/** Pause (s) insérée avant « Alors… » pour laisser lire la capture AdSense. */
export const JEU_ADSENSE_GAP = 2.2;

/** `at("mot", n)` = frame (locale à la scène) de la n-ième occurrence du mot. */
type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

const pop = (frame: number, at: number, fps: number, damping = 11) =>
  frame < at ? 0 : spring({ frame: frame - at, fps, config: { damping, stiffness: 170 } });

// ─── Scène 1 : « Si tu es au Togo, au Bénin, en Côte d'Ivoire… bref, en Afrique » ─
const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.4 : r;
    return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
  }).join(" ");

const FLAG_NAMES = ["TOGO", "BÉNIN", "CÔTE D'IVOIRE"] as const;

const Flag: React.FC<{ name: (typeof FLAG_NAMES)[number] }> = ({ name }) => {
  const flags = {
  TOGO: (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={0} y={i * 40} width={300} height={40} fill={i % 2 ? "#ffce00" : "#006a4e"} />
      ))}
      <rect x={0} y={0} width={120} height={120} fill="#d21034" />
      <polygon points={star(60, 62, 38)} fill="#fff" />
    </>
  ),
  "BÉNIN": (
    <>
      <rect x={0} y={0} width={120} height={200} fill="#008751" />
      <rect x={120} y={0} width={180} height={100} fill="#fcd116" />
      <rect x={120} y={100} width={180} height={100} fill="#e8112d" />
    </>
  ),
  "CÔTE D'IVOIRE": (
    <>
      <rect x={0} y={0} width={100} height={200} fill="#f77f00" />
      <rect x={100} y={0} width={100} height={200} fill="#ffffff" />
      <rect x={200} y={0} width={100} height={200} fill="#009e60" />
    </>
  ),
  };
  return flags[name];
};

const SceneAfrica: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bref = prog(frame, at("bref"), 14);
  const times = [at("togo"), at("benin"), at("cote")];
  return (
    <AbsoluteFill>
      <MaskReveal text="SI TU ES AU" at={0} top={200} size={66} color={theme.muted} weight={800} tracking={0.06} />
      {FLAG_NAMES.map((name, i) => {
        const s = pop(frame, times[i], fps, 10);
        const rot = [-5, 3, -3][i];
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: 540 + (i - 1) * 320 - 145,
              top: 400,
              width: 290,
              opacity: Math.min(1, s * 2),
              transform: `translateY(${(1 - s) * 200 - bref * 50}px) rotate(${rot * s + (1 - s) * rot * 5}deg) scale(${s * mix(bref, 1, 0.88)})`,
            }}
          >
            <svg
              viewBox="0 0 300 200"
              width={290}
              height={193}
              style={{ borderRadius: 22, boxShadow: "0 30px 60px rgba(0,0,0,.55)", display: "block" }}
            >
              <Flag name={name} />
            </svg>
            <div
              style={{
                marginTop: 18,
                textAlign: "center",
                fontFamily,
                fontWeight: 800,
                fontSize: 30,
                letterSpacing: "0.06em",
                color: theme.text,
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
      <MaskReveal text="BREF, EN" at={at("bref")} top={760} size={76} weight={800} />
      <Slam text="AFRIQUE" at={at("afrique")} top={870} size={210} color={theme.accent} />
    </AbsoluteFill>
  );
};

// ─── Scène 2 : « tu peux utiliser Claude et Google pour te créer une source de revenus… » ─
const Spark: React.FC<{ size: number; progress: number }> = ({ size, progress }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      const d = `M${12 + Math.cos(a) * 2.5} ${12 + Math.sin(a) * 2.5} L${12 + Math.cos(a) * 10} ${12 + Math.sin(a) * 10}`;
      return <DrawPath key={i} d={d} progress={progress} stroke={theme.accent} strokeWidth={2.4} />;
    })}
  </svg>
);

const Tile: React.FC<{ left: number; s: number; label: string; children: React.ReactNode }> = ({
  left,
  s,
  label,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top: 300,
      width: 360,
      height: 360,
      borderRadius: 60,
      background: theme.surface,
      border: `3px solid ${theme.line}`,
      boxShadow: "0 40px 80px rgba(0,0,0,.5)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 26,
      opacity: Math.min(1, s * 2),
      transform: `translateY(${(1 - s) * 160}px) scale(${mix(s, 0.7, 1)})`,
    }}
  >
    {children}
    <div style={{ fontFamily, fontWeight: 800, fontSize: 60, letterSpacing: "-0.03em", color: theme.text }}>{label}</div>
  </div>
);

const SceneTools: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sClaude = pop(frame, at("claude"), fps);
  const sGoogle = pop(frame, at("google"), fps);
  const plus = pop(frame, at("google") - 4, fps, 9);
  const notes = at("revenus");
  return (
    <AbsoluteFill>
      <MaskReveal text="TU PEUX UTILISER" at={0} top={170} size={62} color={theme.muted} weight={800} tracking={0.06} />
      <Tile left={140} s={sClaude} label="Claude">
        <Spark size={130} progress={prog(frame, at("claude") + 2, 18)} />
      </Tile>
      <div
        style={{
          position: "absolute",
          left: 540 - 40,
          top: 440,
          width: 80,
          textAlign: "center",
          fontFamily,
          fontWeight: 900,
          fontSize: 90,
          lineHeight: "80px",
          color: theme.accent,
          transform: `scale(${plus}) rotate(${(1 - plus) * 90}deg)`,
        }}
      >
        +
      </div>
      <Tile left={580} s={sGoogle} label="Google">
        <div style={{ display: "flex", gap: 16, height: 130, alignItems: "center" }}>
          {["#4285F4", "#EA4335", "#FBBC05", "#34A853"].map((c, i) => (
            <div
              key={c}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                background: c,
                transform: `translateY(${Math.sin(frame / 6 + i * 0.9) * 16}px)`,
              }}
            />
          ))}
        </div>
      </Tile>
      <MaskReveal text="= REVENUS EN LIGNE" at={at("source")} top={730} size={84} highlight={["REVENUS"]} />
      {[-1, 1, 0].map((k, i) => {
        const s = pop(frame, notes + i * 4, fps, 12);
        return (
          <Img
            key={k}
            src={staticFile(`${slug}/billet.jpg`)}
            style={{
              position: "absolute",
              left: 540 - 260 + k * 110,
              top: 900 + Math.abs(k) * 20,
              width: 520,
              borderRadius: 14,
              boxShadow: "0 30px 70px rgba(0,0,0,.6)",
              opacity: Math.min(1, s * 2),
              transform: `translateY(${(1 - s) * 700}px) rotate(${k * 10 + (1 - s) * 40}deg)`,
            }}
          />
        );
      })}
      <Sticker text="0 FCFA À INVESTIR" at={at("rien")} top={1245} left={250} rotate={-5} size={50} />
    </AbsoluteFill>
  );
};

// ─── Scène 3 : « Voici comment. » ────────────────────────────────────────────
const SceneHow: React.FC<SceneProps> = ({ at }) => (
  <AbsoluteFill>
    <Slam text="VOICI" at={0} top={660} size={200} />
    <Slam text="COMMENT" at={at("comment")} top={870} size={170} color={theme.accent} />
  </AbsoluteFill>
);

// ─── Scène 4 : « Tu vas sur le Play Store… beaucoup de téléchargements. » ─────
const GAMES = [
  ["#ff5b22", "#ffb800"],
  ["#7c5cff", "#2ec4ff"],
  ["#25d366", "#0a8f5a"],
  ["#ff2d55", "#8b1bd1"],
];

const SceneStore: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = prog(frame, 0, 20);
  const query = typed("jeu populaire", frame, at("cherches"), 0.7);
  const top1 = prog(frame, at("populaire"), 12);
  const dl = pop(frame, at("beaucoup"), fps, 12);
  return (
    <AbsoluteFill>
      <StepChip step={1} total={3} />
      <MaskReveal text="VA SUR LE PLAY STORE" at={4} top={230} size={84} highlight={["PLAY", "STORE"]} />
      <div
        style={{
          position: "absolute",
          top: 450,
          left: 540 - 190,
          transform: `translateY(${(1 - phoneIn) * 900}px) rotate(${(1 - phoneIn) * 8}deg)`,
        }}
      >
        <Phone width={380}>
          <div style={{ padding: "84px 20px 0", fontFamily, color: theme.text }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 58,
                padding: "0 18px",
                borderRadius: 29,
                background: "#1f1f23",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              <svg width={26} height={26} viewBox="0 0 24 24">
                <path d="M10.5 4 A6.5 6.5 0 1 1 10.49 4 M15.5 15.5 L21 21" fill="none" stroke={theme.muted} strokeWidth={2.4} strokeLinecap="round" />
              </svg>
              <span style={{ color: query ? theme.text : theme.muted }}>{query || "Rechercher"}</span>
              {frame >= at("cherches") && frame < at("jeu") + 6 && <Caret />}
            </div>
            <div style={{ display: "flex", gap: 8, margin: "18px 0 8px" }}>
              {["Jeux", "Top", "Tendances"].map((c, i) => (
                <div
                  key={c}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: 800,
                    background: i === 1 ? theme.accent : "#1f1f23",
                    color: i === 1 ? theme.ink : theme.muted,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
            {GAMES.map(([a, b], i) => {
              const p = prog(frame, at("jeu") + i * 4, 14);
              const hl = i === 0 ? top1 : 0;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 12,
                    marginTop: 10,
                    borderRadius: 20,
                    background: hl ? "#221812" : "transparent",
                    border: `2px solid ${hl ? theme.accent : "transparent"}`,
                    opacity: p,
                    transform: `translateX(${(1 - p) * 120}px) scale(${1 + hl * 0.03})`,
                  }}
                >
                  <div style={{ width: 70, height: 70, borderRadius: 18, background: `linear-gradient(135deg, ${a}, ${b})`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 13, width: `${80 - i * 10}%`, borderRadius: 7, background: "#4a4a52" }} />
                    <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 16, fontWeight: 800, color: theme.muted }}>
                      <span>{(4.9 - i * 0.1).toFixed(1).replace(".", ",")} ★</span>
                      <span>{[100, 50, 10, 5][i]} M+</span>
                    </div>
                  </div>
                  {i === 0 && hl > 0 && (
                    <div style={{ padding: "4px 10px", borderRadius: 10, background: theme.accent, color: theme.ink, fontSize: 15, fontWeight: 900 }}>
                      TOP 1
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Phone>
      </div>
      {dl > 0 && (
        <div
          style={{
            position: "absolute",
            top: 1010,
            left: 540 - 280,
            width: 560,
            padding: "26px 30px",
            borderRadius: 36,
            background: "rgba(22,22,24,.92)",
            border: `3px solid ${theme.accent}`,
            boxShadow: `0 40px 90px rgba(0,0,0,.6), 0 0 60px ${theme.accent}44`,
            display: "flex",
            alignItems: "center",
            gap: 24,
            transform: `scale(${dl}) rotate(${(1 - dl) * -10}deg)`,
          }}
        >
          <svg width={96} height={96} viewBox="0 0 24 24">
            {["M12 3 V15", "M7 10 L12 15 L17 10", "M4 20 H20"].map((d, k) => (
              <DrawPath key={k} d={d} progress={prog(frame, at("beaucoup") + 4 + k * 3, 12)} stroke={theme.accent} strokeWidth={2.2} />
            ))}
          </svg>
          <div>
            <Odometer text="100" suffix="M+" at={at("beaucoup")} size={110} dur={20} />
            <div style={{ fontFamily, fontWeight: 800, fontSize: 24, letterSpacing: "0.12em", color: theme.muted, marginTop: 6 }}>
              TÉLÉCHARGEMENTS
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Scène 5 : « Ensuite, tu vas sur Claude, et tu lui demandes… » ───────────
const PROMPT = "Crée-moi un jeu inspiré de ce concept, avec ma touche perso.";

const SceneClaude: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = prog(frame, 0, 20);
  const ask = at("demandes");
  const text = typed(PROMPT, frame, ask, 1.1);
  const reply = at("concept") + 4;
  const game = pop(frame, at("propre"), fps, 12);
  return (
    <AbsoluteFill>
      <StepChip step={2} total={3} />
      <MaskReveal text="DEMANDE À CLAUDE" at={at("claude", 1) - 6} top={230} size={92} highlight={["CLAUDE"]} />
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 540 - 190,
          transform: `translateY(${(1 - phoneIn) * 900}px) rotate(${(1 - phoneIn) * -8}deg)`,
        }}
      >
        <Phone width={380}>
          <div style={{ padding: "76px 18px 0", fontFamily, color: theme.text }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingBottom: 14,
                borderBottom: `2px solid ${theme.line}`,
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              <Spark size={34} progress={1} />
              Claude
            </div>
            {frame >= ask && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "14px 18px",
                    borderRadius: "22px 22px 6px 22px",
                    background: theme.accent,
                    color: theme.ink,
                    fontSize: 21,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    transform: `scale(${prog(frame, ask, 8)})`,
                    transformOrigin: "right bottom",
                  }}
                >
                  {text}
                  {text.length < PROMPT.length && <Caret color={theme.ink} />}
                </div>
              </div>
            )}
            {frame >= reply && (
              <div style={{ marginTop: 20, opacity: prog(frame, reply, 8) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 700 }}>
                  <Spark size={26} progress={1} />
                  Voilà ton jeu !
                </div>
                <div style={{ marginTop: 12, padding: 14, borderRadius: 16, background: "#0a0a0b", border: `2px solid ${theme.line}` }}>
                  {[0.7, 0.45, 0.85, 0.55, 0.65].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        height: 9,
                        marginTop: i ? 9 : 0,
                        marginLeft: [0, 20, 20, 40, 0][i],
                        width: `${w * prog(frame, reply + 2 + i * 3, 8) * 80}%`,
                        borderRadius: 5,
                        background: ["#7c5cff", "#2ec4ff", theme.accent, "#25d366", "#4a4a52"][i],
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {game > 0 && (
              <div
                style={{
                  position: "relative",
                  marginTop: 16,
                  height: 220,
                  borderRadius: 18,
                  overflow: "hidden",
                  border: `3px solid ${theme.accent}`,
                  transform: `scale(${game})`,
                }}
              >
                <MiniGame width={338} height={214} frame={frame} />
              </div>
            )}
          </div>
        </Phone>
      </div>
      <Sticker text="TON JEU" at={at("touche")} top={1030} left={680} rotate={7} />
    </AbsoluteFill>
  );
};

// ─── Scène 6 : « T'inquiète, tu n'auras pas besoin de coder. » ───────────────
const SceneNoCode: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const cross = at("pas");
  const dim = prog(frame, cross, 10);
  return (
    <AbsoluteFill>
      <MaskReveal text="T'INQUIÈTE," at={0} top={190} size={76} color={theme.muted} weight={800} />
      <svg
        style={{ position: "absolute", left: 540 - 230, top: 350 }}
        width={460}
        height={460}
        viewBox="0 0 24 24"
      >
        {ICONS.code.map((d, k) => (
          <DrawPath
            key={k}
            d={d}
            progress={prog(frame, 2 + k * 4, 16)}
            stroke={dim > 0 ? `rgba(245,243,238,${1 - dim * 0.65})` : theme.text}
            strokeWidth={1.5}
          />
        ))}
        <DrawPath d="M3.5 20.5 L20.5 3.5" progress={prog(frame, cross, 8, EASE_IN_OUT)} stroke={theme.accent} strokeWidth={2.2} />
      </svg>
      <MaskReveal text="PAS BESOIN" at={cross} top={900} size={140} />
      <MaskReveal text="DE CODER." at={at("coder")} top={1060} size={140} color={theme.accent} />
    </AbsoluteFill>
  );
};

// ─── Scène 7 : « Ensuite, tu mets ton jeu en ligne… AdSense… de l'argent. » ──
const AVATARS: [number, number, string][] = [
  [40, 560, "#7c5cff"],
  [950, 600, "#25d366"],
  [60, 830, "#2ec4ff"],
  [940, 870, "#ff2d55"],
  [150, 1010, "#ffb800"],
  [840, 1030, "#ff5b22"],
];

const SceneOnline: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const urlAt = at("mets");
  const live = at("ligne", 1);
  const loading = interpolate(frame, [at("jeu", 2), live], [0, 1], clamp);
  const adIn = prog(frame, at("connectes"), 14);
  const tile = pop(frame, at("adsense"), fps, 12);
  const players = at("chaque");
  const plays = Math.round(
    interpolate(frame, [players, at("l'argent") + 10], [0, 12480], { ...clamp, easing: Easing.out(Easing.quad) })
  );
  const coinsAt = at("pubs");
  const landed = Array.from({ length: 8 }, (_, i) => coinsAt + i * 4 + 14).filter((t) => frame >= t);
  const pulse = landed.length ? Math.max(0, 1 - (frame - landed[landed.length - 1]) / 8) : 0;
  const shot = at("l'argent") + 10;
  const shotP = prog(frame, shot, 18);

  return (
    <AbsoluteFill>
      <StepChip step={3} total={3} />
      <MaskReveal text="METS-LE EN LIGNE" at={urlAt - 6} top={230} size={92} highlight={["LIGNE"]} />
      <div style={{ position: "absolute", left: 110, top: 390, transform: `translateY(${(1 - prog(frame, 0, 20)) * 900}px)` }}>
        <Browser
          width={860}
          height={560}
          url={typed("tonjeu.com", frame, urlAt, 0.8)}
          loading={loading}
          badge={
            frame >= live ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: "#0f2a1a",
                  color: "#3ddc84",
                  fontFamily,
                  fontWeight: 900,
                  fontSize: 22,
                  transform: `scale(${pop(frame, live, fps, 10)})`,
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: 7, background: "#3ddc84", boxShadow: `0 0 ${8 + Math.sin(frame / 4) * 6}px #3ddc84` }} />
                EN LIGNE
              </div>
            ) : null
          }
        >
          {frame >= live - 4 && (
            <div style={{ position: "absolute", inset: 0, opacity: prog(frame, live - 4, 8) }}>
              <MiniGame width={860} height={471} frame={frame} />
            </div>
          )}
          {adIn > 0 && (
            <div
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                top: 16,
                height: 86,
                borderRadius: 16,
                background: "#fff7e0",
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 20px",
                fontFamily,
                transform: `translateY(${(1 - adIn) * -130}px)`,
                boxShadow: "0 12px 30px rgba(0,0,0,.35)",
              }}
            >
              <div style={{ padding: "4px 10px", borderRadius: 8, background: "#ffb800", color: theme.ink, fontWeight: 900, fontSize: 18 }}>
                PUB
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 12, width: "60%", borderRadius: 6, background: "#d9cfb5" }} />
                <div style={{ height: 10, width: "85%", borderRadius: 6, background: "#ebe2c9", marginTop: 10 }} />
              </div>
            </div>
          )}
        </Browser>
      </div>

      {frame >= players && (
        <div
          style={{
            position: "absolute",
            top: 330,
            right: 90,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 22px",
            borderRadius: 999,
            background: theme.text,
            color: theme.ink,
            fontFamily,
            fontWeight: 900,
            fontSize: 30,
            fontVariantNumeric: "tabular-nums",
            boxShadow: "0 20px 40px rgba(0,0,0,.45)",
            opacity: 1 - shotP,
            transform: `scale(${pop(frame, players, fps, 10)})`,
          }}
        >
          ▶ {plays.toLocaleString("fr-FR")} parties
        </div>
      )}

      {AVATARS.map(([x, y, c], i) => {
        const s = pop(frame, players + i * 4, fps, 9);
        if (!s) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + Math.sin(frame / 10 + i) * 8,
              width: 92,
              height: 92,
              borderRadius: 46,
              background: c,
              border: `5px solid ${theme.bg}`,
              overflow: "hidden",
              transform: `scale(${s})`,
              boxShadow: "0 16px 30px rgba(0,0,0,.5)",
            }}
          >
            <div style={{ position: "absolute", left: 28, top: 16, width: 36, height: 36, borderRadius: 18, background: "rgba(255,255,255,.85)" }} />
            <div style={{ position: "absolute", left: 14, top: 58, width: 64, height: 50, borderRadius: 32, background: "rgba(255,255,255,.85)" }} />
          </div>
        );
      })}

      <svg style={{ position: "absolute", left: 0, top: 950 }} width={1080} height={110}>
        <DrawPath d="M540 0 L540 100" progress={prog(frame, at("connectes"), 12)} stroke={theme.accent} strokeWidth={6} />
      </svg>

      {tile > 0 && (
        <div
          style={{
            position: "absolute",
            left: 540 - 270,
            top: 1060,
            width: 540,
            height: 230,
            borderRadius: 40,
            background: theme.surface,
            border: `3px solid ${theme.accent}`,
            boxShadow: `0 40px 80px rgba(0,0,0,.55), 0 0 ${40 + pulse * 60}px ${theme.accent}55`,
            padding: "26px 32px",
            fontFamily,
            transform: `scale(${tile * (1 + pulse * 0.05)})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 800, fontSize: 40, color: theme.text }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#4285F4", "#EA4335", "#FBBC05", "#34A853"].map((c) => (
                <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
              ))}
            </div>
            Google AdSense
          </div>
          <svg width={476} height={110} viewBox="0 0 476 110" style={{ marginTop: 10 }}>
            <DrawPath
              d="M4 100 L70 88 L130 92 L190 70 L250 74 L310 48 L370 40 L430 16 L472 6"
              progress={interpolate(frame, [coinsAt, at("l'argent") + 12], [0, 1], clamp)}
              stroke={theme.accent}
              strokeWidth={6}
            />
          </svg>
        </div>
      )}

      {Array.from({ length: 8 }, (_, i) => {
        const t0 = coinsAt + i * 4;
        const p = prog(frame, t0, 14, Easing.in(Easing.quad));
        if (frame < t0 || p >= 1) return null;
        const x0 = 200 + (i % 4) * 190;
        const x = mix(p, x0, 540) + Math.sin(p * Math.PI) * (i % 2 ? 80 : -80);
        const y = mix(p, 450, 1140) - Math.sin(p * Math.PI) * 120;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - 30,
              top: y - 30,
              width: 60,
              height: 60,
              borderRadius: 30,
              background: `radial-gradient(circle at 35% 30%, #ffe08a, ${theme.accent})`,
              border: "4px solid #ffb800",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily,
              fontWeight: 900,
              fontSize: 28,
              color: theme.ink,
              transform: `rotateY(${frame * 25}deg)`,
            }}
          >
            F
          </div>
        );
      })}

      {frame >= shot && (
        <>
          <AbsoluteFill style={{ background: `rgba(11,11,12,${shotP * 0.8})` }} />
          <div
            style={{
              position: "absolute",
              top: 330,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              opacity: shotP,
            }}
          >
            <div
              style={{
                padding: "10px 24px",
                borderRadius: 999,
                background: theme.accent,
                color: theme.ink,
                fontFamily,
                fontWeight: 900,
                fontSize: 30,
                letterSpacing: "0.1em",
              }}
            >
              EXEMPLE · TABLEAU ADSENSE
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 540 - 300,
              top: 410,
              width: 600,
              height: 830,
              borderRadius: 36,
              overflow: "hidden",
              border: "3px solid rgba(255,255,255,.15)",
              boxShadow: `0 60px 120px rgba(0,0,0,.7), 0 0 80px ${theme.accent}33`,
              opacity: Math.min(1, shotP * 2),
              transform: `translateY(${(1 - shotP) * 500}px) rotate(${(1 - shotP) * -8}deg) scale(${mix(shotP, 0.6, 1) + Math.max(0, frame - shot) * 0.0012})`,
            }}
          >
            <Img src={staticFile(`${slug}/adsense.png`)} style={{ width: 600, display: "block" }} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ─── Scène 8 : « Alors si ce business t'intéresse, tape « jeu » en commentaire… » ─
const SceneCTA: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typeAt = at("jeu", 3);
  const word = typed("jeu", frame, typeAt, 0.35);
  const send = typeAt + 12;
  const posted = prog(frame, send + 2, 16);
  const heart = pop(frame, send + 12, fps, 8);
  const input = pop(frame, at("tape") - 10, fps, 13);
  return (
    <AbsoluteFill style={{ background: theme.accent }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 - (380 + i * 200),
            top: 760 - (380 + i * 200),
            width: 760 + i * 400,
            height: 760 + i * 400,
            borderRadius: "50%",
            border: "3px solid rgba(0,0,0,.1)",
            transform: `scale(${1 + frame * 0.003 * (i + 1)})`,
          }}
        />
      ))}
      <MaskReveal text="SI ÇA T'INTÉRESSE…" at={at("business") - 10} top={200} size={80} color={theme.ink} />

      {posted > 0 && (
        <div
          style={{
            position: "absolute",
            left: 130,
            top: mix(posted, 590, 390),
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: Math.min(1, posted * 3),
          }}
        >
          <div style={{ width: 76, height: 76, borderRadius: 38, background: theme.ink, border: "4px solid #fff" }} />
          <div
            style={{
              padding: "18px 30px",
              borderRadius: "30px 30px 30px 8px",
              background: "#fff",
              fontFamily,
              fontWeight: 800,
              fontSize: 46,
              color: theme.ink,
              boxShadow: "0 20px 40px rgba(0,0,0,.2)",
            }}
          >
            jeu
          </div>
          <svg width={70} height={70} viewBox="0 0 24 24" style={{ transform: `scale(${heart})` }}>
            <path d="M12 21 C 5 15, 2 11.5, 2 8 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8 C 22 11.5, 19 15, 12 21 Z" fill={theme.ink} />
          </svg>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 580,
          height: 120,
          borderRadius: 60,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "0 16px 0 34px",
          fontFamily,
          fontWeight: 700,
          fontSize: 44,
          color: theme.ink,
          boxShadow: "0 30px 60px rgba(0,0,0,.25)",
          opacity: input,
          transform: `translateY(${(1 - input) * 200}px)`,
        }}
      >
        <span style={{ flex: 1, color: word && frame < send ? theme.ink : "#9a9a9a" }}>
          {frame < send ? word || "Ajouter un commentaire…" : "Ajouter un commentaire…"}
          {frame >= typeAt && frame < send && <Caret color={theme.ink} />}
        </span>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            background: theme.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${frame >= send && frame < send + 5 ? 0.85 : 1})`,
          }}
        >
          <svg width={44} height={44} viewBox="0 0 24 24">
            <path d="M5 12 H19 M13 6 L19 12 L13 18" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <Slam text="TAPE « JEU »" at={at("tape")} top={800} size={128} color={theme.ink} />
      <MaskReveal text="EN COMMENTAIRE" at={at("commentaire")} top={960} size={88} color={theme.text} />
      <MaskReveal text="ET JE TE MONTRE COMMENT" at={at("montre") - 4} top={1150} size={52} color={theme.ink} weight={800} stagger={2} />
    </AbsoluteFill>
  );
};

// ─── Montage ────────────────────────────────────────────────────────────────
export const JeuAdsense: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!timing) return null;
  const cutSec = timeOf(timing, "alors") - 0.05;
  const tl = insertGap(timing, cutSec, JEU_ADSENSE_GAP);
  const f = (w: string, occ = 0) => Math.round(timeOf(tl, w, occ) * fps);
  const scene = (from: number) => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });

  const S2 = f("tu", 1);
  const S3 = f("voici");
  const S4 = f("tu", 2);
  const S5 = f("ensuite");
  const S6 = f("t'inquiete");
  const S7 = f("ensuite", 1);
  const S8 = f("alors");

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Voice slug={slug} cut={Math.round(cutSec * fps)} gap={Math.round(JEU_ADSENSE_GAP * fps)} />
      <Music slug={slug} />
      <Sfx at={0} name="whoosh" volume={0.5} />
      <Sfx at={f("togo")} name="pop" volume={0.6} />
      <Sfx at={f("benin")} name="pop" volume={0.6} />
      <Sfx at={f("cote")} name="pop" volume={0.6} />
      <Sfx at={f("afrique")} name="impact" volume={0.7} />
      <Sfx at={S2 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("claude")} name="pop" volume={0.5} />
      <Sfx at={f("google")} name="pop" volume={0.5} />
      <Sfx at={f("revenus")} name="coin" volume={0.7} />
      <Sfx at={f("rien")} name="ding" volume={0.5} />
      <Sfx at={S3 - 6} name="whoosh_big" volume={0.5} />
      <Sfx at={S4 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("cherches")} name="typing" volume={0.5} />
      <Sfx at={f("populaire")} name="pop" volume={0.5} />
      <Sfx at={f("beaucoup")} name="tick" volume={0.4} />
      <Sfx at={S5 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("demandes")} name="typing" volume={0.6} />
      <Sfx at={f("concept") + 4} name="notif" volume={0.6} />
      <Sfx at={f("propre")} name="pop" volume={0.5} />
      <Sfx at={S6 - 6} name="whoosh_big" volume={0.5} />
      <Sfx at={f("pas")} name="impact" volume={0.7} />
      <Sfx at={S7 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("mets")} name="typing" volume={0.4} />
      <Sfx at={f("ligne", 1)} name="ding" volume={0.5} />
      <Sfx at={f("connectes")} name="pop" volume={0.5} />
      <Sfx at={f("chaque")} name="notif" volume={0.5} />
      <Sfx at={f("pubs") + 14} name="coin" volume={0.6} />
      <Sfx at={f("rapportent") + 10} name="coin" volume={0.6} />
      <Sfx at={f("l'argent") + 6} name="coin" volume={0.6} />
      <Sfx at={f("l'argent") + 10} name="whoosh" volume={0.5} />
      <Sfx at={S8 - 6} name="whoosh_big" volume={0.5} />
      <Sfx at={f("tape")} name="impact" volume={0.6} />
      <Sfx at={f("jeu", 3) + 12} name="pop" volume={0.6} />
      <Sfx at={f("commentaire")} name="notif" volume={0.5} />

      <MotionBlur>
        <AbsoluteFill>
          <Backdrop />
          <Camera shakes={[f("afrique"), f("pas"), f("tape")]}>
            <SceneTrack
              scenes={[
                { from: 0, render: <SceneAfrica {...scene(0)} /> },
                { from: S2, transition: "whip", render: <SceneTools {...scene(S2)} /> },
                { from: S3, transition: "zoom", render: <SceneHow {...scene(S3)} /> },
                { from: S4, transition: "whip", render: <SceneStore {...scene(S4)} /> },
                { from: S5, transition: "whip", render: <SceneClaude {...scene(S5)} /> },
                { from: S6, transition: "zoom", render: <SceneNoCode {...scene(S6)} /> },
                { from: S7, transition: "whip", render: <SceneOnline {...scene(S7)} /> },
                { from: S8, transition: "wipe", push: 0.03, render: <SceneCTA {...scene(S8)} /> },
              ]}
            />
            <Captions words={tl.words} hide={[[S8, durationInFrames]]} />
          </Camera>
        </AbsoluteFill>
      </MotionBlur>
      <Grain />
    </AbsoluteFill>
  );
};
