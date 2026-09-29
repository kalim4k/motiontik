// Rend quelques images fixes d'une vidéo (un seul bundle) + une planche contact.
// Usage : node scripts/stills.mjs <slug> <frame,frame,...> [dossier]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { root } from "./env.mjs";

const [slug, list, outArg] = process.argv.slice(2);
const frames = list.split(",").map(Number);
const out = outArg ?? path.join(root, "out", "stills", slug);
fs.mkdirSync(out, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, "src", "index.ts") });
const composition = await selectComposition({ serveUrl, id: slug, inputProps: {} });
const files = [];
for (const frame of frames) {
  const file = path.join(out, `f${String(frame).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output: file, scale: 0.5 });
  files.push(file);
}
if (files.length < 2) process.exit(0);
// Planche contact (5 par ligne)
const cols = Math.min(5, files.length);
const rows = Math.ceil(files.length / cols);
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  ...files.flatMap((f) => ["-i", f]),
  "-filter_complex",
  `${files.map((_, i) => `[${i}]scale=360:-1[v${i}]`).join(";")};${files.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${files.length}:layout=${files
    .map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`)
    .join("|")}:fill=white`,
  path.join(out, "sheet.png"),
]);
console.log(`✔ ${files.length} images + planche → ${out} (${rows} lignes)`);
