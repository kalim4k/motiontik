import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Captions } from "../lib/Captions";
import { clamp, EASE_IN_OUT, mix, prog } from "../lib/ease";
import { DrawPath, ICONS, Phone } from "../lib/Graphics";
import { SceneTrack } from "../lib/SceneTrack";
import { Backdrop, Camera, Grain, MotionBlur, Music, Sfx } from "../lib/Stage";
import { Caret, MaskReveal, Slam, StepChip, Sticker, typed } from "../lib/Text";
import { fontFamily, theme } from "../lib/theme";
import { timeOf, type VideoProps } from "../lib/timing";

/** `at("mot", n)` = frame (locale à la scène) de la n-ième occurrence du mot. */
type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

const pop = (frame: number, at: number, fps: number, damping = 11) =>
  frame < at ? 0 : spring({ frame: frame - at, fps, config: { damping, stiffness: 170 } });

// ─── Éléments communs ───────────────────────────────────────────────────────
/** Couverture du guide PDF (360×480 à scale 1). */
const GuideCover: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <div
    style={{
      width: 360 * scale,
      height: 480 * scale,
      borderRadius: 22 * scale,
      padding: 32 * scale,
      background: `linear-gradient(150deg, #ff8a4c 0%, ${theme.accent} 45%, #b3261e 100%)`,
      boxShadow: `0 ${40 * scale}px ${80 * scale}px rgba(0,0,0,.55)`,
      position: "relative",
      overflow: "hidden",
      fontFamily,
      color: theme.ink,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: "absolute",
        right: -60 * scale,
        top: -60 * scale,
        width: 240 * scale,
        height: 240 * scale,
        borderRadius: "50%",
        border: `${16 * scale}px solid rgba(255,255,255,.18)`,
      }}
    />
    <div style={{ fontSize: 22 * scale, fontWeight: 800, letterSpacing: "0.14em", opacity: 0.7 }}>GUIDE PRATIQUE</div>
    <div style={{ fontSize: 64 * scale, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", marginTop: 16 * scale }}>
      MON
      <br />
      GUIDE
    </div>
    {[0.9, 0.7, 0.8].map((w, i) => (
      <div
        key={i}
        style={{ height: 12 * scale, width: `${w * 100}%`, borderRadius: 6 * scale, background: "rgba(11,11,12,.25)", marginTop: (i ? 12 : 30) * scale }}
      />
    ))}
    <div
      style={{
        position: "absolute",
        left: 32 * scale,
        bottom: 30 * scale,
        padding: `${6 * scale}px ${14 * scale}px`,
        borderRadius: 10 * scale,
        background: theme.ink,
        color: theme.text,
        fontSize: 22 * scale,
        fontWeight: 900,
      }}
    >
      PDF
    </div>
  </div>
);

const Spark: React.FC<{ size: number; color?: string }> = ({ size, color = "#d97757" }) => (
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

/** Rond "doigt qui tape" à la position (x, y). */
const Tap: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
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

// ─── Scène 1 : « Tu peux créer ton premier produit digital ce soir… téléphone. » ─
const SceneHook: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const coverIn = pop(frame, 2, fps, 12);
  const phoneAt = at("avec");
  const phoneP = prog(frame, phoneAt, 20);
  const into = prog(frame, phoneAt + 4, 18, EASE_IN_OUT);
  return (
    <AbsoluteFill>
      <MaskReveal text="TON PREMIER" at={at("ton")} top={190} size={96} />
      <MaskReveal text="PRODUIT DIGITAL" at={at("produit")} top={300} size={100} color={theme.accent} />
      <div style={{ position: "absolute", top: 500, left: 540 - 200, opacity: phoneP > 0 ? 1 : 0, transform: `translateY(${(1 - phoneP) * 1300}px)` }}>
        <Phone width={400}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #1a1a1e, #0e0e10)" }} />
        </Phone>
      </div>
      <div
        style={{
          position: "absolute",
          left: 540 - 180,
          top: mix(into, 520, 580),
          transform: `perspective(1400px) rotateY(${Math.sin(frame / 18) * 14 * (1 - into)}deg) rotateX(${(1 - coverIn) * 50}deg) scale(${coverIn * mix(into, 1, 0.9)})`,
          opacity: Math.min(1, coverIn * 2),
        }}
      >
        <GuideCover />
      </div>
      <Sticker text="CE SOIR" at={at("soir")} top={470} left={650} rotate={8} />
    </AbsoluteFill>
  );
};

// ─── Scène 2 : « Étape un : choisis un problème… peu importe. » ──────────────
const TOPICS: [string, string[]][] = [
  ["CUISINE", ["M4 11 H20", "M5 11 V16 A4 4 0 0 0 9 20 H15 A4 4 0 0 0 19 16 V11", "M9 8 V5", "M12 8 V3.5", "M15 8 V5"]],
  ["BUSINESS", ["M3 8 H21 V19 H3 Z", "M9 8 V5 H15 V8", "M3 13 H21"]],
  ["ÉTUDES", ["M3 5 H9 A3 3 0 0 1 12 8 V20 A2 2 0 0 0 10 18 H3 Z", "M21 5 H15 A3 3 0 0 0 12 8 V20 A2 2 0 0 1 14 18 H21 Z"]],
];
const MORE: [string, number, number][] = [
  ["Beauté", 90, 1000],
  ["Sport", 420, 1030],
  ["Couture", 700, 990],
  ["Langues", 150, 1130],
  ["Informatique", 470, 1150],
  ["Agriculture", 720, 1110],
];

const SceneTopic: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const times = [at("cuisine"), at("business"), at("etudes")];
  const any = at("peu");
  return (
    <AbsoluteFill>
      <StepChip step={1} total={3} />
      <MaskReveal text="CHOISIS UN PROBLÈME" at={at("choisis")} top={230} size={92} highlight={["PROBLÈME"]} />
      <MaskReveal text="QUE TU SAIS DÉJÀ RÉSOUDRE" at={at("sais")} top={440} size={50} color={theme.muted} weight={800} stagger={2} />
      {TOPICS.map(([label, paths], i) => {
        const s = pop(frame, times[i], fps, 10);
        const wiggle = frame > any ? Math.sin((frame - any) / 3 + i) * 3 * Math.max(0, 1 - (frame - any) / 30) : 0;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 90 + i * 310,
              top: 570,
              width: 280,
              height: 340,
              borderRadius: 40,
              background: theme.surface,
              border: `3px solid ${s > 0.5 ? theme.accent : theme.line}`,
              boxShadow: "0 40px 80px rgba(0,0,0,.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              opacity: Math.min(1, s * 2),
              transform: `translateY(${(1 - s) * 200}px) rotate(${[-6, 0, 6][i] + wiggle}deg) scale(${s})`,
            }}
          >
            <svg width={130} height={130} viewBox="0 0 24 24">
              {paths.map((d, k) => (
                <DrawPath key={k} d={d} progress={prog(frame, times[i] + 3 + k * 3, 16)} stroke={theme.text} strokeWidth={1.5} />
              ))}
            </svg>
            <div style={{ fontFamily, fontWeight: 900, fontSize: 36, letterSpacing: "0.04em", color: theme.text }}>{label}</div>
          </div>
        );
      })}
      {MORE.map(([label, x, y], i) => {
        const s = pop(frame, any + i * 2, fps, 9);
        if (!s) return null;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              padding: "14px 28px",
              borderRadius: 999,
              background: i % 2 ? "rgba(255,255,255,.08)" : "rgba(255,91,34,.16)",
              border: `2px solid ${i % 2 ? "rgba(255,255,255,.15)" : theme.accent}`,
              fontFamily,
              fontWeight: 800,
              fontSize: 34,
              color: theme.text,
              transform: `scale(${s}) rotate(${(i % 3) * 3 - 3}deg)`,
            }}
          >
            {label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scène 3 : « Étape deux : ouvre Claude, et demande-lui… les exemples. » ──
const ASK = "Aide-moi à transformer ce que je sais en guide PDF.";
const OUTLINE: [string, string][] = [
  ["plan", "Introduction"],
  ["chapitres", "Chapitre 1 — Les bases"],
  ["chapitres", "Chapitre 2 — La méthode"],
  ["exemples", "Chapitre 3 — Exemples concrets"],
];

const SceneClaude: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = prog(frame, 0, 20);
  const ask = at("demandelui");
  const chatIn = prog(frame, ask - 4, 12);
  const reply = at("pdf") + 6;
  const pills: [string, string, number, number][] = [
    ["LE PLAN", "plan", 30, 640],
    ["LES CHAPITRES", "chapitres", 660, 800],
    ["LES EXEMPLES", "exemples", 40, 960],
  ];
  return (
    <AbsoluteFill>
      <StepChip step={2} total={3} />
      <MaskReveal text="OUVRE CLAUDE" at={at("ouvre")} top={230} size={100} highlight={["CLAUDE"]} />
      <div
        style={{
          position: "absolute",
          top: 390,
          left: 540 - 200,
          transform: `translateY(${(1 - phoneIn) * 900}px) rotate(${(1 - phoneIn) * -8}deg)`,
        }}
      >
        <Phone width={400}>
          <Img src={staticFile(`${slug}/claude.png`)} style={{ width: "100%", display: "block" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#faf9f5",
              padding: "80px 18px 0",
              fontFamily,
              color: "#1f1e1d",
              transform: `translateX(${(1 - chatIn) * 105}%)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: "2px solid #e8e6dc", fontSize: 26, fontWeight: 800 }}>
              <Spark size={34} />
              Claude
            </div>
            {frame >= ask && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <div style={{ maxWidth: "84%", padding: "14px 18px", borderRadius: "22px 22px 6px 22px", background: "#f0eee6", fontSize: 21, fontWeight: 600, lineHeight: 1.3 }}>
                  {typed(ASK, frame, ask, 1.3)}
                  {typed(ASK, frame, ask, 1.3).length < ASK.length && <Caret color="#d97757" />}
                </div>
              </div>
            )}
            {frame >= reply && (
              <div style={{ marginTop: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 21, fontWeight: 700, opacity: prog(frame, reply, 8) }}>
                  <Spark size={26} />
                  Voici le plan de ton guide :
                </div>
                {OUTLINE.map(([word, line], i) => {
                  const t = at(word) + (i === 2 ? 5 : 0);
                  const p = prog(frame, t, 12);
                  return (
                    <div
                      key={line}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 12,
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: "#fff",
                        border: "2px solid #e8e6dc",
                        fontSize: 19,
                        fontWeight: 700,
                        opacity: p,
                        transform: `translateY(${(1 - p) * 20}px)`,
                      }}
                    >
                      <svg width={26} height={26} viewBox="0 0 24 24">
                        <DrawPath d={ICONS.check[0]} progress={prog(frame, t + 4, 10)} stroke="#d97757" strokeWidth={3} />
                      </svg>
                      {line}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Phone>
      </div>
      {pills.map(([label, word, x, y], i) => {
        const s = pop(frame, at(word), fps, 10);
        if (!s) return null;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              padding: "14px 26px",
              borderRadius: 18,
              background: theme.accent,
              color: theme.ink,
              fontFamily,
              fontWeight: 900,
              fontSize: 40,
              boxShadow: "0 20px 40px rgba(0,0,0,.45)",
              transform: `scale(${s}) rotate(${i % 2 ? 5 : -5}deg)`,
            }}
          >
            {label}
          </div>
        );
      })}
      <Sticker text="GUIDE PDF" at={at("pdf")} top={1150} left={600} rotate={6} />
    </AbsoluteFill>
  );
};

// ─── Scène 4 : « Étape trois : crée ta boutique gratuitement sur Chariow… en vente. » ─
const SceneShop: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = prog(frame, 0, 20);
  const free = at("gratuitement");
  const ring = prog(frame, free, 10);
  const card = pop(frame, at("mets"), fps, 12);
  const onSale = pop(frame, at("vente"), fps, 9);
  // Bouton « Créer une boutique gratuitement » dans la capture (824 px de large → 376 px à l'écran)
  const k = 376 / 824;
  const btn = { x: 340 + 12 + 32 * k, y: 390 + 12 + 975 * k, w: 760 * k, h: 118 * k };
  return (
    <AbsoluteFill>
      <StepChip step={3} total={3} />
      <MaskReveal text="CRÉE TA BOUTIQUE" at={at("cree")} top={230} size={96} highlight={["BOUTIQUE"]} />
      <div
        style={{
          position: "absolute",
          top: 390,
          left: 540 - 200,
          transform: `translateY(${(1 - phoneIn) * 900}px) rotate(${(1 - phoneIn) * 8}deg)`,
        }}
      >
        <Phone width={400}>
          <Img src={staticFile(`${slug}/chariow.png`)} style={{ width: "100%", display: "block" }} />
        </Phone>
      </div>
      {ring > 0 && (
        <div
          style={{
            position: "absolute",
            left: btn.x - 8,
            top: btn.y - 8,
            width: btn.w + 16,
            height: btn.h + 16,
            borderRadius: 24,
            border: `5px solid ${theme.accent}`,
            boxShadow: `0 0 ${20 + Math.sin(frame / 4) * 10}px ${theme.accent}`,
            opacity: ring,
            transform: `scale(${mix(ring, 1.3, 1)})`,
          }}
        />
      )}
      <Tap at={free + 6} x={btn.x + btn.w / 2} y={btn.y + btn.h / 2} />
      <Sticker text="GRATUIT" at={free} top={760} left={690} rotate={8} bg={theme.accent} color={theme.ink} />
      {card > 0 && (
        <div
          style={{
            position: "absolute",
            left: 540 - 320,
            top: 1000,
            width: 640,
            padding: 22,
            borderRadius: 34,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontFamily,
            color: theme.ink,
            boxShadow: "0 40px 90px rgba(0,0,0,.6)",
            transform: `translateY(${(1 - card) * 400}px) rotate(${(1 - card) * -6}deg)`,
          }}
        >
          <GuideCover scale={0.34} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.02em" }}>Mon guide (PDF)</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#6b6b70", marginTop: 6 }}>Produit digital</div>
            {onSale > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 14,
                  padding: "8px 18px",
                  borderRadius: 999,
                  background: "#e6f7ec",
                  color: "#118a3e",
                  fontSize: 26,
                  fontWeight: 900,
                  transform: `scale(${onSale})`,
                  transformOrigin: "left center",
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: 7, background: "#1fbf5b" }} />
                EN VENTE
              </div>
            )}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Scène 5 : « Tes clients paient par Orange Money, Wave ou MTN… automatiquement. » ─
const METHODS: [string, string, string, string][] = [
  ["orange", "Orange Money", "#ff7900", "#fff"],
  ["wave", "Wave", "#1dc3f2", "#0b2a4a"],
  ["mtn", "MTN MoMo", "#ffcc00", "#0b0b0c"],
];

const ScenePay: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = prog(frame, at("paient") - 6, 20);
  const confirmed = at("recoivent");
  const auto = at("automatiquement");
  const dl = interpolate(frame, [at("guide", 2), auto + 12], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <MaskReveal text="TES CLIENTS PAIENT PAR" at={0} top={190} size={62} weight={800} stagger={2} />
      {METHODS.map(([word, label, bg, fg], i) => {
        const s = pop(frame, at(word), fps, 10);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 60 + i * 335,
              top: 300,
              width: 290,
              height: 150,
              borderRadius: 32,
              background: bg,
              color: fg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily,
              fontWeight: 900,
              fontSize: 40,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              boxShadow: `0 30px 60px ${bg}44`,
              opacity: Math.min(1, s * 2),
              transform: `translateY(${(1 - s) * 120}px) scale(${s})`,
            }}
          >
            {label}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          top: 520,
          left: 540 - 175,
          transform: `translateY(${(1 - phoneIn) * 1100}px)`,
        }}
      >
        <Phone width={350}>
          <div style={{ padding: "80px 20px 0", fontFamily, color: theme.text }}>
            {frame < confirmed ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 800, color: theme.muted, letterSpacing: "0.1em" }}>PAIEMENT</div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 16 }}>
                  <GuideCover scale={0.2} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>Mon guide (PDF)</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: theme.muted, marginTop: 4 }}>Livraison instantanée</div>
                  </div>
                </div>
                {METHODS.map(([word, label, bg], i) => {
                  const active = frame >= at(word) && (i === 2 || frame < at(METHODS[i + 1][0]));
                  return (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: i ? 10 : 26,
                        padding: "14px 16px",
                        borderRadius: 16,
                        background: "#1c1c1f",
                        border: `3px solid ${active ? bg : "transparent"}`,
                        fontSize: 20,
                        fontWeight: 800,
                      }}
                    >
                      <div style={{ width: 22, height: 22, borderRadius: 11, border: `3px solid ${active ? bg : "#4a4a52"}`, background: active ? bg : "transparent" }} />
                      {label}
                    </div>
                  );
                })}
                <div
                  style={{
                    marginTop: 22,
                    padding: "16px 0",
                    borderRadius: 16,
                    background: theme.accent,
                    color: theme.ink,
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: 900,
                    transform: `scale(${frame >= confirmed - 5 ? 0.94 : 1})`,
                  }}
                >
                  Payer
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 30 }}>
                <div
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 75,
                    background: "#1fbf5b",
                    transform: `scale(${pop(frame, confirmed, fps, 9)})`,
                    boxShadow: "0 0 60px #1fbf5b88",
                  }}
                >
                  <svg width={150} height={150} viewBox="0 0 24 24">
                    <DrawPath d={ICONS.check[0]} progress={prog(frame, confirmed + 4, 12)} stroke="#fff" strokeWidth={2.4} />
                  </svg>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 22 }}>Paiement confirmé</div>
                {dl > 0 && (
                  <div
                    style={{
                      width: "100%",
                      marginTop: 30,
                      padding: 16,
                      borderRadius: 18,
                      background: "#1c1c1f",
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      opacity: prog(frame, at("guide", 2), 8),
                    }}
                  >
                    <GuideCover scale={0.16} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 19, fontWeight: 800 }}>mon-guide.pdf</div>
                      <div style={{ height: 10, borderRadius: 5, background: "#2c2c31", marginTop: 12, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${dl * 100}%`, background: "#1fbf5b" }} />
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: dl >= 1 ? "#1fbf5b" : theme.muted, marginTop: 8 }}>
                        {dl >= 1 ? "Reçu ✓" : "Envoi automatique…"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Phone>
      </div>
      <MaskReveal text="LIVRÉ AUTOMATIQUEMENT" at={auto} top={1290} size={62} highlight={["AUTOMATIQUEMENT"]} stagger={4} />
    </AbsoluteFill>
  );
};

