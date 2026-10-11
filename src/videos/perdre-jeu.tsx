import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Burst,
  ClaudeWindow,
  Coin,
  CoinBurst,
  col,
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
import { clamp, EASE_IN_OUT, prog } from "../lib/ease";
import { BioCard, comic, MoneyBag, Player, Stamp } from "../lib/Promo";
import { SceneTrack } from "../lib/SceneTrack";
import { Camera, Music, Sfx } from "../lib/Stage";
import { ComicCaptions, Ground, StickMan, stick } from "../lib/Stick";
import { timeOf, type VideoProps } from "../lib/timing";

// Hook choc : « Chaque fois que tu perds à un jeu… quelqu'un gagne de l'argent. » puis retournement : ce quelqu'un, ça peut être toi.

type SceneProps = { at: (word: string, occ?: number) => number; slug: string };

/** Écran « GAME OVER » qui s'écrase sur l'écran du téléphone à `at` (et disparaît à `until`). */
const GameOver: React.FC<{ at: number; until?: number; width: number }> = ({ at, until, width }) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const p = prog(frame, at, 6);
  return (
    <AbsoluteFill style={{ background: `rgba(20,0,0,${0.72 * p})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          ...comic(width * 0.2, col.red),
          textAlign: "center",
          lineHeight: 0.95,
          WebkitTextStroke: `${width * 0.008}px #fff`,
          transform: `scale(${interpolate(p, [0, 1], [2.2, 1])}) rotate(-6deg)`,
          opacity: Math.min(1, p * 2),
        }}
      >
        GAME
        <br />
        OVER
      </div>
    </AbsoluteFill>
  );
};

