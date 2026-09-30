import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  CameraIcon,
  ClaudeWindow,
  CodeCard,
  CoinBurst,
  col,
  CommentBar,
  Flash,
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
  Tag,
} from "../lib/Doodle";
import { clamp } from "../lib/ease";
import { BioCard, comic, MoneyBag, ScamSite, Stamp } from "../lib/Promo";
import { Camera, Music, Sfx } from "../lib/Stage";
import { captionFont, Ground, type Expression, type PoseKey, StickMan, stick, useVoiceLevel } from "../lib/Stick";
import { timeOf, type Timing, type VideoProps, type Word } from "../lib/timing";

// Format « discussion » : deux potes face à face, chacun sa voix (npm run dialogue).
// A = celui qui découvre (gauche), B = celui qui sait (droite). Les visuels surgissent au-dessus d'eux.

type Line = { speaker: string; start: number; end: number; text: string };
type DialogueTiming = Timing & { words: (Word & { speaker: string })[]; lines: Line[] };

const GROUND = 1640;
const HEAD_Y = 1180;
const POS = { A: 260, B: 820 } as const;
const BUBBLE = { A: "#fff3b0", B: "#fff" } as const;

/** Bulle BD : les mots de la réplique en cours apparaissent au fil de la voix ; la pointe vise celui qui parle. */
const SpeechBubble: React.FC<{ timing: DialogueTiming }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = timing.lines.findIndex((l, i) => t >= l.start - 0.05 && (!timing.lines[i + 1] || t < timing.lines[i + 1].start - 0.05));
  if (idx < 0) return null;
  const line = timing.lines[idx];
  const sp = line.speaker as "A" | "B";
  // Pages de 7 mots max, coupées sur la ponctuation
  const words = timing.words.filter((w) => w.start >= line.start - 0.05 && w.start < line.end);
  const pages: Word[][] = [];
  let page: Word[] = [];
  for (const w of words) {
    page.push(w);
    if (page.length >= 7 || /[.,!?;…]$/.test(w.text)) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length) pages.push(page);
  const cur = pages.find((p, i) => t >= p[0].start - 0.05 && (!pages[i + 1] || t < pages[i + 1][0].start - 0.05)) ?? pages[0];
  if (!cur) return null;
  const shown = cur.filter((w) => t >= w.start - 0.02);
  const pop = interpolate(frame, [line.start * fps - 2, line.start * fps + 4], [0.7, 1], clamp);
  const tailX = sp === "A" ? 300 : 780;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 820, height: 250, transform: `scale(${pop})`, transformOrigin: `${tailX - 60}px 250px` }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: BUBBLE[sp],
          border: `7px solid ${ink}`,
          borderRadius: 60,
          boxShadow: `10px 12px 0 ${ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 40px",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: captionFont, fontWeight: 700, fontSize: 54, lineHeight: 1.1, color: ink, textTransform: "uppercase", WebkitTextStroke: `1.4px ${ink}` }}>
          {shown.map((w, i) => (
            <span key={i} style={{ display: "inline-block", marginRight: "0.26em", transform: `scale(${interpolate(frame, [w.start * fps, w.start * fps + 4], [0.6, 1], clamp)})` }}>
              {w.text.replace(/[.,;…]+$/, "")}
            </span>
          ))}
        </div>
      </div>
      <svg width={120} height={110} viewBox="0 0 120 110" style={{ position: "absolute", left: tailX - 60 - 60, top: 238, transform: sp === "B" ? "scaleX(-1)" : undefined }}>
        <path d="M20 0 L100 0 L40 100 Z" fill={BUBBLE[sp]} stroke={ink} strokeWidth={7} strokeLinejoin="round" />
        <rect x={14} y={-8} width={92} height={14} fill={BUBBLE[sp]} />
      </svg>
    </div>
  );
};

/** Un des deux potes : bouche animée quand c'est sa réplique, petit rebond au début de chacune. */
const Buddy: React.FC<{ id: "A" | "B"; slug: string; timing: DialogueTiming; poses: PoseKey[]; expr: [number, Expression][] }> = ({ id, slug, timing, poses, expr }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const level = useVoiceLevel(slug);
  const t = frame / fps;
  const talking = timing.lines.some((l) => l.speaker === id && t >= l.start && t <= l.end);
  let expression: Expression = "neutral";
  for (const [f, e] of expr) if (frame >= f) expression = e;
  const flip = id === "B";
  return (
    <>
      <StickMan x={POS[id]} y={GROUND} height={500} variant="full" flip={flip} look={flip ? -0.5 : 0.5} expression={expression} mouth={talking ? level : 0} poses={poses} seed={id === "A" ? 1 : 2} />
      {/* Casquette pour reconnaître A */}
      {id === "A" && (
        <svg width={170} height={90} viewBox="0 0 170 90" style={{ position: "absolute", left: POS.A - 88, top: GROUND - 540 }}>
          <path d="M20 70 C20 20 150 20 150 70 Z" fill={col.red} stroke={ink} strokeWidth={7} strokeLinejoin="round" />
          <path d="M120 66 L168 72 L150 82 L110 76 Z" fill={col.red} stroke={ink} strokeWidth={7} strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
};

export const DiscussionJeu: React.FC<VideoProps> = ({ slug, timing: raw }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  if (!raw) return null;
  const timing = raw as DialogueTiming;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const L = timing.lines.map((l) => ({ from: Math.round(l.start * fps), to: Math.round(l.end * fps) }));
  // Scène au-dessus des persos : chaque élément entre à `at` et sort à `out`
  const stageY = 480;
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {/* Bruitages (volume global SFX_GAIN) */}
      <Sfx at={0} name="pop" volume={0.4} />
      <Sfx at={f("paie")} name="coin" volume={0.45} />
      <Sfx at={f("l'arnaque")} name="impact" volume={0.4} />
      <Sfx at={f("regarde")} name="pop" volume={0.4} />
      <Sfx at={f("creer")} name="whoosh" volume={0.45} />
      <Sfx at={f("l'argent")} name="coin" volume={0.45} />
      <Sfx at={f("coder")} name="glitch" volume={0.35} />
      <Sfx at={f("coder", 1)} name="impact" volume={0.4} />
      <Sfx at={f("capture")} name="tick" volume={0.6} />
      <Sfx at={f("claude") - 2} name="whoosh" volume={0.4} />
      <Sfx at={f("cree")} name="ding" volume={0.45} />
      <Sfx at={f("d'ou")} name="pop" volume={0.4} />
      <Sfx at={f("google")} name="pop" volume={0.4} />
      <Sfx at={f("l'argent", 2)} name="coin" volume={0.5} />
      <Sfx at={f("miettes")} name="glitch" volume={0.3} />
      <Sfx at={f("encaisses")} name="coin" volume={0.6} />
      <Sfx at={f("encaisses")} name="impact" volume={0.4} />
      <Sfx at={f("montre-moi")} name="riser" volume={0.3} />
      <Sfx at={f("jeu", 5)} name="typing" volume={0.45} />
      <Sfx at={f("commentaire") + 6} name="notif" volume={0.5} />
      <Sfx at={f("lien")} name="tick" volume={0.5} />
      <Camera shakes={[f("l'arnaque"), f("coder"), f("encaisses"), f("montre-moi")]}>
        <Ground horizon={GROUND} />
        {frame >= f("encaisses") && frame < L[10].from && <SpeedLines cx={540} cy={stageY} color="#f4eed8" />}

        {/* 1. Le site qui paie pour jouer */}
        <Pop at={4} x={540} y={stageY} rotate={-3} out={L[3].from + 6} wiggle={f("regarde")}>
          <InkPhone width={300}>
            <ScamSite width={screenW(300)} brand={0} amount="5 000 F" amountAt={f("paie")} perHourAt={f("jouer")} tilesAt={f("jeux")} />
          </InkPhone>
        </Pop>
        <Pop at={f("l'arnaque")} x={560} y={stageY + 60} out={L[2].from + 2} z={5}>
          <Stamp text="Arnaque ?" at={f("l'arnaque")} size={80} rotate={-12} />
        </Pop>
        <Pop at={f("jure")} x={800} y={stageY - 150} rotate={6} out={L[3].from + 6}>
          <Tag text="Promis !" bg={col.green} color="#fff" size={52} />
        </Pop>

        {/* 2. Ton propre jeu, c'est toi qui gagnes */}
        <Pop at={f("creer")} x={380} y={stageY} rotate={-4} out={L[4].from}>
          <InkPhone width={290}>
            <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={60} />
          </InkPhone>
        </Pop>
        <Pop at={f("propre")} x={780} y={stageY - 120} rotate={5} out={L[4].from}>
          <Tag text="Ton jeu" bg={col.yellow} size={60} />
        </Pop>
        <Pop at={f("gagnes") - 2} x={780} y={stageY + 150} out={L[4].from}>
          <MoneyBag slug={slug} x={0} y={0} hits={[f("l'argent")]} label="Toi" labelBg={col.green} />
        </Pop>
        <CoinBurst at={f("l'argent")} x={780} y={stageY + 100} count={10} size={64} />

        {/* 3. Je sais pas coder / pas besoin */}
        <Pop at={L[4].from + 2} x={540} y={stageY} rotate={-3} out={f("capture") - 10}>
          <CodeCard width={420} height={380} at={L[4].from} speed={1.6} />
        </Pop>
        {frame < f("capture") - 10 && (
          <>
            <Ink d="M350 330 L730 630" at={f("coder")} dur={5} width={26} color={col.red} />
            <Ink d="M730 330 L350 630" at={f("coder") + 3} dur={5} width={26} color={col.red} />
          </>
        )}
        <Pop at={f("coder", 1)} x={540} y={stageY + 230} rotate={-6} out={f("capture") - 10} z={6}>
          <Stamp text="Zéro code" at={f("coder", 1)} color={col.green} size={70} rotate={-6} />
        </Pop>

        {/* 4. Capture Play Store → Claude */}
        <Pop at={f("capture") - 8} x={360} y={stageY} rotate={-4} out={f("claude") - 4}>
          <InkPhone width={290}>
            <ScreenShot src={`${slug}/playstore.png`} width={screenW(290)} scroll={interpolate(frame, [f("capture"), f("play")], [0, 260], clamp)} />
            <Flash at={f("capture") + 2} />
          </InkPhone>
        </Pop>
        <Pop at={f("capture") - 4} x={720} y={stageY - 160} rotate={12} wiggle={f("capture") + 2} out={f("claude") - 4}>
          <CameraIcon size={150} />
        </Pop>
        <Pop at={f("play")} x={720} y={stageY + 120} rotate={-4} out={f("claude") - 4}>
          <Tag text="Play Store" bg={col.blue} color="#fff" size={46} />
        </Pop>
        <Pop at={f("claude") - 2} x={540} y={stageY} from="down" out={L[6].from}>
          <div style={{ transform: "scale(0.72)" }}>
            <ClaudeWindow
              width={900}
              height={640}
              image={`${slug}/capture-jeu.png`}
              attachAt={f("claude") + 2}
              prompt="Crée-moi un jeu dans ce style"
              typeAt={f("claude") + 4}
              codeAt={f("cree")}
              previewAt={f("style")}
              preview={`${slug}/gp-solrush.mp4`}
            />
          </div>
        </Pop>

        {/* 5. L'argent vient d'où ? → AdSense */}
        <Pop at={L[6].from + 2} x={540} y={stageY} out={L[7].from}>
          <Burst size={420} fill={col.purple}>
            <div style={comic(200, "#fff")}>?</div>
          </Burst>
        </Pop>
        <Pop at={L[7].from + 2} x={360} y={stageY} rotate={-4} out={L[8].from} wiggle={f("google")}>
          <InkPhone width={290}>
            <ScreenShot src={`${slug}/adsense.png`} width={screenW(290)} />
          </InkPhone>
        </Pop>
        <Pop at={f("google")} x={760} y={stageY - 150} rotate={6} out={L[8].from}>
          <Tag text="Google AdSense" bg={col.blue} color="#fff" size={40} />
        </Pop>
        <Pop at={f("pubs") - 2} x={760} y={stageY + 20} rotate={-5} out={L[8].from}>
          <div style={{ padding: "16px 34px", background: col.yellow, border: `7px solid ${ink}`, borderRadius: 16, boxShadow: `8px 10px 0 ${ink}`, ...comic(70) }}>PUB</div>
        </Pop>
        <CoinBurst at={f("l'argent", 2)} x={760} y={stageY + 20} count={12} size={64} />

        {/* 6. Payé des miettes / c'est toi qui encaisses */}
        <Pop at={f("miettes") - 2} x={540} y={stageY} rotate={-4} out={L[9].from}>
          <Tag text="Des miettes…" bg="#ddd" size={64} />
        </Pop>
        <Pop at={L[9].from} x={540} y={stageY + 170} out={L[10].from + 4}>
          <MoneyBag slug={slug} x={0} y={0} hits={[f("encaisses"), f("jouent", 1)]} label="Toi" labelBg={col.green} />
        </Pop>
        <CoinBurst at={f("encaisses")} x={540} y={stageY + 80} count={16} size={76} />

        {/* 7. Montre-moi ! → commente « jeu » + lien en bio */}
        <Pop at={f("montre-moi")} x={540} y={stageY} rotate={-5} out={L[11].from + 4}>
          <Burst size={560}>
            <div style={{ ...comic(66), textAlign: "center", whiteSpace: "normal", width: 380 }}>MONTRE-MOI !</div>
          </Burst>
        </Pop>
        <Pop at={L[11].from + 2} x={540} y={stageY - 60} rotate={-3}>
          <div style={{ transform: "scale(0.85)" }}>
            <BioCard tapAt={f("lien")} />
          </div>
        </Pop>
        <InkTap at={f("lien")} x={540} y={stageY + 90} />
        <Sparkles at={f("lien") + 2} cx={540} cy={stageY - 60} r={300} />
        <Pop at={L[11].from + 6} x={540} y={stageY + 290} from="up">
          <CommentBar width={860} text="jeu" typeAt={f("jeu", 5)} />
        </Pop>

        <Buddy
          id="A"
          slug={slug}
          timing={timing}
          poses={[
            [0, "phone"],
            [L[2].from, "present"],
            [L[4].from, "shrug"],
            [L[6].from, "think"],
            [L[8].from, "raise"],
            [L[10].from, "cheer"],
            [L[11].from, "idle"],
          ]}
          expr={[
            [0, "happy"],
            [L[1].from, "surprised"],
            [L[2].from, "happy"],
            [L[4].from, "surprised"],
            [L[5].from, "neutral"],
            [L[6].from, "surprised"],
            [L[9].from, "happy"],
          ]}
        />
        <Buddy
          id="B"
          slug={slug}
          timing={timing}
          poses={[
            [0, "idle"],
            [L[1].from, "think"],
            [L[3].from, "raise"],
            [L[5].from, "point"],
            [L[7].from, "present"],
            [L[9].from, "hips"],
            [L[11].from, "point"],
          ]}
          expr={[
            [0, "neutral"],
            [L[1].from, "smug"],
            [L[3].from, "happy"],
            [L[9].from, "smug"],
            [L[11].from, "happy"],
          ]}
        />
        <SpeechBubble timing={timing} />
      </Camera>
    </AbsoluteFill>
  );
};
