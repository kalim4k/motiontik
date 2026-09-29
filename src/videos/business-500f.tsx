import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  CameraIcon,
  ClaudeWindow,
  CodeCard,
  Coin,
  CoinBurst,
  col,
  CommentBar,
  CommentCard,
  CountUp,
  DownloadIcon,
  Flag,
  type FlagName,
  Flash,
  Hearts,
  HomeScreen,
  Ink,
  ink,
  InkPhone,
  InkTap,
  Magnifier,
  Pin,
  PlayIcon,
  Pop,
  ScreenShot,
  ScreenVideo,
  screenW,
  Sparkles,
  SpeedLines,
  Stars,
  Sun,
  Tag,
} from "../lib/Doodle";
import { clamp, EASE_IN, EASE_IN_OUT, prog } from "../lib/ease";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { captionFont, ComicCaptions, type Expression, Ground, handPos, type PoseKey, Prop, StickMan, stick } from "../lib/Stick";
import { timeOf, type VideoProps } from "../lib/timing";

type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

const comic = (size: number): React.CSSProperties => ({
  fontFamily: captionFont,
  fontWeight: 700,
  fontSize: size,
  color: ink,
  lineHeight: 1,
  whiteSpace: "nowrap",
  WebkitTextStroke: `${size * 0.02}px ${ink}`,
});

/** « ÉTAPE n » en grand au centre, puis petite étiquette en haut à gauche. */
const StepIntro: React.FC<{ n: number; big?: boolean }> = ({ n, big = true }) => (
  <>
    {big && (
      <Pop at={0} x={540} y={900} out={15} z={20}>
        <Burst size={600}>
          <div style={comic(96)}>ÉTAPE {n}</div>
        </Burst>
      </Pop>
    )}
    <Pop at={big ? 13 : 2} x={225} y={455} from="left" rotate={-4} z={19}>
      <Tag text={`Étape ${n}`} bg={col.yellow} size={50} />
    </Pop>
  </>
);

/** Petit perso qui surgit du sol (ressort) à `at`. */
const PopFigure: React.FC<{ x: number; y: number; at: number; height: number; poses: PoseKey[]; expression?: Expression; flip?: boolean; seed?: number }> = ({
  x,
  y,
  at,
  ...rest
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: `${x}px ${y}px` }}>
      <StickMan x={x} y={y} {...rest} />
    </div>
  );
};

/** Pièce de 500 F (vraie photo) qui tourne : `spin` en tours. */
const Piece500: React.FC<{ slug: string; width: number; spin?: number }> = ({ slug, width, spin = 0 }) => {
  const c = Math.cos(spin * Math.PI * 2);
  return (
    <Img
      src={staticFile(`${slug}/${c < 0 ? "piece500-revers" : "piece500-avers"}.png`)}
      style={{ width, display: "block", transform: `scaleX(${Math.max(0.04, Math.abs(c))})`, filter: `drop-shadow(8px 12px 0 ${ink})` }}
    />
  );
};

