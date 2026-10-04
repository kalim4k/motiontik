// Nettoie une voix enregistrée : raccourcit les blancs, coupe des passages (faux départs), débruite et normalise.
// Usage : npm run cleanaudio -- <slug> <audio source> [--cut 320.8-328.75 --cut ...] [--max-gap 0.6] [--threshold -34]
// Écrit  public/<slug>/voice.mp3 et public/<slug>/edl.json : segments gardés [{ src, dst, len }] (secondes),
//        pour convertir un instant de l'audio source en instant de la vidéo (scripts/transcribe.mjs, montage).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { root } from "./env.mjs";

const args = process.argv.slice(2);
const [slug, source] = args;
if (!slug || !source) {
  console.error("Usage : npm run cleanaudio -- <slug> <audio> [--cut a-b ...] [--max-gap 0.6] [--threshold -34]");
  process.exit(1);
}
const opt = (name, def) => (args.includes(name) ? Number(args[args.indexOf(name) + 1]) : def);
const maxGap = opt("--max-gap", 0.6); // durée gardée d'un blanc trop long
const minGap = opt("--min-gap", 0.9); // en dessous, le blanc est laissé tel quel
const threshold = opt("--threshold", -34); // dB : en dessous = silence
const cuts = args
  .map((a, i) => (a === "--cut" ? args[i + 1] : null))
  .filter(Boolean)
  .map((c) => c.split("-").map(Number));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clean-"));
const ff = (a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit", maxBuffer: 1 << 26 });

// 1. Enveloppe d'énergie par tranches de 50 ms
const pcm = path.join(tmp, "a.raw");
ff(["-i", source, "-ac", "1", "-ar", "8000", "-f", "s16le", pcm]);
const buf = fs.readFileSync(pcm);
const win = 400;
const step = win / 8000;
const loud = [];
for (let i = 0; (i + win) * 2 <= buf.length; i += win) {
  let s = 0;
  for (let k = 0; k < win; k++) {
    const v = buf.readInt16LE((i + k) * 2) / 32768;
    s += v * v;
  }
  loud.push(20 * Math.log10(Math.sqrt(s / win) + 1e-9) > threshold);
}
const total = loud.length * step;

// 2. Segments à garder : tout, sauf les coupes manuelles et le surplus des blancs trop longs
let keep = [[0, total]];
const remove = (a, b) => {
  keep = keep.flatMap(([s, e]) => (b <= s || a >= e ? [[s, e]] : [...(a > s ? [[s, a]] : []), ...(b < e ? [[b, e]] : [])]));
};
for (const [a, b] of cuts) remove(a, b);
let run = -1;
for (let i = 0; i <= loud.length; i++) {
  if (i < loud.length && !loud[i]) {
    if (run < 0) run = i;
  } else if (run >= 0) {
    const a = run * step;
    const b = i * step;
    if (b - a > minGap && a > 0) remove(a + maxGap * 0.45, b - maxGap * 0.55);
    run = -1;
  }
}
keep = keep.filter(([s, e]) => e - s > 0.04);

// 3. Montage audio : segments recollés avec micro-fondus (pas de clics), débruitage léger, volume normalisé
const edl = [];
let dst = 0;
for (const [s, e] of keep) {
  edl.push({ src: +s.toFixed(3), dst: +dst.toFixed(3), len: +(e - s).toFixed(3) });
  dst += e - s;
}
const parts = [];
const BATCH = 120;
for (let b = 0; b < keep.length; b += BATCH) {
  const chunk = keep.slice(b, b + BATCH);
  const filter =
    chunk
      .map(([s, e], i) => `[0:a]atrim=${s.toFixed(3)}:${e.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st=${Math.max(0, e - s - 0.012).toFixed(3)}:d=0.012[s${i}]`)
      .join(";") + `;${chunk.map((_, i) => `[s${i}]`).join("")}concat=n=${chunk.length}:v=0:a=1[out]`;
  const out = path.join(tmp, `part${b}.wav`);
  const script = path.join(tmp, `f${b}.txt`);
  fs.writeFileSync(script, filter);
  ff(["-i", source, "-filter_complex_script", script, "-map", "[out]", "-ar", "44100", "-ac", "1", out]);
  parts.push(out);
}
const list = path.join(tmp, "list.txt");
fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
const outDir = path.join(root, "public", slug);
fs.mkdirSync(outDir, { recursive: true });
ff(["-f", "concat", "-safe", "0", "-i", list, "-af", "afftdn=nf=-30,highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "160k", path.join(outDir, "voice.mp3")]);
fs.writeFileSync(path.join(outDir, "edl.json"), JSON.stringify({ source: path.basename(source), duration: +dst.toFixed(3), segments: edl }, null, 1));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✔ ${slug} : ${(total / 60).toFixed(1)} min → ${(dst / 60).toFixed(1)} min (${keep.length} segments, ${cuts.length} coupes manuelles)`);
