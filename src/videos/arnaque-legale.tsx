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
  Flash,
  Hearts,
  Ink,
  ink,
  InkPhone,
  InkTap,
  Magnifier,
  Pop,
  ScreenShot,
  ScreenVideo,
  screenW,
  Sparkles,
  SpeedLines,
  Stars,
  Tag,
} from "../lib/Doodle";
import { clamp, EASE_IN, EASE_IN_OUT, prog } from "../lib/ease";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { captionFont, ComicCaptions, Ground, handPos, StickMan, stick } from "../lib/Stick";
import { fontFamily } from "../lib/theme";
import { BioCard, comic, MoneyBag, Player, ScamSite, Stamp } from "../lib/Promo";
import { timeOf, type VideoProps } from "../lib/timing";

type SceneProps = { at: (word: string, occ?: number) => number; slug: string };
// 1. Accroche : ARNAQUE… LÉGALE
const SceneHook: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ground none />
      <SpeedLines cx={380} cy={760} color="#f6e9e9" />
      <Pop at={at("arnaquer")} x={380} y={740} rotate={-6}>
        <Burst size={600} fill={col.red}>
          <div style={comic(82, "#fff")}>ARNAQUE</div>
        </Burst>
      </Pop>
      <Pop at={at("legale")} x={400} y={1090} z={5}>
        <Stamp text="100% légal" at={at("legale")} color={col.green} size={78} rotate={-8} />
      </Pop>
      <StickMan
        x={830}
        y={1480}
        height={640}
        variant="full"
        flip
        expression={frame >= at("arnaquer") ? "smug" : "neutral"}
        poses={[
          [0, "idle"],
          [at("arnaquer"), "hips"],
          [at("legale"), "point"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 2. Ces sites : « gagne 2 000, 5 000 F par heure juste en jouant »
const SceneSites: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const w = 440;
  const amount = frame >= at("cinq") ? "5 000 F" : "2 000 F";
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={at("sites")} x={190} y={960} rotate={-12} from="left">
        <InkPhone width={300}>
          <ScamSite width={screenW(300)} brand={1} amount="3 500 F" amountAt={at("sites") + 4} perHourAt={at("sites") + 6} tilesAt={at("sites") + 6} />
        </InkPhone>
      </Pop>
      <Pop at={at("sites") + 3} x={890} y={960} rotate={12} from="right">
        <InkPhone width={300}>
          <ScamSite width={screenW(300)} brand={2} amount="10 000 F" amountAt={at("sites") + 7} perHourAt={at("sites") + 9} tilesAt={at("sites") + 9} />
        </InkPhone>
      </Pop>
      <Pop at={0} x={540} y={1000} from="up">
        <InkPhone width={w}>
          <ScamSite width={screenW(w)} brand={0} amount={amount} amountAt={at("deux")} perHourAt={at("heure")} tilesAt={at("jouer")} />
        </InkPhone>
      </Pop>
      <Pop at={at("cinq")} x={540} y={540} rotate={-4} wiggle={at("cinq")}>
        <Tag text="5 000 F / heure ?!" bg={col.yellow} size={58} />
      </Pop>
      <Pop at={at("jouer")} x={300} y={1520} rotate={-6}>
        <Tag text="Juste en jouant" bg={col.purple} color="#fff" size={48} />
      </Pop>
    </AbsoluteFill>
  );
};

// 3. Ces sites gagnent vraiment de l'argent avec les pubs pendant que tu joues
const SceneTheyEarn: React.FC<SceneProps> = ({ at, slug }) => {
  const starts = [at("gagnent"), at("reellement"), at("l'argent"), at("joues")];
  const bag: [number, number] = [540, 700];
  return (
    <AbsoluteFill>
      <Ground horizon={1330} />
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={starts} label="Le site" labelBg={col.purple} />
      <Pop at={at("l'argent")} x={870} y={430} rotate={8}>
        <Tag text="Pubs = $$$" bg={col.green} color="#fff" size={46} />
      </Pop>
      {[170, 400, 680, 910].map((x, i) => (
        <Player key={x} x={x} at={starts[i]} flip={i % 2 === 1} seed={i + 2} bag={bag} />
      ))}
    </AbsoluteFill>
  );
};

// 4. …mais ils ne vont jamais te payer : retrait bloqué
const SceneNeverPay: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const w = 460;
  const tap = at("vont");
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={380} y={960} from="up" rotate={-2}>
        <InkPhone width={w}>
          <ScamSite width={screenW(w)} brand={0} wallet={{ balance: "48 500 F", tapAt: tap, errorAt: tap + 4 }} />
          <InkTap at={tap} x={screenW(w) / 2} y={screenW(w) * 0.9} />
        </InkPhone>
      </Pop>
      <Pop at={at("payer") - 3} x={420} y={1180} z={5}>
        <Stamp text="Jamais payé" at={at("payer") - 3} size={80} rotate={-14} />
      </Pop>
      <StickMan
        x={880}
        y={1480}
        height={560}
        variant="full"
        flip
        expression={frame >= tap + 4 ? "sad" : "happy"}
        poses={[
          [0, "phone"],
          [tap + 4, "shrug"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 5. Alors voici comment faire pareil (légalement)
const ScenePareil: React.FC<SceneProps> = ({ at }) => (
  <AbsoluteFill>
    <Ground none />
    <SpeedLines cx={380} cy={760} />
    <Pop at={at("pareil") - 4} x={380} y={740} rotate={-5}>
      <Burst size={560}>
        <div style={{ ...comic(70), textAlign: "center", whiteSpace: "normal", width: 360 }}>FAIS PAREIL</div>
      </Burst>
    </Pop>
    <Pop at={at("pareil") + 4} x={380} y={1110} rotate={4}>
      <Tag text="Mais en légal" bg={col.green} color="#fff" size={52} />
    </Pop>
    <StickMan
      x={830}
      y={1480}
      height={640}
      variant="full"
      flip
      expression="smug"
      poses={[
        [0, "raise"],
        [at("pareil"), "point"],
      ]}
    />
  </AbsoluteFill>
);

// 6. Play Store : recherche d'un jeu
const SceneStore: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const q = "jeu fun populaire".slice(0, Math.max(0, Math.floor((frame - 4) * 1.2)));
  const w = 500;
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={560} y={1010} rotate={-2} from="up">
        <InkPhone width={w}>
          <ScreenShot src={`${slug}/playstore.png`} width={screenW(w)} scroll={interpolate(frame, [22, 34], [0, 300], clamp)}>
            <div style={{ position: "absolute", left: 110, top: 12, width: 330, height: 76, background: "#fff" }} />
            <div style={{ position: "absolute", left: 124, top: 22, fontFamily: "Roboto, Arial", fontSize: 34, color: "#202124" }}>
              {q}
              <span style={{ opacity: frame % 14 < 8 ? 1 : 0, color: "#1a73e8" }}>|</span>
            </div>
          </ScreenShot>
        </InkPhone>
      </Pop>
      <Pop at={at("play")} x={300} y={520} rotate={-6}>
        <Tag text="Play Store" bg={col.blue} color="#fff" size={56} />
      </Pop>
      <Pop at={2} x={860} y={640} from="right" float={14} rotate={-10}>
        <Magnifier size={230} />
      </Pop>
    </AbsoluteFill>
  );
};

// 7. Jeu fun, populaire, des millions de téléchargements
const ScenePopular: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <SpeedLines cy={930} color="#f4eed8" />
    <Pop at={at("populaire")} x={230} y={1000} rotate={-9} from="left">
      <InkPhone width={290}>
        <ScreenVideo src={`${slug}/gp-course.mp4`} trim={60} />
      </InkPhone>
    </Pop>
    <Pop at={at("populaire") + 4} x={850} y={1000} rotate={9} from="right">
      <InkPhone width={290}>
        <ScreenVideo src={`${slug}/gp-chateau.mp4`} trim={90} />
      </InkPhone>
    </Pop>
    <Pop at={1} x={540} y={930}>
      <InkPhone width={350}>
        <ScreenVideo src={`${slug}/gp-golf.mp4`} trim={30} />
      </InkPhone>
    </Pop>
    <Pop at={at("fun")} x={330} y={470} rotate={-7}>
      <Tag text="Fun" bg={col.orange} color="#fff" size={58} />
    </Pop>
    <Pop at={at("populaire")} x={730} y={470} rotate={5}>
      <Tag text="Populaire" bg={col.red} color="#fff" size={52} />
    </Pop>
    <Pop at={at("millions")} x={540} y={1262}>
      <Stars at={at("millions")} size={84} />
    </Pop>
    <Pop at={at("millions")} x={540} y={1420} from="up">
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

// 8. Tu captures ce jeu
const SceneShot: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const snap = at("captures") + 4;
  const fly = prog(frame, at("l'envoies") - 2, 12, EASE_IN_OUT);
  const w = 400;
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={520} y={1010} from="up" rotate={-2}>
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
            left: interpolate(fly, [0, 1], [520, 1300]),
            top: interpolate(fly, [0, 1], [1010, 700]),
            transform: `translate(-50%, -50%) rotate(${fly * 20}deg) scale(${interpolate(prog(frame, snap + 2, 8), [0, 1], [1.4, 0.55])})`,
            background: "#fff",
            padding: "14px 14px 44px",
            border: `6px solid ${ink}`,
            boxShadow: `10px 12px 0 ${ink}`,
          }}
        >
          <Img src={staticFile(`${slug}/capture-jeu.png`)} style={{ width: 300, display: "block", border: `4px solid ${ink}` }} />
        </div>
      )}
      <Pop at={snap + 2} x={300} y={1420} rotate={-5}>
        <Tag text="Capture !" bg={col.blue} color="#fff" size={54} />
      </Pop>
    </AbsoluteFill>
  );
};