// ─── Scène 6 : « Tu le crées une fois… autant de fois que tu veux. » ─────────
const SceneMultiply: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const main = pop(frame, 2, fps, 12);
  const sell = at("vendre");
  const N = 14;
  return (
    <AbsoluteFill>
      <MaskReveal text="TU LE CRÉES UNE FOIS…" at={0} top={190} size={80} highlight={["UNE", "FOIS…"]} />
      {Array.from({ length: N }, (_, i) => {
        const s = prog(frame, sell + i * 1.5, 22);
        if (s <= 0) return null;
        const a = (i / N) * Math.PI * 2 + 0.3;
        const r = 330 + (i % 3) * 70;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540 - 72 + Math.cos(a) * r * s,
              top: 720 - 96 + Math.sin(a) * r * 0.9 * s,
              transform: `rotate(${Math.cos(a) * 25 * s + frame * (i % 2 ? 0.4 : -0.4)}deg) scale(${mix(s, 0.3, 1)})`,
              opacity: Math.min(1, s * 3),
            }}
          >
            <GuideCover scale={0.4} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 540 - 180 * 0.85,
          top: 720 - 240 * 0.85,
          transform: `scale(${main * (1 + prog(frame, sell, 6) * 0.08 - prog(frame, sell + 6, 10) * 0.08)})`,
        }}
      >
        <GuideCover scale={0.85} />
      </div>
      <MaskReveal text="VENDS-LE AUTANT DE FOIS QUE TU VEUX" at={sell} top={1170} size={72} highlight={["AUTANT", "DE", "FOIS"]} stagger={3} />
    </AbsoluteFill>
  );
};

