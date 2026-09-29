import { evolvePath } from "@remotion/paths";
import { theme } from "./theme";

/** Tracé SVG qui se dessine (progress 0→1). Un seul sous-chemin par `d`. */
export const DrawPath: React.FC<{
  d: string;
  progress: number;
  stroke?: string;
  strokeWidth?: number;
}> = ({ d, progress, stroke = theme.text, strokeWidth = 2 }) => {
  const { strokeDasharray, strokeDashoffset } = evolvePath(Math.max(0.0001, progress), d);
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={strokeDasharray}
      strokeDashoffset={strokeDashoffset}
    />
  );
};

/** Icônes 24×24, chaque entrée = un sous-chemin (pour pouvoir les dessiner). */
export const ICONS: Record<string, string[]> = {
  code: ["M8 7 L3 12 L8 17", "M16 7 L21 12 L16 17", "M14 4 L10 20"],
  design: ["M4 20 L8 19 L19 8 L16 5 L5 16 Z", "M14 7 L17 10"],
  video: ["M3 7 H15 V17 H3 Z", "M15 10.5 L21 7 V17 L15 13.5"],
  chart: ["M4 4 V20 H20", "M7 15 L11 11 L14 14 L20 7"],
  check: ["M7 12.5 L10.5 16 L17 8.5"],
  circle: ["M12 2 A10 10 0 1 1 11.99 2"],
};

/** Téléphone stylisé ; `children` = contenu de l'écran. */
export const Phone: React.FC<{ width?: number; children?: React.ReactNode }> = ({
  width = 400,
  children,
}) => (
  <div
    style={{
      position: "relative",
      width,
      height: width * 2.05,
      borderRadius: width * 0.16,
      padding: width * 0.03,
      background: "linear-gradient(145deg, #2a2a2f, #121214)",
      boxShadow: "0 70px 140px rgba(0,0,0,.7), inset 0 0 0 2px #3a3a40",
    }}
  >
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: width * 0.13,
        background: "#0e0e10",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: width * 0.035,
          left: "50%",
          width: width * 0.3,
          height: width * 0.075,
          marginLeft: -width * 0.15,
          borderRadius: 999,
          background: "#000",
          zIndex: 2,
        }}
      />
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(125deg, rgba(255,255,255,.09) 0%, transparent 35%)",
        }}
      />
    </div>
  </div>
);

/** Fenêtre de navigateur ; `loading` 0→1 = barre de chargement, `badge` à droite de l'URL. */
export const Browser: React.FC<{
  width: number;
  height: number;
  url: string;
  loading?: number;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ width, height, url, loading = 1, badge, children }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 34,
      overflow: "hidden",
      background: "#131315",
      boxShadow: "0 60px 120px rgba(0,0,0,.6), inset 0 0 0 2px #2c2c31",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 24px", background: "#1c1c1f" }}>
      <div style={{ display: "flex", gap: 10 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
        ))}
      </div>
      <div
        style={{
          flex: 1,
          height: 50,
          borderRadius: 25,
          background: "#0e0e10",
          display: "flex",
          alignItems: "center",
          padding: "0 22px",
          fontFamily: "inherit",
          fontSize: 26,
          fontWeight: 700,
          color: theme.text,
        }}
      >
        {url}
      </div>
      {badge}
    </div>
    <div style={{ height: 5, background: "#1c1c1f" }}>
      <div
        style={{
          height: "100%",
          width: `${loading * 100}%`,
          background: theme.accent,
          opacity: loading >= 1 ? 0 : 1,
        }}
      />
    </div>
    <div style={{ position: "relative", flex: 1 }}>{children}</div>
  </div>
);

/** Petit jeu de course animé (le perso saute les obstacles), taille libre. */
export const MiniGame: React.FC<{ width: number; height: number; frame: number }> = ({
  width,
  height,
  frame,
}) => {
  const ground = height * 0.78;
  const speed = width / 38;
  const span = width + 120;
  const obstacles = [0, 0.5].map((o) => width + 40 - ((frame * speed + o * span) % span));
  const heroX = width * 0.18;
  const k = width / 330;
  let jump = 0;
  for (const ox of obstacles) {
    const t = (heroX + 90 * k - ox) / (150 * k);
    if (t > 0 && t < 1) jump = Math.max(jump, Math.sin(t * Math.PI));
  }
  const s = height / 230;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width,
        height,
        overflow: "hidden",
        background: "linear-gradient(180deg, #2a1a4a 0%, #6b2d5c 55%, #ff7a45 100%)",
      }}
    >
      {[0, 1].map((layer) => (
        <div
          key={layer}
          style={{
            position: "absolute",
            left: -((frame * (layer + 1) * 2) % 200),
            bottom: height * 0.22,
            width: width + 400,
            height: height * (0.28 - layer * 0.1),
            background: layer ? "#3a1f4f" : "#2b173d",
            clipPath: "polygon(0 100%, 8% 30%, 18% 80%, 30% 10%, 44% 70%, 56% 25%, 70% 85%, 82% 20%, 94% 60%, 100% 100%)",
          }}
        />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: ground, bottom: 0, background: "#1b0f28" }} />
      {obstacles.map((ox, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: ox,
            top: ground - 44 * s,
            width: 30 * s,
            height: 44 * s,
            borderRadius: 6 * s,
            background: "#ffd23f",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: heroX,
          top: ground - 46 * s - jump * 90 * s,
          width: 46 * s,
          height: 46 * s,
          borderRadius: 12 * s,
          background: theme.accent,
          transform: `rotate(${jump * 180}deg)`,
          boxShadow: `0 0 ${24 * s}px ${theme.accent}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 12 * s,
          right: 16 * s,
          fontSize: 20 * s,
          fontWeight: 900,
          color: "#fff",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(Math.floor(frame * 7)).padStart(5, "0")}
      </div>
    </div>
  );
};
