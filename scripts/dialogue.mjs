// Génère une discussion à plusieurs voix (ElevenLabs) + le timing de chaque mot et de chaque réplique.
// Usage : npm run dialogue -- <slug>
// Lit    videos/<slug>/dialogue.txt : une réplique par ligne, « A : texte », « B : texte »…
//        videos/<slug>/voices.json  : { "A": "<voiceId>", "B": "<voiceId>" }
// Écrit  public/<slug>/voice.mp3 et public/<slug>/timing.json
//        (words[].speaker + lines[] = { speaker, start, end, text }, pour animer qui parle)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { config, env, root } from "./env.mjs";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage : npm run dialogue -- <slug>");
  process.exit(1);
}
const dir = path.join(root, "videos", slug);
const voices = JSON.parse(fs.readFileSync(path.join(dir, "voices.json"), "utf8"));
const script = fs
  .readFileSync(path.join(dir, "dialogue.txt"), "utf8")
  .replace(/\r/g, "")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => {
    const m = l.match(/^([A-Z])\s*:\s*(.+)$/);
    if (!m || !voices[m[1]]) throw new Error(`Ligne invalide ou voix inconnue : ${l}`);
    return { speaker: m[1], text: m[2] };
  });

// Silence entre deux répliques : court quand on change de personne (ça s'enchaîne comme une vraie discussion)
const GAP = config.dialogue?.gap ?? 0.18;
const outDir = path.join(root, "public", slug);
fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dialogue-"));
const silence = path.join(tmp, "silence.wav");
ffmpeg(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(GAP), silence]);
const pause = probeDuration(silence);

const list = [];
const words = [];
const lines = [];
let offset = 0;
for (let i = 0; i < script.length; i++) {
  const { speaker, text } = script[i];
  const last = i === script.length - 1;
  // Répliques voisines du même personnage en contexte, pour garder une intonation cohérente
  const same = (j) => script[j] && script[j].speaker === speaker;
  const data = await tts(voices[speaker], text, {
    previous_text: same(i - 2) ? script[i - 2].text : undefined,
    next_text: same(i + 2) ? script[i + 2].text : undefined,
  });
  const mp3 = path.join(tmp, `${i}.mp3`);
  const wav = path.join(tmp, `${i}.wav`);
  fs.writeFileSync(mp3, Buffer.from(data.audio_base64, "base64"));
  const firstChar = data.alignment.character_start_times_seconds.find((_, k) => /\S/.test(data.alignment.characters[k])) ?? 0;
  // Coupe le silence de début et de fin généré, pour maîtriser exactement l'enchaînement
  const from = Math.max(0, firstChar - 0.04);
  const keep = data.alignment.character_end_times_seconds.at(-1) + (last ? 0.3 : 0.06) - from;
  ffmpeg(["-ss", from.toFixed(3), "-i", mp3, "-t", keep.toFixed(3), "-ar", "44100", "-ac", "1", wav]);
  const w = groupWords(data.alignment, offset - from).map((x) => ({ ...x, speaker }));
  words.push(...w);
  const len = probeDuration(wav);
  lines.push({ speaker, start: offset, end: offset + len, text });
  list.push(wav);
  offset += len;
  if (!last) {
    list.push(silence);
    offset += pause;
  }
  console.log(`  ${speaker} : ${text}`);
}
const listFile = path.join(tmp, "list.txt");
fs.writeFileSync(listFile, list.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
ffmpeg(["-f", "concat", "-safe", "0", "-i", listFile, "-c:a", "libmp3lame", "-b:a", "128k", path.join(outDir, "voice.mp3")]);
fs.rmSync(tmp, { recursive: true, force: true });

mergePunctuation(words);
fs.writeFileSync(path.join(outDir, "timing.json"), JSON.stringify({ duration: offset, words, lines }, null, 2));
normalize(path.join(outDir, "voice.mp3"));
console.log(`✔ ${slug} : ${lines.length} répliques, ${words.length} mots, ${offset.toFixed(2)} s`);

async function tts(voiceId, text, extra) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: config.modelId, voice_settings: config.voiceSettings, ...extra }),
    }
  );
  if (!res.ok) {
    console.error(`ElevenLabs ${res.status} : ${await res.text()}`);
    process.exit(1);
  }
  return res.json();
}

function ffmpeg(a) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });
}

/** Volume constant (-15 LUFS, crêtes ≤ -1,5 dB), durée inchangée. */
function normalize(file) {
  const out = file.replace(/\.mp3$/, ".norm.mp3");
  ffmpeg(["-i", file, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "128k", out]);
  fs.renameSync(out, file);
}

function probeDuration(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return Number(String(out).trim());
}

/** Regroupe les caractères alignés en mots, décalés de `offset` secondes. */
function groupWords(alignment, offset) {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
  const out = [];
  let cur = null;
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = { text: "", start: starts[i] + offset, end: ends[i] + offset };
    cur.text += ch;
    cur.end = ends[i] + offset;
  });
  if (cur) out.push(cur);
  return out;
}

/** Rattache la ponctuation isolée (« : », « » », …) au mot voisin, pour les sous-titres. */
function mergePunctuation(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i].text;
    if (/[\p{L}\p{N}]/u.test(p)) continue;
    const opening = /^[«("“]+$/.test(p);
    const target = opening ? list[i + 1] : list[i - 1];
    const thin = /^[«»:;!?]/.test(p) ? " " : "";
    if (target) {
      if (opening) target.text = p + thin + target.text;
      else target.text += thin + p;
    }
    list.splice(i, 1);
  }
}
