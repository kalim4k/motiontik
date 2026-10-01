import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  CameraIcon,
  ClaudeSpark,
  ClaudeWindow,
  CoinBurst,
  CoinRain,
  col,
  CommentBar,
  CommentCard,
  CountUp,
  DownloadIcon,
  Flag,
  type FlagName,
  Flash,
  Hearts,
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
import { clamp, EASE_IN, prog } from "../lib/ease";
import { comic, MoneyBag, Player } from "../lib/Promo";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { ComicCaptions, Ground, type PoseKey, StickMan, stick, useVoiceLevel } from "../lib/Stick";
import { timeOf, type VideoProps } from "../lib/timing";

// Vidéo avec la vraie voix et la vraie tête du créateur : têtes expressives générées par IA
// (npm run face) posées sur le corps du bonhomme bâton, façon « grosse tête » de mème.

type Face = "choque" | "confiant" | "clin" | "reflexion" | "rire" | "argent" | "lunettes" | "malin" | "serieux";
type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

/** Tête détourée qui parle (léger rebond sur la voix) et « pope » à chaque changement d'expression. */
const Head: React.FC<{ slug: string; faces: [number, Face][]; width: number; tilt?: number; origin?: string }> = ({ slug, faces, width, tilt = 0, origin = "50% 50%" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const level = useVoiceLevel(slug);
  let idx = 0;
  faces.forEach(([f], i) => {
    if (frame >= f) idx = i;
  });
  const [since, face] = faces[idx];
  const pop = idx > 0 ? spring({ frame: frame - since, fps, config: { damping: 8, stiffness: 240 } }) : 1;
  const s = (0.85 + pop * 0.15) * (1 + level * 0.035);
  const r = tilt + Math.sin(frame / 9) * 2.5 + level * 3 * Math.sin(frame / 2);
  return (
    <Img
      src={staticFile(`${slug}/${face}.png`)}
      style={{ width, display: "block", transform: `rotate(${r}deg) scale(${s})`, transformOrigin: origin, filter: `drop-shadow(6px 8px 0 ${ink})` }}
    />
  );
};

/** Le créateur : corps de bonhomme + sa vraie tête (2,3× la tête du dessin). */
const Me: React.FC<{ slug: string; x: number; y: number; height: number; faces: [number, Face][]; poses: PoseKey[]; flip?: boolean }> = ({
  slug,
  x,
  y,
  height,
  faces,
  poses,
  flip,
}) => {
  const k = height / 320;
  const w = 110 * k * 1.9;
  // Le menton (bas de l'image détourée) se pose juste au-dessus des épaules du dessin
  const neck = y - 200 * k;
  return (
    <>
      <StickMan x={x} y={y} height={height} variant="full" poses={poses} flip={flip} />
      <div style={{ position: "absolute", left: x - w / 2, bottom: 1920 - neck, width: w, display: "flex", alignItems: "flex-end" }}>
        <Head slug={slug} faces={faces} width={w} origin="50% 100%" />
      </div>
    </>
  );
};

/** Pièce de 500 F (vraie photo) qui tourne. */
const Piece500: React.FC<{ slug: string; width: number; spin?: number }> = ({ slug, width, spin = 0 }) => {
  const c = Math.cos(spin * Math.PI * 2);
  return (
    <Img
      src={staticFile(`${slug}/${c < 0 ? "piece500-revers" : "piece500-avers"}.png`)}
      style={{ width, display: "block", transform: `scaleX(${Math.max(0.04, Math.abs(c))})`, filter: `drop-shadow(8px 12px 0 ${ink})` }}
    />
  );
};

// 1. Togo, Bénin, Côte d'Ivoire… bref en Afrique
const SceneHook: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const af = at("afrique");
  const flags: [FlagName, string, number, number][] = [
    ["togo", "Togo", 200, at("togo")],
    ["benin", "Bénin", 540, at("benin")],
    ["ci", "Côte d'Ivoire", 880, at("cote")],
  ];
  return (
    <AbsoluteFill>
      <Ground horizon={1620} />
      {flags.map(([name, label, x, a], i) => (
        <div key={name}>
          <Pop at={a} x={x} y={560} rotate={[-5, 3, 6][i]} from="down" out={af - 6}>
            <Flag name={name} width={250} />
          </Pop>
          <Pop at={a + 3} x={x} y={740} rotate={[4, -3, -5][i]} out={af - 6}>
            <Tag text={label} size={i === 2 ? 34 : 42} />
          </Pop>
        </div>
      ))}
      <Pop at={af - 2} x={540} y={640}>
        <Img src={staticFile(`${slug}/afrique.png`)} style={{ width: 520, display: "block", filter: `drop-shadow(10px 12px 0 ${ink})` }} />
      </Pop>
      <Pop at={af + 2} x={820} y={430} rotate={6}>
        <Tag text="Afrique" bg={col.green} color="#fff" size={58} />
      </Pop>
      {frame >= af && <Sparkles at={af + 2} cx={540} cy={640} r={330} n={8} />}
      <Me
        slug={slug}
        x={540}
        y={1620}
        height={520}
        faces={[
          [0, "confiant"],
          [af, "clin"],
        ]}
        poses={[
          [0, "wave"],
          [af, "point"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 2. Avec 500 F comme capital
const SceneCoin: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const land = at("cinq");
  const y = interpolate(prog(frame, 0, Math.max(4, land), EASE_IN), [0, 1], [-400, 640]);
  const spin = frame < land ? (frame / Math.max(1, land)) * 3 : 3 + Math.sin((frame - land) / 12) * 0.06;
  return (
    <AbsoluteFill>
      <Ground horizon={1620} />
      <SpeedLines cx={540} cy={640} />
      <div style={{ position: "absolute", left: 540 - 220, top: y - 220 }}>
        <Piece500 slug={slug} width={440} spin={spin} />
      </div>
      <Sparkles at={land + 2} cx={540} cy={640} r={290} n={8} />
      <Pop at={at("capital")} x={540} y={1000} rotate={-4}>
        <Tag text="Capital : 500 F" bg={col.yellow} size={62} />
      </Pop>
      <Me
        slug={slug}
        x={820}
        y={1620}
        height={440}
        flip
        faces={[
          [0, "confiant"],
          [land, "choque"],
          [at("capital"), "malin"],
        ]}
        poses={[
          [0, "idle"],
          [land, "raise"],
          [at("capital"), "hips"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 3. Te lancer dans un business avec Claude et Play Store
const SceneBusiness: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const go = at("lancer");
  const ry = interpolate(frame, [go, go + 22], [1500, -500], { ...clamp, easing: EASE_IN });
  return (
    <AbsoluteFill>
      <Ground horizon={1620} />
      {frame >= go && <Img src={staticFile(`${slug}/fusee.png`)} style={{ position: "absolute", left: 120, top: ry, width: 170 }} />}
      <Pop at={at("business")} x={540} y={620} rotate={-5} out={at("claude") - 4}>
        <Burst size={560}>
          <div style={comic(78)}>BUSINESS</div>
        </Burst>
      </Pop>
      <Pop at={at("claude")} x={300} y={560} rotate={-6}>
        <div style={{ padding: 30, background: "#faf9f5", border: `7px solid ${ink}`, borderRadius: 40, boxShadow: `10px 12px 0 ${ink}` }}>
          <ClaudeSpark size={200} />
        </div>
      </Pop>
      <Pop at={at("claude") + 3} x={300} y={800} rotate={-4}>
        <Tag text="Claude" bg={col.orange} color="#fff" size={56} />
      </Pop>
      <Pop at={at("play") - 2} x={780} y={560} rotate={6}>
        <PlayIcon size={260} />
      </Pop>
      <Pop at={at("play") + 2} x={780} y={800} rotate={5}>
        <Tag text="Play Store" bg={col.blue} color="#fff" size={52} />
      </Pop>
      <Me
        slug={slug}
        x={540}
        y={1620}
        height={480}
        faces={[
          [0, "malin"],
          [at("business"), "argent"],
          [at("claude"), "confiant"],
        ]}
        poses={[
          [0, "idle"],
          [go, "cheer"],
          [at("claude"), "present"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 4. Aller sur Play Store, rechercher un jeu
const SceneSearch: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const q = "jeu populaire".slice(0, Math.max(0, Math.floor((frame - at("recherches")) * 1.1)));
  const w = 440;
  return (
    <AbsoluteFill>
      <Ground horizon={1620} />
      <Pop at={0} x={640} y={820} rotate={-2} from="up">
        <InkPhone width={w}>
          <ScreenShot src={`${slug}/playstore.png`} width={screenW(w)} scroll={interpolate(frame, [at("jeu") - 6, at("jeu") + 4], [0, 300], clamp)}>
            <div style={{ position: "absolute", left: 110, top: 12, width: 330, height: 76, background: "#fff" }} />
            <div style={{ position: "absolute", left: 124, top: 22, fontFamily: "Roboto, Arial", fontSize: 34, color: "#202124" }}>
              {q}
              <span style={{ opacity: frame % 14 < 8 ? 1 : 0, color: "#1a73e8" }}>|</span>
            </div>
          </ScreenShot>
        </InkPhone>
      </Pop>
      <Pop at={at("recherches")} x={930} y={420} from="right" float={12} rotate={-10}>
        <Magnifier size={200} />
      </Pop>
      <Me
        slug={slug}
        x={230}
        y={1620}
        height={420}
        faces={[
          [0, "serieux"],
          [at("recherches"), "reflexion"],
        ]}
        poses={[
          [0, "point"],
          [at("recherches"), "think"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 5. Un jeu intéressant, très populaire, beaucoup de téléchargements
const ScenePopular: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground horizon={1620} />
    <SpeedLines cy={650} color="#f4eed8" />
    <Pop at={at("interessant")} x={220} y={660} rotate={-9} from="left">
      <InkPhone width={250}>
        <ScreenVideo src={`${slug}/gp-course.mp4`} trim={60} />
      </InkPhone>
    </Pop>
    <Pop at={at("populaire")} x={860} y={660} rotate={9} from="right">
      <InkPhone width={250}>
        <ScreenVideo src={`${slug}/gp-chateau.mp4`} trim={90} />
      </InkPhone>
    </Pop>
    <Pop at={1} x={540} y={620}>
      <InkPhone width={300}>
        <ScreenVideo src={`${slug}/gp-golf.mp4`} trim={30} />
      </InkPhone>
    </Pop>
    <Pop at={at("populaire") + 2} x={540} y={960} rotate={-5} z={3}>
      <Tag text="Très populaire" bg={col.red} color="#fff" size={50} />
    </Pop>
    <Pop at={at("telechargements")} x={540} y={1110} from="up">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "14px 32px 14px 18px",
          background: "#fff",
          border: `7px solid ${ink}`,
          borderRadius: 999,
          boxShadow: `8px 10px 0 ${ink}`,
        }}
      >
        <DownloadIcon size={96} />
        <CountUp to={100} at={at("telechargements")} dur={16} size={84} suffix=" M+" />
      </div>
    </Pop>
    <Pop at={at("beaucoup")} x={540} y={1250}>
      <Stars at={at("beaucoup")} size={70} />
    </Pop>
    <Me
      slug={slug}
      x={860}
      y={1620}
      height={380}
      flip
      faces={[
        [0, "confiant"],
        [at("telechargements"), "choque"],
      ]}
      poses={[
        [0, "idle"],
        [at("telechargements"), "raise"],
      ]}
    />
  </AbsoluteFill>
);

// 6. « Ok ? » : gros plan clin d'œil
const SceneOk: React.FC<SceneProps> = ({ slug }) => (
  <AbsoluteFill>
    <SpeedLines cx={540} cy={900} color="#ffe9a8" />
    <Pop at={0} x={540} y={900}>
      <Head slug={slug} faces={[[0, "clin"]]} width={820} tilt={-4} />
    </Pop>
    <Pop at={2} x={820} y={430} rotate={10}>
      <Tag text="Ok ?" bg={col.yellow} size={90} />
    </Pop>
  </AbsoluteFill>
);

// 7. Tu fais une capture de ce jeu
const SceneShot: React.FC<SceneProps> = ({ at, slug }) => {
  const snap = at("capture") + 2;
  return (
    <AbsoluteFill>
      <Ground horizon={1620} />
      <Pop at={0} x={640} y={800} from="up" rotate={-2}>
        <InkPhone width={400}>
          <ScreenVideo src={`${slug}/gp-foule.mp4`} trim={50} />
          <Flash at={snap} />
        </InkPhone>
      </Pop>
      <Pop at={snap - 4} x={930} y={400} rotate={12} wiggle={snap}>
        <CameraIcon size={170} />
      </Pop>
      <Pop at={snap + 2} x={640} y={1290} rotate={-5}>
        <Tag text="Capture !" bg={col.blue} color="#fff" size={54} />
      </Pop>
      <Me
        slug={slug}
        x={220}
        y={1620}
        height={420}
        faces={[[0, "malin"]]}
        poses={[
          [0, "phone"],
          [snap, "point"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 8. Envoyer à Claude : recréer exactement le même jeu
const SceneClaude: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground horizon={1620} />
    <Pop at={0} x={540} y={720} from="down" rotate={-1}>
      <div style={{ transform: "scale(0.9)" }}>
        <ClaudeWindow
          width={900}
          height={720}
          image={`${slug}/capture-jeu.png`}
          attachAt={at("claude", 1) + 2}
          prompt="Recrée exactement le même jeu"
          typeAt={at("demander")}
          codeAt={at("recreer") + 4}
          previewAt={at("meme")}
          preview={`${slug}/gp-solrush.mp4`}
        />
      </div>
    </Pop>
    <Me
      slug={slug}
      x={860}
      y={1620}
      height={400}
      flip
      faces={[
        [0, "confiant"],
        [at("exactement"), "malin"],
        [at("meme"), "argent"],
      ]}
      poses={[
        [0, "present"],
        [at("meme"), "cheer"],
      ]}
    />
  </AbsoluteFill>
);

// 9. Connecter ton jeu à Google AdSense
const SceneConnect: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground horizon={1620} />
    <Ink d="M405 980 C445 1170 635 1170 675 980" at={at("connecter")} dur={12} width={16} />
    <Pop at={0} x={270} y={720} rotate={-4} from="left">
      <InkPhone width={280}>
        <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={120} />
      </InkPhone>
    </Pop>
    <Pop at={3} x={810} y={720} rotate={4} from="right" wiggle={at("google")}>
      <InkPhone width={280}>
        <ScreenShot src={`${slug}/adsense.png`} width={screenW(280)} />
      </InkPhone>
    </Pop>
    <Pop at={at("google")} x={810} y={1080} rotate={6}>
      <Tag text="Google AdSense" bg={col.blue} color="#fff" size={38} />
    </Pop>
    <Me
      slug={slug}
      x={540}
      y={1620}
      height={440}
      faces={[
        [0, "serieux"],
        [at("adsense"), "confiant"],
      ]}
      poses={[
        [0, "idle"],
        [at("connecter"), "present"],
      ]}
    />
  </AbsoluteFill>
);

// 10. Des revenus pub à chaque fois que les gens jouent à ton jeu
const ScenePlayers: React.FC<SceneProps> = ({ at, slug }) => {
  const starts = [at("toucher"), at("revenus"), at("chaque"), at("gens"), at("jouent")];
  const bag: [number, number] = [540, 860];
  return (
    <AbsoluteFill>
      <Ground horizon={1500} />
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={starts} label="Toi" labelBg={col.green} />
      <Pop at={at("revenus")} x={540} y={440} rotate={-4}>
        <Tag text="Revenus pub" bg={col.yellow} size={56} />
      </Pop>
      <Pop at={at("revenus") - 2} x={880} y={520} rotate={8}>
        <Head slug={slug} faces={[[0, "argent"]]} width={260} />
      </Pop>
      {[150, 345, 540, 735, 930].map((x, i) => (
        <Player key={x} x={x} at={starts[i]} flip={i % 2 === 1} seed={i} bag={bag} ground={1500} />
      ))}
    </AbsoluteFill>
  );
};

// 11. Tout simplement (lunettes)
const SceneSimple: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <SpeedLines cx={540} cy={960} color="#dff3fb" />
    <Pop at={0} x={540} y={980}>
      <Head slug={slug} faces={[[0, "lunettes"]]} width={760} tilt={3} />
    </Pop>
    <Pop at={at("simplement") - 2} x={540} y={1520} rotate={-4}>
      <Tag text="Tout simplement" bg={col.green} color="#fff" size={64} />
    </Pop>
  </AbsoluteFill>
);

// 12. 2 000, 5 000, 10 000 F CFA par jour
const SceneGains: React.FC<SceneProps> = ({ at, slug }) => {
  const amounts: [string, number, number, number, string][] = [
    ["2 000 F", at("deux"), 290, 440, col.yellow],
    ["5 000 F", at("cinq", 1), 790, 540, col.orange],
    ["10 000 F CFA", at("dix"), 540, 760, col.green],
  ];
  return (
    <AbsoluteFill>
      <Ground horizon={1620} />
      <CoinRain at={at("dix")} count={18} size={80} />
      {amounts.map(([t, a, x, y, bg], i) =>
        i < 2 ? (
          <Pop key={t} at={a} x={x} y={y} rotate={i ? 6 : -6}>
            <Tag text={t} bg={bg} size={70} />
          </Pop>
        ) : (
          <Pop key={t} at={a} x={x} y={y} rotate={-3} z={4}>
            <Burst size={600} fill={bg}>
              <div style={{ textAlign: "center" }}>
                <div style={comic(78, "#fff")}>10 000 F</div>
                <div style={{ ...comic(46, "#fff"), marginTop: 8 }}>PAR JOUR</div>
              </div>
            </Burst>
          </Pop>
        ),
      )}
      <Pop at={at("publicitaires", 1)} x={850} y={1000} rotate={5} z={5}>
        <Tag text="Selon ton trafic" bg="#fff" size={40} />
      </Pop>
      <CoinBurst at={at("dix")} x={540} y={760} count={14} size={76} />
      <Me
        slug={slug}
        x={540}
        y={1620}
        height={440}
        faces={[
          [0, "confiant"],
          [at("deux"), "argent"],
          [at("dix"), "choque"],
          [at("jour"), "rire"],
        ]}
        poses={[
          [0, "idle"],
          [at("deux"), "raise"],
          [at("dix"), "cheer"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 13. Appel à l'action : tape « business » en commentaire
const SceneCta: React.FC<SceneProps> = ({ at, slug }) => {
  const sent = at("commentaire") + 6;
  const show = at("montrer");
  return (
    <AbsoluteFill>
      <Ground horizon={1620} />
      <Pop at={at("business", 1)} x={540} y={540} rotate={-6} out={show - 3}>
        <Burst size={480}>
          <div style={comic(72)}>BUSINESS</div>
        </Burst>
      </Pop>
      <Pop at={show} x={540} y={540} rotate={-5} float={8}>
        <Img src={staticFile(`${slug}/guide.png`)} style={{ width: 280, display: "block", filter: `drop-shadow(8px 10px 0 ${ink})` }} />
      </Pop>
      <Sparkles at={show + 2} cx={540} cy={540} r={230} />
      <Pop at={at("exactement", 1)} x={850} y={700} rotate={6}>
        <Tag text="Pas à pas" bg={col.yellow} size={50} />
      </Pop>
      <Pop at={sent} x={300} y={810}>
        <CommentCard text="business" />
      </Pop>
      <Hearts at={sent + 4} x={520} y={760} />
      <Pop at={at("tape")} x={420} y={960} from="up">
        <CommentBar width={720} text="business" typeAt={at("business", 2)} />
      </Pop>
      <Me
        slug={slug}
        x={780}
        y={1620}
        height={460}
        flip
        faces={[
          [0, "serieux"],
          [at("tape"), "confiant"],
          [show, "clin"],
          [at("aussi") - 4, "rire"],
        ]}
        poses={[
          [0, "think"],
          [at("tape"), "present"],
          [show, "point"],
          [at("aussi"), "cheer"],
        ]}
      />
    </AbsoluteFill>
  );
};

export const Moi500F: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    coin: f("et") - 2,
    business: f("peux") - 4,
    search: f("tout") - 2,
    popular: f("jeu") - 3,
    ok: f("ok") - 2,
    shot: f("fais") - 2,
    claude: f("claude", 1) - 6,
    connect: f("tout", 1) - 2,
    players: f("ce", 3) - 2,
    simple: f("tout", 2) - 2,
    gains: f("ce", 4) - 2,
    cta: f("alors") - 2,
  };
  const whooshes = [S.coin, S.business, S.search, S.shot, S.claude, S.connect, S.players, S.gains];
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {/* Bruitages (volume global SFX_GAIN) */}
      {whooshes.map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh" volume={0.45} />
      ))}
      {["togo", "benin", "cote"].map((w) => (
        <Sfx key={w} at={f(w)} name="pop" volume={0.45} />
      ))}
      <Sfx at={f("afrique")} name="ding" volume={0.45} />
      <Sfx at={f("cinq")} name="coin" volume={0.6} />
      <Sfx at={f("cinq")} name="impact" volume={0.35} />
      <Sfx at={f("lancer")} name="whoosh_big" volume={0.5} />
      <Sfx at={f("business")} name="impact" volume={0.45} />
      <Sfx at={f("claude")} name="pop" volume={0.45} />
      <Sfx at={f("play")} name="pop" volume={0.45} />
      <Sfx at={f("recherches")} name="typing" volume={0.45} />
      <Sfx at={S.popular - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("telechargements")} name="ding" volume={0.45} />
      <Sfx at={S.ok} name="impact" volume={0.4} />
      <Sfx at={S.ok} name="pop" volume={0.5} />
      <Sfx at={f("capture") + 2} name="tick" volume={0.7} />
      <Sfx at={f("demander")} name="typing" volume={0.5} />
      <Sfx at={f("meme")} name="ding" volume={0.45} />
      <Sfx at={f("google")} name="pop" volume={0.45} />
      {["toucher", "revenus", "chaque", "gens", "jouent"].map((w) => (
        <Sfx key={w} at={f(w) + 15} name="coin" volume={0.25} />
      ))}
      <Sfx at={S.simple} name="whoosh_big" volume={0.4} />
      <Sfx at={f("simplement")} name="ding" volume={0.45} />
      <Sfx at={f("deux")} name="coin" volume={0.4} />
      <Sfx at={f("cinq", 1)} name="coin" volume={0.45} />
      <Sfx at={f("dix")} name="coin" volume={0.6} />
      <Sfx at={f("dix")} name="impact" volume={0.45} />
      <Sfx at={S.cta - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("business", 1)} name="impact" volume={0.45} />
      <Sfx at={f("business", 2)} name="typing" volume={0.45} />
      <Sfx at={f("commentaire") + 6} name="notif" volume={0.55} />
      <Sfx at={f("montrer")} name="pop" volume={0.45} />
      <Camera shakes={[f("cinq"), f("business"), S.ok, f("dix"), f("business", 1)]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.04, render: <SceneHook {...scene(0)} /> },
            { from: S.coin, transition: "zoom", push: 0.05, render: <SceneCoin {...scene(S.coin)} /> },
            { from: S.business, transition: "whip", push: 0.04, render: <SceneBusiness {...scene(S.business)} /> },
            { from: S.search, transition: "whip", push: 0.05, render: <SceneSearch {...scene(S.search)} /> },
            { from: S.popular, transition: "zoom", push: 0.05, render: <ScenePopular {...scene(S.popular)} /> },
            { from: S.ok, transition: "cut", push: 0.08, render: <SceneOk {...scene(S.ok)} /> },
            { from: S.shot, transition: "cut", push: 0.04, render: <SceneShot {...scene(S.shot)} /> },
            { from: S.claude, transition: "wipe", push: 0.03, render: <SceneClaude {...scene(S.claude)} /> },
            { from: S.connect, transition: "whip", push: 0.04, render: <SceneConnect {...scene(S.connect)} /> },
            { from: S.players, transition: "zoom", push: 0.04, render: <ScenePlayers {...scene(S.players)} /> },
            { from: S.simple, transition: "cut", push: 0.06, render: <SceneSimple {...scene(S.simple)} /> },
            { from: S.gains, transition: "zoom", push: 0.04, render: <SceneGains {...scene(S.gains)} /> },
            { from: S.cta, transition: "zoom", push: 0.04, render: <SceneCta {...scene(S.cta)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
