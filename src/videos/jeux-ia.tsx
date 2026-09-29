import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Captions } from "../lib/Captions";
import { clamp, EASE_IN, EASE_IN_OUT, mix, prog } from "../lib/ease";
import { Browser, DrawPath, ICONS, Phone } from "../lib/Graphics";
import { Highlight, inPhone, pop, Spark, Tap } from "../lib/Kit";
import { SceneTrack } from "../lib/SceneTrack";
import { Backdrop, Camera, Grain, MotionBlur, Music, Sfx, Voice } from "../lib/Stage";
import { Caret, MaskReveal, Slam, StepChip, Sticker, typed } from "../lib/Text";
import { fontFamily, theme } from "../lib/theme";
import { insertGap, timeOf, type VideoProps } from "../lib/timing";

/** Pause (s) insérée avant « Tout est expliqué… » pour laisser lire l'exemple AdSense. */
export const JEUX_IA_GAP = 2.3;

/** `at("mot", n)` = frame (locale à la scène) de la n-ième occurrence du mot. */
type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

const GOOGLE = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

/** Vidéo de gameplay (public/<slug>/gp-<name>.mp4), muette, qui remplit son parent. */
const Gameplay: React.FC<{ slug: string; name: string; from?: number }> = ({ slug, name, from = 0 }) => (
  <OffthreadVideo
    src={staticFile(`${slug}/gp-${name}.mp4`)}
    muted
    trimBefore={from}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
  />
);

/** Étiquette du type de jeu, posée en bas de l'écran du téléphone. */
const TypeChip: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, 2, 10);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          padding: "8px 20px",
          borderRadius: 999,
          background: "rgba(11,11,12,.8)",
          border: `2px solid ${theme.accent}`,
          color: theme.text,
          fontFamily,
          fontWeight: 900,
          fontSize: 24,
          letterSpacing: "0.08em",
          opacity: p,
          transform: `translateY(${(1 - p) * 20}px)`,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Capture AdSense du dossier source, toujours marquée « EXEMPLE » (ce ne sont pas des gains réels). */
const ExampleShot: React.FC<{ slug: string; width: number; height: number; zoom?: number }> = ({
  slug,
  width,
  height,
  zoom = 1,
}) => (
  <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", top: -58, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          padding: "8px 20px",
          borderRadius: 999,
          background: theme.accent,
          color: theme.ink,
          fontFamily,
          fontWeight: 900,
          fontSize: Math.max(20, width * 0.045),
          letterSpacing: "0.1em",
          whiteSpace: "nowrap",
        }}
      >
        EXEMPLE · TABLEAU ADSENSE
      </div>
    </div>
    <div
      style={{
        width,
        height,
        borderRadius: width * 0.06,
        overflow: "hidden",
        border: "3px solid rgba(255,255,255,.15)",
        boxShadow: `0 60px 120px rgba(0,0,0,.7), 0 0 80px ${theme.accent}33`,
      }}
    >
      <Img
        src={staticFile(`${slug}/adsense-exemple.png`)}
        style={{ width, display: "block", transform: `scale(${zoom})`, transformOrigin: "10% 22%" }}
      />
    </div>
  </div>
);

const AdSenseChip: React.FC<{ s: number; top: number; size?: number }> = ({ s, top, size = 40 }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 32px",
        borderRadius: 999,
        background: "#fff",
        color: "#3c4043",
        fontFamily,
        fontWeight: 800,
        fontSize: size,
        boxShadow: "0 30px 60px rgba(0,0,0,.5)",
        transform: `scale(${s}) translateY(${(1 - s) * 80}px)`,
        opacity: Math.min(1, s * 2),
      }}
    >
      <div style={{ display: "flex", gap: 6 }}>
        {GOOGLE.map((c) => (
          <div key={c} style={{ width: size * 0.36, height: size * 0.36, borderRadius: size, background: c }} />
        ))}
      </div>
      Google AdSense
    </div>
  </div>
);

/** Pièces qui volent de (x0, y0) vers (x1, y1) à partir de `at`. */
const Coins: React.FC<{ at: number; n?: number; from: [number, number][]; to: [number, number] }> = ({
  at,
  n = 8,
  from,
  to,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const t0 = at + i * 4;
        const p = prog(frame, t0, 16, EASE_IN);
        if (frame < t0 || p >= 1) return null;
        const [x0, y0] = from[i % from.length];
        const x = mix(p, x0, to[0]) + Math.sin(p * Math.PI) * (i % 2 ? 70 : -70);
        const y = mix(p, y0, to[1]) - Math.sin(p * Math.PI) * 140;
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
    </>
  );
};