// 9. Envoie à Claude : « recrée la même chose »
const SceneClaude: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Pop at={0} x={545} y={960} from="down" rotate={-1}>
      <ClaudeWindow
        width={900}
        height={800}
        image={`${slug}/capture-jeu.png`}
        attachAt={2}
        prompt="Recrée-moi la même chose"
        typeAt={at("demandant")}
        codeAt={at("recreer") + 4}
        previewAt={at("chose")}
        preview={`${slug}/gp-solrush.mp4`}
      />
    </Pop>
    <Pop at={at("chose") + 4} x={800} y={1430} rotate={4}>
      <Tag text="Jeu prêt ✓" bg={col.green} color="#fff" size={52} />
    </Pop>
  </AbsoluteFill>
);

// 10. Claude va tout faire pour toi
const SceneAllDone: React.FC<SceneProps> = ({ at }) => (
  <AbsoluteFill>
    <Ground none />
    <Pop at={0} x={330} y={880} rotate={-4}>
      <CodeCard width={500} height={560} at={0} speed={3} />
    </Pop>
    <Pop at={at("tout")} x={330} y={1290} rotate={-6}>
      <Tag text="Zéro code" bg={col.red} color="#fff" size={60} />
    </Pop>
    <Pop at={at("toi")} x={330} y={480} rotate={4}>
      <Tag text="Claude fait tout" bg={col.orange} color="#fff" size={46} />
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
        [at("tout"), "hips"],
      ]}
    />
  </AbsoluteFill>
);

