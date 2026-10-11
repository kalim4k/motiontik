import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  ClaudeWindow,
  Coin,
  CoinBurst,
  col,
  Hearts,
  Ink,
  ink,
  InkPhone,
  InkTap,
  Pop,
  ScreenShot,
  ScreenVideo,
  screenW,
  Sparkles,
  SpeedLines,
  Stars,
  Tag,
} from "../lib/Doodle";
import { clamp, EASE_IN_OUT, prog } from "../lib/ease";
import { BioCard, comic, MoneyBag, Stamp } from "../lib/Promo";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { ComicCaptions, type Expression, Ground, handPos, type PoseKey, StickMan, stick } from "../lib/Stick";
import { timeOf, type VideoProps } from "../lib/timing";

// Histoire en stickman pour la formation Game Build : Koffi joue, Ama crée… et Koffi finit par jouer au jeu d'Ama.

type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

const KOFFI = col.purple;
const AMA = col.green;

/** Ama : petit perso avec un chignon (pour la distinguer de Koffi). */
const Ama: React.FC<{ x: number; y: number; height: number; poses: PoseKey[]; expression?: Expression; flip?: boolean }> = ({
  x,
  y,
  height,
  poses,
  expression = "happy",
  flip,
}) => {
  const k = height / 320;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 26 * k + (flip ? 30 : -30) * k,
          top: y - 352 * k,
          width: 52 * k,
          height: 52 * k,
          borderRadius: "50%",
          background: ink,
        }}
      />
      <StickMan x={x} y={y} height={height} poses={poses} expression={expression} flip={flip} seed={3} />
    </>
  );
};

/** Téléphone tenu dans la main droite d'un perso (pose « phone » ou « sit »). */
const HeldPhone: React.FC<{ x: number; y: number; height: number; pose: "phone" | "sit"; flip?: boolean; glow?: boolean }> = ({ x, y, height, pose, flip, glow }) => {
  const [hx, hy] = handPos("stick", pose, height, flip);
  return (
    <div
      style={{
        position: "absolute",
        left: x + hx - 22,
        top: y + hy - 46,
        width: 44,
        height: 76,
        borderRadius: 10,
        background: glow ? "#bfe3ff" : col.blue,
        border: `5px solid ${ink}`,
        boxShadow: glow ? "0 0 40px 14px rgba(140,200,255,.55)" : undefined,
        transform: `rotate(${flip ? 12 : -12}deg)`,
      }}
    />
  );
};

/** Canapé vu de face : dossier + assise, le perso en pose « sit » se pose dessus. */
const Couch: React.FC<{ x: number; y: number; height: number }> = ({ x, y, height }) => {
  const k = height / 320;
  const seat = y - 104 * k;
  const box = (l: number, t: number, w: number, h: number, bg: string): React.CSSProperties => ({
    position: "absolute",
    left: l,
    top: t,
    width: w,
    height: h,
    background: bg,
    border: `7px solid ${ink}`,
    borderRadius: 26,
  });
  return (
    <>
      <div style={box(x - 230, seat - 230 * k, 460, 250 * k, "#c0623f")} />
      <div style={box(x - 260, seat - 6, 520, 90, "#d9774f")} />
      <div style={box(x - 290, seat - 90 * k, 70, 200, "#c0623f")} />
      <div style={box(x + 220, seat - 90 * k, 70, 200, "#c0623f")} />
    </>
  );
};