// ─── Scène 1 : « Tu peux créer ton propre jeu avec l'IA, sans… code… AdSense. » ─
const HOOK_CLIPS: [string, string, number][] = [
  ["foule", "JEU DE FOULE", 60],
  ["course", "JEU DE COURSE", 30],
  ["chateau", "DÉFENSE DE CHÂTEAU", 90],
];

const SceneHook: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = prog(frame, 4, 22);
  const code = at("code");
  const noCode = pop(frame, at("sans"), fps, 11);
  const google = pop(frame, at("google"), fps, 11);
  const money = at("gagner");
  const shift = prog(frame, money, 18, EASE_IN_OUT);
  const shot = pop(frame, money + 4, fps, 13);
  const cut = [0, 50, 100, 400];
  return (
    <AbsoluteFill>
      <MaskReveal text="CRÉE TON JEU" at={0} top={180} size={120} highlight={["JEU"]} />
      <MaskReveal text="AVEC L'IA" at={at("avec")} out={at("sans") - 4} top={320} size={76} color={theme.muted} weight={800} />
      <MaskReveal text="ZÉRO LIGNE DE CODE" at={at("sans") + 2} out={at("gagner") - 4} top={320} size={76} color={theme.accent} />
      <MaskReveal text="+ DE L'ARGENT AVEC" at={at("gagner")} top={320} size={76} color={theme.text} highlight={["L'ARGENT"]} />
      <div
        style={{
          position: "absolute",
          top: 450,
          left: 540 - 180,
          transform: `perspective(1600px) translateX(${-shift * 190}px) translateY(${(1 - phoneIn) * 1300}px) rotateY(${mix(phoneIn, -25, -6) + Math.sin(frame / 20) * 3}deg) rotateZ(${mix(phoneIn, 10, 2) - shift * 6}deg) scale(${1 - shift * 0.1})`,
        }}
      >
        <Phone width={360}>
          {HOOK_CLIPS.map(([name, label, from], i) => (
            <Sequence key={name} from={cut[i]} durationInFrames={cut[i + 1] - cut[i]}>
              <Gameplay slug={slug} name={name} from={from} />
              <TypeChip label={label} />
            </Sequence>
          ))}
        </Phone>
      </div>
      {shot > 0 && (
        <div
          style={{
            position: "absolute",
            left: 560,
            top: 560,
            transform: `translateX(${(1 - shot) * 600}px) rotate(${4 + (1 - shot) * 15}deg)`,
          }}
        >
          <ExampleShot slug={slug} width={420} height={560} />
        </div>
      )}
      {noCode > 0 && shift < 1 && (
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 760,
            width: 190,
            height: 190,
            borderRadius: 95,
            background: theme.surface,
            border: `4px solid ${theme.line}`,
            boxShadow: "0 30px 60px rgba(0,0,0,.5)",
            opacity: 1 - shift,
            transform: `scale(${noCode * (1 - shift * 0.4)}) rotate(${(1 - noCode) * -30}deg)`,
          }}
        >
          <svg width={190} height={190} viewBox="-3 -3 30 30">
            {ICONS.code.map((d, k) => (
              <DrawPath key={k} d={d} progress={prog(frame, at("sans") + 4 + k * 3, 12)} stroke={theme.text} strokeWidth={1.8} />
            ))}
            <DrawPath d="M3 21 L21 3" progress={prog(frame, code, 8, EASE_IN_OUT)} stroke={theme.accent} strokeWidth={2.6} />
          </svg>
        </div>
      )}
      <Coins at={at("l'argent")} from={[[400, 900], [680, 820], [540, 700]]} to={[540, 1290]} />
      <AdSenseChip s={google} top={1240} />
    </AbsoluteFill>
  );
};

