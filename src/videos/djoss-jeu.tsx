import { AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  CameraIcon,
  ClaudeSpark,
  CodeCard,
  col,
  CommentBar,
  CommentCard,
  CountUp,
  DownloadIcon,
  Flag,
  Flash,
  Hearts,
  Ink,
  ink,
  InkPhone,
  Pop,
  ScreenShot,
  ScreenVideo,
  screenW,
  Sparkles,
  SpeedLines,
  Stars,
  Tag,
} from "../lib/Doodle";
import { comic, MoneyBag, Player, Stamp } from "../lib/Promo";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { ComicCaptions, Ground, StickMan, stick } from "../lib/Stick";
import { timeOf, type VideoProps } from "../lib/timing";

// Montage des enregistrements d'écran de l'utilisateur (Play Store → capture → Claude) en style dessiné,
// hook « Si tu es au Togo… » et appel à l'action : « jeu » en commentaire + djoss.me (formation WhatsApp gratuite).

type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

const WA = "#25d366";

// 1. Si tu es au Togo, au Bénin, en Côte d'Ivoire… bref, en Afrique
const SceneAfrica: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const flags: [Parameters<typeof Flag>[0]["name"], string, number, number][] = [
    ["togo", "Togo", at("togo"), -6],
    ["benin", "Bénin", at("benin"), 4],
    ["ci", "Côte d'Ivoire", at("cote"), -3],
  ];
  return (
    <AbsoluteFill>
      <Ground horizon={1560} />
      {frame >= at("afrique") && <SpeedLines cx={540} cy={1000} color="#fdf0c0" />}
      {flags.map(([name, label, t, rot], i) => (
        <Pop key={name} at={t} x={200 + i * 340} y={560} rotate={rot}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Flag name={name} width={250} />
            <div style={comic(40)}>{label}</div>
          </div>
        </Pop>
      ))}
      <Pop at={at("afrique")} x={480} y={1110} rotate={-4}>
        <Burst size={540} fill={col.yellow}>
          <div style={{ ...comic(60), textAlign: "center", lineHeight: 1 }}>
            BREF,
            <br />
            EN AFRIQUE
          </div>
        </Burst>
      </Pop>
      <StickMan x={850} y={1560} height={360} variant="full" flip expression="happy" poses={[[0, "wave"], [at("afrique"), "cheer"]]} />
    </AbsoluteFill>
  );
};

// 2. Voici un business que tu peux faire avec Claude et le Play Store.
const SceneBusiness: React.FC<SceneProps> = ({ at }) => (
  <AbsoluteFill>
    <Ground horizon={1560} />
    <Pop at={0} x={540} y={560} rotate={-3}>
      <Stamp text="Business" at={0} color={col.green} size={96} rotate={-3} />
    </Pop>
    <Pop at={at("claude")} x={290} y={950} rotate={-5}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 34px", background: "#faf9f5", border: `7px solid ${ink}`, borderRadius: 28, boxShadow: `8px 10px 0 ${ink}` }}>
        <ClaudeSpark size={86} />
        <div style={comic(62)}>Claude</div>
      </div>
    </Pop>
    <Pop at={at("et")} x={540} y={1110}>
      <div style={comic(90)}>+</div>
    </Pop>
    <Pop at={at("play")} x={790} y={1250} rotate={5}>
      <Tag text="Play Store" bg={col.blue} color="#fff" size={62} />
    </Pop>
    <StickMan x={190} y={1560} height={330} expression="happy" poses={[[0, "point"]]} seed={2} />
  </AbsoluteFill>
);

/** Téléphone dessiné qui affiche un enregistrement d'écran de l'utilisateur. */
const Rec: React.FC<{ src: string; width: number; rate?: number }> = ({ src, width, rate = 1 }) => (
  <InkPhone width={width}>
    <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
  </InkPhone>
);

