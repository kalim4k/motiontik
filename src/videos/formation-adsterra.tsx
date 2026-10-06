import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, Callout, Card, ChapterCard, Count, font, Icon, Kicker, Photo, Reveal, SceneTitle, ScreenRec, type Shot, Subtitles, TopBar } from "../lib/Course";
import { Flag } from "../lib/Doodle";
import { clamp, EASE_IN_OUT, EASE_OUT, prog } from "../lib/ease";
import type { VideoProps } from "../lib/timing";

// Formation Adsterra (voix réelle nettoyée, 16:9). Tous les repères sont en secondes de la voix nettoyée
// (public/formation-adsterra/voice.mp3) ; les enregistrements d'écran sont muets et calés plan par plan.

const FPS = 30;
const f = (s: number) => Math.round(s * FPS);

/** Repères (secondes) de la voix nettoyée, avant l'insertion des preuves. */
const T0 = {
  modules: [5.42, 8.26, 11.18, 14.04],
  surprise: 20.32,
  ch1: 23.0,
  def: 27.0,
  quoi: 29.06,
  fonde: 30.98,
  annonceurs: 33.26,
  editeurs: 37.72,
  board: 43.6,
  panneaux: 49.82,
  appartiennent: 52.42,
  louent: 56.24,
  affiches: 60.5,
  contactent: 73.28,
  payer: 86.0,
  toi: 93.82,
  site: 95.92,
  annonceurs2: 99.06,
  pubs: 107.94,
  trafic: 112.7,
  compris: 119.46,
  cpm: 122.3,
  indicateurs: 133.38,
  cpmDef: 136.42,
  impressions: 145.04,
  formule: 160.38,
  ex1: 164.48,
  ex1Res: 173.84,
  ex2: 176.8,
  ex2Res: 188.96,
  varie: 202.88,
  facteurs: 211.06,
  usa: 219.4,
  usaRes: 235.76,
  afrique: 239.26,
  afriqueRes: 243.44,
  theme: 249.14,
  foot: 252.4,
  mangas: 265.34,
  business: 270.14,
  finance: 271.68,
  africain: 285.38,
  why: 300.76,
  arg1: 308.98,
  ecommerce: 313.94,
  trading: 315.18,
  recharger: 320.92,
  paris: 327.86,
  arg2: 333.88,
  yt: 336.2,
  gars: 349.62,
  seuls: 361.52,
  sature: 373.0,
  ecommerce2: 400.26,
  trading2: 405.0,
  paris2: 408.5,
  adsterra2: 416.9,
  pasSature: 422.36,
  ami: 428.92,
  sem1: 441.8,
  jour: 451.22,
  cent: 462.16,
  capital: 477.2,
  produit: 486.26,
  bonus: 507.22,
  stock: 517.46,
  machine: 524.76,
  lancee: 529.44,
  rien: 534.16,
  amis: 554.88,
  etudiant: 576.85,
  argentTravaille: 605.75,
  mine: 620.99,
  communaute: 638.09,
  ch2: 641.33,
  signup: 645.4,
  identite: 702.15,
  seulCompte: 709.77,
  messenger: 732.29,
  cocher: 774.95,
  dash: 783.21,
  popunder: 840.25,
  getCode: 871.83,
  addUnit: 891.53,
  smartlink: 935.68,
  ch3: 957.0,
  pay: 953.92,
  minimums: 987.42,
  webmoney5: 991.2,
  paxum5: 992.72,
  crypto100: 995.0,
  virement1000: 997.18,
  paypal25: 999.62,
  ajouterInfos: 1023.68,
  payouts: 1082.52,
  auto: 1099.1,
  jours: 1105.82,
  octobre: 1115.5,
  ch4: 1134.67,
  traps: 1139.0,
  trap1: 1144.81,
  bannir: 1164.65,
  trap2: 1168.79,
  detecteurs: 1180.53,
  trap3: 1192.07,
  organes: 1220.13,
  fin: 1249.37,
  cadeau: 1253.43,
  liens: 1260.73,
  sansSite: 1264.37,
  unLien: 1300.25,
  partie2: 1304.65,
  augmenterCpm: 1316.73,
  paypalWebmoney: 1328.83,
  outro: 1364.75,
  ngl: 1370.77,
  captures: 1380.75,
  merci: 1388.81,
};

/** Partie « preuves » insérée après coup (scripts/splicevoice.mjs → public/formation-adsterra/splice.json). */
const SPLICE = { at: 1126.05, start: 1126.4, shift: 252.8 };
/** Repères finaux : tout ce qui suit l'insertion est décalé. */
const T = Object.fromEntries(
  Object.entries(T0).map(([k, v]) => [k, typeof v === "number" && v >= SPLICE.at ? v + SPLICE.shift : v]),
) as typeof T0;

/** Scène = séquence entre deux repères ; `r(s)` convertit une seconde absolue en frame relative. */
const Scene: React.FC<{ from: number; to: number; dark?: boolean; children: (r: (s: number) => number) => React.ReactNode }> = ({ from, to, dark, children }) => (
  <Sequence from={f(from)} durationInFrames={Math.max(1, f(to) - f(from))}>
    <Backdrop dark={dark} />
    {children((s) => f(s) - f(from))}
  </Sequence>
);

const big = (size: number, color: string = C.ink): React.CSSProperties => ({ fontFamily: font, fontWeight: 900, fontSize: size, color, letterSpacing: -1, lineHeight: 1.05 });
const body = (size: number, color: string = C.text): React.CSSProperties => ({ fontFamily: font, fontWeight: 700, fontSize: size, color, lineHeight: 1.25 });

// ─── Intro ──────────────────────────────────────────────────────────────────────────────

const MODULES = ["Présentation d'Adsterra", "Créer son compte", "Les retraits", "Les pièges à éviter"];