// ─── Scène 2 : « Regarde : ce jeu, Sol Rush, je l'ai créé avec l'IA. » ────────
const SceneSolRush: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const phone = { left: 340, top: 380, width: 400 };
  const phoneIn = prog(frame, 0, 20);
  const a = inPhone(phone, 36, 492);
  const b = inPhone(phone, 788, 656);
  const tap = at("sol") + 2;
  const play = tap + 10;
  return (
    <AbsoluteFill>
      <MaskReveal text="REGARDE CE JEU" at={0} top={190} size={96} highlight={["JEU"]} />
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: prog(frame, at("sol"), 10),
        }}
      >
        <div style={{ padding: "8px 22px", borderRadius: 999, background: "rgba(255,255,255,.08)", border: "2px solid rgba(255,255,255,.15)", fontFamily, fontWeight: 800, fontSize: 32, color: theme.text }}>
          solrush.site
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: phone.top,
          left: phone.left,
          transform: `translateY(${(1 - phoneIn) * 1000}px) rotate(${(1 - phoneIn) * 8}deg)`,
        }}
      >
        <Phone width={phone.width}>
          <Img src={staticFile(`${slug}/solrush.png`)} style={{ width: "100%", display: "block" }} />
          <Sequence from={play}>
            <AbsoluteFill style={{ opacity: prog(frame, play, 8), background: "#fff" }}>
              <Gameplay slug={slug} name="solrush" from={20} />
            </AbsoluteFill>
          </Sequence>
        </Phone>
      </div>
      {frame < play && <Highlight at={tap - 8} x={a.x} y={a.y} w={b.x - a.x} h={b.y - a.y} radius={30} />}
      <Tap at={tap} x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} />
      <Sticker text="CRÉÉ AVEC L'IA" at={at("cree")} top={1110} left={470} rotate={-6} bg={theme.accent} color={theme.ink} size={50} />
    </AbsoluteFill>
  );
};

// ─── Scène 3 : « Étape un : va sur le Play Store… sans le copier. » ──────────
const SceneStore: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const phone = { left: 350, top: 440, width: 380 };
  const phoneIn = prog(frame, 0, 20);
  const a = inPhone(phone, 40, 690);
  const b = inPhone(phone, 784, 820);
  return (
    <AbsoluteFill>
      <StepChip step={1} total={3} />
      <MaskReveal text="VA SUR LE PLAY STORE" at={4} top={230} size={84} highlight={["PLAY", "STORE"]} />
      <div
        style={{
          position: "absolute",
          top: phone.top,
          left: phone.left,
          transform: `translateY(${(1 - phoneIn) * 1000}px) rotate(${(1 - phoneIn) * -8}deg)`,
        }}
      >
        <Phone width={phone.width}>
          <Img src={staticFile(`${slug}/playstore.png`)} style={{ width: "100%", display: "block" }} />
        </Phone>
      </div>
      <Highlight at={at("repere")} x={a.x} y={a.y} w={b.x - a.x} h={b.y - a.y} />
      <Sticker text="ÇA CARTONNE" at={at("cartonne")} top={a.y - 90} left={640} rotate={7} size={44} />
      <Sticker text="INSPIRE-TOI" at={at("inspiretoi")} top={1030} left={80} rotate={-6} bg={theme.accent} color={theme.ink} size={54} />
      <Sticker text="SANS COPIER" at={at("copier")} top={1150} left={560} rotate={5} size={48} />
    </AbsoluteFill>
  );
};

// ─── Scène 4 : « Étape deux : décris ton idée à Claude… ton propre site. » ────
const IDEA = "Crée-moi un jeu de stratégie 1 contre 1, inspiré d'un jeu de plateau classique.";

