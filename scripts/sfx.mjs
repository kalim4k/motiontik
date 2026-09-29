// Génère la banque de bruitages (ElevenLabs Sound Effects) dans public/sfx/.
// Usage : npm run sfx            -> génère ceux qui manquent
//         npm run sfx -- --force -> régénère tout
import fs from "node:fs";
import path from "node:path";
import { env, root } from "./env.mjs";

const library = {
  whoosh: ["fast clean cinematic whoosh swipe transition, airy, no reverb tail", 0.8],
  whoosh_big: ["powerful deep cinematic swoosh transition with low rumble", 1.2],
  impact: ["deep punchy cinematic impact hit with sub bass boom, short and tight", 1],
  pop: ["short clean satisfying UI pop, bubbly click", 0.5],
  tick: ["rapid digital counter ticking, fast mechanical clicks accelerating", 1.5],
  ding: ["bright positive success chime, clean modern notification", 1],
  riser: ["short tension riser swell building up, cinematic", 1.5],
  glitch: ["short digital glitch stutter sound effect", 0.5],
  typing: ["fast soft smartphone keyboard typing taps", 1.5],
  coin: ["bright coin drop cash register cha-ching, short", 0.8],
  notif: ["short modern phone notification ping", 0.5],
};

const force = process.argv.includes("--force");
const outDir = path.join(root, "public", "sfx");
fs.mkdirSync(outDir, { recursive: true });

for (const [name, [text, duration_seconds]] of Object.entries(library)) {
  const file = path.join(outDir, `${name}.mp3`);
  if (fs.existsSync(file) && !force) continue;
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, duration_seconds, prompt_influence: 0.6 }),
  });
  if (!res.ok) {
    console.error(`✘ ${name} : ${res.status} ${await res.text()}`);
    continue;
  }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`✔ ${name}`);
}