/** Fenêtre de nuit avec lune et étoiles. */
const NightWindow: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 300, height: 300, background: "#22305c", border: `9px solid ${ink}`, borderRadius: 18, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 160, top: 40, width: 90, height: 90, borderRadius: "50%", background: "#ffe9a0", boxShadow: "0 0 40px #ffe9a0" }} />
    <div style={{ position: "absolute", left: 140, top: 30, width: 80, height: 80, borderRadius: "50%", background: "#22305c" }} />
    {[
      [40, 60],
      [90, 190],
      [220, 220],
      [60, 250],
    ].map(([l, t]) => (
      <div key={`${l}-${t}`} style={{ position: "absolute", left: l, top: t, width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />
    ))}
    <div style={{ position: "absolute", left: 141, top: 0, width: 9, height: 300, background: ink }} />
    <div style={{ position: "absolute", left: 0, top: 141, width: 300, height: 9, background: ink }} />
  </div>
);

/** Ampoule dessinée (l'idée d'Ama). */
const Bulb: React.FC<{ size: number; on: boolean }> = ({ size, on }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 100 130" style={{ overflow: "visible" }}>
    {on &&
      [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        return <line key={a} x1={50 + Math.cos(r) * 56} y1={48 + Math.sin(r) * 56} x2={50 + Math.cos(r) * 74} y2={48 + Math.sin(r) * 74} stroke={ink} strokeWidth={6} strokeLinecap="round" />;
      })}
    <path d="M50 6 C22 6 8 28 14 52 C18 68 32 76 34 92 L66 92 C68 76 82 68 86 52 C92 28 78 6 50 6 Z" fill={on ? col.yellow : "#fff"} stroke={ink} strokeWidth={6} />
    <rect x={34} y={94} width={32} height={22} rx={5} fill="#bbb" stroke={ink} strokeWidth={6} />
    <path d="M42 66 L50 50 L58 66" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

/** Pièces qui partent de `from` vers `to` en arc, une toutes les `every` frames à partir de chaque instant de `starts`. */
const CoinStream: React.FC<{ starts: number[]; from: [number, number]; to: [number, number]; size?: number }> = ({ starts, from, to, size = 66 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {starts.map((s, i) => {
        const t = prog(frame, s, 14, EASE_IN_OUT);
        if (t <= 0 || t >= 1) return null;
        const x = interpolate(t, [0, 1], [from[0], to[0]]);
        const y = interpolate(t, [0, 1], [from[1], to[1]]) - Math.sin(t * Math.PI) * 240;
        return (
          <div key={i} style={{ position: "absolute", left: x - size / 2, top: y - size / 2 }}>
            <Coin size={size} spin={t * 2} />
          </div>
        );
      })}
    </>
  );
};

const PubBadge: React.FC = () => (
  <div style={{ padding: "16px 26px", background: col.yellow, border: `6px solid ${ink}`, borderRadius: 16, boxShadow: `6px 8px 0 ${ink}`, ...comic(50) }}>PUB</div>
);

// 1. Voici Koffi et Ama. Tous les deux adorent les jeux sur téléphone.
const SceneIntro: React.FC<SceneProps> = ({ at, slug }) => {
  const love = at("adorent");
  return (
    <AbsoluteFill>
      <Ground horizon={1420} />
      <StickMan x={300} y={1420} height={420} expression="happy" poses={[[0, "wave"], [love, "phone"]]} seed={2} />
      <Ama x={780} y={1420} height={420} flip poses={[[0, "idle"], [at("ama"), "wave"], [love, "phone"]]} />
      <Pop at={at("koffi")} x={300} y={870} rotate={-5}>
        <Tag text="Koffi" bg={KOFFI} color="#fff" size={58} />
      </Pop>
      <Pop at={at("ama")} x={780} y={870} rotate={5}>
        <Tag text="Ama" bg={AMA} color="#fff" size={58} />
      </Pop>
      <Hearts at={love} x={540} y={980} />
      <Pop at={at("telephone")} x={300} y={600} rotate={-6}>
        <InkPhone width={230}>
          <ScreenVideo src={`${slug}/gp-course.mp4`} trim={40} />
        </InkPhone>
      </Pop>
      <Pop at={at("telephone") + 3} x={780} y={600} rotate={6}>
        <InkPhone width={230}>
          <ScreenVideo src={`${slug}/gp-chateau.mp4`} trim={60} />
        </InkPhone>
      </Pop>
    </AbsoluteFill>
  );
};

// 2. Koffi joue tous les soirs, regarde des pubs pour gagner des vies… et ne gagne rien.
const SceneKoffi: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const nothing = at("rien");
  return (
    <AbsoluteFill>
      <Ground horizon={1480} />
      <NightWindow x={90} y={470} />
      <Pop at={at("soirs")} x={240} y={850} rotate={-4}>
        <Tag text="Tous les soirs" bg="#22305c" color="#fff" size={40} />
      </Pop>
      <Couch x={330} y={1530} height={380} />
      <StickMan x={330} y={1530} height={380} poses={[[0, "sit"]]} expression={frame >= nothing ? "sad" : "happy"} seed={2} />
      <HeldPhone x={330} y={1530} height={380} pose="sit" glow />
      <Pop at={at("pubs")} x={790} y={760} rotate={5} from="right">
        <InkPhone width={330}>
          <ScreenVideo src={`${slug}/gp-chateau.mp4`} trim={90} />
          <Pop at={at("pubs") + 4} x={screenW(330) / 2} y={250}>
            <PubBadge />
          </Pop>
        </InkPhone>
      </Pop>
      <Pop at={at("vies")} x={790} y={1220} rotate={-4}>
        <Tag text="+1 vie ♥" bg={col.red} color="#fff" size={48} />
      </Pop>
      <Pop at={nothing} x={560} y={1720} z={6}>
        <Stamp text="0 F gagné" at={nothing} size={64} rotate={-6} />
      </Pop>
    </AbsoluteFill>
  );
};

