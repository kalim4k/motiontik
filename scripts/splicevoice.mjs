// Insère une voix (et son timing) au milieu de la voix d'une vidéo, en décalant tout ce qui suit.
// Usage : node scripts/splicevoice.mjs <slug> <slug-insert> <instant en s> [--gap 0.35]
// Lit    public/<slug>/voice-main.mp3 + timing-main.json (créés depuis voice.mp3 / timing.json au 1er appel)
//        public/<slug-insert>/voice.mp3 + timing.json
// Écrit  public/<slug>/voice.mp3, timing.json et splice.json { at, start, duration, shift }
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { root } from "./env.mjs";

const args = process.argv.slice(2);
const [slug, insertSlug, atArg] = args;
if (!slug || !insertSlug || !atArg) {
  console.error("Usage : node scripts/splicevoice.mjs <slug> <slug-insert> <instant> [--gap 0.35]");
  process.exit(1);
}
const at = Number(atArg);
const gap = args.includes("--gap") ? Number(args[args.indexOf("--gap") + 1]) : 0.35;
const dir = path.join(root, "public", slug);
const ins = path.join(root, "public", insertSlug);
for (const [from, to] of [
  ["voice.mp3", "voice-main.mp3"],
  ["timing.json", "timing-main.json"],
]) {
  if (!fs.existsSync(path.join(dir, to))) fs.copyFileSync(path.join(dir, from), path.join(dir, to));
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "splice-"));
const ff = (a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });
const dur = (f) => Number(String(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])).trim());
// Tout en WAV pour des durées exactes (pas de bourrage d'encodeur MP3)
const a = path.join(tmp, "a.wav");
const b = path.join(tmp, "b.wav");
const c = path.join(tmp, "c.wav");
const s = path.join(tmp, "s.wav");
ff(["-i", path.join(dir, "voice-main.mp3"), "-t", String(at), "-ar", "44100", "-ac", "1", a]);
ff(["-i", path.join(ins, "voice.mp3"), "-ar", "44100", "-ac", "1", b]);
ff(["-ss", String(at), "-i", path.join(dir, "voice-main.mp3"), "-ar", "44100", "-ac", "1", c]);
ff(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(gap), s]);
const start = dur(a) + dur(s);
const insLen = dur(b);
const shift = insLen + 2 * dur(s);
fs.writeFileSync(path.join(tmp, "list.txt"), [a, s, b, s, c].map((f) => `file '${f}'`).join("\n"));
ff(["-f", "concat", "-safe", "0", "-i", path.join(tmp, "list.txt"), "-c:a", "libmp3lame", "-b:a", "160k", path.join(dir, "voice.mp3")]);
fs.rmSync(tmp, { recursive: true, force: true });

const main = JSON.parse(fs.readFileSync(path.join(dir, "timing-main.json"), "utf8"));
const part = JSON.parse(fs.readFileSync(path.join(ins, "timing.json"), "utf8"));
const mv = (w, d) => ({ ...w, start: +(w.start + d).toFixed(3), end: +(w.end + d).toFixed(3) });
const words = [
  ...main.words.filter((w) => w.start < at),
  ...part.words.map((w) => mv(w, start)),
  ...main.words.filter((w) => w.start >= at).map((w) => mv(w, shift)),
];
fs.writeFileSync(path.join(dir, "timing.json"), JSON.stringify({ duration: +(main.duration + shift).toFixed(3), words }, null, 1));
fs.writeFileSync(path.join(dir, "splice.json"), JSON.stringify({ at, start: +start.toFixed(3), duration: +insLen.toFixed(3), shift: +shift.toFixed(3) }, null, 1));
console.log(`✔ ${slug} : ${insertSlug} inséré à ${at} s (+${shift.toFixed(2)} s), durée ${((main.duration + shift) / 60).toFixed(1)} min`);
