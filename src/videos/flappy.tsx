import { AbsoluteFill, Audio, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  ClaudeWindow,
  CodeCard,
  CoinBurst,
  col,
  CommentBar,
  CommentCard,
  Flag,
  Hearts,
  Ink,
  ink,
  InkPhone,
  InkTap,
  Pop,
  ScreenShot,
  screenW,
  Sparkles,
  SpeedLines,
  Tag,
} from "../lib/Doodle";
import { clamp, EASE_OUT, prog } from "../lib/ease";
import { BioCard, comic, MoneyBag, Player, Stamp } from "../lib/Promo";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { ComicCaptions, Ground, StickMan, stick } from "../lib/Stick";
import { timeOf, type VideoProps } from "../lib/timing";

type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

// ─── Mini-jeu « oiseau + tuyaux » dessiné maison (hommage, aucune image de l'original) ─────

/** Oiseau rond jaune ; `flap` fait battre l'aile, `tilt` en degrés. */
export const Bird: React.FC<{ size: number; flap?: number; tilt?: number; crown?: boolean }> = ({ size, flap = 0, tilt = 0, crown }) => {
  const wing = Math.sin(flap) * 12;
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible", transform: `rotate(${tilt}deg)` }}>
      {crown && <path d="M-22 -40 L-22 -60 L-11 -48 L0 -64 L11 -48 L22 -60 L22 -40 Z" fill={col.gold} stroke={ink} strokeWidth={4} strokeLinejoin="round" />}
      <ellipse cx={0} cy={0} rx={40} ry={33} fill="#ffd23f" stroke={ink} strokeWidth={6} />
      <ellipse cx={-4} cy={14} rx={24} ry={12} fill="#fff3b0" />
      <ellipse cx={-18} cy={4 + wing * 0.4} rx={18} ry={11} fill="#fff" stroke={ink} strokeWidth={5} transform={`rotate(${wing} -18 4)`} />
      <circle cx={16} cy={-12} r={13} fill="#fff" stroke={ink} strokeWidth={5} />
      <circle cx={20} cy={-12} r={5} fill={ink} />
      <path d="M26 2 Q52 6 30 16 Q48 18 26 24 Q16 14 26 2 Z" fill={col.orange} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
    </svg>
  );
};

const Pipe: React.FC<{ x: number; top: number; gap: number; h: number; w: number }> = ({ x, top, gap, h, w }) => {
  const lip = { position: "absolute" as const, left: x - 8, width: w + 16, height: 34, background: "#5fd35f", border: `5px solid ${ink}`, borderRadius: 6 };
  const body = { position: "absolute" as const, left: x, width: w, background: "#74e374", borderLeft: `5px solid ${ink}`, borderRight: `5px solid ${ink}` };
  return (
    <>
      <div style={{ ...body, top: -10, height: top + 10 }} />
      <div style={{ ...lip, top: top - 34 }} />
      <div style={{ ...body, top: top + gap, height: h }} />
      <div style={{ ...lip, top: top + gap }} />
    </>
  );
};

