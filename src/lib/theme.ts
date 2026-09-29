import { loadFont } from "@remotion/google-fonts/InterTight";

export const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Zone sûre TikTok : rien d'important sous SAFE_BOTTOM (UI description/boutons). */
export const SAFE_BOTTOM = 1560;

export const theme = {
  bg: "#0b0b0c",
  surface: "#161618",
  line: "#2a2a2e",
  text: "#f5f3ee",
  muted: "#8a8a90",
  accent: "#ff5b22",
  ink: "#0b0b0c",
};
