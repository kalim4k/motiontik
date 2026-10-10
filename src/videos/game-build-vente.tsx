import { AbsoluteFill, Audio, interpolate, Loop, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Card, font, Icon, Reveal, ScreenRec, Subtitles } from "../lib/Course";
import { clamp, EASE_IN_OUT, prog } from "../lib/ease";
import type { VideoProps } from "../lib/timing";

// Vidéo de la page de vente Game Build (16:9) : voix réelle nettoyée + motion design aux couleurs de la page.

const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
const G = {
  blue: "#1f6bff",
  blueDark: "#0f3fb3",
  yellow: "#ffc21a",
  ink: "#121318",
  text: "#1c1d22",
  muted: "#6b6f7a",
  line: "#e3e6ee",
  bg: "#f5f7fc",
  white: "#ffffff",
  green: "#17a35b",
  dark: "#0c1020",
};
const big = (size: number, color: string = G.ink): React.CSSProperties => ({ fontFamily: font, fontWeight: 900, fontSize: size, color, letterSpacing: -1, lineHeight: 1.04 });
const body = (size: number, color: string = G.text): React.CSSProperties => ({ fontFamily: font, fontWeight: 700, fontSize: size, color, lineHeight: 1.25 });
const kicker = (color: string = G.blue): React.CSSProperties => ({ fontFamily: font, fontWeight: 800, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color });

/** Repères (secondes) de la 1re version de la voix nettoyée. */
const T0 = {
  millions: 1.84,
  partie: 4.62,
  toi: 11.08,
  principe: 12.0,
  crees: 13.26,
  enLigne: 14.6,
  rapporte: 16.82,
  avant: 18.1,
  aujourdhui: 20.48,
  code: 22.6,
  choisis: 24.52,
  playStore: 27.88,
  decris: 28.88,
  complet: 31.04,
  testes: 32.14,
  modifs: 33.56,
  touche: 36.26,
  besoin: 37.06,
  ensuite: 39.92,
  site: 41.64,
  partout: 45.38,
  maintenant: 47.32,
  comment: 49.58,
  moyens: 53.2,
  adsense: 55.98,
  connectes: 59.26,
  pubs: 61.78,
  entreDeux: 64.08,
  reverse: 66.0,
  plusJoueurs: 69.76,
  autres: 73.86,
  adsterra: 77.6,
  achats: 78.9,
  revente: 80.48,
  formation: 81.4,
  combiner: 86.7,
  gameBuild: 90.0,
  idee: 92.66,
  creer: 94.72,
  enLigne2: 96.94,
  gagner: 100.38,
  sources: 102.4,
  cta: 105.14,
  clique: 109.02,
};

/** Repères finaux : silence du début (-0,96 s) et « accessible » en double (-1,72 s de plus) retirés. */
const T = Object.fromEntries(Object.entries(T0).map(([k, v]) => [k, v < 42.5 ? v - 0.96 : v - 2.68])) as typeof T0;

const Bg: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <AbsoluteFill
    style={{
      background: dark ? G.dark : G.bg,
      backgroundImage: dark
        ? "radial-gradient(circle at 85% 15%, rgba(31,107,255,0.35), transparent 50%), radial-gradient(circle at 10% 90%, rgba(255,194,26,0.18), transparent 45%)"
        : "radial-gradient(rgba(31,107,255,0.07) 1.5px, transparent 1.5px)",
      backgroundSize: dark ? undefined : "34px 34px",
    }}
  />
);

/** Scène entre deux repères ; `r(s)` = frame relative d'une seconde absolue. Entrée en volet. */
const Scene: React.FC<{ from: number; to: number; dark?: boolean; children: (r: (s: number) => number) => React.ReactNode }> = ({ from, to, dark, children }) => (
  <Sequence from={f(from)} durationInFrames={f(to) - f(from) + 10}>
    <Wipe>
      <Bg dark={dark} />
      {children((s) => f(s) - f(from))}
    </Wipe>
  </Sequence>
);