/** Écran de jeu complet de `width`×`height` : ciel, tuyaux qui défilent, oiseau, sol, score. */
export const FlappyGame: React.FC<{ width: number; height: number; start?: number; score?: boolean; ads?: number }> = ({
  width,
  height,
  start = 0,
  score = true,
  ads,
}) => {
  const frame = useCurrentFrame() + start;
  const k = width / 400;
  const H = height / k;
  const speed = 7;
  const spacing = 250;
  const ground = H - 120;
  const scroll = frame * speed;
  const first = Math.floor(scroll / spacing);
  const birdX = 110;
  // L'oiseau suit l'ouverture du prochain tuyau, avec un petit rebond de battement
  const pipeTop = (i: number) => 170 + random(`pipe${i}`) * (ground - 470);
  const next = Math.floor((scroll + birdX - 40) / spacing) + 1;
  const tNext = ((scroll + birdX - 40) % spacing) / spacing;
  const targetY = interpolate(tNext, [0, 1], [pipeTop(next - 1) + 110, pipeTop(next) + 110]);
  const bob = Math.abs(Math.sin(frame / 5)) * -22;
  const birdY = targetY + bob;
  const passed = Math.max(0, Math.floor((scroll + birdX - 460) / spacing));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 400, height: H, transform: `scale(${k})`, transformOrigin: "0 0", overflow: "hidden", background: "#7fd3f7" }}>
      {/* Nuages et immeubles de fond */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: ((i * 180 - frame * 1.2) % 540) + 500 - 540,
            top: 90 + i * 70,
            width: 130,
            height: 44,
            borderRadius: 30,
            background: "#fff",
            border: `4px solid ${ink}`,
          }}
        />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: ground - 90, height: 90, background: "#b8ecc0", borderTop: `4px solid ${ink}` }} />
      {Array.from({ length: 4 }, (_, j) => {
        const i = first + j;
        return <Pipe key={i} x={i * spacing + 460 - scroll} top={pipeTop(i)} gap={220} h={ground} w={78} />;
      })}
      <div style={{ position: "absolute", left: birdX - 36, top: birdY - 36 }}>
        <Bird size={72} flap={frame * 0.9} tilt={Math.sin(frame / 5) * 12} />
      </div>
      {/* Sol rayé qui défile */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: ground,
          bottom: 0,
          borderTop: `5px solid ${ink}`,
          background: `repeating-linear-gradient(-45deg, #e8d27a 0 22px, #d9bf5c 22px 44px)`,
          backgroundPositionX: -scroll,
        }}
      />
      {score && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", ...comic(76, "#fff"), WebkitTextStroke: `4px ${ink}` }}>{passed}</div>
      )}
      {ads !== undefined && frame - start >= ads && (
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 18,
            height: 80,
            borderRadius: 12,
            background: col.yellow,
            border: `5px solid ${ink}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...comic(44),
            transform: `scale(${prog(frame - start, ads, 8)})`,
          }}
        >
          PUB
        </div>
      )}
    </div>
  );
};

/** Clip plein écran du mini-jeu (rendu en public/flappy/clip.mp4 pour l'aperçu dans Claude). */
export const FlappyClip: React.FC = () => (
  <AbsoluteFill>
    <FlappyGame width={400} height={820} start={40} />
  </AbsoluteFill>
);

const money = (v: number) => `$${Math.round(v).toLocaleString("fr-FR").replace(/ | /g, " ")}`;

// 1. Hook : ce jeu moche rapportait 50 000 $ par jour
const SceneHook: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const big = at("cinquante");
  const v = interpolate(frame, [big, at("dollars") + 4], [0, 50000], { ...clamp, easing: EASE_OUT });
  return (
    <AbsoluteFill>
      <Ground none />
      {frame >= big && <SpeedLines cx={540} cy={720} color="#f4eed8" />}
      <Pop at={0} x={540} y={1060} rotate={-2}>
        <InkPhone width={470}>
          <FlappyGame width={screenW(470)} height={screenW(470) * 2.1} />
        </InkPhone>
      </Pop>
      <Pop at={at("moche")} x={190} y={760} rotate={-10}>
        <Tag text="Moche" bg={col.red} color="#fff" size={54} />
      </Pop>
      <Pop at={at("simple")} x={890} y={900} rotate={8}>
        <Tag text="Simple" bg={col.blue} color="#fff" size={54} />
      </Pop>
      <Pop at={big} x={540} y={720} rotate={-4} z={10}>
        <Burst size={580} fill={col.green}>
          <div style={{ textAlign: "center" }}>
            <div style={comic(88, "#fff")}>{money(v)}</div>
            <div style={{ ...comic(56, "#fff"), marginTop: 10, opacity: prog(frame, at("par"), 6) }}>PAR JOUR</div>
          </div>
        </Burst>
      </Pop>
      <CoinBurst at={at("dollars")} x={540} y={720} count={16} size={80} />
    </AbsoluteFill>
  );
};

// 2. Il s'appelle Flappy Bird
const SceneName: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const letters = "FLAPPY BIRD".split("");
  const fly = prog(frame, 0, 40);
  return (
    <AbsoluteFill>
      <Ground none />
      <SpeedLines cx={540} cy={900} color="#dff3fb" />
      <div style={{ position: "absolute", top: 820, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
        {letters.map((l, i) => {
          const s = prog(frame, at("flappy") + i * 1.5, 8);
          return (
            <div key={i} style={{ ...comic(120, "#fff"), WebkitTextStroke: `7px ${ink}`, transform: `translateY(${(1 - s) * 200}px) scale(${s})`, width: l === " " ? 40 : undefined }}>
              {l}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: interpolate(fly, [0, 1], [-200, 780]), top: 560 + Math.sin(frame / 4) * 40 }}>
        <Bird size={220} flap={frame} tilt={Math.sin(frame / 4) * -10} />
      </div>
    </AbsoluteFill>
  );
};

/** Ordinateur portable dessiné. */
const Laptop: React.FC<{ width: number; at: number }> = ({ width, at }) => (
  <div style={{ width, position: "relative" }}>
    <div style={{ width, height: width * 0.62, background: "#fff", border: `7px solid ${ink}`, borderRadius: 18, padding: 14, boxSizing: "border-box" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 8, overflow: "hidden", border: `4px solid ${ink}` }}>
        <FlappyGame width={width - 50} height={width * 0.62 - 50} start={at} score={false} />
      </div>
    </div>
    <div style={{ width: width * 1.16, marginLeft: -width * 0.08, height: 30, background: "#ddd", border: `7px solid ${ink}`, borderRadius: "0 0 20px 20px" }} />
  </div>
);

// 3. Un seul développeur, au Vietnam, en quelques jours
const SceneSolo: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const days = Math.min(3, 1 + Math.floor(Math.max(0, frame - at("quelques")) / 6));
  return (
    <AbsoluteFill>
      <Ground horizon={1420} />
      <Pop at={0} x={400} y={1120} from="up">
        <Laptop width={460} at={0} />
      </Pop>
      <StickMan x={820} y={1420} height={420} flip expression="happy" poses={[[0, "point"]]} />
      <Pop at={at("seul")} x={330} y={640} rotate={-6}>
        <Tag text="1 seul développeur" bg={col.yellow} size={50} />
      </Pop>
      <Pop at={at("vietnam")} x={820} y={560} rotate={6} from="down">
        <Flag name="vietnam" width={260} />
      </Pop>
      <Pop at={at("vietnam") + 3} x={820} y={760} rotate={-4}>
        <Tag text="Vietnam" bg={col.red} color="#fff" size={44} />
      </Pop>
      <Pop at={at("quelques")} x={180} y={1560} rotate={-5}>
        <div style={{ width: 200, background: "#fff", border: `7px solid ${ink}`, borderRadius: 18, boxShadow: `8px 10px 0 ${ink}`, overflow: "hidden", textAlign: "center" }}>
          <div style={{ background: col.red, height: 44, borderBottom: `6px solid ${ink}` }} />
          <div style={{ ...comic(90), padding: "10px 0 0" }}>{days}</div>
          <div style={{ ...comic(34), paddingBottom: 12 }}>{days > 1 ? "JOURS" : "JOUR"}</div>
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

// 4. Pas de grosse équipe, pas de gros budget
const SceneNoTeam: React.FC<SceneProps> = ({ at, slug }) => {
  const team = at("equipe");
  const budget = at("budget");
  return (
    <AbsoluteFill>
      <Ground horizon={900} />
      {[160, 330, 500].map((x, i) => (
        <StickMan key={x} x={x} y={900} height={260} expression="neutral" poses={[[0, "idle"]]} seed={i + 4} flip={i === 2} />
      ))}
      <Ink d="M90 560 L590 930" at={team} dur={5} width={28} color={col.red} />
      <Ink d="M590 560 L90 930" at={team + 3} dur={5} width={28} color={col.red} />
      <Pop at={team + 2} x={330} y={1010} rotate={-5}>
        <Tag text="Pas d'équipe" bg={col.red} color="#fff" size={50} />
      </Pop>
      <Pop at={at("pas", 1) - 2} x={670} y={1220}>
        <MoneyBag slug={slug} x={130} y={150} hits={[]} label="Budget" labelBg={col.purple} />
      </Pop>
      <Ink d="M640 1180 L960 1520" at={budget} dur={5} width={28} color={col.red} />
      <Ink d="M960 1180 L640 1520" at={budget + 3} dur={5} width={28} color={col.red} />
    </AbsoluteFill>
  );
};

// 5. Juste un oiseau + des tuyaux + des pubs = $$$
const SceneRecipe: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const plus = (x: number, y: number, a: number) => (
    <Pop at={a} x={x} y={y}>
      <div style={comic(110)}>+</div>
    </Pop>
  );
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={at("oiseau")} x={540} y={560} rotate={-6}>
        <Bird size={260} flap={frame} />
      </Pop>
      {plus(540, 760, at("tuyaux") - 2)}
      <Pop at={at("tuyaux")} x={540} y={960}>
        <svg width={170} height={230} viewBox="0 0 170 230">
          <rect x={25} y={40} width={120} height={186} fill="#74e374" stroke={ink} strokeWidth={8} />
          <rect x={6} y={6} width={158} height={50} rx={8} fill="#5fd35f" stroke={ink} strokeWidth={8} />
        </svg>
      </Pop>
      {plus(540, 1160, at("pubs") - 2)}
      <Pop at={at("pubs")} x={540} y={1320} rotate={4}>
        <div style={{ padding: "22px 40px", background: col.yellow, border: `7px solid ${ink}`, borderRadius: 18, boxShadow: `8px 10px 0 ${ink}`, ...comic(90) }}>PUB</div>
      </Pop>
      <Pop at={at("pubs") + 6} x={850} y={940} rotate={8}>
        <Burst size={300} fill={col.green}>
          <div style={comic(76, "#fff")}>$$$</div>
        </Burst>
      </Pop>
    </AbsoluteFill>
  );
};

// 6. Des millions de joueurs par jour, chaque partie rapporte
const SceneMillions: React.FC<SceneProps> = ({ at, slug }) => {
  const starts = [at("jouaient"), at("chaque"), at("chaque", 1), at("partie"), at("pubs", 1)];
  const bag: [number, number] = [540, 880];
  return (
    <AbsoluteFill>
      <Ground horizon={1360} />
      <Pop at={at("millions")} x={540} y={460} rotate={-3}>
        <Tag text="Des millions de joueurs" bg={col.yellow} size={52} />
      </Pop>
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={starts} label="Le créateur" labelBg={col.purple} />
      {[150, 345, 540, 735, 930].map((x, i) => (
        <Player key={x} x={x} at={starts[i]} flip={i % 2 === 1} seed={i} bag={bag} ground={1360} />
      ))}
    </AbsoluteFill>
  );
};

// 7. À l'époque, il fallait savoir coder
const SceneBefore: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const x = at("coder");
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={at("l'epoque")} x={330} y={420} rotate={-5}>
        <Tag text="Avant" bg="#999" color="#fff" size={60} />
      </Pop>
      <Pop at={2} x={330} y={900} rotate={-4} wiggle={x}>
        <CodeCard width={500} height={560} at={0} speed={1.6} />
      </Pop>
      <Ink d="M130 660 L530 1140" at={x + 2} dur={6} width={30} color={col.red} />
      <Ink d="M530 660 L130 1140" at={x + 5} dur={6} width={30} color={col.red} />
      <StickMan x={820} y={1480} height={600} variant="full" flip expression={frame >= x ? "sad" : "neutral"} poses={[[0, "think"], [x, "shrug"]]} />
    </AbsoluteFill>
  );
};

// 8. Aujourd'hui : capture à Claude, il crée le jeu
const SceneClaude: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Pop at={0} x={330} y={400} rotate={-5}>
      <Tag text="Aujourd'hui" bg={col.green} color="#fff" size={60} />
    </Pop>
    <Pop at={2} x={545} y={980} from="down" rotate={-1}>
      <ClaudeWindow
        width={900}
        height={800}
        image={`${slug}/capture.png`}
        attachAt={at("claude") - 2}
        prompt="Crée-moi un jeu comme celui-là"
        typeAt={at("claude") + 4}
        codeAt={at("jeu", 1)}
        previewAt={at("celui-la")}
        preview={`${slug}/clip.mp4`}
      />
    </Pop>
    <Pop at={at("toi") + 2} x={800} y={1480} rotate={4}>
      <Tag text="Jeu prêt ✓" bg={col.green} color="#fff" size={52} />
    </Pop>
  </AbsoluteFill>
);

// 9. Connecter à Google AdSense : tes pubs tournent quand les gens jouent
const SceneAdsense: React.FC<SceneProps> = ({ at, slug }) => {
  const starts = [at("tournent"), at("quand"), at("gens"), at("jouent")];
  const bag: [number, number] = [540, 1180];
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={270} y={620} rotate={-4} from="left">
        <InkPhone width={260}>
          <FlappyGame width={screenW(260)} height={screenW(260) * 2.1} score={false} ads={at("pubs", 2)} />
        </InkPhone>
      </Pop>
      <Ink d="M400 720 C470 600 610 600 680 720" at={at("connectes")} dur={10} width={14} />
      <Pop at={3} x={810} y={620} rotate={4} from="right" wiggle={at("google")}>
        <InkPhone width={260}>
          <ScreenShot src={`${slug}/adsense.png`} width={screenW(260)} />
        </InkPhone>
      </Pop>
      <Pop at={at("google")} x={810} y={370} rotate={6}>
        <Tag text="Google AdSense" bg={col.blue} color="#fff" size={38} />
      </Pop>
      <Pop at={at("tes")} x={270} y={370} rotate={-5}>
        <Tag text="Tes pubs" bg={col.yellow} size={48} />
      </Pop>
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={starts} label="Toi" labelBg={col.green} />
      {[160, 380, 700, 920].map((x, i) => (
        <Player key={x} x={x} at={starts[i]} flip={i % 2 === 1} seed={i + 3} bag={bag} ground={1560} />
      ))}
    </AbsoluteFill>
  );
};

// 10. Le prochain Flappy Bird, ça peut être le tien
const SceneNext: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ground none />
      <SpeedLines cx={540} cy={760} />
      <Pop at={0} x={540} y={760} float={16}>
        <Bird size={380} flap={frame} crown={frame >= at("tien") - 2} />
      </Pop>
      <Sparkles at={at("tien")} cx={540} cy={760} r={300} n={8} />
      <Pop at={at("prochain")} x={540} y={400} rotate={-4}>
        <Tag text="Le prochain ?" bg={col.yellow} size={62} />
      </Pop>
      <Pop at={at("tien") - 2} x={540} y={1180} z={5}>
        <Stamp text="Le tien" at={at("tien") - 2} color={col.green} size={96} rotate={-8} />
      </Pop>
    </AbsoluteFill>
  );
};

// 11. Appel à l'action
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
        <Burst size={560}>
          <div style={comic(76)}>MÉTHODE</div>
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
        <CommentBar width={900} text="jeu" typeAt={at("jeu", 2)} />
      </Pop>
    </AbsoluteFill>
  );
};

export const Flappy: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    name: f("s'appelle") - 5,
    solo: f("a") - 6,
    noTeam: f("pas") - 2,
    recipe: f("juste") - 2,
    millions: f("des", 2) - 2,
    before: f("a", 2) - 2,
    claude: f("aujourd'hui") - 2,
    adsense: f("connectes") - 8,
    next: f("prochain") - 8,
    cta: f("si") - 2,
  };
  const whooshes = [S.name, S.solo, S.noTeam, S.recipe, S.before, S.claude, S.adsense];
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {/* Bruitages (volume global SFX_GAIN) */}
      {whooshes.map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh" volume={0.45} />
      ))}
      <Sfx at={f("moche")} name="pop" volume={0.45} />
      <Sfx at={f("simple")} name="pop" volume={0.45} />
      <Sfx at={f("cinquante")} name="tick" volume={0.5} />
      <Sfx at={f("dollars")} name="coin" volume={0.6} />
      <Sfx at={f("dollars")} name="impact" volume={0.45} />
      <Sfx at={f("flappy")} name="riser" volume={0.3} />
      <Sfx at={f("bird")} name="ding" volume={0.45} />
      <Sfx at={f("seul")} name="pop" volume={0.4} />
      <Sfx at={f("vietnam")} name="pop" volume={0.45} />
      <Sfx at={f("quelques")} name="tick" volume={0.45} />
      <Sfx at={f("equipe")} name="glitch" volume={0.35} />
      <Sfx at={f("budget")} name="glitch" volume={0.35} />
      <Sfx at={f("oiseau")} name="pop" volume={0.45} />
      <Sfx at={f("tuyaux")} name="pop" volume={0.45} />
      <Sfx at={f("pubs")} name="pop" volume={0.45} />
      <Sfx at={f("pubs") + 6} name="coin" volume={0.5} />
      <Sfx at={S.millions - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("millions")} name="ding" volume={0.4} />
      {[f("jouaient"), f("chaque"), f("chaque", 1), f("partie"), f("pubs", 1)].map((w) => (
        <Sfx key={w} at={w + 15} name="coin" volume={0.25} />
      ))}
      <Sfx at={f("coder") + 2} name="impact" volume={0.4} />
      <Sfx at={f("claude") - 2} name="pop" volume={0.45} />
      <Sfx at={f("claude") + 4} name="typing" volume={0.5} />
      <Sfx at={f("celui-la")} name="ding" volume={0.45} />
      <Sfx at={f("pubs", 2)} name="pop" volume={0.4} />
      {[f("tournent"), f("quand"), f("gens"), f("jouent")].map((w) => (
        <Sfx key={w} at={w + 15} name="coin" volume={0.3} />
      ))}
      <Sfx at={S.next - 6} name="whoosh_big" volume={0.4} />
      <Sfx at={f("tien") - 2} name="impact" volume={0.45} />
      <Sfx at={f("tien")} name="ding" volume={0.45} />
      <Sfx at={S.cta - 6} name="whoosh_big" volume={0.35} />
      <Sfx at={f("methode")} name="impact" volume={0.4} />
      <Sfx at={f("jeu", 2)} name="typing" volume={0.45} />
      <Sfx at={f("commentaire") + 6} name="notif" volume={0.55} />
      <Sfx at={f("clique")} name="pop" volume={0.45} />
      <Sfx at={f("lien")} name="tick" volume={0.5} />
      <Camera shakes={[f("dollars"), f("equipe"), f("budget"), f("coder") + 2, f("tien") - 2, f("methode")]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.05, render: <SceneHook {...scene(0)} /> },
            { from: S.name, transition: "zoom", push: 0.04, render: <SceneName {...scene(S.name)} /> },
            { from: S.solo, transition: "whip", push: 0.04, render: <SceneSolo {...scene(S.solo)} /> },
            { from: S.noTeam, transition: "whip", push: 0.04, render: <SceneNoTeam {...scene(S.noTeam)} /> },
            { from: S.recipe, transition: "whip", push: 0.04, render: <SceneRecipe {...scene(S.recipe)} /> },
            { from: S.millions, transition: "zoom", push: 0.04, render: <SceneMillions {...scene(S.millions)} /> },
            { from: S.before, transition: "whip", push: 0.04, render: <SceneBefore {...scene(S.before)} /> },
            { from: S.claude, transition: "wipe", push: 0.03, render: <SceneClaude {...scene(S.claude)} /> },
            { from: S.adsense, transition: "whip", push: 0.04, render: <SceneAdsense {...scene(S.adsense)} /> },
            { from: S.next, transition: "zoom", push: 0.05, render: <SceneNext {...scene(S.next)} /> },
            { from: S.cta, transition: "zoom", push: 0.04, render: <SceneCta {...scene(S.cta)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