// 3. Va sur le Play Store, cherche un jeu populaire, avec beaucoup de téléchargements.
const SceneStore: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Pop at={0} x={400} y={1020} rotate={-3} from="left">
      <Rec src={`${slug}/store-list.mp4`} width={560} />
    </Pop>
    <Pop at={at("play", 1)} x={860} y={480} rotate={6}>
      <Tag text="Play Store" bg={col.blue} color="#fff" size={46} />
    </Pop>
    <Pop at={at("populaire")} x={850} y={800} rotate={-5}>
      <Tag text="Populaire" bg={col.yellow} size={46} />
    </Pop>
    <Pop at={at("populaire") + 3} x={850} y={930}>
      <Stars at={at("populaire") + 3} size={44} />
    </Pop>
    <Pop at={at("beaucoup")} x={850} y={1150} rotate={4}>
      <DownloadIcon size={130} />
    </Pop>
  </AbsoluteFill>
);

// 4. Celui-ci, par exemple : plus de 500 000 téléchargements.
const ScenePage: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Pop at={0} x={560} y={1010} rotate={2} from="right">
      <Rec src={`${slug}/store-page.mp4`} width={540} />
    </Pop>
    <Ink d="M150 1420 C110 1280 150 1180 250 1120" at={at("celui-ci")} dur={8} width={14} arrow />
    <Pop at={at("celui-ci")} x={170} y={1480} rotate={-6}>
      <Tag text="Celui-ci !" bg={col.red} color="#fff" size={46} />
    </Pop>
    <Pop at={at("plus")} x={640} y={1660} from="up">
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 34px 14px 20px", background: "#fff", border: `7px solid ${ink}`, borderRadius: 999, boxShadow: `8px 10px 0 ${ink}` }}>
        <DownloadIcon size={96} />
        <CountUp to={500} at={at("cinq")} dur={16} size={84} suffix=" k +" />
      </div>
    </Pop>
  </AbsoluteFill>
);

// 5. Fais une capture d'écran du jeu.
const SceneShot: React.FC<SceneProps> = ({ at, slug }) => {
  const snap = at("capture");
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={480} y={960} rotate={-2} from="up">
        <InkPhone width={560}>
          <ScreenVideo src={`${slug}/screenshot.mp4`} />
          <Flash at={snap} />
        </InkPhone>
      </Pop>
      <Pop at={snap - 4} x={880} y={560} rotate={12} wiggle={snap}>
        <CameraIcon size={190} />
      </Pop>
      <Pop at={snap + 3} x={860} y={1500} rotate={6}>
        <Tag text="Capture !" bg={col.blue} color="#fff" size={52} />
      </Pop>
    </AbsoluteFill>
  );
};

// 6. Va sur Claude, envoie la capture, demande-lui : crée-moi ce jeu en HTML5 pour le monétiser avec Google AdSense.
const SceneClaude: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const ask = at("crée-moi");
  const words = ["Crée-moi ce jeu", "en HTML5,", "pour le monétiser", "avec Google AdSense"];
  const times = [ask, at("html5"), at("monetiser"), at("google")];
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={330} y={1000} rotate={-3} from="left">
        <Rec src={`${slug}/claude.mp4`} width={540} rate={0.75} />
      </Pop>
      <Pop at={at("claude", 1)} x={820} y={430} rotate={5}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", background: "#faf9f5", border: `6px solid ${ink}`, borderRadius: 24, boxShadow: `6px 8px 0 ${ink}` }}>
          <ClaudeSpark size={60} />
          <div style={comic(48)}>Claude</div>
        </div>
      </Pop>
      <Pop at={ask - 2} x={785} y={1020} rotate={3}>
        <div style={{ width: 450, padding: "24px 26px", background: "#fff", border: `7px solid ${ink}`, borderRadius: 30, boxShadow: `8px 10px 0 ${ink}` }}>
          {words.map((w, i) => (
            <div key={w} style={{ ...comic(37, i === 3 ? col.blue : ink), opacity: frame >= times[i] ? 1 : 0.12, lineHeight: 1.2 }}>
              {w}
            </div>
          ))}
        </div>
      </Pop>
      <Pop at={at("capture", 1)} x={820} y={680} rotate={-6}>
        <Tag text="+ ta capture" bg={col.yellow} size={40} />
      </Pop>
    </AbsoluteFill>
  );
};