// 3. Ama, elle, a eu une autre idée.
const SceneIdea: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const idea = at("idee");
  return (
    <AbsoluteFill>
      <Ground horizon={1450} />
      {frame >= idea && <SpeedLines cx={540} cy={700} color="#fdf0c0" />}
      <Ama x={540} y={1450} height={480} poses={[[0, "think"], [idea, "raise"]]} expression={frame >= idea ? "happy" : "neutral"} />
      <Pop at={2} x={300} y={1580} rotate={-4}>
        <Tag text="Ama" bg={AMA} color="#fff" size={52} />
      </Pop>
      <Pop at={at("autre") - 4} x={760} y={640} rotate={8} wiggle={idea}>
        <Bulb size={200} on={frame >= idea} />
      </Pop>
    </AbsoluteFill>
  );
};

// 4. Elle a trouvé un jeu populaire sur le Play Store
const SceneStore: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ground horizon={1600} />
      <Pop at={0} x={340} y={950} rotate={-5} from="left">
        <InkPhone width={420}>
          <ScreenShot src={`${slug}/playstore.png`} width={screenW(420)} scroll={interpolate(frame, [at("trouve"), at("trouve") + 14], [0, 300], clamp)} />
        </InkPhone>
      </Pop>
      <Pop at={at("play")} x={340} y={420} rotate={-6}>
        <Tag text="Play Store" bg={col.blue} color="#fff" size={56} />
      </Pop>
      <Pop at={at("populaire")} x={820} y={760} rotate={6} from="right">
        <InkPhone width={280}>
          <ScreenVideo src={`${slug}/gp-course.mp4`} trim={20} />
        </InkPhone>
      </Pop>
      <Pop at={at("populaire") + 4} x={820} y={1120}>
        <Stars at={at("populaire") + 4} size={56} />
      </Pop>
      <Ama x={850} y={1600} height={300} flip poses={[[0, "point"]]} />
    </AbsoluteFill>
  );
};

// 5. Capture envoyée à l'IA… qui crée son propre jeu. Sans une seule ligne de code.
const SceneAI: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Pop at={0} x={545} y={940} from="down" rotate={-1}>
      <ClaudeWindow
        width={900}
        height={820}
        image={`${slug}/capture-jeu.png`}
        attachAt={at("capture")}
        prompt="Crée-moi un jeu dans ce style"
        typeAt={at("capture") + 6}
        codeAt={at("l'ia", 1)}
        previewAt={at("cree")}
        preview={`${slug}/gp-solrush.mp4`}
      />
    </Pop>
    <Pop at={at("jeu", 1) + 2} x={780} y={1450} rotate={4}>
      <Tag text="Son jeu ✓" bg={AMA} color="#fff" size={50} />
    </Pop>
    <Pop at={at("sans")} x={300} y={1450} rotate={-6}>
      <Stamp text="Zéro code" at={at("sans")} size={68} rotate={-6} />
    </Pop>
  </AbsoluteFill>
);

// 6. En ligne + connecté à Google AdSense
const SceneOnline: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Ink d="M405 1290 C445 1480 635 1480 675 1290" at={at("connecte")} dur={12} width={16} />
    <Pop at={0} x={270} y={1000} rotate={-4} from="left">
      <InkPhone width={300}>
        <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={120} />
      </InkPhone>
    </Pop>
    <Pop at={at("ligne", 1)} x={270} y={560} rotate={-6}>
      <Tag text="En ligne ✓" bg={AMA} color="#fff" size={44} />
    </Pop>
    <Pop at={at("connecte")} x={810} y={1000} rotate={4} from="right" wiggle={at("google")}>
      <InkPhone width={300}>
        <ScreenShot src={`${slug}/adsense.png`} width={screenW(300)} />
      </InkPhone>
    </Pop>
    <Pop at={at("google")} x={810} y={560} rotate={6}>
      <Tag text="Google AdSense" bg={col.blue} color="#fff" size={38} />
    </Pop>
    <Pop at={at("adsense") + 4} x={540} y={1470} rotate={-3}>
      <Tag text="Connecté ✓" bg={col.green} color="#fff" size={50} />
    </Pop>
  </AbsoluteFill>
);

