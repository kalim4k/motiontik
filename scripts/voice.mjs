// Génère la voix off d'une vidéo avec ElevenLabs + le timing de chaque mot.
// Usage : npm run voice -- <slug> [--voice <voiceId>] [--flow]
// Lit    videos/<slug>/script.txt
// Écrit  public/<slug>/voice.mp3 et public/<slug>/timing.json
//
// Par défaut : tout le script en une seule requête (rendu préféré par l'utilisateur).
// Option --flow : chaque phrase est générée séparément avec la phrase précédente et la
// suivante en contexte (previous_text / next_text), se termine par une virgule (intonation
// en suspens), et les phrases sont recollées avec un silence exact (config.flow.sentencePause).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { config, env, root } from "./env.mjs";

const args = process.argv.slice(2);
const slug = args[0];
if (!slug) {
  console.error("Usage : npm run voice -- <slug> [--voice <voiceId>] [--flow]");
  process.exit(1);
}
const voiceIdx = args.indexOf("--voice");
const voiceId = voiceIdx > -1 ? args[voiceIdx + 1] : config.defaultVoiceId;
const script = fs.readFileSync(path.join(root, "videos", slug, "script.txt"), "utf8").trim();
const outDir = path.join(root, "public", slug);
fs.mkdirSync(outDir, { recursive: true });

async function tts(text, extra = {}) {
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

let words;
let duration;

if (!args.includes("--flow")) {
  const data = await tts(script);
  fs.writeFileSync(path.join(outDir, "voice.mp3"), Buffer.from(data.audio_base64, "base64"));
  words = groupWords(data.alignment, 0);
  duration = data.alignment.character_end_times_seconds.at(-1);
} else {
  const { sentencePause = 0.45 } = config.flow ?? {};
  const chunks = splitSentences(script);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "voice-"));
  const silence = path.join(tmp, "silence.wav");
  ffmpeg(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(sentencePause), silence]);
  const pause = probeDuration(silence);

  const list = [];
  words = [];
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    const last = i === chunks.length - 1;
    // Virgule à la place du point : la phrase ne « retombe » pas, elle annonce la suite
    const say = last ? chunks[i] : chunks[i].replace(/\.$/, ",");
    const data = await tts(say, {
      previous_text: chunks.slice(Math.max(0, i - 2), i).join(" ") || undefined,
      next_text: chunks[i + 1],
    });
    const mp3 = path.join(tmp, `${i}.mp3`);
    const wav = path.join(tmp, `${i}.wav`);
    fs.writeFileSync(mp3, Buffer.from(data.audio_base64, "base64"));
    // Coupe le silence de fin généré, pour maîtriser exactement la pause entre phrases
    const keep = data.alignment.character_end_times_seconds.at(-1) + (last ? 0.3 : 0.06);
    ffmpeg(["-i", mp3, "-t", keep.toFixed(3), "-ar", "44100", "-ac", "1", wav]);
    words.push(...groupWords(data.alignment, offset));
    list.push(wav);
    // Durée réelle du morceau (peut être plus courte que `keep`), sinon les sous-titres dérivent
    offset += probeDuration(wav);
    if (!last) {
      list.push(silence);
      offset += pause;
    }
  }
  const listFile = path.join(tmp, "list.txt");
  fs.writeFileSync(listFile, list.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
  ffmpeg(["-f", "concat", "-safe", "0", "-i", listFile, "-c:a", "libmp3lame", "-b:a", "128k", path.join(outDir, "voice.mp3")]);
  fs.rmSync(tmp, { recursive: true, force: true });
  duration = offset;
  console.log(`  ${chunks.length} phrases enchaînées, pause ${sentencePause} s`);
}

mergePunctuation(words);
fs.writeFileSync(path.join(outDir, "timing.json"), JSON.stringify({ duration, words }, null, 2));
normalize(path.join(outDir, "voice.mp3"));
console.log(`✔ ${slug} : ${words.length} mots, ${duration.toFixed(2)} s (voix ${voiceId})`);

function ffmpeg(a) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });
}

/** Volume de voix constant d'une voix à l'autre (-15 LUFS, crêtes ≤ -1,5 dB), durée inchangée. */
function normalize(file) {
  const tmp = file.replace(/\.mp3$/, ".norm.mp3");
  ffmpeg(["-i", file, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "128k", tmp]);
  fs.renameSync(tmp, file);
}

function probeDuration(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return Number(String(out).trim());
}

/** Découpe le script en phrases (après . … ? ! ou retour à la ligne). */
function splitSentences(src) {
  return src
    .replace(/\r/g, "")
    .split(/(?<=[.…?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
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
    // Espace fine insécable avant/après la ponctuation double, à la française
    const thin = /^[«»:;!?]/.test(p) ? " " : "";
    if (target) {
      if (opening) target.text = p + thin + target.text;
      else target.text += thin + p;
    }
    list.splice(i, 1);
  }
}