// 11. Connecter le jeu à Google AdSense
const SceneConnect: React.FC<SceneProps> = ({ at, slug }) => {
  const click = at("adsense") + 4;
  return (
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
      <Pop at={click} x={540} y={1450} rotate={-3}>
        <Tag text="Connecté ✓" bg={col.green} color="#fff" size={50} />
      </Pop>
    </AbsoluteFill>
  );
};

// 12. Tu gagnes de l'argent quand les gens jouent à TON jeu
const SceneYouEarn: React.FC<SceneProps> = ({ at, slug }) => {
  const starts = [at("gagner", 1), at("l'argent", 1), at("gens", 1), at("jouent"), at("jouent") + 5];
  const bag: [number, number] = [540, 700];
  return (
    <AbsoluteFill>
      <Ground horizon={1330} />
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={starts} label="Toi" labelBg={col.green} />
      <CoinBurst at={at("l'argent", 1)} x={540} y={640} count={12} size={72} />
      <Pop at={at("jouent")} x={850} y={430} rotate={7}>
        <Tag text="Revenus pubs" bg={col.yellow} size={44} />
      </Pop>
      {[150, 345, 540, 735, 930].map((x, i) => (
        <Player key={x} x={x} at={starts[i]} flip={i % 2 === 1} seed={i} bag={bag} />
      ))}
    </AbsoluteFill>
  );
};

// 13. Appel à l'action : commente « business » + lien en bio
const SceneCta: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const sent = at("commentaire") + 6;
  const bio = at("clique");
  const go = at("lancer");
  const ry = interpolate(frame, [go, go + 22], [1500, -500], { ...clamp, easing: EASE_IN });
  return (
    <AbsoluteFill>
      <Ground none />
      <StickMan
        x={830}
        y={1250}
        height={560}
        variant="full"
        flip
        expression={frame >= at("business") ? "happy" : "neutral"}
        poses={[
          [0, "idle"],
          [at("t'interesse"), "think"],
          [at("tape"), "present"],
          [bio, "point"],
          [go, "cheer"],
        ]}
      />
      <Pop at={at("business")} x={370} y={700} rotate={-6} out={bio - 3}>
        <Burst size={600}>
          <div style={comic(76)}>BUSINESS</div>
        </Burst>
      </Pop>
      <Pop at={sent} x={430} y={1030} out={bio - 3}>
        <CommentCard text="business" />
      </Pop>
      <Hearts at={sent + 4} x={640} y={950} />
      <Pop at={bio} x={380} y={760} rotate={-3}>
        <BioCard tapAt={at("lien")} />
      </Pop>
      <InkTap at={at("lien")} x={380} y={935} />
      <Sparkles at={at("lien") + 2} cx={380} cy={760} r={330} />
      {frame >= go && <Img src={staticFile(`${slug}/fusee.png`)} style={{ position: "absolute", left: 90, top: ry, width: 160 }} />}
      <Pop at={at("tape")} x={540} y={1440} from="up">
        <CommentBar width={900} text="business" typeAt={at("business", 1)} />
      </Pop>
    </AbsoluteFill>
  );
};