const SceneClaude: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = prog(frame, 0, 20);
  const ask = at("decris");
  const text = typed(IDEA, frame, ask, 1.7);
  const reply = at("fabrique");
  const game = pop(frame, at("jeu", 3), fps, 12);
  const live = pop(frame, at("mets"), fps, 12);
  return (
    <AbsoluteFill>
      <StepChip step={2} total={3} />
      <MaskReveal text="DÉCRIS TON IDÉE À CLAUDE" at={ask - 4} top={230} size={80} highlight={["CLAUDE"]} />
      <div
        style={{
          position: "absolute",
          top: 440,
          left: 540 - 190,
          transform: `translateY(${(1 - phoneIn) * 1000}px) rotate(${(1 - phoneIn) * 8}deg)`,
        }}
      >
        <Phone width={380}>
          <div style={{ position: "absolute", inset: 0, background: "#faf9f5", padding: "76px 16px 0", fontFamily, color: "#1f1e1d" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "2px solid #e8e6dc", fontSize: 24, fontWeight: 800 }}>
              <Spark size={32} />
              Claude
            </div>
            {frame >= ask && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <div style={{ maxWidth: "86%", padding: "12px 16px", borderRadius: "20px 20px 6px 20px", background: "#f0eee6", fontSize: 19, fontWeight: 600, lineHeight: 1.3 }}>
                  {text}
                  {text.length < IDEA.length && <Caret color="#d97757" />}
                </div>
              </div>
            )}
            {frame >= reply && (
              <div style={{ marginTop: 18, opacity: prog(frame, reply, 8) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 19, fontWeight: 700 }}>
                  <Spark size={24} />
                  Voilà ton jeu, prêt à jouer :
                </div>
                {game > 0 && (
                  <div
                    style={{
                      position: "relative",
                      marginTop: 12,
                      height: 250,
                      borderRadius: 16,
                      overflow: "hidden",
                      border: `3px solid ${theme.accent}`,
                      transform: `scale(${game})`,
                    }}
                  >
                    <Sequence from={at("jeu", 3)}>
                      <Gameplay slug={slug} name="chateau" from={150} />
                    </Sequence>
                  </div>
                )}
              </div>
            )}
          </div>
        </Phone>
      </div>
      {live > 0 && (
        <div
          style={{
            position: "absolute",
            top: 1120,
            left: 540 - 330,
            transform: `translateY(${(1 - live) * 300}px) scale(${mix(live, 0.8, 1)})`,
          }}
        >
          <Browser
            width={660}
            height={98}
            url={typed("tonjeu.site", frame, at("mets") + 4, 0.8)}
            loading={interpolate(frame, [at("ligne", 1), at("site") - 2], [0, 1], clamp)}
            badge={
              frame >= at("site") ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "#0f2a1a",
                    color: "#3ddc84",
                    fontFamily,
                    fontWeight: 900,
                    fontSize: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: 6, background: "#3ddc84" }} />
                  EN LIGNE
                </div>
              ) : null
            }
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Scène 5 : « Étape trois : connecte ton site à Google AdSense… revenus. » ─
const AVATARS: [number, number, string][] = [
  [110, 560, "#7c5cff"],
  [880, 610, "#25d366"],
  [90, 860, "#2ec4ff"],
  [890, 900, "#ff2d55"],
];

