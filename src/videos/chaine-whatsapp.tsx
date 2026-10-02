import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  CoinBurst,
  col,
  CommentCard,
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
import { clamp, EASE_OUT, prog } from "../lib/ease";
import { Head, Me } from "../lib/Me";
import { comic, Stamp } from "../lib/Promo";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { ComicCaptions, Ground, StickMan, stick } from "../lib/Stick";
import { fontFamily } from "../lib/theme";
import { timeOf, type VideoProps } from "../lib/timing";

// Annonce de la chaîne WhatsApp (formations gratuites) : vraie voix + têtes expressives, lien pandoo.me.

type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

const URL = "pandoo.me";
const WA = "#25d366";

/** Pastille « messagerie » verte (bulle + combiné), dessinée. */
const ChatIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M50 8 C26 8 8 25 8 47 C8 56 11 64 16 70 L11 90 L32 84 C37 86 43 87 50 87 C74 87 92 70 92 47 C92 25 74 8 50 8 Z" fill={WA} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
    <path
      d="M36 30 C33 30 31 33 31 36 C32 50 46 63 60 66 C63 66 66 64 67 61 L67 57 L58 53 L54 57 C48 55 43 50 41 44 L45 40 L41 31 Z"
      fill="#fff"
      stroke={ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  </svg>
);

/** Barre d'adresse de navigateur : `text` tapé lettre par lettre à partir de `typeAt`. */
const BrowserBar: React.FC<{ width: number; text: string; typeAt: number; cps?: number; goAt?: number }> = ({ width, text, typeAt, cps = 0.9, goAt }) => {
  const frame = useCurrentFrame();
  const shown = text.slice(0, Math.max(0, Math.floor((frame - typeAt) * cps)));
  const pressed = goAt !== undefined && frame >= goAt && frame < goAt + 6;
  const loading = goAt !== undefined && frame >= goAt ? prog(frame, goAt, 18) : 0;
  return (
    <div style={{ width, background: "#fff", border: `7px solid ${ink}`, borderRadius: 34, boxShadow: `12px 14px 0 ${ink}`, overflow: "hidden", fontFamily }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 24px", background: "#f0eee6", borderBottom: `5px solid ${ink}` }}>
        {[col.red, col.yellow, col.green].map((c) => (
          <div key={c} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: `3px solid ${ink}` }} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: 22 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 24px",
            borderRadius: 999,
            background: "#f4f4f4",
            border: `5px solid ${ink}`,
            fontSize: 58,
            fontWeight: 800,
            color: ink,
          }}
        >
          <svg width={40} height={40} viewBox="0 0 24 24">
            <rect x={5} y={10} width={14} height={11} rx={2} fill={col.green} stroke={ink} strokeWidth={2} />
            <path d="M8 10 V7 A4 4 0 0 1 16 7 V10" fill="none" stroke={ink} strokeWidth={2} />
          </svg>
          <span>
            {shown}
            <span style={{ opacity: frame % 14 < 8 ? 1 : 0, color: col.blue }}>|</span>
          </span>
        </div>
        <div
          style={{
            padding: "14px 26px",
            borderRadius: 20,
            background: col.blue,
            border: `5px solid ${ink}`,
            color: "#fff",
            fontSize: 44,
            fontWeight: 800,
            transform: `scale(${pressed ? 0.9 : 1})`,
          }}
        >
          OK
        </div>
      </div>
      <div style={{ height: 10, background: "#eee" }}>
        <div style={{ height: "100%", width: `${loading * 100}%`, background: WA }} />
      </div>
    </div>
  );
};