export const ArnaqueLegale: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    sites: f("vois") - 6,
    earn: f("ces", 1) - 2,
    never: f("mais") - 2,
    pareil: f("alors") - 2,
    store: f("vas") - 5,
    popular: f("jeu") - 3,
    shot: f("captures") - 5,
    claude: f("claude") - 4,
    done: f("claude", 1) - 2,
    connect: f("ensuite") - 2,
    youEarn: f("ce", 1) - 2,
    cta: f("alors", 1) - 2,
  };
  const whooshes = [S.sites, S.earn, S.pareil, S.store, S.shot, S.claude, S.done, S.connect, S.youEarn];
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {/* Bruitages (volume global SFX_GAIN) */}
      {whooshes.map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh" volume={0.45} />
      ))}
      <Sfx at={f("arnaquer")} name="impact" volume={0.45} />
      <Sfx at={f("legale")} name="impact" volume={0.35} />
      <Sfx at={f("legale")} name="ding" volume={0.45} />
      <Sfx at={f("sites")} name="pop" volume={0.4} />
      <Sfx at={f("sites") + 3} name="pop" volume={0.4} />
      <Sfx at={f("deux")} name="coin" volume={0.45} />
      <Sfx at={f("cinq")} name="coin" volume={0.55} />
      <Sfx at={f("heure")} name="pop" volume={0.4} />
      <Sfx at={f("jouer")} name="pop" volume={0.4} />
      {["gagnent", "reellement", "l'argent", "joues"].map((w) => (
        <Sfx key={w} at={f(w) + 15} name="coin" volume={0.25} />
      ))}
      <Sfx at={S.never - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("vont")} name="tick" volume={0.6} />
      <Sfx at={f("vont") + 4} name="glitch" volume={0.4} />
      <Sfx at={f("payer") - 3} name="impact" volume={0.5} />
      <Sfx at={f("pareil") - 4} name="impact" volume={0.35} />
      <Sfx at={S.store + 4} name="typing" volume={0.45} />
      <Sfx at={S.popular - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("fun")} name="pop" volume={0.4} />
      <Sfx at={f("populaire")} name="pop" volume={0.4} />
      <Sfx at={f("millions")} name="ding" volume={0.4} />
      <Sfx at={f("captures") + 4} name="tick" volume={0.7} />
      <Sfx at={f("captures") + 4} name="glitch" volume={0.25} />
      <Sfx at={S.claude + 2} name="pop" volume={0.45} />
      <Sfx at={f("demandant")} name="typing" volume={0.5} />
      <Sfx at={f("chose")} name="ding" volume={0.45} />
      <Sfx at={f("tout")} name="impact" volume={0.35} />
      <Sfx at={f("adsense") + 4} name="ding" volume={0.45} />
      {["gagner", "l'argent", "gens"].map((w) => (
        <Sfx key={w} at={f(w, 1) + 15} name="coin" volume={0.25} />
      ))}
      <Sfx at={f("jouent") + 15} name="coin" volume={0.25} />
      <Sfx at={S.cta - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("business")} name="impact" volume={0.45} />
      <Sfx at={f("business", 1)} name="typing" volume={0.45} />
      <Sfx at={f("commentaire") + 6} name="notif" volume={0.55} />
      <Sfx at={f("clique")} name="pop" volume={0.45} />
      <Sfx at={f("lien")} name="tick" volume={0.5} />
      <Sfx at={f("lancer")} name="whoosh_big" volume={0.5} />
      <Camera shakes={[f("arnaquer"), f("legale"), f("cinq"), f("payer") - 3, f("pareil") - 4, f("tout"), f("business")]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.04, render: <SceneHook {...scene(0)} /> },
            { from: S.sites, transition: "whip", push: 0.04, render: <SceneSites {...scene(S.sites)} /> },
            { from: S.earn, transition: "zoom", push: 0.04, render: <SceneTheyEarn {...scene(S.earn)} /> },
            { from: S.never, transition: "cut", push: 0.05, render: <SceneNeverPay {...scene(S.never)} /> },
            { from: S.pareil, transition: "whip", push: 0.04, render: <ScenePareil {...scene(S.pareil)} /> },
            { from: S.store, transition: "whip", push: 0.05, render: <SceneStore {...scene(S.store)} /> },
            { from: S.popular, transition: "zoom", push: 0.05, render: <ScenePopular {...scene(S.popular)} /> },
            { from: S.shot, transition: "whip", push: 0.04, render: <SceneShot {...scene(S.shot)} /> },
            { from: S.claude, transition: "wipe", push: 0.03, render: <SceneClaude {...scene(S.claude)} /> },
            { from: S.done, transition: "whip", push: 0.04, render: <SceneAllDone {...scene(S.done)} /> },
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
