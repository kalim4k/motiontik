// Transcrit public/<slug>/voice.mp3 (ElevenLabs speech-to-text) en timing.json { duration, words }.
// Les longues voix sont découpées en morceaux (~5 min, coupés aux raccords de public/<slug>/edl.json s'il existe)
// pour garder des timings de mots précis.
// Usage : npm run transcribe -- <slug> [--fix "mauvais=bon" ...]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { env, root } from "./env.mjs";

const args = process.argv.slice(2);
const slug = args[0];
if (!slug) {
  console.error('Usage : npm run transcribe -- <slug> [--fix "mauvais=bon" ...]');
  process.exit(1);
}
const fixes = args
  .map((a, i) => (a === "--fix" ? args[i + 1] : null))
  .filter(Boolean)
  .map((f) => f.split("="));
const dir = path.join(root, "public", slug);
const voice = path.join(dir, "voice.mp3");
const duration = Number(String(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", voice])).trim());

// Points de coupe : raccords de l'EDL les plus proches de chaque multiple de 5 min
const edlFile = path.join(dir, "edl.json");
const joints = fs.existsSync(edlFile) ? JSON.parse(fs.readFileSync(edlFile, "utf8")).segments.map((s) => s.dst) : [];
const bounds = [0];
for (let t = 300; t < duration - 60; t += 300) {
  const near = joints.filter((j) => Math.abs(j - t) < 90).sort((a, b) => Math.abs(a - t) - Math.abs(b - t))[0];
  bounds.push(near ?? t);
}
bounds.push(duration);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stt-"));
const words = [];
for (let i = 0; i < bounds.length - 1; i++) {
  const [a, b] = [bounds[i], bounds[i + 1]];
  const file = path.join(tmp, `${i}.mp3`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(a), "-t", String(b - a), "-i", voice, "-ac", "1", "-b:a", "96k", file]);
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("language_code", "fra");
  form.append("timestamps_granularity", "word");
  form.append("tag_audio_events", "false");
  form.append("file", new Blob([fs.readFileSync(file)]), `${i}.mp3`);
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": env.ELEVENLABS_API_KEY }, body: form });
  if (!res.ok) {
    console.error(`ElevenLabs ${res.status} : ${await res.text()}`);
    process.exit(1);
  }
  const j = await res.json();
  for (const w of j.words) {
    if (w.type !== "word") continue;
    let text = w.text;
    for (const [bad, good] of fixes) text = text.replace(new RegExp(bad, "gi"), good);
    const item = { text, start: +(a + w.start).toFixed(3), end: +(a + w.end).toFixed(3) };
    // Ponctuation isolée rattachée au mot précédent
    if (/^[?!:;»,.]+$/.test(text) && words.length) words[words.length - 1].text += (/[?!:;»]/.test(text) ? " " : "") + text;
    else words.push(item);
  }
  console.log(`  morceau ${i + 1}/${bounds.length - 1} : ${(a / 60).toFixed(1)}–${(b / 60).toFixed(1)} min`);
}
fs.rmSync(tmp, { recursive: true, force: true });
fs.writeFileSync(path.join(dir, "timing.json"), JSON.stringify({ duration: +duration.toFixed(3), words }, null, 1));
console.log(`✔ ${slug} : ${words.length} mots, ${(duration / 60).toFixed(1)} min`);