// 1. Accroche : BUSINESS + fusée qui décolle (« lancer »)
const SceneHook: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  // Décolle un peu avant « lancer » pour traverser l'écran avant le changement de plan
  const go = at("lancer") - 9;
  const ry = interpolate(frame, [go, go + 20], [1750, -500], { ...clamp, easing: EASE_IN });
  const rx = 300 + Math.sin(frame / 2) * 4;
  return (
    <AbsoluteFill>
      <Ground none />
      {frame >= go &&
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const t = frame - go - i * 2;
          if (t < 0) return null;
          const y = interpolate(go + i * 2, [go, go + 20], [1750, -500], { ...clamp, easing: EASE_IN }) + 240;
          const r = 30 + t * 4;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: rx - r + (i % 2 ? 20 : -20),
                top: y - r,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                background: "#fff",
                border: `5px solid ${ink}`,
                opacity: Math.max(0, 1 - t / 30),
              }}
            />
          );
        })}
      <Pop at={at("business")} x={370} y={760} rotate={-6}>
        <Burst size={540}>
          <div style={comic(76)}>BUSINESS</div>
        </Burst>
      </Pop>
      {frame >= go && <Img src={staticFile(`${slug}/fusee.png`)} style={{ position: "absolute", left: rx - 90, top: ry, width: 180 }} />}
      <StickMan
        x={820}
        y={1470}
        height={660}
        variant="full"
        flip
        expression="smug"
        poses={[
          [0, "idle"],
          [at("business"), "point"],
          [at("lancer"), "cheer"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 2. Avec 500 francs (vraie pièce XOF)
const SceneCoin: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const land = at("cinq");
  const fall = prog(frame, 0, Math.max(4, land), EASE_IN);
  const y = interpolate(fall, [0, 1], [-400, 930]);
  const squash = frame >= land ? 1 + Math.sin((frame - land) * 1.2) * 0.08 * Math.max(0, 1 - (frame - land) / 12) : 1;
  const spin = frame < land ? (frame / Math.max(1, land)) * 3 : 3 + Math.sin((frame - land) / 12) * 0.06;
  const shine = prog(frame, land + 6, 12);
  return (
    <AbsoluteFill>
      <Ground none />
      <SpeedLines cx={540} cy={930} />
      <div style={{ position: "absolute", left: 540 - 260, top: y - 265, transform: `scale(${1 / squash}, ${squash})` }}>
        <div style={{ position: "relative", width: 520, borderRadius: "50%", overflow: "hidden" }}>
          <Piece500 slug={slug} width={520} spin={spin} />
          {shine > 0 && shine < 1 && (
            <div
              style={{
                position: "absolute",
                top: -100,
                bottom: -100,
                width: 90,
                left: -150 + shine * 820,
                background: "rgba(255,255,255,.55)",
                transform: "rotate(20deg)",
              }}
            />
          )}
        </div>
      </div>
      <Sparkles at={land + 2} cx={540} cy={930} r={320} n={8} />
      <Pop at={at("francs")} x={540} y={1330} rotate={-4}>
        <Tag text="Seulement !" bg={col.yellow} size={66} />
      </Pop>
    </AbsoluteFill>
  );
};

// 3. Togo, Bénin, Côte d'Ivoire
const SceneFlags: React.FC<SceneProps> = ({ at }) => {
  const cols: [FlagName, string, number, number][] = [
    ["togo", "Togo", 190, at("togo")],
    ["benin", "Bénin", 540, at("benin")],
    ["ci", "Côte d'Ivoire", 885, at("cote")],
  ];
  return (
    <AbsoluteFill>
      <Ground horizon={1360} />
      {cols.map(([name, label, x, a], i) => (
        <div key={name}>
          <Pop at={a} x={x} y={700} rotate={[-5, 3, 6][i]} from="down">
            <Flag name={name} width={270} />
          </Pop>
          <Pop at={a + 3} x={x} y={900} rotate={[4, -3, -5][i]}>
            <Tag text={label} size={i === 2 ? 36 : 44} />
          </Pop>
          <PopFigure x={x} y={1360} at={a + 2} height={290} poses={[[0, "wave"]]} expression="happy" flip={i === 0} seed={i} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

// 4. Bref, en Afrique : zoom sur l'Afrique de l'Ouest puis dézoom sur le continent
const SceneAfrica: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const out = prog(frame, at("afrique") - 4, 14, EASE_IN_OUT);
  const zoom = 1.9 - out * 0.9;
  const W = 720;
  const H = (W * 690) / 736;
  const L = 540 - W / 2;
  const T = 980 - H / 2;
  const pins: [number, number, string][] = [
    [0.269, 0.407, "#f77f00"],
    [0.34, 0.4, "#006a4e"],
    [0.3625, 0.387, "#fcd116"],
  ];
  return (
    <AbsoluteFill>
      <Ground none />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${L + W * 0.32}px ${T + H * 0.4}px` }}>
        <Pop at={0} x={540} y={980}>
          <Img src={staticFile(`${slug}/afrique.png`)} style={{ width: W, display: "block", filter: `drop-shadow(10px 12px 0 ${ink})` }} />
        </Pop>
        {pins.map(([px, py, c], i) => (
          <Pop key={i} at={4 + i * 4} x={L + W * px} y={T + H * py - 30} from="down">
            <Pin size={46} color={c} />
          </Pop>
        ))}
      </AbsoluteFill>
      <Pop at={at("afrique")} x={540} y={480} rotate={-4}>
        <Tag text="Afrique" bg={col.green} color="#fff" size={70} />
      </Pop>
      <Sparkles at={at("afrique") + 4} cx={540} cy={980} r={380} n={8} />
    </AbsoluteFill>
  );
};

// 5. Étape 1 : ouvrir le Play Store
const SceneStep1: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const open = prog(frame, at("store") + 8, 10, EASE_IN);
  const w = 380;
  return (
    <AbsoluteFill>
      <Ground none />
      <StepIntro n={1} />
      <Pop at={14} x={640} y={1000} from="up" rotate={3}>
        <InkPhone width={w} screen="#f7f5ee">
          <HomeScreen at={14} />
          <Pop at={at("play")} x={165} y={330} z={3}>
            <div style={{ transform: `scale(${1 + open * 3})`, filter: `drop-shadow(8px 10px 0 ${ink})` }}>
              <PlayIcon size={200} />
            </div>
          </Pop>
          <InkTap at={at("play") + 6} x={165} y={330} />
        </InkPhone>
      </Pop>
      <StickMan
        x={220}
        y={1480}
        height={560}
        variant="full"
        expression={frame >= at("play") ? "happy" : "neutral"}
        poses={[
          [0, "idle"],
          [at("vas"), "point"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 6. Recherche « jeu populaire »
const SceneSearch: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const q = "jeu populaire".slice(0, Math.max(0, Math.floor((frame - 2) * 1.1)));
  const w = 500;
  return (
    <AbsoluteFill>
      <Ground none />
      <StepIntro n={1} big={false} />
      <Pop at={0} x={560} y={1010} rotate={-2}>
        <InkPhone width={w}>
          <ScreenShot src={`${slug}/playstore.png`} width={screenW(w)} scroll={interpolate(frame, [10, 20], [0, 300], clamp)}>
            <div style={{ position: "absolute", left: 110, top: 12, width: 330, height: 76, background: "#fff" }} />
            <div style={{ position: "absolute", left: 124, top: 22, fontFamily: "Roboto, Arial", fontSize: 34, color: "#202124" }}>
              {q}
              <span style={{ opacity: frame % 14 < 8 ? 1 : 0, color: "#1a73e8" }}>|</span>
            </div>
          </ScreenShot>
        </InkPhone>
      </Pop>
      <Pop at={1} x={850} y={660} from="right" float={14} rotate={-10}>
        <Magnifier size={240} />
      </Pop>
    </AbsoluteFill>
  );
};

// 7. Jeux populaires + téléchargements
const ScenePopular: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <SpeedLines cy={930} color="#f4eed8" />
    <Pop at={at("populaire")} x={230} y={1000} rotate={-9} from="left">
      <InkPhone width={290}>
        <ScreenVideo src={`${slug}/gp-course.mp4`} trim={60} />
      </InkPhone>
    </Pop>
    <Pop at={at("populaire") + 5} x={850} y={1000} rotate={9} from="right">
      <InkPhone width={290}>
        <ScreenVideo src={`${slug}/gp-chateau.mp4`} trim={90} />
      </InkPhone>
    </Pop>
    <Pop at={1} x={540} y={930}>
      <InkPhone width={350}>
        <ScreenVideo src={`${slug}/gp-golf.mp4`} trim={30} />
      </InkPhone>
    </Pop>
    <Pop at={at("populaire") + 2} x={540} y={470} rotate={-5}>
      <Tag text="Top jeux" bg={col.red} color="#fff" size={56} />
    </Pop>
    <Pop at={at("telechargements")} x={540} y={1262}>
      <Stars at={at("telechargements")} size={84} />
    </Pop>
    <Pop at={at("beaucoup")} x={540} y={1420} from="up">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "16px 36px 16px 20px",
          background: "#fff",
          border: `7px solid ${ink}`,
          borderRadius: 999,
          boxShadow: `8px 10px 0 ${ink}`,
        }}
      >
        <DownloadIcon size={110} />
        <CountUp to={100} at={at("beaucoup")} dur={18} size={92} suffix=" M+" />
      </div>
    </Pop>
  </AbsoluteFill>
);

// 8. Étape 2 : capture d'écran du jeu
const SceneShot: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const snap = at("capture");
  const fly = prog(frame, at("d'ecran") + 2, 14, EASE_IN_OUT);
  const w = 400;
  return (
    <AbsoluteFill>
      <Ground none />
      <StepIntro n={2} />
      <Pop at={12} x={520} y={1010} from="up" rotate={-2}>
        <InkPhone width={w}>
          <ScreenVideo src={`${slug}/gp-foule.mp4`} trim={50} />
          <Flash at={snap} />
        </InkPhone>
      </Pop>
      <Pop at={snap - 4} x={850} y={620} rotate={12} wiggle={snap}>
        <CameraIcon size={200} />
      </Pop>
      {frame >= snap + 2 && (
        <div
          style={{
            position: "absolute",
            left: interpolate(fly, [0, 1], [520, 800]),
            top: interpolate(fly, [0, 1], [1010, 1250]),
            transform: `translate(-50%, -50%) rotate(${fly * 10}deg) scale(${interpolate(prog(frame, snap + 2, 8), [0, 1], [1.4, 0.55])})`,
            background: "#fff",
            padding: "14px 14px 44px",
            border: `6px solid ${ink}`,
            boxShadow: `10px 12px 0 ${ink}`,
          }}
        >
          <Img src={staticFile(`${slug}/capture-jeu.png`)} style={{ width: 300, display: "block", border: `4px solid ${ink}` }} />
        </div>
      )}
      <Pop at={at("d'ecran")} x={300} y={1420} rotate={-5}>
        <Tag text="Capture !" bg={col.blue} color="#fff" size={54} />
      </Pop>
    </AbsoluteFill>
  );
};

// 9. Envoyer à Claude : « recrée un jeu comme celui-là »
const SceneClaude: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <StepIntro n={2} big={false} />
    <Pop at={0} x={545} y={960} from="down" rotate={-1}>
      <ClaudeWindow
        width={900}
        height={800}
        image={`${slug}/capture-jeu.png`}
        attachAt={at("claude") + 2}
        prompt="Recrée-moi un jeu comme celui-là"
        typeAt={at("demandes")}
        codeAt={at("recreer") + 6}
        previewAt={at("celui-la")}
        preview={`${slug}/gp-solrush.mp4`}
      />
    </Pop>
    <Pop at={at("celui-la") + 4} x={800} y={1430} rotate={4}>
      <Tag text="Jeu prêt ✓" bg={col.green} color="#fff" size={52} />
    </Pop>
  </AbsoluteFill>
);

// 10. Pas besoin de savoir coder
const SceneNoCode: React.FC<SceneProps> = ({ at }) => {
  const x = at("coder");
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={2} x={330} y={900} rotate={-4} wiggle={at("besoin")}>
        <CodeCard width={500} height={560} at={0} speed={1.8} />
      </Pop>
      <Ink d="M130 660 L530 1140" at={x - 2} dur={6} width={30} color={col.red} />
      <Ink d="M530 660 L130 1140" at={x + 2} dur={6} width={30} color={col.red} />
      <Pop at={x + 5} x={330} y={1320} rotate={-8}>
        <Tag text="Zéro code" bg={col.red} color="#fff" size={62} />
      </Pop>
      <StickMan
        x={810}
        y={1480}
        height={650}
        variant="full"
        flip
        expression="happy"
        poses={[
          [0, "idle"],
          [at("t'inquiete"), "raise"],
          [at("besoin"), "hips"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 11. Connecter le jeu à AdSense
const SceneConnect: React.FC<SceneProps> = ({ at, slug }) => {
  const click = at("connectes") + 12;
  return (
    <AbsoluteFill>
      <Ground none />
      <StepIntro n={3} big={false} />
      <Ink d="M405 1290 C445 1480 635 1480 675 1290" at={at("connectes")} dur={12} width={16} />
      <Pop at={0} x={270} y={1000} rotate={-4} from="left">
        <InkPhone width={300}>
          <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={120} />
        </InkPhone>
      </Pop>
      <Pop at={3} x={810} y={1000} rotate={4} from="right" wiggle={at("google")}>
        <InkPhone width={300}>
          <ScreenShot src={`${slug}/adsense.png`} width={screenW(300)} />
        </InkPhone>
      </Pop>
      <Pop at={click} x={540} y={1430} out={click + 16}>
        <Burst size={200}>
          <div style={comic(44)}>CLIC</div>
        </Burst>
      </Pop>
      <Pop at={at("google")} x={810} y={600} rotate={6}>
        <Tag text="Google AdSense" bg={col.blue} color="#fff" size={38} />
      </Pop>
      <Pop at={at("adsense")} x={540} y={1450} rotate={-3}>
        <Tag text="Connecté ✓" bg={col.green} color="#fff" size={50} />
      </Pop>
    </AbsoluteFill>
  );
};

// 12. Gagner de l'argent (capture EXEMPLE)
const SceneEarn: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const w = 470;
  const hl = prog(frame, at("gagner"), 8);
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={560} y={1000} from="up" rotate={2}>
        <InkPhone width={w}>
          <ScreenShot src={`${slug}/adsense-exemple.png`} width={screenW(w)} base={821} scroll={250}>
            {hl > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: 322,
                  width: 385,
                  height: 250,
                  borderRadius: 18,
                  border: `12px solid ${col.yellow}`,
                  outline: `6px solid ${ink}`,
                  transform: `scale(${1.25 - hl * 0.25})`,
                  opacity: hl,
                }}
              />
            )}
          </ScreenShot>
        </InkPhone>
      </Pop>
      <Pop at={3} x={250} y={560} rotate={-8}>
        <Tag text="Exemple" bg={col.red} color="#fff" size={48} />
      </Pop>
      <CoinBurst at={at("l'argent")} x={560} y={880} count={14} size={84} />
      <Pop at={at("l'argent") + 2} x={870} y={1380} rotate={6}>
        <Img src={staticFile(`${slug}/pieces.png`)} style={{ width: 280 }} />
      </Pop>
    </AbsoluteFill>
  );
};

// Joueur avec téléphone qui envoie une pièce vers le sac
const Player: React.FC<{ x: number; at: number; flip?: boolean; seed: number; bag: [number, number] }> = ({ x, at, flip, seed, bag }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const h = 290;
  const ground = 1330;
  const s = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 200 } });
  const [hx, hy] = handPos("stick", "phone", h, flip);
  const px = x + hx;
  const py = ground + hy;
  const t = prog(frame, at + 5, 11, EASE_IN_OUT);
  const cx = (1 - t) ** 2 * px + 2 * (1 - t) * t * ((px + bag[0]) / 2) + t * t * bag[0];
  const cy = (1 - t) ** 2 * py + 2 * (1 - t) * t * (Math.min(py, bag[1]) - 260) + t * t * bag[1];
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: `${x}px ${ground}px` }}>
        <StickMan x={x} y={ground} height={h} poses={[[0, "phone"]]} flip={flip} look={flip ? -0.6 : 0.6} expression="happy" seed={seed} />
        <div
          style={{
            position: "absolute",
            left: px - 20,
            top: py - 40,
            width: 40,
            height: 70,
            borderRadius: 9,
            background: col.blue,
            border: `5px solid ${ink}`,
            transform: `rotate(${flip ? 12 : -12}deg)`,
          }}
        />
      </div>
      {t > 0 && t < 1 && (
        <div style={{ position: "absolute", left: cx - 36, top: cy - 36 }}>
          <Coin size={72} spin={t * 2} />
        </div>
      )}
    </>
  );
};

// 13. À chaque fois que les gens jouent
const ScenePlayers: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const starts = [at("chaque"), at("fois"), at("gens"), at("jouent"), at("jouent") + 4];
  const bag: [number, number] = [540, 700];
  const pulse = starts.reduce((m, a) => Math.max(m, 1 - Math.abs(frame - (a + 16)) / 5), 0);
  return (
    <AbsoluteFill>
      <Ground horizon={1330} />
      <div
        style={{
          position: "absolute",
          left: bag[0] - 130,
          top: bag[1] - 150,
          width: 260,
          transform: `scale(${prog(frame, 0, 10) + Math.max(0, pulse) * 0.12})`,
          transformOrigin: "50% 100%",
        }}
      >
        <Img src={staticFile(`${slug}/sac.png`)} style={{ width: 260 }} />
      </div>
      <Pop at={4} x={820} y={560} rotate={7}>
        <Tag text="Revenus" bg={col.green} color="#fff" size={44} />
      </Pop>
      {[150, 345, 540, 735, 930].map((x, i) => (
        <Player key={x} x={x} at={starts[i]} flip={i % 2 === 1} seed={i} bag={bag} />
      ))}
    </AbsoluteFill>
  );
};

// Lunettes de soleil posées sur la tête d'un petit perso (tête de rayon r centrée en cx, cy)
const Shades: React.FC<{ cx: number; cy: number; r: number; at: number }> = ({ cx, cy, r, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <svg
      width={r * 2}
      height={r}
      viewBox="-50 -25 100 50"
      style={{ position: "absolute", left: cx - r, top: cy - r * 0.55 - (1 - s) * 120, opacity: Math.min(1, s * 2) }}
    >
      <path d="M-44 -8 H44" stroke={ink} strokeWidth={5} />
      <path d="M-40 -10 H-6 V4 C-6 16 -40 16 -40 4 Z" fill={ink} />
      <path d="M40 -10 H6 V4 C6 16 40 16 40 4 Z" fill={ink} />
      <path d="M-32 -4 L-22 -4" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
};

// 14. Tes 500 F : un jus, tranquillement
const SceneJuice: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const sit = at("jus") - 2;
  const toss = prog(frame, at("utiliser") + 4, 14, EASE_IN_OUT);
  const h = 300;
  const k = h / 320;
  const standX = 250;
  const ground = 1350;
  const chairX = 560;
  const seatY = ground - 188;
  const sitY = seatY + 104 * k;
  const [hx, hy] = handPos("stick", "present", h);
  const [cx, cy] = handPos("stick", "chill", h);
  const coinX = interpolate(toss, [0, 1], [standX + hx, 850]);
  const coinY = interpolate(toss, [0, 1], [ground + hy, 1250]) - Math.sin(toss * Math.PI) * 260;
  return (
    <AbsoluteFill>
      <Ground horizon={ground} />
      <Pop at={0} x={880} y={560}>
        <Sun size={210} />
      </Pop>
      <Prop src={`${slug}/chaise.png`} x={chairX} y={ground + 6} width={300} at={0} />
      {/* Petite table + verre de jus */}
      <Pop at={2} x={850} y={ground - 70} from="up">
        <svg width={200} height={150} viewBox="0 0 200 150">
          <rect x={10} y={10} width={180} height={22} rx={8} fill="#c98a4a" stroke={ink} strokeWidth={6} />
          <path d="M40 32 V146 M160 32 V146" stroke={ink} strokeWidth={8} strokeLinecap="round" />
        </svg>
      </Pop>
      {frame < sit ? (
        <>
          <Prop src={`${slug}/jus.png`} x={850} y={ground - 138} width={90} at={at("boire")} />
          <StickMan
            x={standX}
            y={ground}
            height={h}
            expression="happy"
            poses={[
              [0, "idle"],
              [at("tes") + 2, "present"],
            ]}
          />
          {frame >= at("tes") + 4 && toss < 1 && (
            <div style={{ position: "absolute", left: coinX - 45, top: coinY - 45 }}>
              <Piece500 slug={slug} width={90} spin={frame / 10} />
            </div>
          )}
        </>
      ) : (
        <>
          <StickMan x={chairX} y={sitY} height={h} expression="happy" poses={[[0, "chill"]]} seed={3} />
          <Img src={staticFile(`${slug}/jus.png`)} style={{ position: "absolute", left: chairX + cx - 30, top: sitY + cy - 60, width: 60 }} />
          <Shades cx={chairX} cy={sitY - 262 * k - 4} r={58 * k} at={at("tranquillement")} />
        </>
      )}
      <Pop at={at("tranquillement")} x={400} y={520} rotate={-6}>
        <Tag text="Tranquille" bg={col.green} color="#fff" size={62} />
      </Pop>
    </AbsoluteFill>
  );
};

// 15. Appel à l'action : commente « business », je te montre tout
const SceneCta: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const sent = at("commentaire") + 6;
  const show = at("montrer");
  return (
    <AbsoluteFill>
      <Ground none />
      <StickMan
        x={805}
        y={1250}
        height={600}
        variant="full"
        flip
        expression={frame >= at("business", 1) ? "happy" : "neutral"}
        poses={[
          [0, "idle"],
          [at("interesse"), "think"],
          [at("business", 1), "raise"],
          [at("tape"), "present"],
          [show, "point"],
        ]}
      />
      <Pop at={at("business", 1)} x={370} y={700} rotate={-6} out={show - 3}>
        <Burst size={600}>
          <div style={comic(76)}>BUSINESS</div>
        </Burst>
      </Pop>
      <Pop at={show} x={360} y={740} rotate={-5} float={8}>
        <Img src={staticFile(`${slug}/guide.png`)} style={{ width: 290, display: "block", filter: `drop-shadow(8px 10px 0 ${ink})` }} />
      </Pop>
      <Sparkles at={show + 2} cx={360} cy={740} r={230} />
      <Pop at={at("exactement")} x={360} y={480} rotate={-4}>
        <Tag text="Pas à pas" bg={col.yellow} size={56} />
      </Pop>
      <Pop at={sent} x={430} y={1265}>
        <CommentCard text="business" />
      </Pop>
      <Hearts at={sent + 4} x={640} y={1180} />
      <Pop at={at("tape")} x={540} y={1440} from="up">
        <CommentBar width={900} text="business" typeAt={at("business", 2)} />
      </Pop>
    </AbsoluteFill>
  );
};

export const Business500F: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    coin: f("avec") - 3,
    flags: f("si") - 3,
    africa: f("bref") - 2,
    step1: f("etape") - 2,
    search: f("recherches") - 5,
    popular: f("jeu") - 3,
    shot: f("etape", 1) - 2,
    claude: f("claude") - 5,
    nocode: f("ne") - 2,
    connect: f("enfin") - 2,
    earn: f("ce", 1) - 2,
    players: f("chaque") - 4,
    juice: f("tes") - 2,
    cta: f("bref", 1) - 2,
  };
  const whooshes = [S.flags, S.step1, S.search, S.claude, S.nocode, S.connect, S.players, S.juice];
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {/* Bruitages (volume global SFX_GAIN) */}
      <Sfx at={f("business")} name="impact" volume={0.4} />
      <Sfx at={f("lancer") - 9} name="whoosh_big" volume={0.5} />
      <Sfx at={f("cinq")} name="coin" volume={0.6} />
      <Sfx at={f("cinq")} name="impact" volume={0.35} />
      <Sfx at={f("francs")} name="ding" volume={0.45} />
      {whooshes.map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh" volume={0.45} />
      ))}
      <Sfx at={S.coin - 6} name="whoosh" volume={0.4} />
      {["togo", "benin", "cote"].map((w) => (
        <Sfx key={w} at={f(w)} name="pop" volume={0.45} />
      ))}
      <Sfx at={S.africa - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={S.africa + 4} name="tick" volume={0.45} />
      <Sfx at={S.africa + 8} name="tick" volume={0.45} />
      <Sfx at={S.africa + 12} name="tick" volume={0.45} />
      <Sfx at={f("afrique")} name="ding" volume={0.5} />
      <Sfx at={S.step1} name="impact" volume={0.35} />
      <Sfx at={f("play") + 6} name="tick" volume={0.5} />
      <Sfx at={S.search} name="typing" volume={0.45} />
      <Sfx at={S.popular - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("populaire")} name="pop" volume={0.4} />
      <Sfx at={f("beaucoup")} name="pop" volume={0.4} />
      <Sfx at={f("telechargements")} name="ding" volume={0.4} />
      <Sfx at={S.shot - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={S.shot} name="impact" volume={0.35} />
      <Sfx at={f("capture")} name="tick" volume={0.7} />
      <Sfx at={f("capture")} name="glitch" volume={0.25} />
      <Sfx at={f("claude") + 2} name="pop" volume={0.45} />
      <Sfx at={f("demandes")} name="typing" volume={0.5} />
      <Sfx at={f("celui-la")} name="ding" volume={0.45} />
      <Sfx at={f("coder")} name="impact" volume={0.45} />
      <Sfx at={f("connectes") + 12} name="impact" volume={0.45} />
      <Sfx at={f("adsense")} name="ding" volume={0.45} />
      <Sfx at={S.earn - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("l'argent")} name="coin" volume={0.55} />
      {["chaque", "fois", "gens", "jouent"].map((w) => (
        <Sfx key={w} at={f(w) + 15} name="coin" volume={0.25} />
      ))}
      <Sfx at={f("tes") + 4} name="coin" volume={0.4} />
      <Sfx at={f("boire")} name="pop" volume={0.4} />
      <Sfx at={f("jus") - 2} name="pop" volume={0.45} />
      <Sfx at={f("tranquillement")} name="ding" volume={0.4} />
      <Sfx at={S.cta - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("business", 1)} name="impact" volume={0.45} />
      <Sfx at={f("business", 2)} name="typing" volume={0.45} />
      <Sfx at={f("commentaire") + 6} name="notif" volume={0.55} />
      <Sfx at={f("montrer")} name="pop" volume={0.45} />
      <Camera shakes={[f("business"), f("cinq"), S.step1, S.shot, f("coder"), f("connectes") + 12, f("business", 1)]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.04, render: <SceneHook {...scene(0)} /> },
            { from: S.coin, transition: "zoom", push: 0.05, render: <SceneCoin {...scene(S.coin)} /> },
            { from: S.flags, transition: "whip", push: 0.04, render: <SceneFlags {...scene(S.flags)} /> },
            { from: S.africa, transition: "zoom", push: 0.02, render: <SceneAfrica {...scene(S.africa)} /> },
            { from: S.step1, transition: "whip", push: 0.04, render: <SceneStep1 {...scene(S.step1)} /> },
            { from: S.search, transition: "cut", push: 0.06, render: <SceneSearch {...scene(S.search)} /> },
            { from: S.popular, transition: "zoom", push: 0.05, render: <ScenePopular {...scene(S.popular)} /> },
            { from: S.shot, transition: "whip", push: 0.04, render: <SceneShot {...scene(S.shot)} /> },
            { from: S.claude, transition: "wipe", push: 0.03, render: <SceneClaude {...scene(S.claude)} /> },
            { from: S.nocode, transition: "whip", push: 0.04, render: <SceneNoCode {...scene(S.nocode)} /> },
            { from: S.connect, transition: "whip", push: 0.04, render: <SceneConnect {...scene(S.connect)} /> },
            { from: S.earn, transition: "zoom", push: 0.06, render: <SceneEarn {...scene(S.earn)} /> },
            { from: S.players, transition: "whip", push: 0.04, render: <ScenePlayers {...scene(S.players)} /> },
            { from: S.juice, transition: "wipe", push: 0.04, render: <SceneJuice {...scene(S.juice)} /> },
            { from: S.cta, transition: "zoom", push: 0.04, render: <SceneCta {...scene(S.cta)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
