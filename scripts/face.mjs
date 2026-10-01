// Génère une tête expressive à partir d'une vraie photo (kie.ai nano-banana-edit), détourée sur fond transparent.
// Usage : npm run face -- <slug> <nom> "<expression en anglais>" --ref <photo.png>
// Écrit  public/<slug>/<nom>.png (tête détourée, recadrée) + public/<slug>/<nom>-raw.png (original généré)
// La photo de référence est envoyée une fois sur le stockage temporaire de kie.ai (URL gardée dans public/<slug>/.ref-url).
import fs from "node:fs";
import path from "node:path";
import { cutout } from "./cutout.mjs";
import { env, root } from "./env.mjs";

const args = process.argv.slice(2);
const [slug, name, expression] = args;
const refIdx = args.indexOf("--ref");
if (!slug || !name || !expression) {
  console.error('Usage : npm run face -- <slug> <nom> "<expression>" --ref <photo.png>');
  process.exit(1);
}
const outDir = path.join(root, "public", slug);
fs.mkdirSync(outDir, { recursive: true });
const headers = { Authorization: `Bearer ${env.KIE_API_KEY}`, "Content-Type": "application/json" };

// 1. URL publique de la photo de référence (réutilisée tant qu'elle est en cache)
const cache = path.join(outDir, ".ref-url");
let refUrl = fs.existsSync(cache) && refIdx < 0 ? fs.readFileSync(cache, "utf8").trim() : "";
if (!refUrl) {
  if (refIdx < 0) {
    console.error("Première fois : passer --ref <photo.png>");
    process.exit(1);
  }
  const file = path.resolve(args[refIdx + 1]);
  const up = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
    method: "POST",
    headers,
    body: JSON.stringify({
      base64Data: `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`,
      uploadPath: "motiontik",
      fileName: `${slug}-ref.png`,
    }),
  }).then((r) => r.json());
  if (!up.success) {
    console.error("Envoi de la photo :", JSON.stringify(up));
    process.exit(1);
  }
  refUrl = up.data.downloadUrl;
  fs.writeFileSync(cache, refUrl);
}

// 2. Édition : même personne, nouvelle expression, tête seule sur fond blanc
const prompt =
  `Same person as in the photo, same face, same skin tone, same haircut, keep his identity exactly. ` +
  `New facial expression: ${expression}. Exaggerated, expressive, funny, ideal for a TikTok meme reaction. ` +
  `Show ONLY a floating head: cut cleanly just below the chin with a very short neck, NO shoulders, NO clothes, NO body. ` +
  `Head centered and filling most of the frame. Photorealistic, sharp studio lighting. ` +
  `Isolated on a pure flat white background (#FFFFFF), no shadow, no text.`;
const API = "https://api.kie.ai/api/v1/jobs";
const create = await fetch(`${API}/createTask`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: "google/nano-banana-edit",
    input: { prompt, image_urls: [refUrl], output_format: "png", image_size: "1:1" },
  }),
}).then((r) => r.json());
if (create.code !== 200) {
  console.error("kie.ai :", JSON.stringify(create));
  process.exit(1);
}
const taskId = create.data.taskId;
process.stdout.write(`${name} … tâche ${taskId}`);

let result;
for (let i = 0; i < 90; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const info = await fetch(`${API}/recordInfo?taskId=${taskId}`, { headers }).then((r) => r.json());
  const state = info.data?.state;
  if (state === "success") {
    result = JSON.parse(info.data.resultJson);
    break;
  }
  if (state === "fail") {
    console.error(`\nÉchec kie.ai : ${info.data.failMsg || JSON.stringify(info.data)}`);
    process.exit(1);
  }
  process.stdout.write(".");
}
if (!result) {
  console.error("\nDélai dépassé, voir https://kie.ai/logs");
  process.exit(1);
}

// 3. Téléchargement + détourage (le blanc relié aux bords devient transparent)
const buf = Buffer.from(await (await fetch(result.resultUrls[0])).arrayBuffer());
const out = path.join(outDir, `${name}.png`);
fs.writeFileSync(path.join(outDir, `${name}-raw.png`), buf);
fs.writeFileSync(out, buf);
cutout(out);
console.log(`\n✔ ${path.relative(root, out)}`);