// 7. Claude code le jeu pour toi. Pas besoin de savoir coder.
const SceneNoCode: React.FC<SceneProps> = ({ at }) => (
  <AbsoluteFill>
    <Ground horizon={1560} />
    <Pop at={0} x={540} y={760} from="down" rotate={-2}>
      <CodeCard width={820} height={560} at={2} />
    </Pop>
    <Pop at={at("pas")} x={560} y={1220} rotate={-6} z={5}>
      <Stamp text="Zéro code" at={at("pas")} size={84} rotate={-6} />
    </Pop>
    <StickMan x={190} y={1560} height={320} expression="happy" poses={[[0, "chill"]]} seed={2} />
  </AbsoluteFill>
);

// 8. En ligne + Google AdSense
const SceneOnline: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Ink d="M405 1290 C445 1480 635 1480 675 1290" at={at("connectes")} dur={12} width={16} />
    <Pop at={0} x={270} y={1000} rotate={-4} from="left">
      <InkPhone width={300}>
        <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={120} />
      </InkPhone>
    </Pop>
    <Pop at={at("ligne")} x={270} y={560} rotate={-6}>
      <Tag text="En ligne ✓" bg={col.green} color="#fff" size={44} />
    </Pop>
    <Pop at={at("connectes")} x={810} y={1000} rotate={4} from="right" wiggle={at("google", 1)}>
      <InkPhone width={300}>
        <ScreenShot src={`${slug}/adsense.png`} width={screenW(300)} />
      </InkPhone>
    </Pop>
    <Pop at={at("google", 1)} x={810} y={560} rotate={6}>
      <Tag text="Google AdSense" bg={col.blue} color="#fff" size={38} />
    </Pop>
  </AbsoluteFill>
);

// 9. Chaque fois que des gens jouent, les pubs te rapportent de l'argent.
const SceneMoney: React.FC<SceneProps> = ({ at, slug }) => {
  const bag: [number, number] = [540, 720];
  const starts = [at("gens"), at("jouent"), at("pubs"), at("rapportent"), at("l'argent")];
  return (
    <AbsoluteFill>
      <Ground horizon={1450} />
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={starts} label="Toi" labelBg={col.green} />
      {[150, 345, 540, 735, 930].map((x, i) => (
        <Player key={x} x={x} at={starts[i] - 4} flip={i % 2 === 1} seed={i} bag={bag} ground={1450} />
      ))}
      <Pop at={at("pubs")} x={850} y={420} rotate={7}>
        <Tag text="Pubs = $" bg={col.yellow} size={46} />
      </Pop>
    </AbsoluteFill>
  );
};

// 10. Tape « jeu » en commentaire, et va sur djoss.me pour rejoindre la formation WhatsApp gratuite.
const SceneCta: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const link = at("djoss.me");
  const sent = at("commentaire") + 4;
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={540} y={430} rotate={-3}>
        <Tag text="Formation gratuite" bg={col.green} color="#fff" size={60} />
      </Pop>
      <Pop at={at("tape")} x={540} y={770} out={link - 3} from="up">
        <CommentBar width={900} text="jeu" typeAt={at("jeu", 5) - 4} />
      </Pop>
      <Pop at={sent} x={460} y={1010} out={link - 3}>
        <CommentCard text="jeu" />
      </Pop>
      <Hearts at={sent + 3} x={720} y={960} />
      <Pop at={link} x={540} y={900} rotate={-2}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "36px 56px", background: "#fff", border: `9px solid ${ink}`, borderRadius: 40, boxShadow: `12px 14px 0 ${ink}` }}>
          <div style={{ ...comic(120, ink), letterSpacing: 1 }}>djoss.me</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 30px", background: WA, border: `6px solid ${ink}`, borderRadius: 999, ...comic(44, "#fff") }}>
            <WhatsAppIcon size={56} /> Formation WhatsApp
          </div>
        </div>
      </Pop>
      {frame >= link && <Sparkles at={link + 2} cx={540} cy={900} r={420} />}
      <StickMan
        x={830}
        y={1700}
        height={420}
        variant="full"
        flip
        expression="happy"
        poses={[
          [0, "present"],
          [link, "point"],
        ]}
      />
    </AbsoluteFill>
  );
};

