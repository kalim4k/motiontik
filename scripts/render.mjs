// Rend une vidéo en MP4 : npm run render -- <slug> [--hq] [--low-mem] [--out <fichier>]
// --hq      active le motion blur (beaucoup plus lent).
// --low-mem un seul Chrome à la fois (plus lent, mais évite les plantages quand la RAM manque).
// --out     nom du fichier (utile si l'ancienne vidéo est ouverte dans un lecteur : Windows la verrouille).
import { execSync } from "node:child_process";

const [slug, ...flags] = process.argv.slice(2);
if (!slug) {
  console.error("Usage : npm run render -- <slug> [--hq] [--low-mem] [--out <fichier>]");
  process.exit(1);
}
const hq = flags.includes("--hq");
const outIdx = flags.indexOf("--out");
const out = outIdx > -1 ? flags[outIdx + 1] : `out/${slug}${hq ? "-hq" : ""}.mp4`;
const opts = [
  "--codec h264",
  "--crf 18",
  // Marge pour les images lourdes (vidéos de gameplay) sur une machine chargée
  "--timeout=120000",
  "--offthreadvideo-cache-size-in-bytes=268435456",
  hq ? `--props="{\\"blur\\":5}"` : "",
  flags.includes("--low-mem") ? "--concurrency=1" : "",
].filter(Boolean);
execSync(`npx remotion render src/index.ts ${slug} ${out} ${opts.join(" ")}`, { stdio: "inherit" });