const SceneAds: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = prog(frame, 0, 20);
  const valid = at("valide");
  const pubs = at("pubs");
  const toGame = prog(frame, pubs - 6, 14, EASE_IN_OUT);
  const adIn = prog(frame, pubs, 12);
  const players = at("gens");
  const chip = pop(frame, at("touches"), fps, 11);
  const shot = at("revenus") + 8;
  const shotP = prog(frame, shot, 18);
  return (
    <AbsoluteFill>
      <StepChip step={3} total={3} />
      <MaskReveal text="CONNECTE GOOGLE ADSENSE" at={at("connecte") - 4} top={230} size={80} highlight={["ADSENSE"]} />
      <div
        style={{
          position: "absolute",
          top: 440,
          left: 540 - 190,
          transform: `translateY(${(1 - phoneIn) * 1000}px) rotate(${(1 - phoneIn) * -8}deg)`,
        }}
      >
        <Phone width={380}>
          <Img src={staticFile(`${slug}/adsense.png`)} style={{ width: "100%", display: "block", opacity: 1 - toGame }} />
          {toGame > 0 && (
            <div style={{ position: "absolute", inset: 0, background: "#0e0e10", opacity: toGame }}>
              <Sequence from={pubs - 6}>
                <Gameplay slug={slug} name="golf" from={30} />
                <TypeChip label="MINI-GOLF" />
              </Sequence>
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  top: 70,
                  height: 64,
                  borderRadius: 14,
                  background: "#fff7e0",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 14px",
                  fontFamily,
                  transform: `translateY(${(1 - adIn) * -120}px)`,
                  boxShadow: "0 12px 30px rgba(0,0,0,.4)",
                }}
              >
                <div style={{ padding: "3px 8px", borderRadius: 6, background: "#ffb800", color: theme.ink, fontWeight: 900, fontSize: 15 }}>PUB</div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 9, width: "60%", borderRadius: 5, background: "#d9cfb5" }} />
                  <div style={{ height: 8, width: "85%", borderRadius: 5, background: "#ebe2c9", marginTop: 7 }} />
                </div>
              </div>
            </div>
          )}
        </Phone>
      </div>
      {frame >= valid && frame < pubs + 4 && (
        <div style={{ position: "absolute", top: 820, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 30px",
              borderRadius: 999,
              background: "#1fbf5b",
              color: "#fff",
              fontFamily,
              fontWeight: 900,
              fontSize: 44,
              boxShadow: "0 30px 60px rgba(0,0,0,.5), 0 0 50px #1fbf5b88",
              transform: `scale(${pop(frame, valid, fps, 9)})`,
              opacity: 1 - prog(frame, pubs - 4, 8),
            }}
          >
            <svg width={48} height={48} viewBox="0 0 24 24">
              <DrawPath d={ICONS.check[0]} progress={prog(frame, valid + 4, 10)} stroke="#fff" strokeWidth={3} />
            </svg>
            SITE VALIDÉ
          </div>
        </div>
      )}
      {AVATARS.map(([x, y, c], i) => {
        const s = pop(frame, players + i * 3, fps, 9);
        if (!s) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + Math.sin(frame / 10 + i) * 8,
              width: 96,
              height: 96,
              borderRadius: 48,
              background: c,
              border: `5px solid ${theme.bg}`,
              overflow: "hidden",
              transform: `scale(${s})`,
              boxShadow: "0 16px 30px rgba(0,0,0,.5)",
            }}
          >
            <div style={{ position: "absolute", left: 30, top: 16, width: 36, height: 36, borderRadius: 18, background: "rgba(255,255,255,.85)" }} />
            <div style={{ position: "absolute", left: 16, top: 58, width: 64, height: 50, borderRadius: 32, background: "rgba(255,255,255,.85)" }} />
          </div>
        );
      })}
      <Coins at={pubs + 8} n={10} from={[[540, 560], [420, 600], [660, 600]]} to={[540, 1290]} />
      <AdSenseChip s={Math.max(chip, pop(frame, pubs + 6, fps, 11))} top={1240} size={38} />
      {frame < shot + 8 && (
        <Sticker text="TA PART DES REVENUS" at={at("part")} top={1110} left={470} rotate={-5} bg={theme.accent} color={theme.ink} size={44} />
      )}
      {frame >= shot && (
        <>
          <AbsoluteFill style={{ background: `rgba(11,11,12,${shotP * 0.82})` }} />
          <div
            style={{
              position: "absolute",
              left: 540 - 300,
              top: 430,
              opacity: Math.min(1, shotP * 2),
              transform: `translateY(${(1 - shotP) * 600}px) rotate(${(1 - shotP) * -8}deg) scale(${mix(shotP, 0.6, 1)})`,
            }}
          >
            <ExampleShot slug={slug} width={600} height={880} zoom={1 + prog(frame, shot + 22, 26, EASE_IN_OUT) * 0.3} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ─── Scène 6 : « Tout est expliqué… Game Build… Le lien est dans ma bio. » ────
const SceneCTA: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phone = { left: 350, top: 330, width: 380 };
  const phoneIn = prog(frame, 0, 22);
  // Capture remontée de SCROLL px (image) pour que le bouton d'achat soit entièrement visible
  const SCROLL = 170;
  const a = inPhone(phone, 130, 1705 - SCROLL);
  const b = inPhone(phone, 694, 1808 - SCROLL);
  const chips: [string, string, number][] = [
    ["2 GUIDES PDF", "guides", 130],
    ["+ TUTO VIDÉO", "tutoriel", 560],
  ];
  return (
    <AbsoluteFill style={{ background: theme.accent }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 - (380 + i * 200),
            top: 720 - (380 + i * 200),
            width: 760 + i * 400,
            height: 760 + i * 400,
            borderRadius: "50%",
            border: "3px solid rgba(0,0,0,.1)",
            transform: `scale(${1 + frame * 0.003 * (i + 1)})`,
          }}
        />
      ))}
      <MaskReveal text="TOUT EST EXPLIQUÉ" at={0} top={170} size={84} color={theme.ink} />
      <div
        style={{
          position: "absolute",
          top: phone.top,
          left: phone.left,
          transform: `translateY(${(1 - phoneIn) * 1100}px) rotate(${(1 - phoneIn) * 8}deg)`,
        }}
      >
        <Phone width={phone.width}>
          <Img src={staticFile(`${slug}/vente.png`)} style={{ width: "100%", display: "block", marginTop: -SCROLL * a.k }} />
        </Phone>
      </div>
      <Highlight at={at("game")} x={a.x} y={a.y} w={b.x - a.x} h={b.y - a.y} radius={40} />
      <Tap at={at("game") + 12} x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} />
      <Slam text="GAME BUILD" at={at("game")} top={1150} size={140} color={theme.ink} />
      {chips.map(([label, word, x], i) => {
        const s = pop(frame, at(word), fps, 10);
        if (!s) return null;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: x,
              top: 1320,
              padding: "14px 28px",
              borderRadius: 18,
              background: "#fff",
              color: theme.ink,
              fontFamily,
              fontWeight: 900,
              fontSize: 44,
              boxShadow: "0 20px 40px rgba(0,0,0,.2)",
              transform: `scale(${s}) rotate(${i ? 4 : -4}deg)`,
            }}
          >
            {label}
          </div>
        );
      })}
      <Sticker text="LIEN DANS MA BIO ↑" at={at("lien")} top={1450} left={230} rotate={-3} bg={theme.ink} color="#fff" size={60} />
    </AbsoluteFill>
  );
};

