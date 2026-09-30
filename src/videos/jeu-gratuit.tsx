import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  CameraIcon,
  ClaudeWindow,
  Coin,
  CoinBurst,
  col,
  CommentBar,
  CommentCard,
  CountUp,
  DownloadIcon,
  Flash,
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
import { BioCard, comic, MoneyBag, Player, Stamp } from "../lib/Promo";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { ComicCaptions, Ground, StickMan, stick } from "../lib/Stick";
import { timeOf, type VideoProps } from "../lib/timing";

type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

/** Pièces qui partent de (x0, y0) vers (x1, y1) en arc, une toutes les `every` frames à partir de `at`. */
const CoinStream: React.FC<{ at: number; from: [number, number]; to: [number, number]; n?: number; every?: number; size?: number }> = ({
  at,
  from,
  to,
  n = 6,
  every = 5,
  size = 70,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const t = prog(frame, at + i * every, 14, EASE_IN_OUT);
        if (t <= 0 || t >= 1) return null;
        const x = interpolate(t, [0, 1], [from[0], to[0]]);
        const y = interpolate(t, [0, 1], [from[1], to[1]]) - Math.sin(t * Math.PI) * 220;
        return (
          <div key={i} style={{ position: "absolute", left: x - size / 2, top: y - size / 2 }}>
            <Coin size={size} spin={t * 2} />
          </div>
        );
      })}
    </>
  );
};