// ─── Scène 7 : « Écris « guide » en commentaire… le prompt exact… » ──────────
const SceneCTA: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typeAt = at("guide", 3);
  const word = typed("guide", frame, typeAt, 0.5);
  const send = typeAt + 14;
  const posted = prog(frame, send + 2, 16);
  const input = pop(frame, 0, fps, 13);
  const dm = pop(frame, at("prompt"), fps, 12);
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
      {posted > 0 && (
        <div
          style={{
            position: "absolute",
            left: 130,
            top: mix(posted, 420, 240),
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
            guide
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 420,
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
          {frame < send && word ? word : "Ajouter un commentaire…"}
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
      <Slam text="ÉCRIS « GUIDE »" at={at("ecris")} top={640} size={116} color={theme.ink} />
      <MaskReveal text="EN COMMENTAIRE" at={at("commentaire")} top={790} size={84} color={theme.text} />
      {dm > 0 && (
        <div
          style={{
            position: "absolute",
            left: 540 - 330,
            top: 990,
            width: 660,
            padding: "26px 30px",
            borderRadius: 36,
            background: theme.ink,
            color: theme.text,
            fontFamily,
            boxShadow: "0 40px 80px rgba(0,0,0,.35)",
            transform: `translateY(${(1 - dm) * 300}px) rotate(${(1 - dm) * 6}deg)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 900, letterSpacing: "0.04em" }}>
            <Spark size={40} />
            LE PROMPT EXACT
          </div>
          {[0.95, 0.8, 0.9, 0.6].map((w, i) => (
            <div key={i} style={{ height: 14, width: `${w * 100}%`, borderRadius: 7, background: "#3a3a40", marginTop: i ? 12 : 22, filter: "blur(1px)" }} />
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Montage ────────────────────────────────────────────────────────────────
export const GuideChariow: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number) => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });

  const S2 = f("etape");
  const S3 = f("etape", 1);
  const S4 = f("etape", 2);
  const S5 = f("tes");
  const S6 = f("tu", 3);
  const S7 = f("ecris");

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      <Music slug={slug} />
      <Sfx at={0} name="whoosh" volume={0.5} />
      <Sfx at={f("soir")} name="pop" volume={0.6} />
      <Sfx at={f("avec")} name="whoosh" volume={0.5} />
      <Sfx at={S2 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("cuisine")} name="pop" volume={0.55} />
      <Sfx at={f("business")} name="pop" volume={0.55} />
      <Sfx at={f("etudes")} name="pop" volume={0.55} />
      <Sfx at={f("peu")} name="tick" volume={0.35} />
      <Sfx at={S3 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("demandelui")} name="typing" volume={0.6} />
      <Sfx at={f("plan")} name="notif" volume={0.5} />
      <Sfx at={f("chapitres")} name="pop" volume={0.45} />
      <Sfx at={f("exemples")} name="pop" volume={0.45} />
      <Sfx at={f("pdf")} name="ding" volume={0.5} />
      <Sfx at={S4 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("gratuitement") + 6} name="pop" volume={0.6} />
      <Sfx at={f("vente")} name="ding" volume={0.5} />
      <Sfx at={S5 - 6} name="whoosh_big" volume={0.5} />
      <Sfx at={f("orange")} name="pop" volume={0.5} />
      <Sfx at={f("wave")} name="pop" volume={0.5} />
      <Sfx at={f("mtn")} name="pop" volume={0.5} />
      <Sfx at={f("recoivent")} name="ding" volume={0.6} />
      <Sfx at={f("automatiquement")} name="notif" volume={0.5} />
      <Sfx at={S6 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("vendre")} name="whoosh_big" volume={0.4} />
      <Sfx at={S7 - 6} name="whoosh_big" volume={0.5} />
      <Sfx at={f("ecris")} name="impact" volume={0.6} />
      <Sfx at={f("guide", 3) + 14} name="pop" volume={0.6} />
      <Sfx at={f("prompt")} name="notif" volume={0.6} />

      <MotionBlur>
        <AbsoluteFill>
          <Backdrop />
          <Camera shakes={[f("gratuitement") + 6, f("ecris")]}>
            <SceneTrack
              scenes={[
                { from: 0, render: <SceneHook {...scene(0)} /> },
                { from: S2, transition: "whip", render: <SceneTopic {...scene(S2)} /> },
                { from: S3, transition: "whip", render: <SceneClaude {...scene(S3)} /> },
                { from: S4, transition: "whip", render: <SceneShop {...scene(S4)} /> },
                { from: S5, transition: "zoom", render: <ScenePay {...scene(S5)} /> },
                { from: S6, transition: "whip", render: <SceneMultiply {...scene(S6)} /> },
                { from: S7, transition: "wipe", push: 0.03, render: <SceneCTA {...scene(S7)} /> },
              ]}
            />
            <Captions words={timing.words} hide={[[S7, durationInFrames]]} />
          </Camera>
        </AbsoluteFill>
      </MotionBlur>
      <Grain />
    </AbsoluteFill>
  );
};