const Wipe: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, 0, 12, EASE_IN_OUT);
  return <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` }}>{children}</AbsoluteFill>;
};

/** Extrait de l'enregistrement de la page (jeux, AdSense, page Game Build) qui boucle. */
const SiteClip: React.FC<{ from: number; to: number; rate?: number }> = ({ from, to, rate = 1 }) => (
  <Loop durationInFrames={Math.max(1, Math.round(((to - from) * FPS) / rate))}>
    <OffthreadVideo src={staticFile("game-build-vente/rec-site.mp4")} muted trimBefore={f(from)} playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  </Loop>
);

/** Cadre arrondi avec ombre (vidéo ou contenu). */
const Frame: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode; bar?: string }> = ({ x, y, w, h, children, bar }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, borderRadius: 24, overflow: "hidden", background: G.white, border: `2px solid ${G.line}`, boxShadow: "0 30px 80px rgba(15,30,80,0.18)" }}>
    {bar !== undefined && (
      <div style={{ height: 46, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "#eef1f8", borderBottom: `1px solid ${G.line}` }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
        {bar && <div style={{ marginLeft: 18, padding: "4px 18px", borderRadius: 8, background: G.white, ...body(20, G.muted) }}>{bar}</div>}
      </div>
    )}
    <div style={{ position: "relative", width: w, height: h }}>{children}</div>
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number }> = ({ children, bg = G.blue, color = G.white, size = 34 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: `${size * 0.4}px ${size * 0.8}px`, borderRadius: 999, background: bg, ...body(size, color) }}>{children}</div>
);

const Coin: React.FC<{ size?: number }> = ({ size = 70 }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: G.yellow, border: `${size * 0.07}px solid #fff`, boxShadow: "0 6px 16px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", ...big(size * 0.5, G.ink) }}>
    $
  </div>
);

/** Pièces qui volent de (x0, y0) vers (x1, y1), une toutes les `every` frames. */
const CoinFlow: React.FC<{ at: number; from: [number, number]; to: [number, number]; n?: number; every?: number; loop?: boolean }> = ({ at, from, to, n = 6, every = 8, loop }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        let start = at + i * every;
        if (loop && frame > start) start += Math.floor((frame - start) / (n * every)) * n * every;
        const t = prog(frame, start, 24, EASE_IN_OUT);
        if (t <= 0 || t >= 1) return null;
        return (
          <div key={i} style={{ position: "absolute", left: interpolate(t, [0, 1], [from[0], to[0]]) - 35, top: interpolate(t, [0, 1], [from[1], to[1]]) - Math.sin(t * Math.PI) * 160 - 35 }}>
            <Coin />
          </div>
        );
      })}
    </>
  );
};

// ─── Scènes ───────────────────────────────────────────────────────────────────────────

