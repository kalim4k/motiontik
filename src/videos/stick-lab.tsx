import { loadFont as loadComicRelief } from "@remotion/google-fonts/ComicRelief";
import { loadFont as loadGaegu } from "@remotion/google-fonts/Gaegu";
import { loadFont as loadMali } from "@remotion/google-fonts/Mali";
import { loadFont as loadShortStack } from "@remotion/google-fonts/ShortStack";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { comicFont, ComicCaptions, Ground, type Expression, type PoseName, StickMan, stick } from "../lib/Stick";

// Planche de réglage du perso et des polices (pas une vidéo) : une image par frame.
const fonts: [string, string, number][] = [
  ["Comic Relief 700", loadComicRelief("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily, 700],
  ["Comic Sans MS (Windows)", "Comic Sans MS", 700],
  ["Comic Neue 700", comicFont, 700],
  ["Gaegu 700", loadGaegu("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily, 700],
  ["Mali 700", loadMali("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily, 700],
  ["Short Stack", loadShortStack("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily, 400],
];

const words = ["PLANTE", "UNE", "ESPÈCE", "VÉGÉTALE", "EN", "VOIE", "DE", "DISPARITION"].map((text, i) => ({
  text,
  start: i * 0.01 - 1,
  end: i * 0.01 - 0.99,
}));

export const StickLab: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame === 0) {
    // Même cadrage que la capture de référence
    return (
      <AbsoluteFill style={{ background: stick.paper }}>
        <ComicCaptions words={words} />
        <StickMan x={785} y={1462} height={740} variant="full" seed={1} />
      </AbsoluteFill>
    );
  }
  if (frame === 1) {
    return (
      <AbsoluteFill style={{ background: "#fff", padding: 60, gap: 40 }}>
        {fonts.map(([label, family, weight]) => (
          <div key={label}>
            <div style={{ fontFamily: "Arial", fontSize: 26, color: "#999" }}>{label}</div>
            <div style={{ fontFamily: family, fontWeight: weight, fontSize: 64, color: stick.ink }}>PLANTE UNE ESPÈCE VÉGÉTALE</div>
          </div>
        ))}
      </AbsoluteFill>
    );
  }
  if (frame === 2) {
    const sheet: [PoseName, Expression][] = [
      ["idle", "neutral"],
      ["point", "smug"],
      ["raise", "surprised"],
      ["think", "neutral"],
      ["shrug", "sad"],
      ["cheer", "happy"],
      ["hips", "angry"],
      ["present", "happy"],
      ["walk", "neutral"],
    ];
    return (
      <AbsoluteFill style={{ background: stick.paper }}>
        {sheet.map(([pose, expr], i) => (
          <StickMan
            key={pose}
            x={200 + (i % 3) * 340}
            y={560 + Math.floor(i / 3) * 620}
            height={440}
            variant="full"
            poses={[[0, pose]]}
            expression={expr}
            seed={1}
          />
        ))}
      </AbsoluteFill>
    );
  }
  const sheet: [PoseName, Expression][] = [
    ["idle", "neutral"],
    ["point", "neutral"],
    ["raise", "happy"],
    ["think", "neutral"],
    ["shrug", "sad"],
    ["cheer", "happy"],
    ["hips", "angry"],
    ["walk", "surprised"],
  ];
  return (
    <AbsoluteFill>
      <Ground horizon={1160} />
      {sheet.map(([pose, expr], i) => (
        <StickMan key={pose} x={120 + i * 120} y={1160} height={300} poses={[[0, pose]]} expression={expr} seed={1} flip={i % 2 === 1} />
      ))}
      <StickMan x={540} y={800} height={560} poses={[[0, "idle"]]} seed={1} />
    </AbsoluteFill>
  );
};
