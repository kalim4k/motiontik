// Génère une illustration (décor / objet) avec kie.ai, dans le style « bonhomme bâton » des vidéos.
// Usage : npm run image -- <slug> <nom> "<description>" [--ratio 1:1] [--raw] [--keep-bg]
// Écrit  public/<slug>/<nom>.png : fond blanc détouré + recadré sur l'objet (sauf --keep-bg),
//        l'original est gardé dans <nom>-raw.png
// Par défaut, la description est complétée par un style commun (illustration plate, fond blanc) ;
// --raw envoie la description telle quelle.
import fs from "node:fs";
import path from "node:path";
import { cutout } from "./cutout.mjs";
import { env, root } from "./env.mjs";

const args = process.argv.slice(2);
const [slug, name, desc] = args;
if (!slug || !name || !desc) {
  console.error('Usage : npm run image -- <slug> <nom> "<description>" [--ratio 1:1] [--raw]');
  process.exit(1);
}
const ratioIdx = args.indexOf("--ratio");
const ratio = ratioIdx > -1 ? args[ratioIdx + 1] : "1:1";

const STYLE =
  "Flat 2D vector illustration for a minimalist stick-figure explainer cartoon. Clean simple shapes, " +
  "soft flat colors, thin dark outlines, no gradients, no shadows on the ground, no people, no text, no logo. " +
  "Isolated on a pure white background (#FFFFFF), centered, full object visible.";
const prompt = args.includes("--raw") ? desc : `${desc}. ${STYLE}`;

const API = "https://api.kie.ai/api/v1/jobs";
const headers = { Authorization: `Bearer ${env.KIE_API_KEY}`, "Content-Type": "application/json" };

const create = await fetch(`${API}/createTask`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: "google/nano-banana",
    input: { prompt, output_format: "png", aspect_ratio: ratio },
  }),
}).then((r) => r.json());
if (create.code !== 200) {
  console.error("kie.ai :", JSON.stringify(create));
  process.exit(1);
}
const taskId = create.data.taskId;
process.stdout.write(`… tâche ${taskId}`);

// Attente du résultat (max ~3 min)
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

const url = result.resultUrls[0];
const outDir = path.join(root, "public", slug);
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${name}.png`);
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
fs.writeFileSync(out, buf);
if (!args.includes("--keep-bg")) {
  fs.writeFileSync(path.join(outDir, `${name}-raw.png`), buf);
  cutout(out);
}
console.log(`\n✔ ${path.relative(root, out)}`);
