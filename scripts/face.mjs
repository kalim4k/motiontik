// Génère une tête expressive à partir d'une vraie photo (kie.ai nano-banana-edit), détourée façon « sticker visage » :
// visage + cheveux + oreilles, coupé net le long de la mâchoire et du menton (sans cou).
// Usage : npm run face -- <slug> <nom> "<expression en anglais>" [--ref <photo.png>]
//         npm run face -- <slug> <nom> --retrim      (refait seulement la coupe du cou sur <nom>-raw.png)
// Écrit  public/<slug>/<nom>.png (visage détouré, recadré) + public/<slug>/<nom>-raw.png (image générée avec cou)
// La photo de référence est envoyée une fois sur le stockage temporaire de kie.ai (URL gardée dans public/<slug>/.ref-url).
import fs from "node:fs";
import path from "node:path";
import { cutout } from "./cutout.mjs";
import { env, root } from "./env.mjs";

const args = process.argv.slice(2);
const [slug, name, expression] = args;
const refIdx = args.indexOf("--ref");
const retrim = args.includes("--retrim");
if (!slug || !name || (!expression && !retrim)) {
  console.error('Usage : npm run face -- <slug> <nom> "<expression>" [--ref <photo.png>] | --retrim');
  process.exit(1);
}
const outDir = path.join(root, "public", slug);
fs.mkdirSync(outDir, { recursive: true });
const headers = { Authorization: `Bearer ${env.KIE_API_KEY}`, "Content-Type": "application/json" };
const API = "https://api.kie.ai/api/v1/jobs";

/** Envoie un fichier local sur le stockage temporaire de kie.ai, renvoie son URL publique. */
async function upload(file, fileName) {
  const up = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
    method: "POST",
    headers,
    body: JSON.stringify({
      base64Data: `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`,
      uploadPath: "motiontik",
      fileName,
    }),
  }).then((r) => r.json());
  if (!up.success) {
    console.error("Envoi de l'image :", JSON.stringify(up));
    process.exit(1);
  }
  return up.data.downloadUrl;
}

/** Édition nano-banana sur `imageUrl`, renvoie l'URL du résultat. */
async function edit(prompt, imageUrl) {
  const create = await fetch(`${API}/createTask`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "google/nano-banana-edit",
      input: { prompt, image_urls: [imageUrl], output_format: "png", image_size: "1:1" },
    }),
  }).then((r) => r.json());
  if (create.code !== 200) {
    console.error("kie.ai :", JSON.stringify(create));
    process.exit(1);
  }
  const taskId = create.data.taskId;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const info = await fetch(`${API}/recordInfo?taskId=${taskId}`, { headers }).then((r) => r.json());
    const state = info.data?.state;
    if (state === "success") return JSON.parse(info.data.resultJson).resultUrls[0];
    if (state === "fail") {
      console.error(`\nÉchec kie.ai : ${info.data.failMsg || JSON.stringify(info.data)}`);
      process.exit(1);
    }
    process.stdout.write(".");
  }
  console.error("\nDélai dépassé, voir https://kie.ai/logs");
  process.exit(1);
}

const download = async (url) => Buffer.from(await (await fetch(url)).arrayBuffer());
const rawFile = path.join(outDir, `${name}-raw.png`);
let rawUrl;
process.stdout.write(`${name} `);

if (retrim) {
  rawUrl = await upload(rawFile, `${slug}-${name}-raw.png`);
} else {
  // 1. URL publique de la photo de référence (réutilisée tant qu'elle est en cache)
  const cache = path.join(outDir, ".ref-url");
  let refUrl = fs.existsSync(cache) && refIdx < 0 ? fs.readFileSync(cache, "utf8").trim() : "";
  if (!refUrl) {
    if (refIdx < 0) {
      console.error("Première fois : passer --ref <photo.png>");
      process.exit(1);
    }
    refUrl = await upload(path.resolve(args[refIdx + 1]), `${slug}-ref.png`);
    fs.writeFileSync(cache, refUrl);
  }
  // 2. Même personne, nouvelle expression, tête seule sur fond blanc
  rawUrl = await edit(
    `Same person as in the photo, same face, same skin tone, same haircut, keep his identity exactly. ` +
      `New facial expression: ${expression}. Exaggerated, expressive, funny, ideal for a TikTok meme reaction. ` +
      `Show ONLY a floating head: cut cleanly just below the chin with a very short neck, NO shoulders, NO clothes, NO body. ` +
      `Head centered and filling most of the frame. Photorealistic, sharp studio lighting. ` +
      `Isolated on a pure flat white background (#FFFFFF), no shadow, no text.`,
    refUrl,
  );
  fs.writeFileSync(rawFile, await download(rawUrl));
}

// 3. Coupe du cou : visage seul, coupé net le long de la mâchoire et du menton
const faceUrl = await edit(
  "Keep this exact face, expression, hair and ears unchanged. The CHIN must be the lowest point of the image: erase " +
    "the neck entirely, including the dark area under the jaw. The face ends exactly at the jawline and the tip of the " +
    "chin, like a paper face mask. Everything below the jaw and chin is pure flat white (#FFFFFF).",
  rawUrl,
);
const out = path.join(outDir, `${name}.png`);
fs.writeFileSync(out, await download(faceUrl));
cutout(out);
console.log(`\n✔ ${path.relative(root, out)}`);