/** Chaîne dessinée (maillons) le long d'un segment, qui apparaît à `at`. */
const Chain: React.FC<{ x1: number; y1: number; x2: number; y2: number; at: number }> = ({ x1, y1, x2, y2, at }) => {
  const frame = useCurrentFrame();
  const n = 7;
  const shown = Math.floor(prog(frame, at, 10) * n);
  const a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <>
      {Array.from({ length: shown }, (_, i) => {
        const t = i / (n - 1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x1 + (x2 - x1) * t - 26,
              top: y1 + (y2 - y1) * t - 16,
              width: 52,
              height: 32,
              borderRadius: 16,
              border: `9px solid #777`,
              outline: `4px solid ${ink}`,
              transform: `rotate(${a + (i % 2 ? 90 : 0)}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

// 1. Hook : tu joues… tu travailles gratuitement pour quelqu'un
const SceneHook: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const chained = at("travailles");
  return (
    <AbsoluteFill>
      <Ground none />
      {frame >= chained && <SpeedLines cx={420} cy={1000} color="#f6e0e0" />}
      <Pop at={0} x={420} y={930} rotate={-3}>
        <InkPhone width={420}>
          <ScreenVideo src={`${slug}/gp-course.mp4`} trim={40} />
        </InkPhone>
      </Pop>
      <Pop at={at("gratuit")} x={420} y={400} rotate={-5} wiggle={at("gratuit") + 6}>
        <Tag text="Jeu gratuit ?" bg={col.yellow} size={64} />
      </Pop>
      <Chain x1={130} y1={1500} x2={280} y2={1200} at={chained} />
      <Chain x1={720} y1={1500} x2={560} y2={1200} at={chained + 4} />
      <Pop at={at("gratuitement")} x={420} y={1330} z={6}>
        <Stamp text="Travail gratuit" at={at("gratuitement")} size={74} rotate={-10} />
      </Pop>
      <CoinStream at={at("quelqu'un") - 4} from={[420, 800]} to={[900, 470]} n={5} every={3} />
      <Pop at={at("quelqu'un") - 2} x={900} y={500} rotate={6}>
        <Burst size={260} fill={col.purple}>
          <div style={comic(110, "#fff")}>?</div>
        </Burst>
      </Pop>
      <StickMan
        x={880}
        y={1500}
        height={520}
        variant="full"
        flip
        expression={frame >= chained ? "surprised" : "happy"}
        poses={[
          [0, "phone"],
          [chained, "shrug"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 2. Les pubs rapportent au créateur du jeu. Pas à toi.
const SceneCreator: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const notYou = at("pas");
  const bag: [number, number] = [790, 760];
  return (
    <AbsoluteFill>
      <Ground horizon={1360} />
      <Pop at={0} x={290} y={640} rotate={-4} from="left">
        <InkPhone width={300}>
          <ScreenVideo src={`${slug}/gp-chateau.mp4`} trim={60} />
          <Pop at={at("pubs")} x={screenW(300) / 2} y={240}>
            <div
              style={{
                padding: "18px 26px",
                background: col.yellow,
                border: `6px solid ${ink}`,
                borderRadius: 16,
                boxShadow: `6px 8px 0 ${ink}`,
                ...comic(54),
              }}
            >
              PUB
            </div>
          </Pop>
        </InkPhone>
      </Pop>
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={[at("rapportent"), at("l'argent")]} label="Le créateur" labelBg={col.purple} />
      <CoinStream at={at("rapportent")} from={[290, 560]} to={bag} n={7} every={4} />
      <StickMan
        x={790}
        y={1360}
        height={380}
        flip
        expression="smug"
        poses={[
          [0, "idle"],
          [at("createur"), "cheer"],
        ]}
      />
      <StickMan x={290} y={1360} height={300} expression={frame >= notYou ? "sad" : "neutral"} poses={[[0, "phone"]]} seed={2} />
      <Ink d="M170 1030 L410 1370" at={notYou} dur={5} width={26} color={col.red} />
      <Ink d="M410 1030 L170 1370" at={notYou + 3} dur={5} width={26} color={col.red} />
      <Pop at={notYou + 2} x={290} y={1520} rotate={-5}>
        <Tag text="Pas à toi" bg={col.red} color="#fff" size={56} />
      </Pop>
    </AbsoluteFill>
  );
};

// 3. Alors inverse les rôles : les deux persos échangent leur place
const SceneSwap: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const t = prog(frame, at("inverse"), 14, EASE_IN_OUT);
  const hop = Math.sin(t * Math.PI) * 220;
  const swapped = t > 0.5;
  return (
    <AbsoluteFill>
      <Ground horizon={1400} />
      <SpeedLines cx={540} cy={700} />
      <Pop at={at("roles") - 4} x={540} y={620} rotate={-4}>
        <Burst size={620} fill={col.yellow}>
          <div style={{ ...comic(64), textAlign: "center", whiteSpace: "normal", width: 400 }}>INVERSE LES RÔLES</div>
        </Burst>
      </Pop>
      <StickMan
        x={interpolate(t, [0, 1], [260, 820])}
        y={1400 - hop}
        height={380}
        expression={swapped ? "happy" : "sad"}
        poses={[[0, swapped ? "cheer" : "phone"]]}
        seed={2}
      />
      <StickMan
        x={interpolate(t, [0, 1], [820, 260])}
        y={1400 - hop * 0.6}
        height={380}
        flip
        expression={swapped ? "surprised" : "smug"}
        poses={[[0, swapped ? "phone" : "hips"]]}
      />
      <Pop at={at("roles") + 4} x={820} y={930} rotate={5}>
        <Tag text="Toi = créateur" bg={col.green} color="#fff" size={44} />
      </Pop>
    </AbsoluteFill>
  );
};

// 4. Play Store : un jeu qui a des millions de téléchargements
const SceneStore: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ground none />
      <SpeedLines cy={900} color="#f4eed8" />
      <Pop at={0} x={300} y={960} rotate={-5} from="left">
        <InkPhone width={400}>
          <ScreenShot src={`${slug}/playstore.png`} width={screenW(400)} scroll={interpolate(frame, [at("trouve"), at("trouve") + 12], [0, 300], clamp)} />
        </InkPhone>
      </Pop>
      <Pop at={at("jeu", 2)} x={820} y={860} rotate={7} from="right">
        <InkPhone width={300}>
          <ScreenVideo src={`${slug}/gp-golf.mp4`} trim={30} />
        </InkPhone>
      </Pop>
      <Pop at={at("play")} x={300} y={420} rotate={-6}>
        <Tag text="Play Store" bg={col.blue} color="#fff" size={56} />
      </Pop>
      <Pop at={at("millions")} x={820} y={1270}>
        <Stars at={at("millions")} size={70} />
      </Pop>
      <Pop at={at("millions")} x={620} y={1480} from="up">
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
          <CountUp to={100} at={at("millions")} dur={18} size={92} suffix=" M+" />
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

// 5. Fais une capture
const SceneShot: React.FC<SceneProps> = ({ at, slug }) => {
  const snap = at("capture") + 2;
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={520} y={1000} from="up" rotate={-2}>
        <InkPhone width={420}>
          <ScreenVideo src={`${slug}/gp-foule.mp4`} trim={50} />
          <Flash at={snap} />
        </InkPhone>
      </Pop>
      <Pop at={snap - 4} x={850} y={600} rotate={12} wiggle={snap}>
        <CameraIcon size={200} />
      </Pop>
      <Pop at={snap + 2} x={290} y={1450} rotate={-5}>
        <Tag text="Capture !" bg={col.blue} color="#fff" size={56} />
      </Pop>
    </AbsoluteFill>
  );
};

// 6. Claude le crée pour toi. Zéro code.
const SceneClaude: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Pop at={0} x={545} y={900} from="down" rotate={-1}>
      <ClaudeWindow
        width={900}
        height={800}
        image={`${slug}/capture-jeu.png`}
        attachAt={2}
        prompt="Crée-moi un jeu dans ce style"
        typeAt={at("demandant")}
        codeAt={at("style") + 4}
        previewAt={at("cree")}
        preview={`${slug}/gp-solrush.mp4`}
      />
    </Pop>
    <Pop at={at("toi", 1)} x={760} y={1420} rotate={4}>
      <Tag text="Jeu prêt ✓" bg={col.green} color="#fff" size={52} />
    </Pop>
    <Pop at={at("zero")} x={310} y={1420} rotate={-6}>
      <Stamp text="Zéro code" at={at("zero")} size={70} rotate={-6} />
    </Pop>
  </AbsoluteFill>
);

// 7. Connecter à Google AdSense
const SceneConnect: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
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
    <Pop at={at("google")} x={810} y={560} rotate={6}>
      <Tag text="Google AdSense" bg={col.blue} color="#fff" size={38} />
    </Pop>
    <Pop at={at("adsense") + 4} x={540} y={1450} rotate={-3}>
      <Tag text="Connecté ✓" bg={col.green} color="#fff" size={50} />
    </Pop>
  </AbsoluteFill>
);

// 8. Maintenant c'est toi qui encaisses quand les autres jouent
const SceneYouEarn: React.FC<SceneProps> = ({ at, slug }) => {
  const starts = [at("encaisses"), at("quand"), at("autres"), at("jouent"), at("jouent") + 5];
  const bag: [number, number] = [540, 700];
  return (
    <AbsoluteFill>
      <Ground horizon={1330} />
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={starts} label="Toi" labelBg={col.green} />
      <CoinBurst at={at("encaisses")} x={540} y={640} count={12} size={72} />
      <Pop at={at("toi", 2)} x={850} y={430} rotate={7}>
        <Tag text="Rôles inversés" bg={col.yellow} size={42} />
      </Pop>
      {[150, 345, 540, 735, 930].map((x, i) => (
        <Player key={x} x={x} at={starts[i]} flip={i % 2 === 1} seed={i} bag={bag} />
      ))}
    </AbsoluteFill>
  );
};

// 9. Appel à l'action : commente « jeu » + lien en bio
const SceneCta: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const sent = at("commentaire") + 6;
  const bio = at("clique");
  return (
    <AbsoluteFill>
      <Ground none />
      <StickMan
        x={830}
        y={1250}
        height={560}
        variant="full"
        flip
        expression={frame >= at("methode") ? "happy" : "neutral"}
        poses={[
          [0, "idle"],
          [at("methode"), "raise"],
          [at("tape"), "present"],
          [bio, "point"],
        ]}
      />
      <Pop at={at("methode")} x={370} y={700} rotate={-6} out={bio - 3}>
        <Burst size={600}>
          <div style={{ ...comic(64), textAlign: "center", whiteSpace: "normal", width: 380 }}>MÉTHODE COMPLÈTE</div>
        </Burst>
      </Pop>
      <Pop at={sent} x={430} y={1030} out={bio - 3}>
        <CommentCard text="jeu" />
      </Pop>
      <Hearts at={sent + 4} x={640} y={950} />
      <Pop at={bio} x={380} y={760} rotate={-3}>
        <BioCard tapAt={at("lien")} />
      </Pop>
      <InkTap at={at("lien")} x={380} y={935} />
      <Sparkles at={at("lien") + 2} cx={380} cy={760} r={330} />
      <Pop at={at("tape")} x={540} y={1440} from="up">
        <CommentBar width={900} text="jeu" typeAt={at("jeu", 4)} />
      </Pop>
    </AbsoluteFill>
  );
};

export const JeuGratuit: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    creator: f("les") - 2,
    swap: f("alors") - 2,
    store: f("va") - 3,
    shot: f("fais") - 3,
    claude: f("envoie-la") - 2,
    connect: f("connectes") - 8,
    youEarn: f("maintenant") - 3,
    cta: f("si") - 2,
  };
  const whooshes = [S.creator, S.store, S.shot, S.claude, S.connect, S.youEarn];
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {/* Bruitages (volume global SFX_GAIN) */}
      {whooshes.map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh" volume={0.45} />
      ))}
      <Sfx at={0} name="pop" volume={0.4} />
      <Sfx at={f("travailles")} name="glitch" volume={0.35} />
      <Sfx at={f("travailles")} name="impact" volume={0.45} />
      <Sfx at={f("gratuitement")} name="impact" volume={0.4} />
      <Sfx at={f("quelqu'un")} name="coin" volume={0.5} />
      <Sfx at={f("pubs")} name="pop" volume={0.45} />
      <Sfx at={f("rapportent") + 14} name="coin" volume={0.4} />
      <Sfx at={f("l'argent") + 10} name="coin" volume={0.35} />
      <Sfx at={f("pas")} name="glitch" volume={0.4} />
      <Sfx at={S.swap - 6} name="whoosh_big" volume={0.4} />
      <Sfx at={f("inverse")} name="riser" volume={0.35} />
      <Sfx at={f("roles") - 4} name="impact" volume={0.45} />
      <Sfx at={f("play")} name="pop" volume={0.4} />
      <Sfx at={f("millions")} name="ding" volume={0.4} />
      <Sfx at={f("capture") + 2} name="tick" volume={0.7} />
      <Sfx at={f("capture") + 2} name="glitch" volume={0.25} />
      <Sfx at={S.claude + 2} name="pop" volume={0.45} />
      <Sfx at={f("demandant")} name="typing" volume={0.5} />
      <Sfx at={f("cree")} name="ding" volume={0.45} />
      <Sfx at={f("zero")} name="impact" volume={0.4} />
      <Sfx at={f("adsense") + 4} name="ding" volume={0.45} />
      <Sfx at={f("encaisses")} name="coin" volume={0.55} />
      {["quand", "autres", "jouent"].map((w) => (
        <Sfx key={w} at={f(w) + 15} name="coin" volume={0.25} />
      ))}
      <Sfx at={S.cta - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("methode")} name="impact" volume={0.4} />
      <Sfx at={f("jeu", 4)} name="typing" volume={0.45} />
      <Sfx at={f("commentaire") + 6} name="notif" volume={0.55} />
      <Sfx at={f("clique")} name="pop" volume={0.45} />
      <Sfx at={f("lien")} name="tick" volume={0.5} />
      <Camera shakes={[f("travailles"), f("gratuitement"), f("pas"), f("roles") - 4, f("zero"), f("encaisses"), f("methode")]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.05, render: <SceneHook {...scene(0)} /> },
            { from: S.creator, transition: "whip", push: 0.04, render: <SceneCreator {...scene(S.creator)} /> },
            { from: S.swap, transition: "zoom", push: 0.04, render: <SceneSwap {...scene(S.swap)} /> },
            { from: S.store, transition: "whip", push: 0.05, render: <SceneStore {...scene(S.store)} /> },
            { from: S.shot, transition: "whip", push: 0.04, render: <SceneShot {...scene(S.shot)} /> },
            { from: S.claude, transition: "wipe", push: 0.03, render: <SceneClaude {...scene(S.claude)} /> },
            { from: S.connect, transition: "whip", push: 0.04, render: <SceneConnect {...scene(S.connect)} /> },
            { from: S.youEarn, transition: "zoom", push: 0.04, render: <SceneYouEarn {...scene(S.youEarn)} /> },
            { from: S.cta, transition: "zoom", push: 0.04, render: <SceneCta {...scene(S.cta)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