/** Bulle WhatsApp simplifiée (cercle + combiné), dessinée. */
const WhatsAppIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M50 8 C26 8 8 26 8 49 C8 58 11 66 15 72 L9 92 L30 86 C36 89 43 91 50 91 C74 91 92 72 92 49 C92 26 74 8 50 8 Z" fill="#fff" stroke={ink} strokeWidth={6} />
    <path d="M36 30 C33 30 30 34 31 40 C33 52 46 66 59 69 C65 70 69 67 69 64 L69 59 L59 55 L55 60 C49 58 42 51 40 45 L45 41 L41 31 Z" fill={WA} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

export const DjossJeu: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    business: f("voici") - 3,
    store: f("d'abord") - 3,
    page: f("celui-ci") - 3,
    shot: f("fais") - 3,
    claude: f("ensuite") - 3,
    nocode: f("claude", 2) - 3,
    online: f("mets") - 6,
    money: f("chaque") - 8,
    cta: f("si", 1) - 3,
  };
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {[S.store, S.page, S.shot, S.claude, S.online, S.money].map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh" volume={0.4} />
      ))}
      {[S.business, S.nocode, S.cta].map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh_big" volume={0.35} />
      ))}
      {[f("togo"), f("benin"), f("cote")].map((w) => (
        <Sfx key={w} at={w} name="pop" volume={0.4} />
      ))}
      <Sfx at={f("afrique")} name="impact" volume={0.45} />
      <Sfx at={S.business + 3} name="impact" volume={0.4} />
      <Sfx at={f("populaire")} name="ding" volume={0.35} />
      <Sfx at={f("cinq")} name="riser" volume={0.25} />
      <Sfx at={f("capture")} name="tick" volume={0.6} />
      <Sfx at={f("crée-moi")} name="typing" volume={0.4} />
      <Sfx at={f("pas")} name="impact" volume={0.4} />
      <Sfx at={f("adsense", 1) + 4} name="ding" volume={0.4} />
      {[f("gens"), f("jouent"), f("pubs"), f("rapportent"), f("l'argent")].map((w) => (
        <Sfx key={w} at={w + 12} name="coin" volume={0.3} />
      ))}
      <Sfx at={f("jeu", 5) - 4} name="typing" volume={0.4} />
      <Sfx at={f("commentaire") + 4} name="notif" volume={0.5} />
      <Sfx at={f("djoss.me")} name="impact" volume={0.45} />
      <Camera shakes={[f("afrique"), S.business + 3, f("pas"), f("djoss.me")]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.04, render: <SceneAfrica {...scene(0)} /> },
            { from: S.business, transition: "zoom", push: 0.04, render: <SceneBusiness {...scene(S.business)} /> },
            { from: S.store, transition: "whip", push: 0.03, render: <SceneStore {...scene(S.store)} /> },
            { from: S.page, transition: "whip", push: 0.03, render: <ScenePage {...scene(S.page)} /> },
            { from: S.shot, transition: "whip", push: 0.03, render: <SceneShot {...scene(S.shot)} /> },
            { from: S.claude, transition: "wipe", push: 0.03, render: <SceneClaude {...scene(S.claude)} /> },
            { from: S.nocode, transition: "zoom", push: 0.04, render: <SceneNoCode {...scene(S.nocode)} /> },
            { from: S.online, transition: "whip", push: 0.04, render: <SceneOnline {...scene(S.online)} /> },
            { from: S.money, transition: "whip", push: 0.04, render: <SceneMoney {...scene(S.money)} /> },
            { from: S.cta, transition: "zoom", push: 0.04, render: <SceneCta {...scene(S.cta)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