// 7. Et devine à quel jeu Koffi joue maintenant ? Celui d'Ama.
const SceneTwist: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const reveal = at("celui");
  return (
    <AbsoluteFill>
      <Ground horizon={1480} />
      <NightWindow x={90} y={470} />
      <Couch x={330} y={1530} height={380} />
      <StickMan x={330} y={1530} height={380} poses={[[0, "sit"]]} expression="happy" look={0.6} seed={2} />
      <HeldPhone x={330} y={1530} height={380} pose="sit" glow />
      <Pop at={at("devine")} x={790} y={640} rotate={6} out={reveal - 2}>
        <Burst size={340} fill={col.purple}>
          <div style={comic(150, "#fff")}>?</div>
        </Burst>
      </Pop>
      <Pop at={reveal} x={790} y={760} rotate={5} from="right">
        <InkPhone width={330}>
          <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={60} />
        </InkPhone>
      </Pop>
      <Pop at={at("d'ama")} x={790} y={1220} rotate={-4}>
        <Tag text="Le jeu d'Ama !" bg={AMA} color="#fff" size={46} />
      </Pop>
      {frame >= reveal && <Sparkles at={reveal} cx={790} cy={760} r={260} />}
    </AbsoluteFill>
  );
};

// 8. Chaque pub qu'il regarde… c'est elle qui est payée.
const SceneMoney: React.FC<SceneProps> = ({ at, slug }) => {
  const bag: [number, number] = [790, 820];
  const coins = [at("chaque"), at("pub") + 2, at("regarde", 1), at("regarde", 1) + 6, at("c'est"), at("payee")];
  return (
    <AbsoluteFill>
      <Ground horizon={1450} />
      <StickMan x={250} y={1450} height={360} poses={[[0, "phone"]]} expression="happy" look={0.6} seed={2} />
      <HeldPhone x={250} y={1450} height={360} pose="phone" glow />
      <Pop at={2} x={250} y={950} rotate={-4}>
        <Tag text="Koffi" bg={KOFFI} color="#fff" size={44} />
      </Pop>
      <Pop at={at("pub")} x={300} y={760} rotate={-6}>
        <PubBadge />
      </Pop>
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={coins} label="Ama" labelBg={AMA} />
      <CoinStream starts={coins} from={[300, 1100]} to={bag} />
      <Ama x={790} y={1450} height={360} flip poses={[[0, "idle"], [at("payee"), "cheer"]]} />
      <Pop at={at("payee")} x={540} y={560} z={6}>
        <Stamp text="Payée" at={at("payee")} color={col.green} size={74} rotate={-8} />
      </Pop>
      <CoinBurst at={at("payee")} x={790} y={760} count={10} size={64} />
    </AbsoluteFill>
  );
};

// 9. Alors toi, tu veux être Koffi… ou Ama ?
const SceneChoice: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const k = at("koffi", 3);
  const a = at("ama", 2);
  const dimK = frame >= a ? 0.45 : 1;
  return (
    <AbsoluteFill>
      <Ground horizon={1500} />
      <div style={{ position: "absolute", left: 536, top: 980, width: 8, height: 560, background: ink, borderRadius: 4 }} />
      <div style={{ position: "absolute", inset: 0, opacity: dimK }}>
        <Couch x={270} y={1540} height={300} />
        <StickMan x={270} y={1540} height={300} poses={[[0, "sit"]]} expression="sad" seed={2} />
        <HeldPhone x={270} y={1540} height={300} pose="sit" />
        <Pop at={k} x={270} y={1680} rotate={-4}>
          <Tag text="Koffi : 0 F" bg={KOFFI} color="#fff" size={44} />
        </Pop>
      </div>
      <MoneyBag slug={slug} x={810} y={1010} hits={[a]} label="Ama" labelBg={AMA} />
      <Ama x={810} y={1500} height={340} flip poses={[[0, "hips"], [a, "cheer"]]} />
      {frame >= a && <CoinBurst at={a} x={810} y={930} count={10} size={60} />}
      <Pop at={at("toi")} x={540} y={640} rotate={-3}>
        <Burst size={500} fill={col.yellow}>
          <div style={{ ...comic(64), textAlign: "center" }}>ET TOI ?</div>
        </Burst>
      </Pop>
      <Pop at={at("ou")} x={540} y={1180}>
        <div style={{ width: 130, height: 130, borderRadius: "50%", background: "#fff", border: `7px solid ${ink}`, display: "flex", alignItems: "center", justifyContent: "center", ...comic(56) }}>OU</div>
      </Pop>
    </AbsoluteFill>
  );
};

