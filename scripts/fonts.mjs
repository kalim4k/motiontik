// Télécharge les polices Google utilisées par les vidéos dans public/fonts/,
// pour que le rendu n'ait pas besoin d'Internet : npm run fonts
// Ajouter ici toute nouvelle police/graisse chargée via loadLocalFont (src/lib/fonts.ts).
import fs from "node:fs";
import path from "node:path";
import { root } from "./env.mjs";

const fonts = [
  ["InterTight", ["500", "700", "800", "900"], ["latin", "latin-ext"]],
  ["ComicNeue", ["700"], ["latin"]],
  ["ComicRelief", ["700"], ["latin"]],
  ["Gaegu", ["700"], ["latin"]],
  ["Mali", ["700"], ["latin"]],
  ["ShortStack", ["400"], ["latin"]],
];

const dir = path.join(root, "public", "fonts");
fs.mkdirSync(dir, { recursive: true });

for (const [name, weights, subsets] of fonts) {
  const { getInfo } = await import(`@remotion/google-fonts/${name}`);
  const info = getInfo();
  for (const weight of weights) {
    for (const subset of subsets) {
      const url = info.fonts.normal[weight]?.[subset];
      if (!url) throw new Error(`${name} ${weight} ${subset} introuvable`);
      const file = path.join(dir, `${name}-${weight}-${subset}.woff2`);
      if (fs.existsSync(file)) continue;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} : HTTP ${res.status}`);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log(`✓ ${path.relative(root, file)}`);
    }
  }
}