const Hook: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const toi = frame >= r(T.toi);
  return (
    <>
      <Reveal at={0} scale style={{ position: "absolute", left: 90, top: 150 }}>
        <Frame x={0} y={0} w={1100} h={688}>
          <SiteClip from={0} to={2.4} rate={0.5} />
        </Frame>
      </Reveal>
      <Reveal at={r(T.millions)} style={{ position: "absolute", left: 90, top: 70 }}>
        <Pill bg={G.ink}>
          <Icon name="users" size={40} color={G.yellow} /> Des millions de parties chaque jour
        </Pill>
      </Reveal>
      <CoinFlow at={r(T.partie)} from={[640, 480]} to={[1560, 470]} n={6} every={9} loop />
      {frame >= r(T.partie) && (
        <div style={{ position: "absolute", left: 1400, top: 300 }}>
          <Reveal at={r(T.partie)} scale>
            <div
              style={{
                width: 320,
                height: 320,
                borderRadius: 160,
                background: toi ? G.blue : G.white,
                border: `8px solid ${toi ? G.blue : G.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 20px 60px rgba(15,30,80,0.18)",
                transform: `scale(${toi ? 1 + Math.max(0, 1 - (frame - r(T.toi)) / 10) * 0.15 : 1})`,
                ...big(toi ? 110 : 180, toi ? G.white : G.muted),
              }}
            >
              {toi ? "TOI" : "?"}
            </div>
          </Reveal>
        </div>
      )}
    </>
  );
};

const Principle: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const steps: [string, string, "gift" | "globe" | "money", number][] = [
    ["Créer", "ton jeu", "gift", r(T.crees)],
    ["Publier", "en ligne", "globe", r(T.enLigne)],
    ["Gagner", "quand les gens jouent", "money", r(T.rapporte)],
  ];
  return (
    <>
      <Reveal at={4} style={{ position: "absolute", left: 140, top: 150 }}>
        <div style={kicker()}>Le principe</div>
        <div style={{ ...big(78), marginTop: 10 }}>Simple, en 3 étapes</div>
      </Reveal>
      <div style={{ position: "absolute", left: 140, right: 140, top: 400, display: "flex", alignItems: "center", gap: 30 }}>
        {steps.map(([t, s, ic, at], i) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 30, flex: 1 }}>
            <Reveal at={at} scale style={{ flex: 1 }}>
              <Card style={{ textAlign: "center", borderTop: `8px solid ${i === 2 ? G.yellow : G.blue}` }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Icon name={ic} size={84} color={i === 2 ? "#e0a800" : G.blue} />
                </div>
                <div style={{ ...big(56), marginTop: 12 }}>{t}</div>
                <div style={{ ...body(28, G.muted), marginTop: 6 }}>{s}</div>
              </Card>
            </Reveal>
            {i < 2 && (
              <Reveal at={at + 8}>
                <div style={big(70, G.blue)}>→</div>
              </Reveal>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

const CodeLines: React.FC<{ at: number; n?: number; dark?: boolean }> = ({ at, n = 9, dark = true }) => {
  const frame = useCurrentFrame();
  const palette = ["#ff7eb6", "#7ee787", "#79c0ff", "#ffa657", "#d2a8ff"];
  return (
    <div style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
      {Array.from({ length: n }, (_, i) => {
        const g = Math.max(0, Math.min(1, (frame - at) / 4 - i));
        const parts = [0.2, 0.32, 0.14, 0.24].slice(0, 2 + (i % 3));
        return (
          <div key={i} style={{ display: "flex", gap: 12, paddingLeft: ([0, 1, 2, 2, 1, 2, 3, 2, 1][i % 9] || 0) * 26 }}>
            {parts.map((w, j) => (
              <div key={j} style={{ height: 16, width: `${w * 100 * g}%`, borderRadius: 8, background: dark ? palette[(i + j) % palette.length] : "#c9d2e6" }} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const BeforeAfter: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const cross = prog(frame, r(T.aujourdhui) - 6, 10);
  return (
    <>
      <Reveal at={2} style={{ position: "absolute", left: 140, top: 200, width: 760 }}>
        <div style={kicker(G.muted)}>Avant</div>
        <div style={{ ...big(52), margin: "8px 0 24px" }}>Des mois à apprendre à coder</div>
        <div style={{ position: "relative", height: 380, borderRadius: 24, background: "#1e2030", overflow: "hidden" }}>
          <CodeLines at={4} n={12} />
          <svg width={760} height={380} style={{ position: "absolute", inset: 0 }}>
            <path d={`M40 40 L${40 + 680 * cross} ${40 + 300 * cross}`} stroke="#ff4d4d" strokeWidth={18} strokeLinecap="round" />
            <path d={`M720 40 L${720 - 680 * cross} ${40 + 300 * cross}`} stroke="#ff4d4d" strokeWidth={18} strokeLinecap="round" />
          </svg>
        </div>
      </Reveal>
      <Reveal at={r(T.aujourdhui)} style={{ position: "absolute", left: 1000, top: 200, width: 780 }}>
        <div style={kicker()}>Aujourd'hui</div>
        <div style={{ ...big(52), margin: "8px 0 24px" }}>L'IA écrit le code pour toi</div>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 26px", display: "flex", alignItems: "center", gap: 14, borderBottom: `2px solid ${G.line}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: G.blue }} />
            <div style={body(30)}>Assistant IA</div>
          </div>
          <div style={{ background: "#1e2030" }}>
            <CodeLines at={r(T.code)} n={8} />
          </div>
        </Card>
      </Reveal>
    </>
  );
};

const PlayStore: React.FC<{ r: (s: number) => number; len: number }> = ({ r, len }) => (
  <>
    <ScreenRec src="game-build-vente/rec-playstore.mp4" url="play.google.com/store/games" width={1400} top={90} len={len} shots={[{ at: 0, from: 1, to: 9 }]} />
    <Reveal at={r(T.playStore) - 20} dx={50} dy={0} style={{ position: "absolute", left: 1270, top: 640, width: 560, zIndex: 5 }}>
      <div style={{ padding: "22px 28px", borderRadius: 22, background: G.blue, ...body(36, G.white), boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>Inspire-toi des jeux qui marchent déjà</div>
    </Reveal>
  </>
);

const AiBuilds: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const prompt = "Crée-moi un jeu de course simple et addictif, avec des niveaux";
  const typed = prompt.slice(0, Math.max(0, Math.floor((frame - 6) * 1.8)));
  const chips: [string, number][] = [
    ["Tu testes", r(T.testes)],
    ["Tu demandes des modifications", r(T.modifs)],
    ["Tu ajoutes ta touche", r(T.touche)],
  ];
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 110, width: 980 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 26px", display: "flex", alignItems: "center", gap: 14, borderBottom: `2px solid ${G.line}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: G.blue }} />
            <div style={body(30)}>Assistant IA</div>
          </div>
          <div style={{ padding: 26, minHeight: 560, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ alignSelf: "flex-end", maxWidth: 680, padding: "16px 22px", borderRadius: 20, background: "#eef2ff", ...body(30) }}>
              {typed}
              {typed.length < prompt.length && <span style={{ color: G.blue }}>|</span>}
            </div>
            {frame >= r(T.complet) - 50 && (
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ flex: 1, borderRadius: 18, background: "#1e2030", overflow: "hidden" }}>
                  <CodeLines at={r(T.complet) - 50} n={10} />
                </div>
                {frame >= r(T.complet) && (
                  <Reveal at={r(T.complet)} scale>
                    <div style={{ width: 300, height: 420, borderRadius: 28, overflow: "hidden", border: `6px solid ${G.ink}` }}>
                      <div style={{ width: 900, height: 420, marginLeft: 0 }}>
                        <SiteClip from={0} to={2.4} rate={0.5} />
                      </div>
                    </div>
                  </Reveal>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
      <div style={{ position: "absolute", left: 1170, top: 170, display: "flex", flexDirection: "column", gap: 22 }}>
        {chips.map(([t, at]) => (
          <Reveal key={t} at={at} dx={50} dy={0}>
            <Card style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 26px" }}>
              <Icon name="check" size={44} color={G.green} />
              <div style={body(32)}>{t}</div>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal at={r(T.besoin)} scale style={{ position: "absolute", left: 1170, top: 640 }}>
        <Pill bg={G.yellow} color={G.ink} size={36}>
          Pas besoin d'être développeur
        </Pill>
      </Reveal>
    </>
  );
};

const Publish: React.FC<{ r: (s: number) => number }> = ({ r }) => (
  <>
    <Reveal at={2} style={{ position: "absolute", left: 120, top: 120 }}>
      <div style={kicker()}>Ensuite</div>
      <div style={{ ...big(70), marginTop: 8 }}>Tu publies ton jeu sur ton site</div>
    </Reveal>
    <Reveal at={r(T.site)} scale style={{ position: "absolute", left: 120, top: 300 }}>
      <Frame x={0} y={0} w={1060} h={560} bar="https://ton-jeu.com">
        <SiteClip from={0} to={2.4} rate={0.5} />
      </Frame>
    </Reveal>
    <Reveal at={r(T.partout)} dx={60} dy={0} style={{ position: "absolute", left: 1300, top: 360 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {[
          ["globe", "Accessible partout"],
          ["users", "Sur téléphone"],
          ["check", "Et sur ordinateur"],
        ].map(([ic, t]) => (
          <Card key={t} style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 28px" }}>
            <Icon name={ic as "globe"} size={46} color={G.blue} />
            <div style={body(34)}>{t}</div>
          </Card>
        ))}
      </div>
    </Reveal>
  </>
);

const HowMoney: React.FC<{ r: (s: number) => number }> = ({ r }) => (
  <>
    <Reveal at={r(T.comment)} style={{ position: "absolute", left: 140, top: 260 }}>
      <div style={kicker(G.yellow)}>La partie qui t'intéresse</div>
      <div style={{ ...big(100, G.white), marginTop: 14 }}>Comment ton jeu</div>
      <div style={{ ...big(100, G.yellow) }}>te rapporte de l'argent</div>
    </Reveal>
    <div style={{ position: "absolute", left: 140, top: 640, display: "flex", gap: 24 }}>
      {["Publicité", "Achats intégrés", "Revente"].map((t, i) => (
        <Reveal key={t} at={r(T.moyens) + i * 8} scale>
          <Pill bg="rgba(255,255,255,0.12)" size={34}>
            {t}
          </Pill>
        </Reveal>
      ))}
    </div>
  </>
);

const Adsense: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const dash = frame >= r(T.plusJoueurs);
  const adOn = frame >= r(T.entreDeux) && frame < r(T.reverse);
  const flow = frame >= r(T.reverse) && !dash;
  return (
    <>
      <Reveal at={2} style={{ position: "absolute", left: 120, top: 90 }}>
        <div style={kicker()}>Moyen n°1 · la publicité</div>
        <div style={{ ...big(64), marginTop: 6 }}>Google AdSense</div>
      </Reveal>
      {!dash && (
        <>
          <Reveal at={r(T.connectes)} scale style={{ position: "absolute", left: 120, top: 290 }}>
            <Frame x={0} y={0} w={860} h={520} bar="https://ton-jeu.com">
              <SiteClip from={0} to={2.4} rate={0.5} />
              {frame >= r(T.pubs) && (
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "#fff7d6", borderTop: `3px solid ${G.yellow}`, display: "flex", alignItems: "center", justifyContent: "center", ...body(30, G.ink), opacity: prog(frame, r(T.pubs), 8) }}>
                  Publicité
                </div>
              )}
              {adOn && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(12,16,32,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                  <div style={body(28, "#c5cbe0")}>Niveau terminé !</div>
                  <div style={{ width: 520, height: 220, borderRadius: 18, background: G.yellow, display: "flex", alignItems: "center", justifyContent: "center", ...big(56, G.ink) }}>PUBLICITÉ</div>
                  <div style={body(24, "#c5cbe0")}>Niveau suivant dans 3 s…</div>
                </div>
              )}
            </Frame>
          </Reveal>
          <Reveal at={r(T.connectes) + 10} dx={50} dy={0} style={{ position: "absolute", left: 1080, top: 300, width: 700 }}>
            <Card style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 70, height: 70, borderRadius: 18, background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", ...big(40, G.blue) }}>G</div>
              <div>
                <div style={big(40)}>Google AdSense</div>
                <div style={body(26, G.green)}>Connecté à ton jeu ✓</div>
              </div>
            </Card>
          </Reveal>
          {flow && (
            <div style={{ position: "absolute", left: 1080, top: 470, width: 700, display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                ["Les annonceurs", "paient pour afficher leurs pubs"],
                ["Google", "garde sa part"],
                ["Toi", "reçois le reste"],
              ].map(([a, b], i) => (
                <Reveal key={a} at={r(T.reverse) + i * 12} dx={40} dy={0}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 24px", borderRadius: 18, background: i === 2 ? G.blue : G.white, border: `2px solid ${i === 2 ? G.blue : G.line}` }}>
                    <div style={big(34, i === 2 ? G.white : G.ink)}>{a}</div>
                    <div style={body(26, i === 2 ? "#dbe6ff" : G.muted)}>{b}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
      {dash && (
        <>
          <Reveal at={r(T.plusJoueurs)} scale style={{ position: "absolute", left: 120, top: 250 }}>
            <Frame x={0} y={0} w={1100} h={688} bar="adsense.google.com">
              <SiteClip from={2.6} to={6.1} rate={0.5} />
            </Frame>
          </Reveal>
          <Reveal at={r(T.plusJoueurs) + 10} dx={50} dy={0} style={{ position: "absolute", left: 1300, top: 420, width: 500 }}>
            <div style={{ padding: "26px 30px", borderRadius: 24, background: G.blue, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
              <div style={body(26, "#dbe6ff")}>La règle</div>
              <div style={{ ...big(48, G.white), marginTop: 6 }}>Plus de joueurs = plus de revenus</div>
            </div>
          </Reveal>
        </>
      )}
    </>
  );
};

const Others: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const cards: [string, string, string, number, React.ReactNode][] = [
    ["Adsterra", "Un autre réseau de publicité", "#e3262b", r(T.adsterra), <Icon name="globe" size={70} color="#e3262b" />],
    [
      "Achats intégrés",
      "Vies, bonus, « sans pub »…",
      G.blue,
      r(T.achats),
      <div style={{ display: "flex", gap: 10 }}>
        {["0,99 $", "1,99 $"].map((p) => (
          <div key={p} style={{ padding: "6px 12px", borderRadius: 10, background: "#eef2ff", ...body(22, G.blue) }}>{p}</div>
        ))}
      </div>,
    ],
    ["Revente du jeu", "Un jeu qui a des joueurs a de la valeur", "#e0a800", r(T.revente), <div style={{ padding: "6px 14px", borderRadius: 10, background: G.yellow, ...body(24, G.ink) }}>À VENDRE</div>],
  ];
  return (
    <>
      <Reveal at={2} style={{ position: "absolute", left: 120, top: 110 }}>
        <div style={kicker()}>Et ce n'est pas tout</div>
        <div style={{ ...big(66), marginTop: 6 }}>Les autres moyens de monétisation</div>
      </Reveal>
      <div style={{ position: "absolute", left: 120, right: 120, top: 330, display: "flex", gap: 34 }}>
        {cards.map(([t, s, color, at, visual]) => (
          <Reveal key={t} at={at} style={{ flex: 1 }}>
            <Card style={{ height: 380, borderTop: `8px solid ${color}` }}>
              <div style={{ height: 80, display: "flex", alignItems: "center" }}>{visual}</div>
              <div style={{ ...big(48), marginTop: 20 }}>{t}</div>
              <div style={{ ...body(30, G.muted), marginTop: 12 }}>{s}</div>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal at={r(T.formation) + 20} scale style={{ position: "absolute", left: 120, top: 780 }}>
        <Pill bg={G.ink} size={32}>
          <Icon name="check" size={38} color={G.yellow} /> Tout est détaillé dans la formation complète
        </Pill>
      </Reveal>
    </>
  );
};

const Combine: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const srcs: [string, number][] = [
    ["Publicité", 250],
    ["Achats intégrés", 470],
    ["Revente", 690],
  ];
  const pulse = 1 + Math.max(0, Math.sin(frame / 6)) * 0.04;
  return (
    <>
      <Reveal at={2} style={{ position: "absolute", left: 120, top: 110 }}>
        <div style={kicker()}>Le mieux</div>
        <div style={{ ...big(66), marginTop: 6 }}>Tu peux tout combiner sur le même jeu</div>
      </Reveal>
      {srcs.map(([t, y], i) => (
        <Reveal key={t} at={6 + i * 6} dx={-50} dy={0} style={{ position: "absolute", left: 120, top: y + 60 }}>
          <Pill bg={G.white} color={G.ink} size={34}>
            {t}
          </Pill>
        </Reveal>
      ))}
      {srcs.map(([t, y], i) => (
        <CoinFlow key={t} at={20 + i * 5} from={[560, y + 100]} to={[1380, 520]} n={4} every={14} loop />
      ))}
      <Reveal at={14} scale style={{ position: "absolute", left: 1250, top: 380 }}>
        <div style={{ width: 280, height: 280, borderRadius: 140, background: G.blue, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${pulse})`, boxShadow: "0 20px 60px rgba(31,107,255,0.35)" }}>
          <Icon name="money" size={90} color={G.white} />
          <div style={{ ...big(40, G.white), marginTop: 8 }}>Tes revenus</div>
        </div>
      </Reveal>
    </>
  );
};

const Inside: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const items: [string, number][] = [
    ["Trouver une idée de jeu", r(T.idee)],
    ["Le créer avec l'IA, sans coder", r(T.creer)],
    ["Le mettre en ligne", r(T.enLigne2)],
    ["Gagner de l'argent avec AdSense", r(T.gagner)],
    ["Les autres sources de revenus", r(T.sources)],
  ];
  return (
    <>
      <Reveal at={4} scale style={{ position: "absolute", left: 90, top: 150 }}>
        <Frame x={0} y={0} w={1000} h={625} bar="Game Build">
          <SiteClip from={6.4} to={11.1} rate={0.4} />
        </Frame>
      </Reveal>
      <Reveal at={4} style={{ position: "absolute", left: 1170, top: 120 }}>
        <div style={kicker()}>Dans Game Build</div>
        <div style={{ ...big(54), marginTop: 6 }}>Tout, étape par étape</div>
      </Reveal>
      <div style={{ position: "absolute", left: 1170, top: 290, width: 660, display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map(([t, at], i) => (
          <Reveal key={t} at={at} dx={50} dy={0}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", borderRadius: 18, background: G.white, border: `2px solid ${G.line}` }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: G.blue, display: "flex", alignItems: "center", justifyContent: "center", ...big(26, G.white) }}>{i + 1}</div>
              <div style={body(30)}>{t}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
};

const Cta: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const bounce = Math.abs(Math.sin(frame / 8)) * 24;
  const pulse = 1 + Math.max(0, Math.sin(frame / 7)) * 0.04;
  return (
    <>
      <Reveal at={4} style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center" }}>
        <div style={kicker(G.yellow)}>Formation Game Build</div>
        <div style={{ ...big(96, G.white), marginTop: 16 }}>Ton propre jeu en ligne,</div>
        <div style={big(96, G.yellow)}>et l'art de le monétiser</div>
      </Reveal>
      <Reveal at={r(T.clique) - 20} scale style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
        <div style={{ transform: `scale(${pulse})`, padding: "30px 70px", borderRadius: 999, background: G.blue, boxShadow: "0 20px 60px rgba(31,107,255,0.5)", ...big(54, G.white) }}>Rejoindre la formation</div>
      </Reveal>
      {frame >= r(T.clique) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 730 + bounce, display: "flex", justifyContent: "center", ...big(90, G.yellow) }}>↓</div>
      )}
    </>
  );
};

const KEYWORDS = /^(AdSense|Adsterra|IA|l'IA|Game|Build|argent|l'argent|publicité|jeu|toi)[.,!?…:;]*$/i;

export const GameBuildVente: React.FC<VideoProps> = ({ slug, timing }) => {
  const { durationInFrames } = useVideoConfig();
  if (!timing) return null;
  const end = timing.duration + 1;
  const scenes: [number, number, React.FC<{ r: (s: number) => number; len: number }>, boolean?][] = [
    [0, T.principe, Hook],
    [T.principe, T.avant, Principle],
    [T.avant, T.choisis, BeforeAfter],
    [T.choisis, T.decris, PlayStore],
    [T.decris, T.ensuite, AiBuilds],
    [T.ensuite, T.maintenant, Publish],
    [T.maintenant, T.adsense, HowMoney, true],
    [T.adsense, T.autres, Adsense],
    [T.autres, T.combiner, Others],
    [T.combiner, T.gameBuild, Combine],
    [T.gameBuild, T.cta, Inside],
    [T.cta, end, Cta, true],
  ];
  return (
    <AbsoluteFill style={{ background: G.bg }}>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      {scenes.map(([a, b, Comp, dark], i) => (
        <Scene key={i} from={a} to={b} dark={dark}>
          {(r) => <Comp r={r} len={f(b) - f(a)} />}
        </Scene>
      ))}
      <Subtitles words={timing.words} keywords={KEYWORDS} accent={G.yellow} />
    </AbsoluteFill>
  );
};