// 10. Toute la méthode est dans ma formation Game Build. Le lien est dans ma bio.
const SceneCta: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const bio = at("le", 1);
  return (
    <AbsoluteFill>
      <Ground none />
      <StickMan
        x={830}
        y={1300}
        height={560}
        variant="full"
        flip
        expression={frame >= at("formation") ? "happy" : "neutral"}
        poses={[
          [0, "present"],
          [at("formation"), "raise"],
          [bio, "point"],
        ]}
      />
      <Pop at={at("methode")} x={360} y={720} rotate={-6} out={bio - 3}>
        <Burst size={580} fill={col.blue}>
          <div style={{ ...comic(62, "#fff"), textAlign: "center", whiteSpace: "normal", width: 380 }}>TOUTE LA MÉTHODE</div>
        </Burst>
      </Pop>
      <Pop at={at("game")} x={380} y={1160} rotate={-4} out={bio - 3}>
        <Tag text="Game Build" bg={col.yellow} size={74} />
      </Pop>
      <Pop at={bio} x={380} y={780} rotate={-3}>
        <BioCard tapAt={at("bio")} />
      </Pop>
      <InkTap at={at("bio")} x={380} y={955} />
      <Sparkles at={at("bio") + 2} cx={380} cy={780} r={330} />
    </AbsoluteFill>
  );
};

export const KoffiAma: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    koffi: f("koffi", 1) - 3,
    idea: f("ama", 1) - 3,
    store: f("elle", 1) - 3,
    ai: f("elle", 2) - 3,
    online: f("elle", 3) - 3,
    twist: f("devine") - 8,
    money: f("chaque") - 3,
    choice: f("alors") - 3,
    cta: f("toute") - 3,
  };
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {[S.koffi, S.store, S.ai, S.online, S.money].map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh" volume={0.4} />
      ))}
      {[S.idea, S.twist, S.choice, S.cta].map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh_big" volume={0.35} />
      ))}
      <Sfx at={f("koffi")} name="pop" volume={0.4} />
      <Sfx at={f("ama")} name="pop" volume={0.4} />
      <Sfx at={f("pubs")} name="pop" volume={0.4} />
      <Sfx at={f("rien")} name="impact" volume={0.4} />
      <Sfx at={f("idee")} name="ding" volume={0.45} />
      <Sfx at={f("populaire")} name="ding" volume={0.35} />
      <Sfx at={f("capture")} name="tick" volume={0.6} />
      <Sfx at={f("capture") + 6} name="typing" volume={0.45} />
      <Sfx at={f("cree")} name="ding" volume={0.45} />
      <Sfx at={f("sans")} name="impact" volume={0.4} />
      <Sfx at={f("adsense") + 4} name="ding" volume={0.4} />
      <Sfx at={f("celui")} name="riser" volume={0.3} />
      <Sfx at={f("d'ama")} name="impact" volume={0.4} />
      {[f("chaque"), f("regarde", 1), f("c'est")].map((w) => (
        <Sfx key={w} at={w + 14} name="coin" volume={0.35} />
      ))}
      <Sfx at={f("payee")} name="coin" volume={0.5} />
      <Sfx at={f("toi")} name="impact" volume={0.35} />
      <Sfx at={f("bio")} name="tick" volume={0.5} />
      <Camera shakes={[f("rien"), f("sans"), f("d'ama"), f("payee"), f("toi")]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.04, render: <SceneIntro {...scene(0)} /> },
            { from: S.koffi, transition: "whip", push: 0.04, render: <SceneKoffi {...scene(S.koffi)} /> },
            { from: S.idea, transition: "zoom", push: 0.05, render: <SceneIdea {...scene(S.idea)} /> },
            { from: S.store, transition: "whip", push: 0.04, render: <SceneStore {...scene(S.store)} /> },
            { from: S.ai, transition: "wipe", push: 0.03, render: <SceneAI {...scene(S.ai)} /> },
            { from: S.online, transition: "whip", push: 0.04, render: <SceneOnline {...scene(S.online)} /> },
            { from: S.twist, transition: "zoom", push: 0.05, render: <SceneTwist {...scene(S.twist)} /> },
            { from: S.money, transition: "whip", push: 0.04, render: <SceneMoney {...scene(S.money)} /> },
            { from: S.choice, transition: "zoom", push: 0.04, render: <SceneChoice {...scene(S.choice)} /> },
            { from: S.cta, transition: "zoom", push: 0.04, render: <SceneCta {...scene(S.cta)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