/** Pub plein écran qui s'affiche sur le téléphone. */
const AdScreen: React.FC<{ at: number; until?: number; width: number }> = ({ at, until, width }) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const p = prog(frame, at, 7);
  return (
    <AbsoluteFill style={{ background: col.yellow, transform: `translateY(${(1 - p) * 100}%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: width * 0.04 }}>
      <div style={{ ...comic(width * 0.24), lineHeight: 1 }}>PUB</div>
      <div style={{ ...comic(width * 0.07), padding: `${width * 0.02}px ${width * 0.05}px`, border: `5px solid ${ink}`, borderRadius: 12, background: "#fff" }}>
        {Math.max(1, 5 - Math.floor((frame - at) / 30))} s
      </div>
    </AbsoluteFill>
  );
};

/** Pièces qui partent de `from` vers `to` en arc, une par instant de `starts`. */
const CoinStream: React.FC<{ starts: number[]; from: [number, number]; to: [number, number]; size?: number }> = ({ starts, from, to, size = 70 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {starts.map((s, i) => {
        const t = prog(frame, s, 14, EASE_IN_OUT);
        if (t <= 0 || t >= 1) return null;
        const x = interpolate(t, [0, 1], [from[0], to[0]]);
        const y = interpolate(t, [0, 1], [from[1], to[1]]) - Math.sin(t * Math.PI) * 260;
        return (
          <div key={i} style={{ position: "absolute", left: x - size / 2, top: y - size / 2 }}>
            <Coin size={size} spin={t * 2} />
          </div>
        );
      })}
    </>
  );
};

/** Compteur « Pubs vues » qui s'incrémente à chaque instant de `hits`. */
const AdCounter: React.FC<{ hits: number[] }> = ({ hits }) => {
  const frame = useCurrentFrame();
  const n = hits.filter((h) => frame >= h).length;
  const last = hits.filter((h) => frame >= h).pop() ?? -99;
  const bump = 1 + Math.max(0, 1 - (frame - last) / 6) * 0.25;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 30px", background: "#fff", border: `7px solid ${ink}`, borderRadius: 999, boxShadow: `7px 9px 0 ${ink}`, transform: `scale(${bump})` }}>
      <div style={comic(44)}>Pubs vues :</div>
      <div style={comic(64, col.red)}>{n}</div>
    </div>
  );
};

/** Silhouette noire du « quelqu'un » qui encaisse. */
const Shadow: React.FC<{ x: number; y: number; height: number; cheerAt: number }> = ({ x, y, height, cheerAt }) => (
  <div style={{ position: "absolute", inset: 0, filter: "brightness(0)" }}>
    <StickMan x={x} y={y} height={height} flip expression="smug" poses={[[0, "hips"], [cheerAt, "cheer"]]} seed={4} />
  </div>
);

// 1. Hook : chaque fois que tu perds… quelqu'un gagne de l'argent.
const SceneHook: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const lose = at("perds");
  const someone = at("quelqu'un");
  return (
    <AbsoluteFill>
      <Ground horizon={1520} />
      {frame >= lose && <SpeedLines cx={360} cy={900} color="#f8dede" />}
      <Pop at={0} x={400} y={760} rotate={-4}>
        <InkPhone width={380}>
          <ScreenVideo src={`${slug}/gp-course.mp4`} trim={40} />
          <GameOver at={lose} width={screenW(380)} />
        </InkPhone>
      </Pop>
      <StickMan x={330} y={1520} height={300} poses={[[0, "phone"], [lose, "shrug"]]} expression={frame >= lose ? "angry" : "happy"} seed={2} />
      {frame >= someone && <Shadow x={860} y={1520} height={420} cheerAt={at("l'argent")} />}
      <Pop at={someone} x={860} y={920} rotate={6}>
        <Tag text="Quelqu'un ?" bg={ink} color="#fff" size={48} />
      </Pop>
      <CoinStream starts={[at("gagne"), at("gagne") + 4, at("l'argent"), at("l'argent") + 4]} from={[400, 760]} to={[860, 1180]} />
      <Pop at={at("l'argent")} x={860} y={720} rotate={-5}>
        <Burst size={300} fill={col.green}>
          <div style={comic(120, "#fff")}>$</div>
        </Burst>
      </Pop>
    </AbsoluteFill>
  );
};

// 2. Regarde : perdu → pub → le créateur est payé. Tu relances, tu reperds… encore.
const SceneLoop: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const w = 400;
  const bag: [number, number] = [830, 980];
  const lose1 = at("perds", 1);
  const ad1 = at("pub");
  const restart = at("relances");
  const lose2 = at("perds", 2);
  const ad2 = at("pub", 1);
  const paid = [at("paye"), at("encore", 2) + 4, at("l'argent", 1) + 2];
  return (
    <AbsoluteFill>
      <Ground horizon={1560} />
      <Pop at={0} x={310} y={900} rotate={-3} from="left" wiggle={lose2}>
        <InkPhone width={w}>
          <ScreenVideo src={`${slug}/${frame >= restart ? "gp-chateau" : "gp-course"}.mp4`} trim={frame >= restart ? 50 : 90} />
          <GameOver at={lose1} until={ad1} width={screenW(w)} />
          <AdScreen at={ad1} until={restart} width={screenW(w)} />
          <GameOver at={lose2} until={ad2} width={screenW(w)} />
          <AdScreen at={ad2} width={screenW(w)} />
        </InkPhone>
      </Pop>
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={paid} label="Le créateur" labelBg={col.purple} />
      <CoinStream starts={paid} from={[310, 820]} to={bag} />
      <StickMan x={830} y={1560} height={300} flip expression="smug" poses={[[0, "hips"], [paid[0], "cheer"]]} seed={4} />
      <Pop at={4} x={540} y={1690}>
        <AdCounter hits={[ad1, ad2]} />
      </Pop>
      <Pop at={at("encore", 1)} x={800} y={500} rotate={8} out={at("encore", 2) - 2}>
        <Stamp text="Encore" at={at("encore", 1)} size={70} rotate={8} />
      </Pop>
      <Pop at={at("encore", 2)} x={800} y={500} rotate={-6}>
        <Stamp text="Et encore" at={at("encore", 2)} color={col.purple} size={64} rotate={-6} />
      </Pop>
    </AbsoluteFill>
  );
};

// 3. Des millions de joueurs perdent chaque jour. Fais le calcul.
const SceneMillions: React.FC<SceneProps> = ({ at, slug }) => {
  const bag: [number, number] = [540, 760];
  const base = at("millions");
  const xs = [120, 300, 480, 660, 840, 1000];
  return (
    <AbsoluteFill>
      <Ground horizon={1500} />
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={xs.map((_, i) => base + i * 4)} label="Le créateur" labelBg={col.purple} />
      {xs.map((x, i) => (
        <Player key={x} x={x} at={base - 6 + i * 4} flip={i % 2 === 1} seed={i} bag={bag} ground={1500} />
      ))}
      <Pop at={at("perdent")} x={540} y={1640}>
        <Tag text="Des millions / jour" bg={col.red} color="#fff" size={52} />
      </Pop>
      <Pop at={at("fais")} x={540} y={420} rotate={-4}>
        <Burst size={520} fill={col.yellow}>
          <div style={{ ...comic(58), textAlign: "center", whiteSpace: "normal", width: 330 }}>FAIS LE CALCUL</div>
        </Burst>
      </Pop>
      <CoinBurst at={at("calcul")} x={540} y={700} count={14} size={66} />
    </AbsoluteFill>
  );
};

// 4. Le pire ? Ce jeu, tu pourrais le créer toi-même.
const SceneWorst: React.FC<SceneProps> = ({ at, slug }) => {
  const frame = useCurrentFrame();
  const you = at("toi-meme");
  return (
    <AbsoluteFill>
      <Ground none />
      <Pop at={0} x={330} y={620} rotate={-5} out={at("jeu", 2) - 2}>
        <Burst size={500} fill={col.red}>
          <div style={{ ...comic(84, "#fff"), textAlign: "center" }}>LE PIRE ?</div>
        </Burst>
      </Pop>
      <Pop at={at("jeu", 2)} x={300} y={820} rotate={-5} from="left">
        <InkPhone width={330}>
          <ScreenVideo src={`${slug}/gp-course.mp4`} trim={10} />
        </InkPhone>
      </Pop>
      <StickMan
        x={790}
        y={1500}
        height={620}
        variant="full"
        flip
        expression={frame >= you ? "smug" : "surprised"}
        poses={[[0, "raise"], [at("jeu", 2), "present"], [you, "point"]]}
      />
      <Pop at={you} x={360} y={1480} rotate={-6}>
        <Stamp text="Toi-même" at={you} color={col.blue} size={62} rotate={-6} />
      </Pop>
    </AbsoluteFill>
  );
};

// 5. L'IA fabrique le jeu pour toi, sans une ligne de code.
const SceneAI: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Pop at={0} x={545} y={940} from="down" rotate={-1}>
      <ClaudeWindow
        width={900}
        height={820}
        image={`${slug}/capture-jeu.png`}
        attachAt={3}
        prompt="Crée-moi un jeu comme celui-ci"
        typeAt={at("l'ia") - 4}
        codeAt={at("fabrique") + 4}
        previewAt={at("jeu", 3)}
        preview={`${slug}/gp-solrush.mp4`}
      />
    </Pop>
    <Pop at={at("toi") + 2} x={780} y={1450} rotate={4}>
      <Tag text="Ton jeu ✓" bg={col.green} color="#fff" size={50} />
    </Pop>
    <Pop at={at("sans")} x={300} y={1450} rotate={-6}>
      <Stamp text="Zéro code" at={at("sans")} size={68} rotate={-6} />
    </Pop>
  </AbsoluteFill>
);

// 6. En ligne + Google AdSense
const SceneOnline: React.FC<SceneProps> = ({ at, slug }) => (
  <AbsoluteFill>
    <Ground none />
    <Ink d="M405 1290 C445 1480 635 1480 675 1290" at={at("connectes")} dur={12} width={16} />
    <Pop at={0} x={270} y={1000} rotate={-4} from="left">
      <InkPhone width={300}>
        <ScreenVideo src={`${slug}/gp-solrush.mp4`} trim={120} />
      </InkPhone>
    </Pop>
    <Pop at={at("ligne", 1)} x={270} y={560} rotate={-6}>
      <Tag text="En ligne ✓" bg={col.green} color="#fff" size={44} />
    </Pop>
    <Pop at={at("connectes")} x={810} y={1000} rotate={4} from="right" wiggle={at("google")}>
      <InkPhone width={300}>
        <ScreenShot src={`${slug}/adsense.png`} width={screenW(300)} />
      </InkPhone>
    </Pop>
    <Pop at={at("google")} x={810} y={560} rotate={6}>
      <Tag text="Google AdSense" bg={col.blue} color="#fff" size={38} />
    </Pop>
  </AbsoluteFill>
);

// 7. Cette fois, quand les autres perdent… c'est toi qui gagnes.
const SceneFlip: React.FC<SceneProps> = ({ at, slug }) => {
  const bag: [number, number] = [540, 760];
  const base = at("perdent", 1) - 6;
  const xs = [150, 345, 735, 930];
  const starts = xs.map((_, i) => base + i * 4);
  return (
    <AbsoluteFill>
      <Ground horizon={1500} />
      <SpeedLines cx={540} cy={700} color="#e3f5e6" />
      <MoneyBag slug={slug} x={bag[0]} y={bag[1]} hits={[...starts, at("gagnes")]} label="Toi" labelBg={col.green} />
      {xs.map((x, i) => (
        <Player key={x} x={x} at={starts[i]} flip={i % 2 === 1} seed={i} bag={bag} ground={1500} />
      ))}
      {xs.map((x, i) => (
        <Pop key={`go${x}`} at={starts[i] + 2} x={x} y={i % 2 ? 1110 : 1030} rotate={i % 2 ? 6 : -6}>
          <div style={{ ...comic(24, "#fff"), padding: "5px 10px", background: col.red, border: `4px solid ${ink}`, borderRadius: 10 }}>GAME OVER</div>
        </Pop>
      ))}
      <StickMan x={540} y={1500} height={360} variant="full" expression="happy" poses={[[0, "idle"], [at("gagnes"), "cheer"]]} />
      <Pop at={at("gagnes")} x={540} y={430} z={6}>
        <Stamp text="Tu gagnes" at={at("gagnes")} color={col.green} size={82} rotate={-6} />
      </Pop>
      <CoinBurst at={at("gagnes")} x={540} y={700} count={14} size={66} />
    </AbsoluteFill>
  );
};

// 8. Appel à l'action : formation Game Build, lien en bio
const SceneCta: React.FC<SceneProps> = ({ at }) => {
  const frame = useCurrentFrame();
  const bio = at("lien") - 4;
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
          <div style={{ ...comic(60, "#fff"), textAlign: "center", whiteSpace: "normal", width: 380 }}>LA MÉTHODE COMPLÈTE</div>
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

export const PerdreJeu: React.FC<VideoProps> = ({ slug, timing }) => {
  const { fps } = useVideoConfig();
  if (!timing) return null;
  const f = (w: string, occ = 0) => Math.round(timeOf(timing, w, occ) * fps);
  const scene = (from: number): SceneProps => ({ at: (w: string, occ = 0) => f(w, occ) - from, slug });
  const S = {
    loop: f("regarde") - 3,
    millions: f("millions") - 10,
    worst: f("pire") - 8,
    ai: f("aujourd'hui") - 3,
    online: f("mets") - 8,
    flip: f("cette") - 6,
    cta: f("methode") - 6,
  };
  return (
    <AbsoluteFill style={{ background: stick.paper }}>
      <Music slug={slug} />
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {[S.loop, S.millions, S.ai, S.online].map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh" volume={0.4} />
      ))}
      {[S.worst, S.flip, S.cta].map((w) => (
        <Sfx key={w} at={w - 6} name="whoosh_big" volume={0.35} />
      ))}
      {[f("perds"), f("perds", 1), f("perds", 2)].map((w) => (
        <Sfx key={w} at={w} name="glitch" volume={0.4} />
      ))}
      <Sfx at={f("perds")} name="impact" volume={0.5} />
      {[f("gagne"), f("l'argent"), f("paye"), f("encore", 2) + 4, f("l'argent", 1) + 2].map((w) => (
        <Sfx key={w} at={w + 12} name="coin" volume={0.4} />
      ))}
      <Sfx at={f("pub")} name="pop" volume={0.4} />
      <Sfx at={f("pub", 1)} name="pop" volume={0.4} />
      <Sfx at={f("encore", 1)} name="impact" volume={0.35} />
      <Sfx at={f("fais")} name="impact" volume={0.4} />
      <Sfx at={f("pire")} name="riser" volume={0.3} />
      <Sfx at={f("toi-meme")} name="impact" volume={0.45} />
      <Sfx at={f("l'ia") - 4} name="typing" volume={0.45} />
      <Sfx at={f("jeu", 3)} name="ding" volume={0.45} />
      <Sfx at={f("sans")} name="impact" volume={0.4} />
      <Sfx at={f("adsense") + 4} name="ding" volume={0.4} />
      <Sfx at={f("gagnes")} name="coin" volume={0.55} />
      <Sfx at={f("gagnes")} name="impact" volume={0.4} />
      <Sfx at={f("bio")} name="tick" volume={0.5} />
      <Camera shakes={[f("perds"), f("l'argent"), f("perds", 2), f("fais"), f("toi-meme"), f("sans"), f("gagnes")]}>
        <SceneTrack
          scenes={[
            { from: 0, push: 0.05, render: <SceneHook {...scene(0)} /> },
            { from: S.loop, transition: "whip", push: 0.04, render: <SceneLoop {...scene(S.loop)} /> },
            { from: S.millions, transition: "zoom", push: 0.05, render: <SceneMillions {...scene(S.millions)} /> },
            { from: S.worst, transition: "whip", push: 0.04, render: <SceneWorst {...scene(S.worst)} /> },
            { from: S.ai, transition: "wipe", push: 0.03, render: <SceneAI {...scene(S.ai)} /> },
            { from: S.online, transition: "whip", push: 0.04, render: <SceneOnline {...scene(S.online)} /> },
            { from: S.flip, transition: "zoom", push: 0.05, render: <SceneFlip {...scene(S.flip)} /> },
            { from: S.cta, transition: "zoom", push: 0.04, render: <SceneCta {...scene(S.cta)} /> },
          ]}
        />
        <ComicCaptions words={timing.words} />
      </Camera>
    </AbsoluteFill>
  );
};