const Intro: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const titleOut = prog(frame, r(3.2), 14, EASE_IN_OUT);
  return (
    <>
      <AbsoluteFill style={{ opacity: 1 - titleOut, transform: `scale(${1 + titleOut * 0.08})` }}>
        <Backdrop dark />
        <div style={{ position: "absolute", left: 140, top: 330 }}>
          <Reveal at={2}>
            <Kicker>Formation complète</Kicker>
          </Reveal>
          <Reveal at={6}>
            <div style={{ ...big(150, C.white), marginTop: 10 }}>
              Adsterra<span style={{ color: C.red }}>.</span>
            </div>
          </Reveal>
          <Reveal at={12}>
            <div style={{ ...body(46, "#c9c9cf"), marginTop: 18 }}>Gagne de l'argent en affichant des publicités sur ton site</div>
          </Reveal>
        </div>
      </AbsoluteFill>
      {frame >= r(3.2) && (
        <>
          <Reveal at={r(3.4)} style={{ position: "absolute", left: 120, top: 150 }}>
            <Kicker>Au programme</Kicker>
            <div style={big(72)}>4 modules</div>
          </Reveal>
          <div style={{ position: "absolute", left: 120, right: 120, top: 360, display: "flex", gap: 34 }}>
            {MODULES.map((m, i) => (
              <Reveal key={m} at={r(T.modules[i])} style={{ flex: 1 }}>
                <Card accent={C.red} style={{ height: 300 }}>
                  <div style={big(110, C.red)}>{i + 1}</div>
                  <div style={{ ...body(40, C.ink), fontWeight: 800, marginTop: 20 }}>{m}</div>
                </Card>
              </Reveal>
            ))}
          </div>
          <Reveal at={r(T.surprise)} style={{ position: "absolute", left: 120, top: 720 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 30px", background: C.ink, borderRadius: 20 }}>
              <Icon name="gift" size={54} />
              <div style={body(36, C.white)}>+ une surprise à la fin</div>
            </div>
          </Reveal>
        </>
      )}
    </>
  );
};

// ─── Module 1 ───────────────────────────────────────────────────────────────────────────

const Definition: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const flow = prog(frame, r(T.editeurs) + 20, 30, EASE_IN_OUT);
  const node = (title: string, sub: string, at: number, x: number, color: string, icon: "money" | "users") => (
    <Reveal at={at} style={{ position: "absolute", left: x, top: 470, width: 440 }}>
      <Card style={{ textAlign: "center", padding: "30px 30px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Icon name={icon} size={70} color={color} />
        </div>
        <div style={{ ...big(48, color), marginTop: 10 }}>{title}</div>
        <div style={{ ...body(28, C.muted), marginTop: 10 }}>{sub}</div>
      </Card>
    </Reveal>
  );
  return (
    <>
      <SceneTitle kicker="Module 1" title="Adsterra, c'est quoi ?" at={r(T.quoi)} />
      <Reveal at={r(T.fonde)} style={{ position: "absolute", left: 120, top: 290 }}>
        <div style={body(40, C.text)}>
          Un <b style={{ color: C.red }}>réseau publicitaire mondial</b>, fondé en <b>2013</b>
        </div>
      </Reveal>
      {node("Annonceurs", "Entreprises qui veulent de la visibilité", r(T.annonceurs), 120, C.ink, "money")}
      <Reveal at={r(T.annonceurs) + 10} scale style={{ position: "absolute", left: 790, top: 520 }}>
        <div style={{ width: 340, height: 220, borderRadius: 110, background: C.red, display: "flex", alignItems: "center", justifyContent: "center", ...big(54, C.white) }}>
          Adsterra
        </div>
      </Reveal>
      {node("Éditeurs", "Toi et moi : on affiche leurs pubs", r(T.editeurs), 1360, C.red, "users")}
      {frame >= r(T.editeurs) + 20 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <marker id="ah" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
              <path d="M0 0 L10 5 L0 10 Z" fill={C.ink} />
            </marker>
          </defs>
          <path d={`M565 630 L${565 + 215 * flow} 630`} stroke={C.ink} strokeWidth={6} markerEnd="url(#ah)" />
          <path d={`M1135 630 L${1135 + 215 * flow} 630`} stroke={C.ink} strokeWidth={6} markerEnd="url(#ah)" />
          <text x={672} y={605} textAnchor="middle" style={{ ...body(24, C.muted) }} opacity={flow}>
            paient pour les pubs
          </text>
          <text x={1243} y={605} textAnchor="middle" style={{ ...body(24, C.muted) }} opacity={flow}>
            te reverse de l'argent
          </text>
        </svg>
      )}
    </>
  );
};

/** Analogie du panneau publicitaire : route, voitures, panneau, propriétaire, entreprises… puis correspondances. */
const Billboard: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const swap = (at: number) => frame >= r(at);
  const label = (text: string, alt: string, at: number, x: number, y: number) => {
    const s = swap(at);
    const p = s ? prog(frame, r(at), 10) : 0;
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, 0) scale(${s ? 0.9 + p * 0.1 : 1})`,
          padding: "10px 22px",
          borderRadius: 14,
          background: s ? C.red : C.white,
          color: s ? C.white : C.ink,
          border: `3px solid ${s ? C.red : C.ink}`,
          ...body(28, s ? C.white : C.ink),
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {s ? alt : text}
      </div>
    );
  };
  const posterColors = ["#ffcc00", "#00a1de", "#1e2b6f", "#e3262b"];
  const poster = frame >= r(T.affiches) ? posterColors[Math.floor((frame - r(T.affiches)) / 75) % posterColors.length] : null;
  return (
    <>
      <SceneTitle kicker="L'analogie du panneau" title="Comment ça marche, concrètement" at={4} />
      {/* Route + voitures */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, height: 110, background: "#3a3a3f" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 51, height: 8, backgroundImage: "repeating-linear-gradient(90deg, #fff 0 60px, transparent 60px 120px)", backgroundPositionX: -frame * 6 }} />
      </div>
      {[0, 1, 2, 3, 4].map((i) => {
        const x = ((frame * (7 + (i % 2) * 2) + i * 430) % 2300) - 200;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: i % 2 ? 812 : 858, width: 120, height: 40, borderRadius: 12, background: ["#e3262b", "#ffffff", "#1fa463", "#ffcc00", "#3d7bff"][i], border: "3px solid #111" }} />
        );
      })}
      {label("Les voitures", "Ton trafic (visiteurs)", T.trafic, 1640, 720)}
      {/* Panneau */}
      <Reveal at={r(T.panneaux)} style={{ position: "absolute", left: 560, top: 270 }}>
        <div style={{ position: "relative", width: 640, height: 530 }}>
          <div style={{ position: "absolute", left: 300, top: 330, width: 40, height: 200, background: "#555" }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 640,
              height: 340,
              borderRadius: 18,
              border: "12px solid #2b2b2f",
              background: poster ?? "#e9e9ec",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {poster ? (
              <div style={{ textAlign: "center", ...big(64, poster === "#ffcc00" ? C.ink : C.white) }}>
                TA MARQUE
                <div style={body(32, poster === "#ffcc00" ? C.ink : C.white)}>ici, vue par des milliers de passants</div>
              </div>
            ) : (
              <div style={body(34, C.muted)}>Espace à louer</div>
            )}
          </div>
        </div>
      </Reveal>
      {frame >= r(T.panneaux) && label("Le panneau", "Ton site internet", T.site, 880, 230)}
      {frame >= r(T.affiches) && label("L'affiche", "Les publicités", T.pubs, 880, 545)}
      {/* Propriétaire */}
      <Reveal at={r(T.appartiennent)} style={{ position: "absolute", left: 200, top: 470 }}>
        <svg width={180} height={330} viewBox="0 0 180 330">
          <circle cx={90} cy={60} r={48} fill="#f1d3b3" stroke="#111" strokeWidth={6} />
          <path d="M30 330 L30 180 C30 120 150 120 150 180 L150 330" fill={swap(T.toi) ? C.red : "#ddd"} stroke="#111" strokeWidth={6} />
        </svg>
      </Reveal>
      {frame >= r(T.appartiennent) && label("Le propriétaire", "TOI", T.toi, 290, 420)}
      {/* Entreprises */}
      {[0, 1, 2].map((i) => (
        <Reveal key={i} at={r(T.louent) + i * 6} dx={60} dy={0} style={{ position: "absolute", left: 1400, top: 300 + i * 140 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", borderRadius: 18, background: C.white, border: `3px solid ${C.ink}` }}>
            <div style={{ width: 54, height: 54, borderRadius: 12, background: posterColors[i] }} />
            <div style={body(30, C.ink)}>Entreprise {String.fromCharCode(65 + i)}</div>
          </div>
        </Reveal>
      ))}
      {frame >= r(T.louent) && label("Les entreprises", "Les annonceurs", T.annonceurs2, 1560, 230)}
      {/* Loyer : billets de l'entreprise vers le propriétaire */}
      {frame >= r(T.payer) &&
        [0, 1, 2].map((i) => {
          const p = prog(frame, r(T.payer) + i * 10, 40, EASE_IN_OUT);
          if (p <= 0 || p >= 1) return null;
          return (
            <div key={i} style={{ position: "absolute", left: interpolate(p, [0, 1], [1400, 320]), top: 380 - Math.sin(p * Math.PI) * 140 }}>
              <Icon name="money" size={70} color={C.green} />
            </div>
          );
        })}
      <Reveal at={r(T.contactent)} out={r(T.toi) - 4} style={{ position: "absolute", left: 1240, top: 760 }}>
        <div style={{ padding: "12px 22px", borderRadius: 14, background: C.ink, ...body(28, C.white) }}>« On loue ton panneau, on te paie »</div>
      </Reveal>
      <Reveal at={r(T.compris)} scale style={{ position: "absolute", left: 120, top: 260 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", borderRadius: 999, background: C.green, ...body(32, C.white) }}>
          <Icon name="check" size={40} color={C.white} /> Tu as compris Adsterra
        </div>
      </Reveal>
    </>
  );
};

const Equation: React.FC<{ at: number; impressions: number; cpm: number; resAt: number; y: number; color?: string }> = ({ at, impressions, cpm, resAt, y, color = C.ink }) => {
  const frame = useCurrentFrame();
  const res = (impressions / 1000) * cpm;
  return (
    <Reveal at={at} style={{ position: "absolute", left: 120, right: 120, top: y }}>
      <Card style={{ display: "flex", alignItems: "center", gap: 30, padding: "26px 40px" }}>
        <div style={big(60, color)}>
          <Count to={impressions} at={at + 4} dur={20} />
        </div>
        <div style={big(56, C.muted)}>÷ 1 000 ×</div>
        <div style={big(60, color)}>{cpm} $</div>
        <div style={big(56, C.muted)}>=</div>
        {frame >= resAt && (
          <div style={{ padding: "6px 26px", borderRadius: 16, background: C.green, ...big(64, C.white) }}>
            <Count to={res} at={resAt} dur={14} suffix=" $" />
          </div>
        )}
        <div style={{ marginLeft: "auto", ...body(26, C.muted) }}>par jour</div>
      </Card>
    </Reveal>
  );
};

const Cpm: React.FC<{ r: (s: number) => number }> = ({ r }) => (
  <>
    <SceneTitle kicker="Comment tu es payé" title="2 indicateurs à connaître" at={r(T.indicateurs) - 300} />
    <div style={{ position: "absolute", left: 120, right: 120, top: 290, display: "flex", gap: 34 }}>
      <Reveal at={r(T.cpmDef)} style={{ flex: 1 }}>
        <Card accent={C.red}>
          <div style={big(64, C.red)}>CPM</div>
          <div style={{ ...body(32), marginTop: 8 }}>Ce que tu gagnes pour <b>1 000 affichages</b> de la pub</div>
        </Card>
      </Reveal>
      <Reveal at={r(T.impressions)} style={{ flex: 1 }}>
        <Card accent={C.ink}>
          <div style={big(64)}>Impressions</div>
          <div style={{ ...body(32), marginTop: 8 }}>Le nombre de fois où la pub a été <b>vue</b></div>
        </Card>
      </Reveal>
    </div>
    <Reveal at={r(T.formule)} style={{ position: "absolute", left: 120, right: 120, top: 560 }}>
      <div style={{ padding: "22px 36px", borderRadius: 20, background: C.ink, ...big(46, C.white) }}>
        Revenu = Impressions <span style={{ color: "#ff6b6f" }}>÷ 1 000</span> × CPM
      </div>
    </Reveal>
    <Equation at={r(T.ex1)} impressions={10000} cpm={2} resAt={r(T.ex1Res)} y={680} />
    <Equation at={r(T.ex2)} impressions={15000} cpm={6} resAt={r(T.ex2Res)} y={810} />
  </>
);

const CpmVaries: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const chartOut = r(T.facteurs) - 4;
  const pts = Array.from({ length: 40 }, (_, i) => `${120 + i * 43},${560 - Math.sin(i * 0.7 + frame * 0.05) * 60 - Math.sin(i * 0.23) * 50}`).join(" ");
  const bar = (label: string, cpmTxt: string, value: number, max: number, at: number, resAt: number, y: number, color: string) => {
    const w = interpolate(frame, [resAt, resAt + 20], [0, (value / max) * 900], { ...clamp, easing: EASE_OUT });
    return (
      <Reveal at={at} style={{ position: "absolute", left: 120, top: y, width: 1680 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ width: 360 }}>
            <div style={big(44)}>{label}</div>
            <div style={body(28, C.muted)}>{cpmTxt}</div>
          </div>
          <div style={{ height: 70, width: Math.max(4, w), borderRadius: 14, background: color }} />
          {frame >= resAt && <div style={big(56, color)}>{value} $</div>}
        </div>
      </Reveal>
    );
  };
  const chip = (t: string, at: number, high: boolean) => (
    <Reveal key={t} at={at} scale>
      <div style={{ padding: "14px 28px", borderRadius: 999, background: high ? C.green : "#d6d6db", ...body(32, high ? C.white : C.ink) }}>{t}</div>
    </Reveal>
  );
  return (
    <>
      <SceneTitle kicker="Le CPM" title="Ton CPM change tout le temps" at={4} />
      {frame < chartOut + 10 && (
        <Reveal at={6} out={chartOut} style={{ position: "absolute", inset: 0 }}>
          <svg width={1920} height={1080}>
            <polyline points={pts} fill="none" stroke={C.red} strokeWidth={8} strokeLinejoin="round" />
          </svg>
          <div style={{ position: "absolute", left: 120, top: 720, ...body(34, C.muted) }}>Le matin ≠ le soir · aujourd'hui ≠ demain</div>
        </Reveal>
      )}
      {frame >= r(T.facteurs) && frame < r(T.theme) && (
        <>
          <Reveal at={r(T.facteurs)} style={{ position: "absolute", left: 120, top: 290 }}>
            <Kicker color={C.muted}>Facteur 1 · le pays des visiteurs</Kicker>
            <div style={{ ...body(30, C.muted), marginTop: 6 }}>Exemple : 10 000 impressions dans la journée</div>
          </Reveal>
          {bar("États-Unis / Canada", "CPM jusqu'à 15–25 $", 250, 250, r(T.usa), r(T.usaRes), 430, C.green)}
          {bar("Afrique", "CPM ≈ 2 $", 20, 250, r(T.afrique), r(T.afriqueRes), 600, C.red)}
        </>
      )}
      {frame >= r(T.theme) && frame < r(T.africain) && (
        <>
          <Reveal at={r(T.theme)} style={{ position: "absolute", left: 120, top: 290 }}>
            <Kicker color={C.muted}>Facteur 2 · le thème de ton site</Kicker>
          </Reveal>
          <div style={{ position: "absolute", left: 120, top: 400 }}>
            <div style={{ ...body(30, C.muted), marginBottom: 16 }}>CPM plus faible</div>
            <div style={{ display: "flex", gap: 20 }}>
              {chip("Football", r(T.foot), false)}
              {chip("Blagues", r(T.foot) + 60, false)}
              {chip("Films & mangas", r(T.mangas), false)}
            </div>
          </div>
          <div style={{ position: "absolute", left: 120, top: 600 }}>
            <div style={{ ...body(30, C.muted), marginBottom: 16 }}>CPM plus élevé</div>
            <div style={{ display: "flex", gap: 20 }}>
              {chip("Business", r(T.business), true)}
              {chip("Finance", r(T.finance), true)}
              {chip("Technologie", r(T.finance) + 20, true)}
            </div>
          </div>
        </>
      )}
      {frame >= r(T.africain) && (
        <>
          <Reveal at={r(T.africain)} style={{ position: "absolute", left: 120, top: 290 }}>
            <Kicker color={C.muted}>L'avantage du trafic africain</Kicker>
            <div style={{ ...big(56), marginTop: 10 }}>Beaucoup plus de monde à toucher</div>
            <div style={{ ...body(32, C.muted), marginTop: 10 }}>Le volume comble une bonne partie de l'écart de CPM</div>
          </Reveal>
          <div style={{ position: "absolute", left: 120, top: 560, display: "flex", flexWrap: "wrap", width: 1680, gap: 18 }}>
            {Array.from({ length: 48 }, (_, i) => (
              <Reveal key={i} at={r(T.africain) + 10 + i} scale>
                <Icon name="users" size={58} color={i % 5 ? C.ink : C.red} />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </>
  );
};

const Why: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const row = (name: string, need: string, at: number, ok: boolean) => (
    <Reveal at={at} dx={-40} dy={0}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 30px", borderRadius: 20, background: ok ? C.ink : C.white, border: `2px solid ${ok ? C.ink : C.line}` }}>
        <Icon name={ok ? "check" : "cross"} size={50} color={ok ? C.green : C.red} />
        <div style={{ width: 340, ...big(42, ok ? C.white : C.ink) }}>{name}</div>
        <div style={body(32, ok ? "#d8d8dc" : C.muted)}>{need}</div>
      </div>
    </Reveal>
  );
  return (
    <>
      <SceneTitle kicker="Pourquoi c'est une opportunité en or" title="Argument 1 · tu commences avec 0 F" at={r(T.arg1) - 120} />
      <div style={{ position: "absolute", left: 120, right: 120, top: 300, display: "flex", flexDirection: "column", gap: 20 }}>
        {row("Adsterra", "0 F pour commencer, rien à recharger", r(T.arg1), true)}
        {row("E-commerce", "Acheter du stock, payer la pub", r(T.ecommerce), false)}
        {row("Trading", "Capital de départ, recharger si tu perds", r(T.trading), false)}
        {row("Paris sportifs", "Dépôt initial obligatoire", r(T.paris), false)}
      </div>
    </>
  );
};

const YouTube: React.FC<{ r: (s: number) => number; len: number }> = ({ r, len }) => (
  <>
    <ScreenRec src="formation-adsterra/rec-youtube.mp4" url="youtube.com — recherche « adsterra »" width={1380} top={110} len={len} shots={[{ at: r(T.yt), from: 0, to: 25 }]} />
    <Callout at={0} out={r(T.yt) + 60} x={1300} y={160} width={520} title="Argument 2">
      Personne n'en parle en Afrique francophone
    </Callout>
    <Callout at={r(T.gars)} out={r(T.seuls) - 6} x={1340} y={560} width={500} tone="dark">
      Un Africain… mais anglophone
    </Callout>
    <Callout at={r(T.seuls)} x={1340} y={560} width={500} tone="dark">
      Nigérians, Indiens, Français, Vietnamiens…
    </Callout>
  </>
);

const Saturation: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const row = (name: string, fill: number, at: number, color: string) => {
    const w = interpolate(frame, [at, at + 24], [0, fill], { ...clamp, easing: EASE_OUT });
    return (
      <Reveal at={at}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ width: 360, ...big(42) }}>{name}</div>
          <div style={{ flex: 1, height: 60, borderRadius: 14, background: "#e6e6ea", overflow: "hidden" }}>
            <div style={{ width: `${w * 100}%`, height: "100%", background: color, display: "flex", alignItems: "center", paddingLeft: 20, ...body(26, C.white) }}>
              {fill > 0.5 && w > 0.4 ? "saturé" : ""}
            </div>
          </div>
        </div>
      </Reveal>
    );
  };
  return (
    <>
      <SceneTitle kicker="Concurrence" title="Un marché pas encore saturé" at={4} />
      <div style={{ position: "absolute", left: 120, right: 120, top: 320, display: "flex", flexDirection: "column", gap: 34 }}>
        {row("E-commerce", 0.96, r(T.ecommerce2), "#8a8a92")}
        {row("Trading", 0.92, r(T.trading2), "#8a8a92")}
        {row("Paris sportifs", 0.9, r(T.paris2), "#8a8a92")}
        {row("Adsterra", 0.08, r(T.adsterra2), C.red)}
      </div>
      <Reveal at={r(T.pasSature)} scale style={{ position: "absolute", left: 120, top: 780 }}>
        <div style={{ padding: "14px 30px", borderRadius: 999, background: C.green, ...body(36, C.white) }}>De la place pour tout le monde</div>
      </Reveal>
    </>
  );
};

const Friend: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const steps: [string, string, number, number][] = [
    ["1ʳᵉ semaine", "≈ 25 $ / semaine", r(T.sem1), 0.18],
    ["Ensuite", "10 à 30 $ / jour", r(T.jour), 0.45],
    ["Puis", "90 à 100 $ / jour", r(T.cent), 1],
  ];
  return (
    <>
      <SceneTitle kicker="Témoignage" title="Un ami à qui j'ai montré la méthode" at={4} />
      <div style={{ position: "absolute", left: 160, right: 160, top: 300, height: 520, display: "flex", alignItems: "flex-end", gap: 60 }}>
        {steps.map(([a, b, at, h]) => (
          <Reveal key={a} at={at} style={{ flex: 1 }} dy={60}>
            <div style={{ ...body(30, C.muted), textAlign: "center" }}>{a}</div>
            <div style={{ ...big(44, C.ink), textAlign: "center", margin: "8px 0 16px" }}>{b}</div>
            <div style={{ height: 380 * h, borderRadius: "18px 18px 0 0", background: h === 1 ? C.red : C.ink }} />
          </Reveal>
        ))}
      </div>
    </>
  );
};

const Stock: React.FC<{ r: (s: number) => number }> = ({ r }) => (
  <>
    <SceneTitle kicker="Argument 3" title="Pas de capital, pas de stock" at={4} />
    <Reveal at={r(T.produit)} style={{ position: "absolute", left: 120, top: 300, width: 800 }}>
      <Card accent="#8a8a92">
        <div style={big(46)}>E-commerce</div>
        {["Il achète un produit", "Il paie la pub Facebook", "Rien ne se vend : le stock reste", "Il finit par l'offrir en bonus"].map((t, i) => (
          <Reveal key={t} at={[r(T.produit), r(497), r(502), r(T.bonus)][i]} dy={10}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, ...body(32) }}>
              <Icon name="cross" size={36} /> {t}
            </div>
          </Reveal>
        ))}
      </Card>
    </Reveal>
    <Reveal at={r(T.stock)} style={{ position: "absolute", left: 1000, top: 300, width: 800 }}>
      <Card accent={C.red}>
        <div style={big(46, C.red)}>Adsterra</div>
        {["Aucun stock à écouler", "Aucun client à convaincre", "Tu mets le système en place, c'est tout"].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, ...body(32) }}>
            <Icon name="check" size={36} color={C.green} /> {t}
          </div>
        ))}
      </Card>
    </Reveal>
  </>
);

const Gear: React.FC<{ size: number; spin: number; color: string }> = ({ size, spin, color }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ transform: `rotate(${spin}deg)` }}>
    {Array.from({ length: 10 }, (_, i) => (
      <rect key={i} x={-7} y={-48} width={14} height={18} rx={3} fill={color} transform={`rotate(${i * 36})`} />
    ))}
    <circle r={34} fill={color} />
    <circle r={13} fill={C.bg} />
  </svg>
);

const Machine: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const spin = frame * 1.5;
  return (
    <>
      <SceneTitle kicker="Une fois la machine lancée" title="Au début tu travailles… ensuite tu encaisses" at={4} />
      <Reveal at={r(T.lancee)} style={{ position: "absolute", left: 140, top: 330 }}>
        <div style={{ position: "relative", width: 420, height: 400 }}>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <Gear size={260} spin={spin} color={C.red} />
          </div>
          <div style={{ position: "absolute", left: 210, top: 190 }}>
            <Gear size={190} spin={-spin * 1.37 + 18} color={C.ink} />
          </div>
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 700, top: 320, width: 1080, display: "flex", flexDirection: "column", gap: 22 }}>
        <Reveal at={r(T.rien)}>
          <Card style={{ padding: "22px 30px" }}>
            <div style={body(34)}>
              <b>Au début :</b> tu dois être actif, vraiment actif
            </div>
          </Card>
        </Reveal>
        <Reveal at={r(T.rien) + 150}>
          <Card style={{ padding: "22px 30px" }}>
            <div style={body(34)}>
              <b>Ensuite :</b> tu vérifies juste tes gains chaque jour
            </div>
          </Card>
        </Reveal>
        <Reveal at={r(T.etudiant)}>
          <Card style={{ padding: "22px 30px" }} accent={C.red}>
            <div style={body(34)}>
              <b>Étudiant ?</b> Un complément de revenu à côté des cours
            </div>
          </Card>
        </Reveal>
      </div>
      <Reveal at={r(T.amis)} out={r(T.etudiant) - 4} style={{ position: "absolute", left: 1300, top: 700 }}>
        <div style={{ padding: "16px 26px", borderRadius: 18, background: C.green, ...big(46, C.white) }}>+10 $ aujourd'hui</div>
      </Reveal>
      <Reveal at={r(T.argentTravaille)} style={{ position: "absolute", left: 120, right: 120, top: 760 }}>
        <div style={{ ...big(50, C.ink), borderLeft: `10px solid ${C.red}`, paddingLeft: 30 }}>« Il faut que l'argent travaille pour nous. »</div>
      </Reveal>
      <Reveal at={r(T.mine)} scale style={{ position: "absolute", left: 120, top: 860 }}>
        <div style={{ padding: "12px 28px", borderRadius: 999, background: C.red, ...body(32, C.white) }}>Une mine d'or encore inexploitée en Afrique</div>
      </Reveal>
    </>
  );
};

// ─── Modules 2 et 3 : enregistrements d'écran ─────────────────────────────────────────

const shotsAt = (r: (s: number) => number, list: [number, number, number, [number, number, number]?][]): Shot[] =>
  list.map(([at, from, to, focus]) => ({ at: r(at), from, to, focus }));

const Signup: React.FC<{ r: (s: number) => number; len: number }> = ({ r, len }) => (
  <>
    <ScreenRec
      src="formation-adsterra/rec-inscription.mp4"
      url="adsterra.com"
      len={len}
      shots={shotsAt(r, [
        [645.4, 0, 12],
        [652.5, 12, 17, [0.5, 0.36, 1.5]],
        [657.3, 22, 27],
        [660.0, 27, 41, [0.5, 0.6, 1.45]],
        [686.9, 41, 51, [0.62, 0.6, 1.7]],
        [688.7, 51, 56],
        [695.5, 56, 70, [0.33, 0.4, 1.55]],
        [702.15, 70, 88, [0.33, 0.4, 1.55]],
        [722.75, 88, 96, [0.33, 0.4, 1.55]],
        [732.29, 96, 105, [0.3, 0.5, 1.45]],
        [742.83, 105, 114, [0.3, 0.5, 1.45]],
        [747.11, 114, 140, [0.3, 0.55, 1.4]],
        [774.95, 140, 158, [0.3, 0.62, 1.45]],
      ])}
    />
    <Callout at={r(683.0)} out={r(688.7)} x={1360} y={640} width={480} title="Nous">
      On s'inscrit en tant qu'éditeur
    </Callout>
    <Callout at={r(T.identite)} out={r(T.seulCompte) - 4} x={1360} y={640} width={480} title="Important">
      Ton vrai nom, comme sur ta pièce d'identité
    </Callout>
    <Callout at={r(T.seulCompte)} out={r(722.0)} x={1360} y={640} width={480} title="Attention">
      Un seul compte par personne, sinon bannissement
    </Callout>
    <Callout at={r(T.messenger)} out={r(747.0)} x={1360} y={640} width={480} title="Messenger" tone="dark">
      Choisis WhatsApp et mets ton numéro
    </Callout>
    <Callout at={r(T.cocher)} x={1360} y={640} width={480} tone="dark">
      Coche la case, puis « S'inscrire »
    </Callout>
  </>
);

const Dashboard: React.FC<{ r: (s: number) => number; len: number }> = ({ r, len }) => (
  <>
    <ScreenRec
      src="formation-adsterra/rec-tableau.mp4"
      url="beta.publishers.adsterra.com"
      len={len}
      shots={shotsAt(r, [
        [783.21, 0, 6],
        [795.79, 6, 12, [0.18, 0.4, 1.6]],
        [799.15, 12, 24],
        [812.69, 24, 33],
        [822.13, 33, 36, [0.63, 0.5, 1.45]],
        [824.85, 36, 44, [0.63, 0.45, 1.6]],
        [833.29, 44, 51, [0.63, 0.55, 1.55]],
        [840.25, 51, 58, [0.63, 0.6, 1.55]],
        [844.27, 58, 63],
        [851.29, 63, 72],
        [856.73, 72, 87],
        [864.73, 87, 90, [0.55, 0.75, 1.4]],
        [871.83, 90, 102, [0.5, 0.55, 1.35]],
        [891.53, 105, 126, [0.45, 0.55, 1.35]],
        [918.3, 129, 138],
        [919.3, 138, 150, [0.5, 0.6, 1.35]],
        [931.1, 150, 171],
      ])}
    />
    <Callout at={r(T.popunder)} out={r(851.0)} x={1360} y={640} width={480} title="Conseil">
      Le format PopUnder rapporte énormément
    </Callout>
    <Callout at={r(T.getCode) + 60} out={r(T.addUnit) - 4} x={1360} y={640} width={480} title="Get code">
      Copie le code et colle-le sur ton site
    </Callout>
    <Callout at={r(T.addUnit) + 150} out={r(918.0)} x={1360} y={640} width={480} title="À savoir" tone="dark">
      Un seul bloc par format de pub
    </Callout>
    <Callout at={r(T.smartlink)} x={1360} y={640} width={480} title="Smartlinks" tone="dark">
      Gagner sans site internet (on en parle à la fin)
    </Callout>
  </>
);

const Payment: React.FC<{ r: (s: number) => number; len: number }> = ({ r, len }) => {
  const frame = useCurrentFrame();
  const tableOn = frame >= r(T.minimums) && frame < r(T.ajouterInfos);
  const rows: [string, string, number][] = [
    ["WebMoney", "5 $", T.webmoney5],
    ["Paxum", "5 $", T.paxum5],
    ["PayPal", "25 $", T.paypal25],
    ["Tether / Bitcoin", "100 $", T.crypto100],
    ["Virement bancaire", "1 000 $", T.virement1000],
  ];
  return (
    <>
      <div style={{ filter: tableOn ? "blur(6px)" : undefined, opacity: tableOn ? 0.5 : 1 }}>
        <ScreenRec
          src="formation-adsterra/rec-paiement.mp4"
          url="beta.publishers.adsterra.com/payout-information"
          len={len}
          shots={shotsAt(r, [
            [T.pay, 0, 9],
            [T.ajouterInfos, 9, 15, [0.33, 0.4, 1.45]],
            [1030.08, 12, 21, [0.33, 0.5, 1.45]],
            [1041.0, 21, 33, [0.33, 0.62, 1.45]],
            [1054.16, 33, 48, [0.33, 0.5, 1.35]],
            [1073.0, 48, 62, [0.33, 0.6, 1.35]],
          ])}
        />
      </div>
      {tableOn && (
        <div style={{ position: "absolute", left: 460, top: 200, width: 1000 }}>
          <Reveal at={r(T.minimums)}>
            <Card>
              <Kicker>Minimums de retrait</Kicker>
              {rows.map(([n, v, at]) => (
                <Reveal key={n} at={r(at)} dx={-30} dy={0}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 0", borderBottom: `2px solid ${C.line}`, ...body(40) }}>
                    <span>{n}</span>
                    <b style={{ color: C.red }}>{v}</b>
                  </div>
                </Reveal>
              ))}
            </Card>
          </Reveal>
        </div>
      )}
    </>
  );
};

const Calendar: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const pay = [1, 2, 16, 17];
  const on = frame >= r(T.jours);
  return (
    <>
      <SceneTitle kicker="Paiements" title="Automatiques, toutes les 2 semaines" at={r(T.auto)} />
      <Reveal at={r(T.auto) + 20} style={{ position: "absolute", left: 120, top: 320, width: 820 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={big(44)}>{frame >= r(T.octobre) ? "Octobre" : "Chaque mois"}</div>
            <Icon name="calendar" size={54} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginTop: 20 }}>
            {days.map((d) => {
              const hit = on && pay.includes(d);
              return (
                <div key={d} style={{ height: 70, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: hit ? C.red : "#f0f0f2", ...body(30, hit ? C.white : C.text) }}>
                  {d}
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>
      <div style={{ position: "absolute", left: 1020, top: 330, width: 780, display: "flex", flexDirection: "column", gap: 24 }}>
        <Reveal at={r(T.auto) + 10}>
          <Card style={{ padding: "24px 30px" }}>
            <div style={body(34)}>Ce n'est <b>pas toi</b> qui lances le retrait</div>
          </Card>
        </Reveal>
        <Reveal at={r(T.jours)}>
          <Card style={{ padding: "24px 30px" }} accent={C.red}>
            <div style={body(34)}>
              Paiement le <b>1er–2</b> et le <b>16–17</b> du mois
            </div>
          </Card>
        </Reveal>
        <Reveal at={r(T.octobre) + 90}>
          <Card style={{ padding: "24px 30px" }}>
            <div style={body(34)}>Il faut avoir atteint le <b>minimum de retrait</b></div>
          </Card>
        </Reveal>
      </div>
    </>
  );
};

// ─── Preuves : mes résultats et ceux des personnes formées ─────────────────────────────

const PR = (n: string) => `formation-adsterra/preuves/${n}.jpg`;
const IMG = { x: 90, y: 110, w: 1200, h: 820 };
const SIDE = 1340;

const Proofs: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const q = (p: number) => r(SPLICE.start + p);
  // Plans : [début, fin) en secondes de la partie insérée
  const shot = (from: number, to: number, el: (a: number, b: number) => React.ReactNode) => (frame >= q(from) - 2 && frame < q(to) + 8 ? el(q(from), q(to)) : null);
  const photo = (n: string, ratio: number, a: number, b: number, zooms: [number, [number, number, number]][] = []) => (
    <Photo src={PR(n)} ratio={ratio} at={a} out={b} {...IMG} zooms={zooms} />
  );
  const note = (at: number, out: number, y: number, title: string, text: string, tone: "red" | "dark" = "red") => (
    <Callout at={at} out={out} x={SIDE} y={y} width={500} title={title} tone={tone}>
      {text}
    </Callout>
  );
  const students: [string, number][] = [
    ["08", 0.802],
    ["03", 1.094],
    ["13", 1.851],
    ["04", 0.844],
    ["11", 0.595],
    ["01", 0.545],
    ["02", 0.964],
  ];
  return (
    <>
      {/* Titre de la partie */}
      {frame < q(3.2) + 8 && (
        <Reveal at={0} out={q(3.2)} style={{ position: "absolute", inset: 0 }}>
          <AbsoluteFill style={{ background: C.dark, justifyContent: "center", paddingLeft: 140 }}>
            <Kicker>Preuves</Kicker>
            <div style={{ ...big(96, C.white), marginTop: 12 }}>Mes résultats</div>
            <div style={{ ...big(96, C.red) }}>et ceux de mes élèves</div>
          </AbsoluteFill>
        </Reveal>
      )}
      {/* Mon compte : solde, gains, retraits */}
      {shot(3.2, 33.4, (a, b) => (
        <>
          {photo("09", 1.822, a, b, [[q(5), [0.7, 0.14, 2.2]], [q(29.2), [0.5, 0.5, 1]]])}
          {note(q(3.4), b, 200, "Reste à retirer", "574,45 $")}
          {note(q(10.28), b, 380, "Gagné au total", "6 081 $")}
          {note(q(13.0), b, 560, "Déjà retiré", "5 506 $", "dark")}
          {note(q(29.22), b, 740, "Rythme", "Un retrait toutes les 2 semaines", "dark")}
        </>
      ))}
      {shot(33.4, 47.9, (a, b) => (
        <>
          {photo("12", 1.874, a, b, [[q(38), [0.32, 0.85, 1.9]]])}
          {note(q(41.12), b, 300, "Dernier retrait · 1er octobre", "820,49 $ par PayPal")}
        </>
      ))}
      {shot(47.9, 59.8, (a, b) => (
        <>
          {photo("05", 2.218, a, b, [[q(49), [0.55, 0.5, 1.25]]])}
          {note(q(48.5), b, 300, "Mail PayPal · 1er octobre", "820,49 $ reçus")}
        </>
      ))}
      {shot(59.8, 70.5, (a, b) => (
        <>
          {photo("10", 2.222, a, b, [[q(61), [0.55, 0.5, 1.25]]])}
          {note(q(61.62), b, 300, "Mail PayPal · 16 septembre", "692,56 $ reçus")}
        </>
      ))}
      {shot(70.5, 96.1, (a, b) => (
        <>
          {photo("06", 1.792, a, b, [[q(76), [0.3, 0.75, 1.7]]])}
          {note(q(72), b, 260, "Compte Ecobank", "Retrait par virement bancaire", "dark")}
          {note(q(78.6), b, 440, "Ce jour-là", "≈ 1 800 $ reçus")}
        </>
      ))}
      {shot(96.1, 106.6, () => (
        <>
          <Reveal at={q(96.3)} style={{ position: "absolute", left: 120, top: 330 }}>
            <Kicker>Retours</Kicker>
            <div style={{ ...big(84), marginTop: 10 }}>Les personnes que j'ai formées</div>
            <div style={{ ...body(38, C.muted), marginTop: 18 }}>Leurs captures, envoyées sur WhatsApp</div>
          </Reveal>
        </>
      ))}
      {shot(106.6, 123.9, (a, b) => (
        <>
          {photo("08", 0.802, a, b, [[q(115), [0.6, 0.6, 1.35]]])}
          {note(q(108.94), b, 300, "En 5 jours", "50,18 $")}
          {note(q(116.94), b, 480, "D'un jour à l'autre", "De 2,59 $ à 21,74 $ / jour", "dark")}
        </>
      ))}
      {shot(123.9, 143.7, (a, b) => (
        <>
          {photo("03", 1.094, a, b, [[q(136), [0.85, 0.5, 1.5]]])}
          {note(q(123.94), b, 300, "En 5 jours", "132,99 $")}
          {note(q(131.2), b, 480, "CPM", "Environ 2 à 3 $", "dark")}
        </>
      ))}
      {shot(143.7, 156.3, (a, b) => (
        <>
          {photo("13", 1.851, a, b)}
          {note(q(152.08), b, 300, "Notification PayPal", "94,46 $ reçus")}
        </>
      ))}
      {shot(156.3, 162.8, (a, b) => (
        <>
          {photo("04", 0.844, a, b)}
          {note(q(156.6), b, 300, "Solde PayPal", "52,42 $")}
        </>
      ))}
      {shot(162.8, 181.6, (a, b) => (
        <>
          {photo("11", 0.595, a, b)}
          {note(q(164.5), b, 300, "Au total", "≈ 477 $ reçus")}
          {note(q(170.02), b, 480, "Fonds suspendus", "250 $ bloqués le temps d'une vérification", "dark")}
        </>
      ))}
      {shot(181.6, 186.0, (a, b) => (
        <>
          {photo("01", 0.545, a, b)}
          {note(q(181.62), b, 300, "1ʳᵉ semaine", "135,78 $ reçus")}
        </>
      ))}
      {shot(186.0, 192.5, (a, b) => (
        <>
          {photo("02", 0.964, a, b)}
          {note(q(186.0), b, 300, "1er octobre", "122,43 $ reçus")}
        </>
      ))}
      {/* Mur de captures */}
      {shot(192.5, 209.5, () => (
        <>
          {students.map(([n, ratio], i) => (
            <Photo key={n} src={PR(n)} ratio={ratio} at={q(192.5) + i * 6} x={60 + (i % 4) * 455} y={i < 4 ? 100 : 520} w={430} h={400} />
          ))}
          <Reveal at={q(201.4)} scale style={{ position: "absolute", left: 1420, top: 640 }}>
            <div style={{ padding: "16px 28px", borderRadius: 20, background: C.red, ...big(40, C.white) }}>Plein de retours positifs</div>
          </Reveal>
        </>
      ))}
      {/* Retirer sur Mobile Money */}
      {shot(209.5, 260, () => (
        <>
          <Reveal at={q(209.7)} style={{ position: "absolute", left: 120, top: 130 }}>
            <Kicker>Tu t'inquiètes pour le retrait ?</Kicker>
            <div style={{ ...big(66), marginTop: 8 }}>PayPal → Mobile Money, c'est possible</div>
          </Reveal>
          <div style={{ position: "absolute", left: 120, top: 360, display: "flex", alignItems: "center", gap: 30 }}>
            {[
              ["Adsterra", "te paie", q(217.4)],
              ["PayPal", "reçoit l'argent", q(217.4) + 20],
              ["Mobile Money", "tu retires et tu dépenses", q(217.4) + 40],
            ].map(([t, sub, at], i) => (
              <div key={t as string} style={{ display: "flex", alignItems: "center", gap: 30 }}>
                <Reveal at={at as number} scale>
                  <Card accent={i === 2 ? C.green : C.red} style={{ width: 300, textAlign: "center", padding: "26px 20px" }}>
                    <div style={big(42)}>{t}</div>
                    <div style={{ ...body(26, C.muted), marginTop: 8 }}>{sub}</div>
                  </Card>
                </Reveal>
                {i < 2 && (
                  <Reveal at={(at as number) + 10}>
                    <div style={big(60, C.red)}>→</div>
                  </Reveal>
                )}
              </div>
            ))}
          </div>
          <Reveal at={q(233.88)} style={{ position: "absolute", left: 120, top: 640, display: "flex", alignItems: "center", gap: 26 }}>
            <Flag name="togo" width={170} />
            <div style={body(36)}>
              Au Togo, où PayPal n'est pas éligible :<br />
              <b>reçu, retiré et dépensé.</b>
            </div>
          </Reveal>
          <Photo src={PR("07")} ratio={0.558} at={q(237.04)} x={1350} y={120} w={480} h={800} />
          <Reveal at={q(247.42)} scale style={{ position: "absolute", left: 120, top: 830 }}>
            <div style={{ padding: "14px 32px", borderRadius: 999, background: C.green, ...big(40, C.white) }}>N'hésite pas à te lancer</div>
          </Reveal>
        </>
      ))}
    </>
  );
};

// ─── Module 4 et fin ──────────────────────────────────────────────────────────────────

const Traps: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const cards: [string, string, "click" | "robot" | "users", number, number, boolean][] = [
    ["Ne clique jamais sur tes propres pubs", "Adsterra le détecte et te bannit", "click", r(T.trap1), r(T.trap2), false],
    ["N'achète jamais de trafic robot", "Détecteurs de bots : bannissement et argent perdu", "robot", r(T.trap2), r(T.trap3), false],
    ["Privilégie le trafic humain", "De vrais visiteurs : pub, contenus, partages", "users", r(T.trap3), 1e9, true],
  ];
  return (
    <>
      <SceneTitle kicker="Module 4" title="Les 3 pièges à éviter" at={4} />
      <div style={{ position: "absolute", left: 120, right: 120, top: 300, display: "flex", gap: 34 }}>
        {cards.map(([t, s, icon, at, until, good], i) => {
          const active = frame >= at && frame < until;
          return (
            <Reveal key={t} at={at} style={{ flex: 1 }}>
              <div style={{ transform: `scale(${active ? 1.03 : 0.97})`, opacity: active ? 1 : 0.6, transition: "none" }}>
                <Card accent={good ? C.green : C.red} style={{ height: 470 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={big(90, good ? C.green : C.red)}>{i + 1}</div>
                    <Icon name={icon} size={84} color={good ? C.green : C.red} />
                  </div>
                  <div style={{ ...big(44), marginTop: 20 }}>{t}</div>
                  <div style={{ ...body(30, C.muted), marginTop: 16 }}>{s}</div>
                </Card>
              </div>
            </Reveal>
          );
        })}
      </div>
      <Reveal at={r(T.organes)} scale style={{ position: "absolute", left: 120, top: 830 }}>
        <div style={{ padding: "12px 26px", borderRadius: 999, background: C.ink, ...body(30, C.white) }}>Trafic humain = de vrais visiteurs (rien à voir avec un trafic d'organes !)</div>
      </Reveal>
    </>
  );
};

const Bonus: React.FC<{ r: (s: number) => number }> = ({ r }) => {
  const frame = useCurrentFrame();
  const part2 = frame >= r(T.partie2);
  return (
    <>
      {!part2 && (
        <>
          <SceneTitle kicker="Le cadeau" title="Les Smartlinks (liens directs)" at={r(T.cadeau)} />
          <Reveal at={r(T.sansSite)} style={{ position: "absolute", left: 120, top: 300 }}>
            <div style={body(40)}>
              Gagner de l'argent <b style={{ color: C.red }}>sans créer de site internet</b>
            </div>
          </Reveal>
          <div style={{ position: "absolute", left: 120, right: 120, top: 420, display: "flex", alignItems: "center", gap: 30 }}>
            {[
              ["link", "Tu crées un lien"],
              ["users", "Tu le partages"],
              ["money", "Tu gagnes de l'argent"],
            ].map(([ic, t], i) => (
              <Reveal key={t} at={r(T.unLien) - 160 + i * 40} style={{ flex: 1 }}>
                <Card style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Icon name={ic as "link"} size={90} />
                  </div>
                  <div style={{ ...big(40), marginTop: 14 }}>{t}</div>
                </Card>
              </Reveal>
            ))}
          </div>
        </>
      )}
      {part2 && (
        <>
          <SceneTitle kicker="La suite" title="Partie 2 de la formation" at={r(T.partie2)} />
          <Reveal at={r(T.partie2) + 10} style={{ position: "absolute", left: 120, top: 290 }}>
            <div style={body(36, C.muted)}>Le lien t'est envoyé dans la chaîne</div>
          </Reveal>
          <div style={{ position: "absolute", left: 120, top: 390, width: 1100, display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              ["Gagner avec les liens directs", r(T.partie2) + 40],
              ["Augmenter son CPM", r(T.augmenterCpm)],
              ["Retirer son argent avec PayPal ou WebMoney", r(T.paypalWebmoney)],
            ].map(([t, at]) => (
              <Reveal key={t as string} at={at as number} dx={-40} dy={0}>
                <Card style={{ padding: "24px 32px", display: "flex", alignItems: "center", gap: 20 }}>
                  <Icon name="check" size={46} color={C.green} />
                  <div style={body(38)}>{t}</div>
                </Card>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </>
  );
};

const Outro: React.FC<{ r: (s: number) => number }> = ({ r }) => (
  <>
    <div style={{ position: "absolute", left: 140, top: 300 }}>
      <Reveal at={6}>
        <Kicker>Fin de la formation</Kicker>
      </Reveal>
      <Reveal at={14}>
        <div style={{ ...big(110, C.white), marginTop: 10 }}>Des questions ?</div>
      </Reveal>
      <Reveal at={r(T.ngl)}>
        <div style={{ ...body(44, "#d0d0d5"), marginTop: 26 }}>Pose-les via le lien NGL dans la chaîne</div>
      </Reveal>
      <Reveal at={r(T.captures)}>
        <div style={{ ...body(44, "#d0d0d5"), marginTop: 14 }}>Je réponds en vocal à vos questions</div>
      </Reveal>
      <Reveal at={r(T.merci)}>
        <div style={{ ...big(64, C.red), marginTop: 50 }}>Merci, et à très vite !</div>
      </Reveal>
    </div>
  </>
);

// ─── Composition ──────────────────────────────────────────────────────────────────────

const KEYWORDS = /^(Adsterra|CPM|PopUnder|Smart|Smartlinks?|PayPal|Webmoney|WebMoney|Paxum|éditeur|annonceurs?|impressions?|robots?|bannir|\d[\d\s.,]*|dollars?)[.,!?…:;]*$/i;

export const FormationAdsterra: React.FC<VideoProps> = ({ slug, timing }) => {
  const { durationInFrames } = useVideoConfig();
  if (!timing) return null;
  const end = timing.duration;
  const scenes: [number, number, React.FC<{ r: (s: number) => number; len: number }>, boolean?][] = [
    [0, T.def, Intro, false],
    [T.def, T.board, Definition],
    [T.board, T.cpm, Billboard],
    [T.cpm, T.varie, Cpm],
    [T.varie, T.why, CpmVaries],
    [T.why, T.arg2, Why],
    [T.arg2, T.sature, YouTube],
    [T.sature, T.ami, Saturation],
    [T.ami, T.capital, Friend],
    [T.capital, T.machine, Stock],
    [T.machine, T.signup, Machine],
    [T.signup, T.dash, Signup],
    [T.dash, T.pay, Dashboard],
    [T.pay, T.payouts, Payment],
    [T.payouts, T.auto, ({ r, len }) => <ScreenRec src="formation-adsterra/rec-retraits.mp4" url="beta.publishers.adsterra.com/payouts" len={len} shots={[{ at: r(T.payouts), from: 0, to: 20 }]} />],
    [T.auto, SPLICE.at, Calendar],
    [SPLICE.at, SPLICE.at + SPLICE.shift, Proofs],
    [SPLICE.at + SPLICE.shift, T.traps, Calendar],
    [T.traps, T.fin, Traps],
    [T.fin, T.outro, Bonus],
    [T.outro, end + 1, Outro, true],
  ];
  const chapters: [number, number, string][] = [
    [T.ch1, 1, MODULES[0]],
    [T.ch2, 2, MODULES[1]],
    [T.ch3, 3, MODULES[2]],
    [T.ch4, 4, MODULES[3]],
  ];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      <Audio src={staticFile(`${slug}/music.mp3`)} loop volume={(fr) => interpolate(fr, [0, 30, durationInFrames - 60, durationInFrames], [0, 0.045, 0.045, 0], clamp)} />
      {scenes.map(([a, b, Comp, dark], i) => (
        <Scene key={i} from={a} to={b} dark={dark ?? (i === 0)}>
          {(r) => <Comp r={r} len={f(b) - f(a)} />}
        </Scene>
      ))}
      <Sequence from={f(T.ch1)} durationInFrames={f(end) - f(T.ch1)} layout="none">
        <TopBar
          title="Formation Adsterra"
          modules={[
            { label: "Présentation", from: 0, to: f(T.ch2) - f(T.ch1) },
            { label: "Créer son compte", from: f(T.ch2) - f(T.ch1), to: f(T.ch3) - f(T.ch1) },
            { label: "Retraits", from: f(T.ch3) - f(T.ch1), to: f(T.ch4) - f(T.ch1) },
            { label: "Pièges à éviter", from: f(T.ch4) - f(T.ch1), to: f(T.fin) - f(T.ch1) },
          ]}
        />
      </Sequence>
      {chapters.map(([at, n, title]) => (
        <Sequence key={n} from={f(at)} durationInFrames={f(4)}>
          <ChapterCard n={n} title={title} len={f(4)} />
        </Sequence>
      ))}
      <Subtitles words={timing.words} keywords={KEYWORDS} />
    </AbsoluteFill>
  );
};
