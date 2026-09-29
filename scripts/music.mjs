// Génère une musique de fond (ElevenLabs Music) calée sur la durée de la voix.
// Usage : npm run music -- <slug> "<description de la musique>"
// Écrit  public/<slug>/music.mp3
import fs from "node:fs";
import path from "node:path";
import { env, root } from "./env.mjs";

const [slug, prompt = "minimal modern electronic beat, punchy, motivational, no vocals"] =
  process.argv.slice(2);
if (!slug) {
  console.error('Usage : npm run music -- <slug> "<description>"');
  process.exit(1);
}
const { duration } = JSON.parse(
  fs.readFileSync(path.join(root, "public", slug, "timing.json"), "utf8")
);

const res = await fetch("https://api.elevenlabs.io/v1/music", {
  method: "POST",
  headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: `${prompt}, instrumental only`,
    music_length_ms: Math.max(10000, Math.ceil((duration + 2) * 1000)),
  }),
});
if (!res.ok) {
  console.error(`ElevenLabs ${res.status} : ${await res.text()}`);
  process.exit(1);
}
fs.writeFileSync(path.join(root, "public", slug, "music.mp3"), Buffer.from(await res.arrayBuffer()));
console.log(`✔ musique ${slug}`);