// ─── Montage ────────────────────────────────────────────────────────────────
export const JeuxIA: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!timing) return null;
  const cutSec = timeOf(timing, "tout") - 0.05;
  const tl = insertGap(timing, cutSec, JEUX_IA_GAP);
  const f = (w: string, occ = 0) => Math.round(timeOf(tl, w, occ) * fps);
  const scene = (from: number) => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });

  const S2 = f("regarde");
  const S3 = f("etape");
  const S4 = f("etape", 1);
  const S5 = f("etape", 2);
  const S6 = f("tout");

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Voice slug={slug} cut={Math.round(cutSec * fps)} gap={Math.round(JEUX_IA_GAP * fps)} />
      <Music slug={slug} />
      <Sfx at={4} name="whoosh" volume={0.5} />
      <Sfx at={f("sans") + 4} name="pop" volume={0.5} />
      <Sfx at={f("code")} name="impact" volume={0.6} />
      <Sfx at={f("l'argent")} name="coin" volume={0.6} />
      <Sfx at={f("google")} name="pop" volume={0.6} />
      <Sfx at={S2 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("rush") + 14} name="pop" volume={0.6} />
      <Sfx at={f("cree")} name="ding" volume={0.5} />
      <Sfx at={S3 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("repere")} name="pop" volume={0.5} />
      <Sfx at={f("inspiretoi")} name="pop" volume={0.5} />
      <Sfx at={f("copier")} name="pop" volume={0.5} />
      <Sfx at={S4 - 5} name="whoosh" volume={0.6} />
      <Sfx at={f("decris")} name="typing" volume={0.6} />
      <Sfx at={f("fabrique")} name="notif" volume={0.5} />
      <Sfx at={f("mets")} name="pop" volume={0.5} />
      <Sfx at={f("site")} name="ding" volume={0.5} />
      <Sfx at={S5 - 6} name="whoosh_big" volume={0.5} />
      <Sfx at={f("valide")} name="ding" volume={0.6} />
      <Sfx at={f("pubs") + 8} name="coin" volume={0.6} />
      <Sfx at={f("touches")} name="coin" volume={0.6} />
      <Sfx at={f("revenus") + 8} name="whoosh" volume={0.5} />
      <Sfx at={f("revenus") + 30} name="ding" volume={0.5} />
      <Sfx at={f("gagner") + 4} name="whoosh" volume={0.5} />
      <Sfx at={S6 - 6} name="whoosh_big" volume={0.5} />
      <Sfx at={f("game")} name="impact" volume={0.6} />
      <Sfx at={f("guides")} name="pop" volume={0.5} />
      <Sfx at={f("tutoriel")} name="pop" volume={0.5} />
      <Sfx at={f("lien")} name="notif" volume={0.6} />

      <MotionBlur>
        <AbsoluteFill>
          <Backdrop />
          <Camera shakes={[f("code"), f("game")]}>
            <SceneTrack
              scenes={[
                { from: 0, render: <SceneHook {...scene(0)} /> },
                { from: S2, transition: "whip", render: <SceneSolRush {...scene(S2)} /> },
                { from: S3, transition: "whip", render: <SceneStore {...scene(S3)} /> },
                { from: S4, transition: "whip", render: <SceneClaude {...scene(S4)} /> },
                { from: S5, transition: "zoom", render: <SceneAds {...scene(S5)} /> },
                { from: S6, transition: "wipe", push: 0.03, render: <SceneCTA {...scene(S6)} /> },
              ]}
            />
            <Captions words={tl.words} hide={[[S6, durationInFrames]]} />
          </Camera>
        </AbsoluteFill>
      </MotionBlur>
      <Grain />
    </AbsoluteFill>
  );
};