/** Carte « épisode de formation ». */
const Episode: React.FC<{ n: number }> = ({ n }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 18,
      width: 400,
      padding: "14px 20px",
      background: "#fff",
      border: `6px solid ${ink}`,
      borderRadius: 22,
      boxShadow: `8px 10px 0 ${ink}`,
      fontFamily,
    }}
  >
    <div style={{ width: 70, height: 70, borderRadius: 16, background: col.red, border: `5px solid ${ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={34} height={34} viewBox="0 0 24 24">
        <path d="M7 4 L20 12 L7 20 Z" fill="#fff" />
      </svg>
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#666" }}>Formation</div>
      <div style={{ fontSize: 40, fontWeight: 900, color: ink }}>Épisode {n}</div>
    </div>
  </div>
);

// 1. Vous êtes très nombreux à être intéressés par le business des jeux IA
const SceneCrowd: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const crowd = at("nombreux") - 4;
  const people: [number, number][] = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) people.push([90 + i * 105 + (r ? 52 : 0), r ? 1650 : 1520]);
  const comments = ["business", "moi aussi !", "comment on fait ?", "jeu", "je veux !"];
  return (
    <AbsoluteFill>
      <Ground horizon={1650} />
      {people.map(([x, y], i) => {
        const a = crowd + i * 1.5;
        if (frame < a) return null;
        const s = spring({ frame: frame - a, fps, config: { damping: 10, stiffness: 200 } });
        return (
          <div key={i} style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: `${x}px ${y}px` }}>
            <StickMan x={x} y={y} height={200} poses={[[0, i % 3 ? "raise" : "cheer"]]} expression="happy" seed={i} flip={i % 2 === 1} />
          </div>
        );
      })}
      {comments.map((c, i) => (
        <Pop key={c} at={at("interesses") + i * 5} x={[220, 520, 300, 560, 180][i]} y={[540, 660, 800, 930, 1060][i]} rotate={[-4, 3, -2, 4, -3][i]} float={8}>
          <div style={{ transform: "scale(0.85)" }}>
            <CommentCard text={c} name={["awa", "kofi", "moussa", "ines", "yao"][i]} />
          </div>
        </Pop>
      ))}
      <Pop at={at("creation")} x={830} y={720} rotate={6} from="right">
        <InkPhone width={250}>
          <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={60} />
        </InkPhone>
      </Pop>
      <Pop at={at("monetisation")} x={830} y={1040} rotate={-4}>
        <Tag text="Jeux IA + AdSense" bg={col.blue} color="#fff" size={40} />
      </Pop>
      <CoinBurst at={at("monetisation")} x={830} y={720} count={10} size={60} />
      {/* Ouverture : grosse tête choquée au centre, qui file sur le côté quand la foule arrive */}
      <div
        style={{
          position: "absolute",
          left: interpolate(prog(frame, crowd - 2, 10), [0, 1], [540, 850]),
          top: interpolate(prog(frame, crowd - 2, 10), [0, 1], [880, 1330]),
          transform: `translate(-50%, -50%) scale(${interpolate(prog(frame, crowd - 2, 10), [0, 1], [2, 1])}) scale(${prog(frame, 0, 8)})`,
        }}
      >
        <Head slug={slug} faces={[[0, "choque"], [at("business"), "argent"], [at("l'ia"), "clin"]]} width={300} />
      </div>
    </AbsoluteFill>
  );
};

// 2. J'ai créé une chaîne WhatsApp : série de formations gratuites
const SceneChannel: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const w = 430;
  return (
    <AbsoluteFill>
      <Ground horizon={1660} />
      <Pop at={at("chaine") - 2} x={300} y={880} rotate={-3} from="up">
        <InkPhone width={w}>
          <ScreenShot src={`${slug}/chaine.jpg`} width={screenW(w)} base={1080} scroll={interpolate(frame, [at("serie"), at("gratuites")], [0, 700], clamp)} />
        </InkPhone>
      </Pop>
      <Pop at={at("whatsapp")} x={800} y={470} rotate={8}>
        <ChatIcon size={190} />
      </Pop>
      <Pop at={at("whatsapp") + 3} x={800} y={630} rotate={-4}>
        <Tag text="Chaîne WhatsApp" bg={WA} color="#fff" size={44} />
      </Pop>
      {[1, 2, 3].map((n, i) => (
        <Pop key={n} at={at("serie") + i * 4} x={790} y={800 + i * 140} rotate={[3, -2, 2][i]} from="right">
          <Episode n={n} />
        </Pop>
      ))}
      <Pop at={at("gratuites")} x={760} y={1230} z={5}>
        <Stamp text="Gratuit" at={at("gratuites")} color={col.green} size={84} rotate={-10} />
      </Pop>
      <Me
        slug={slug}
        x={820}
        y={1660}
        height={330}
        flip
        faces={[
          [0, "confiant"],
          [at("gratuites"), "clin"],
        ]}
        poses={[
          [0, "present"],
          [at("gratuites"), "cheer"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 3. Tu vas sur pandoo.me → redirigé vers ma chaîne WhatsApp
const SceneUrl: React.FC<SceneProps> = ({ at, slug }) => {
  const type = at("pandoo.me") - 2;
  const go = type + URL.length / 0.9 + 6;
  const w = 300;
  return (
    <AbsoluteFill>
      <Ground horizon={1680} />
      <Pop at={0} x={540} y={560} from="down" rotate={-1}>
        <BrowserBar width={900} text={URL} typeAt={type} goAt={go} />
      </Pop>
      <InkTap at={go} x={890} y={590} />
      <Pop at={at("vas")} x={280} y={770} rotate={-5}>
        <Tag text="Ton navigateur" bg={col.yellow} size={40} />
      </Pop>
      <Ink d="M560 760 C520 900 480 980 470 1040" at={at("automatiquement")} dur={10} width={14} arrow />
      <Pop at={at("redirige")} x={460} y={1210} rotate={-3} from="down">
        <InkPhone width={w}>
          <ScreenShot src={`${slug}/chaine.jpg`} width={screenW(w)} base={1080} />
        </InkPhone>
      </Pop>
      <Pop at={at("chaine", 1)} x={250} y={1050} rotate={-8}>
        <ChatIcon size={130} />
      </Pop>
      <Sparkles at={at("chaine", 1)} cx={460} cy={1210} r={240} />
      <Me
        slug={slug}
        x={850}
        y={1680}
        height={360}
        flip
        faces={[
          [0, "serieux"],
          [type, "malin"],
          [at("chaine", 1), "clin"],
        ]}
        poses={[
          [0, "idle"],
          [type, "point"],
          [at("chaine", 1), "present"],
        ]}
      />
    </AbsoluteFill>
  );
};

// 4. Les places sont très limitées : fais-le dès maintenant
const SceneLimited: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [at("places"), at("limitees") + 8], [0.4, 0.92], { ...clamp, easing: EASE_OUT });
  const pulse = 1 + Math.max(0, Math.sin((frame - at("maintenant")) / 3)) * 0.05 * (frame >= at("maintenant") ? 1 : 0);
  return (
    <AbsoluteFill>
      <Ground horizon={1680} />
      <SpeedLines cx={540} cy={760} color="#fde2e2" />
      <Pop at={0} x={540} y={530} from="down">
        <div style={{ width: 860, padding: "24px 30px", background: "#fff", border: `7px solid ${ink}`, borderRadius: 30, boxShadow: `10px 12px 0 ${ink}`, fontFamily }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 40, fontWeight: 900, color: ink }}>
            <span>Places prises</span>
            <span style={{ color: col.red }}>{Math.round(fill * 100)} %</span>
          </div>
          <div style={{ marginTop: 16, height: 56, borderRadius: 999, border: `6px solid ${ink}`, background: "#eee", overflow: "hidden" }}>
            <div style={{ width: `${fill * 100}%`, height: "100%", background: `repeating-linear-gradient(-45deg, ${col.red} 0 24px, #ff7070 24px 48px)`, backgroundPositionX: frame * 2 }} />
          </div>
        </div>
      </Pop>
      <Pop at={at("limitees")} x={540} y={790} z={4}>
        <Stamp text="Places limitées" at={at("limitees")} size={76} rotate={-6} />
      </Pop>
      <Pop at={at("alors", 1)} x={540} y={1040}>
        <div
          style={{
            transform: `scale(${pulse})`,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "22px 44px",
            background: WA,
            border: `8px solid ${ink}`,
            borderRadius: 999,
            boxShadow: `10px 12px 0 ${ink}`,
          }}
        >
          <ChatIcon size={90} />
          <div style={{ ...comic(84, "#fff"), WebkitTextStroke: `3px ${ink}` }}>{URL}</div>
        </div>
      </Pop>
      <Me
        slug={slug}
        x={540}
        y={1680}
        height={360}
        faces={[
          [0, "serieux"],
          [at("limitees"), "choque"],
          [at("alors", 1), "serieux"],
          [at("maintenant"), "clin"],
        ]}
        poses={[
          [0, "idle"],
          [at("limitees"), "raise"],
          [at("alors", 1), "point"],
        ]}
      />
    </AbsoluteFill>
  );
};

export const ChaineWhatsapp: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    channel: f("c'est") - 2,
    url: f("alors") - 2,
    limited: f("les") - 2,
  };
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {/* Bruitages (volume global SFX_GAIN) */}
      <Sfx at={f("nombreux") - 4} name="whoosh" volume={0.4} />
      {[0, 5, 10, 15, 20].map((d) => (
        <Sfx key={d} at={f("interesses") + d} name="notif" volume={0.3} />
      ))}
      <Sfx at={f("creation")} name="pop" volume={0.4} />
      <Sfx at={f("monetisation")} name="coin" volume={0.45} />
      <Sfx at={S.channel - 6} name="whoosh_big" volume={0.4} />
      <Sfx at={f("whatsapp")} name="ding" volume={0.45} />
      {[0, 4, 8].map((d) => (
        <Sfx key={d} at={f("serie") + d} name="pop" volume={0.4} />
      ))}
      <Sfx at={f("gratuites")} name="impact" volume={0.45} />
      <Sfx at={S.url - 6} name="whoosh_big" volume={0.4} />
      <Sfx at={f("pandoo.me") - 2} name="typing" volume={0.55} />
      <Sfx at={f("automatiquement")} name="whoosh" volume={0.45} />
      <Sfx at={f("chaine", 1)} name="ding" volume={0.5} />
      <Sfx at={S.limited - 6} name="whoosh_big" volume={0.4} />
      <Sfx at={f("places")} name="tick" volume={0.5} />
      <Sfx at={f("limitees")} name="impact" volume={0.5} />
      <Sfx at={f("alors", 1)} name="pop" volume={0.5} />
      <Sfx at={f("maintenant")} name="riser" volume={0.35} />
      <Camera shakes={[f("nombreux"), f("gratuites"), f("limitees")]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.04, render: <SceneCrowd {...scene(0)} /> },
            { from: S.channel, transition: "whip", push: 0.04, render: <SceneChannel {...scene(S.channel)} /> },
            { from: S.url, transition: "zoom", push: 0.03, render: <SceneUrl {...scene(S.url)} /> },
            { from: S.limited, transition: "whip", push: 0.05, render: <SceneLimited {...scene(S.limited)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
