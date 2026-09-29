import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  ChatWindow,
  Coin,
  CoinBurst,
  CoinRain,
  col,
  CommentBar,
  CommentCard,
  CountUp,
  DownloadIcon,
  Hearts,
  HomeScreen,
  Ink,
  ink,
  InkPhone,
  Magnifier,
  PlayIcon,
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
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { captionFont, ComicCaptions, Ground, handPos, Prop, StickMan, stick } from "../lib/Stick";
import { timeOf, type VideoProps } from "../lib/timing";

type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

const StepTag: React.FC<{ n: number }> = ({ n }) => (
  <Pop at={2} x={225} y={455} from="left" rotate={-4}>
    <Tag text={`Étape ${n}`} bg={col.yellow} size={50} />
  </Pop>
);

// 1. Accroche : fenêtre ChatGPT qui se fissure
const SceneHook: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const crack = at("faille");
  const punch = prog(frame, crack, 6) - prog(frame, crack + 26, 14) * 0.6;
  const glow = frame >= at("exploiter") ? 0.55 + Math.sin(frame / 2.5) * 0.35 : 0;
  const CRACK = "M455 -10 L372 120 L420 182 L300 296 L352 360 L214 470 L250 528 L130 640";
  return (
    <AbsoluteFill>
      <Ground none />
      <AbsoluteFill style={{ transform: `scale(${1 + punch * 0.1})`, transformOrigin: "36% 48%" }}>
        <Pop at={0} x={390} y={905} rotate={-3} wiggle={crack}>
          <div style={{ position: "relative" }}>
            <ChatWindow width={560} height={620} prompt="Salut ! Tu peux m'aider ?" typeAt={-60} answerAt={-40} />
            {glow > 0 && <Ink d={CRACK} at={at("exploiter")} dur={1} width={34} color={`rgba(255,210,63,${glow})`} />}
            <Ink d={CRACK} at={crack} dur={7} width={13} />
          </div>
        </Pop>
        <CoinBurst at={at("exploiter")} x={400} y={900} count={9} size={70} />
      </AbsoluteFill>
      <Pop at={crack + 2} x={290} y={520} rotate={-9}>
        <Tag text="Faille !" bg={col.red} color="#fff" size={62} />
      </Pop>
      <StickMan
        x={850}
        y={1480}
        height={660}
        variant="full"
        flip
        expression="smug"
        poses={[
          [0, "idle"],
          [crack, "point"],
          [at("exploiter"), "hips"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 2. Argent : 5 000 F par jour
const SceneMoney: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground horizon={1300} />
    <SpeedLines cx={540} cy={680} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1300, bottom: 0, background: stick.ground }} />
    <Prop src={`${slug}/billets.png`} x={230} y={1312} width={300} at={at("jusqu'a")} />
    <Prop src={`${slug}/sac.png`} x={850} y={1312} width={250} at={at("gagner") + 3} />
    <StickMan
      x={540}
      y={1300}
      height={380}
      expression="happy"
      poses={[
        [0, "idle"],
        [at("gagner"), "cheer"],
      ]}
    />
    <Pop at={at("cinq")} x={540} y={680}>
      <Burst size={580}>
        <CountUp to={5000} at={at("cinq")} dur={14} size={98} suffix=" F" />
      </Burst>
    </Pop>
    <CoinRain at={at("mille")} count={18} />
    <Pop at={at("jusqu'a")} x={300} y={470} rotate={-8}>
      <Tag text="Jusqu'à" size={46} />
    </Pop>
    <Pop at={at("jour")} x={790} y={960} rotate={8}>
      <Tag text="Par jour" bg={col.green} color="#fff" size={56} />
    </Pop>
  </AbsoluteFill>
);

// 3. Juste le Play Store sur ton téléphone
const ScenePhone: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={at("auras")} x={760} y={940} from="up" wiggle={at("telephone")} rotate={3}>
        <InkPhone width={380} screen="#f7f5ee">
          <HomeScreen at={at("auras")} />
          <Pop at={at("play")} x={165} y={330} z={3}>
            <div style={{ filter: `drop-shadow(8px 10px 0 ${ink})` }}>
              <PlayIcon size={210} />
            </div>
          </Pop>
          <Pop at={at("store")} x={165} y={500} z={3}>
            <Tag text="Play Store" size={36} />
          </Pop>
        </InkPhone>
      </Pop>
      <Pop at={at("juste")} x={760} y={470} rotate={-6}>
        <Tag text="Juste ça !" bg={col.yellow} size={54} />
      </Pop>
      <Pop at={at("telephone")} x={945} y={640} rotate={10}>
        <svg width={120} height={120} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={44} fill={col.green} stroke={ink} strokeWidth={7} />
          <path d="M28 52 L44 67 L73 34" fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Pop>
      <StickMan
        x={290}
        y={1470}
        height={680}
        variant="full"
        expression={frame >= at("play") ? "happy" : "neutral"}
        poses={[
          [0, "idle"],
          [at("juste"), "raise"],
          [at("play"), "point"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 4a. Recherche sur le Play Store
const SceneSearch: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [at("play", 1) + 2, at("play", 1) + 16], [0, 520], { ...clamp, easing: EASE_IN_OUT });
  const q = "jeu populaire".slice(0, Math.max(0, Math.floor((frame - at("cherches")) * 0.8)));
  const w = 500;
  return (
    <AbsoluteFill>
      <Ground none />
      <StepTag n={1} />
      <Pop at={0} x={560} y={1010} from="up" rotate={-2}>
        <InkPhone width={w}>
          <ScreenShot src={`${slug}/playstore.png`} width={screenW(w)} scroll={scroll}>
            <div style={{ position: "absolute", left: 110, top: 12, width: 330, height: 76, background: "#fff" }} />
            <div style={{ position: "absolute", left: 124, top: 22, fontFamily: "Roboto, Arial", fontSize: 34, color: "#202124" }}>
              {q}
              <span style={{ opacity: frame % 14 < 8 ? 1 : 0, color: "#1a73e8" }}>|</span>
            </div>
          </ScreenShot>
        </InkPhone>
      </Pop>
      <Pop at={at("cherches")} x={850} y={660} from="right" float={14} rotate={-10}>
        <Magnifier size={240} />
      </Pop>
    </AbsoluteFill>
  );
};

// 4b. Jeux populaires + téléchargements
const ScenePopular: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <SpeedLines cy={930} color="#f4eed8" />
    <Pop at={at("populaire")} x={230} y={1000} rotate={-9} from="left">
      <InkPhone width={290}>
        <ScreenVideo src={`${slug}/gp-course.mp4`} trim={30} />
      </InkPhone>
    </Pop>
    <Pop at={at("populaire") + 5} x={850} y={1000} rotate={9} from="right">
      <InkPhone width={290}>
        <ScreenVideo src={`${slug}/gp-chateau.mp4`} trim={40} />
      </InkPhone>
    </Pop>
    <Pop at={1} x={540} y={930}>
      <InkPhone width={350}>
        <ScreenVideo src={`${slug}/gp-foule.mp4`} trim={20} />
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

// 5a. Demander à ChatGPT
const SceneAsk: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground horizon={1330} />
    <StepTag n={2} />
    <Prop src={`${slug}/bureau.png`} x={740} y={1342} width={300} at={0} />
    <StickMan
      x={410}
      y={1330}
      height={300}
      expression="neutral"
      poses={[
        [0, "idle"],
        [at("demandes"), "point"],
      ]}
    />
    <Pop at={0} x={560} y={755} from="down" rotate={-1}>
      <ChatWindow
        width={860}
        height={430}
        prompt="Crée-moi le même type de jeu que celui-ci, avec des améliorations"
        typeAt={at("demandes")}
        cps={2.2}
        answerAt={at("demandes") + 32}
      />
    </Pop>
  </AbsoluteFill>
);

// Petites balises de code qui volent d'un téléphone à l'autre
const CodeFlight: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => {
        const t = prog(frame, at + i * 3, 16, EASE_IN_OUT);
        if (t <= 0 || t >= 1) return null;
        const x = (1 - t) ** 2 * 330 + 2 * (1 - t) * t * 540 + t * t * 760;
        const y = (1 - t) ** 2 * 900 + 2 * (1 - t) * t * 640 + t * t * 900 + (i % 3) * 40;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${(i % 2 ? 1 : -1) * 12}deg)` }}>
            <Tag text="</>" bg={col.purple} color="#fff" size={34} />
          </div>
        );
      })}
    </>
  );
};

// 5b. Le même type de jeu, avec des améliorations
const SceneCreate: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Pop at={0} x={280} y={950} rotate={-5} from="left">
      <InkPhone width={320}>
        <ScreenVideo src={`${slug}/gp-foule.mp4`} trim={150} />
      </InkPhone>
    </Pop>
    <Pop at={3} x={280} y={530} rotate={-6}>
      <Tag text="Jeu populaire" size={40} />
    </Pop>
    <Ink d="M420 640 Q540 520 650 640" at={at("meme")} dur={9} width={11} arrow />
    <CodeFlight at={at("creer") + 2} />
    <Pop at={at("type")} x={800} y={950} rotate={5} from="right" wiggle={at("ameliorations")}>
      <InkPhone width={320}>
        <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={20} />
      </InkPhone>
    </Pop>
    <Pop at={at("type") + 4} x={800} y={530} rotate={5}>
      <Tag text="Ton jeu" bg={col.green} color="#fff" size={48} />
    </Pop>
    <Sparkles at={at("ameliorations")} cx={800} cy={950} r={250} />
    <Pop at={at("ameliorations")} x={585} y={1180} rotate={-7}>
      <Tag text="+ Niveaux" bg={col.yellow} size={42} />
    </Pop>
    <Pop at={at("ameliorations") + 4} x={640} y={1370} rotate={5}>
      <Tag text="+ Bonus" bg={col.orange} size={42} />
    </Pop>
    <Pop at={at("ameliorations") + 8} x={860} y={1455} rotate={-4}>
      <Tag text="+ Design" bg={col.blue} color="#fff" size={42} />
    </Pop>
  </AbsoluteFill>
);

// 6. Connecter le jeu à AdSense
const SceneConnect: React.FC<SceneProps> = ({ at, slug }) => {
  const click = at("connectes") + 12;
  return (
    <AbsoluteFill>
      <Ground none />
      <StepTag n={3} />
      <Ink d="M405 1290 C445 1480 635 1480 675 1290" at={at("connectes")} dur={12} width={16} />
      <Pop at={0} x={270} y={1000} rotate={-4} from="left">
        <InkPhone width={300}>
          <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={90} />
        </InkPhone>
      </Pop>
      <Pop at={3} x={810} y={1000} rotate={4} from="right" wiggle={at("google")}>
        <InkPhone width={300}>
          <ScreenShot src={`${slug}/adsense.png`} width={screenW(300)} />
        </InkPhone>
      </Pop>
      <Pop at={click} x={540} y={1430} out={click + 16}>
        <Burst size={200}>
          <div style={{ fontFamily: captionFont, fontWeight: 700, fontSize: 44, color: ink }}>CLIC</div>
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

// 7a. Gagner de l'argent (capture EXEMPLE)
const SceneEarn: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const w = 470;
  const hl = prog(frame, at("gagner", 1), 8);
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

// Joueur (petit perso) qui apparaît avec un téléphone, puis envoie une pièce vers le sac
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
  const t = prog(frame, at + 7, 13, EASE_IN_OUT);
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

// 7b. À chaque fois que les gens jouent
const ScenePlayers: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const starts = [at("chaque"), at("fois"), at("gens"), at("jouent"), at("jouent") + 6];
  const bag: [number, number] = [540, 700];
  const pulse = starts.reduce((m, a) => Math.max(m, 1 - Math.abs(frame - (a + 20)) / 5), 0);
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

// 8. Appel à l'action : commente « business »
const SceneCta: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const sent = at("commentaire") + 6;
  return (
    <AbsoluteFill>
      <Ground none />
      <StickMan
        x={805}
        y={1250}
        height={600}
        variant="full"
        flip
        expression={frame >= at("business") ? "happy" : "neutral"}
        poses={[
          [0, "idle"],
          [at("interesse"), "think"],
          [at("business"), "raise"],
          [at("tape"), "present"],
        ]}
      />
      <Pop at={at("business")} x={370} y={700} rotate={-6}>
        <Burst size={600}>
          <div style={{ fontFamily: captionFont, fontWeight: 700, fontSize: 76, color: ink, WebkitTextStroke: `2px ${ink}` }}>BUSINESS</div>
        </Burst>
      </Pop>
      <Pop at={sent} x={430} y={1265}>
        <CommentCard text="business" />
      </Pop>
      <Hearts at={sent + 4} x={640} y={1180} />
      <Pop at={at("tape")} x={540} y={1440} from="up">
        <CommentBar width={900} text="business" typeAt={at("business", 1)} />
      </Pop>
    </AbsoluteFill>
  );
};

export const FailleChatGPT: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    money: f("pour") - 3,
    phone: f("auras") - 5,
    search: f("cherches") - 7,
    popular: f("jeu") - 3,
    ask: f("ensuite") - 2,
    create: f("creer") - 3,
    connect: f("enfin") - 2,
    earn: f("ce") - 2,
    players: f("chaque") - 4,
    cta: f("bref") - 2,
  };
  const whooshes = [S.phone, S.search, S.ask, S.create, S.connect, S.players];
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {/* Bruitages (volume global SFX_GAIN) */}
      <Sfx at={0} name="pop" volume={0.45} />
      <Sfx at={f("faille")} name="glitch" volume={0.55} />
      <Sfx at={f("faille")} name="impact" volume={0.45} />
      <Sfx at={f("exploiter")} name="coin" volume={0.45} />
      <Sfx at={S.money - 6} name="whoosh_big" volume={0.4} />
      <Sfx at={f("cinq")} name="impact" volume={0.4} />
      <Sfx at={f("mille")} name="coin" volume={0.55} />
      <Sfx at={f("jour")} name="ding" volume={0.5} />
      {whooshes.map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh" volume={0.45} />
      ))}
      <Sfx at={f("juste")} name="pop" volume={0.4} />
      <Sfx at={f("play")} name="ding" volume={0.45} />
      <Sfx at={f("telephone")} name="tick" volume={0.5} />
      <Sfx at={f("cherches")} name="typing" volume={0.45} />
      <Sfx at={S.popular - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("populaire")} name="pop" volume={0.4} />
      <Sfx at={f("beaucoup")} name="pop" volume={0.4} />
      <Sfx at={f("telechargements")} name="ding" volume={0.4} />
      <Sfx at={f("demandes")} name="typing" volume={0.5} />
      <Sfx at={f("type")} name="pop" volume={0.4} />
      <Sfx at={f("ameliorations")} name="ding" volume={0.45} />
      <Sfx at={f("connectes") + 12} name="impact" volume={0.45} />
      <Sfx at={f("adsense")} name="ding" volume={0.45} />
      <Sfx at={S.earn - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("l'argent")} name="coin" volume={0.55} />
      {["chaque", "fois", "gens", "jouent"].map((w) => (
        <Sfx key={w} at={f(w) + 18} name="coin" volume={0.25} />
      ))}
      <Sfx at={S.cta - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("business")} name="impact" volume={0.45} />
      <Sfx at={f("business", 1)} name="typing" volume={0.45} />
      <Sfx at={f("commentaire") + 6} name="notif" volume={0.55} />
      <Camera shakes={[f("faille"), f("cinq"), f("connectes") + 12, f("business")]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.04, render: <SceneHook {...scene(0)} /> },
            { from: S.money, transition: "zoom", push: 0.05, render: <SceneMoney {...scene(S.money)} /> },
            { from: S.phone, transition: "whip", push: 0.04, render: <ScenePhone {...scene(S.phone)} /> },
            { from: S.search, transition: "whip", push: 0.06, render: <SceneSearch {...scene(S.search)} /> },
            { from: S.popular, transition: "zoom", push: 0.05, render: <ScenePopular {...scene(S.popular)} /> },
            { from: S.ask, transition: "whip", push: 0.04, render: <SceneAsk {...scene(S.ask)} /> },
            { from: S.create, transition: "wipe", push: 0.04, render: <SceneCreate {...scene(S.create)} /> },
            { from: S.connect, transition: "whip", push: 0.04, render: <SceneConnect {...scene(S.connect)} /> },
            { from: S.earn, transition: "zoom", push: 0.06, render: <SceneEarn {...scene(S.earn)} /> },
            { from: S.players, transition: "whip", push: 0.04, render: <ScenePlayers {...scene(S.players)} /> },
            { from: S.cta, transition: "zoom", push: 0.04, render: <SceneCta {...scene(S.cta)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
