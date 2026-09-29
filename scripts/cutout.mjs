// Détoure une illustration sur fond blanc : le blanc relié aux bords devient transparent
// (remplissage depuis les bords, donc les zones blanches à l'intérieur de l'objet sont gardées),
// puis l'image est recadrée au plus près de l'objet.
// Usage : node scripts/cutout.mjs <fichier.png> [seuil 0-255, défaut 232]
import fs from "node:fs";
import { PNG } from "pngjs";

export function cutout(file, threshold = 232) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const { width: w, height: h, data } = png;
  const isBg = (i) => data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!isBg(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
  // Adoucit le liseré : pixels presque blancs au contact du fond → semi-transparents
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    const x = p % w;
    const nearBg =
      (x > 0 && data[i - 1] === 0) || (x < w - 1 && data[i + 7] === 0) || (p >= w && data[i - w * 4 + 3] === 0) || (p < w * (h - 1) && data[i + w * 4 + 3] === 0);
    if (nearBg) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (lum > 200) data[i + 3] = Math.round(255 * (1 - (lum - 200) / 55));
    }
  }
  // Recadrage sur l'objet (+ petite marge)
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] > 10) {
      const x = p % w, y = (p / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const m = 4;
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
  const out = new PNG({ width: x1 - x0 + 1, height: y1 - y0 + 1 });
  PNG.bitblt(png, out, x0, y0, out.width, out.height, 0, 0);
  fs.writeFileSync(file, PNG.sync.write(out));
  return { width: out.width, height: out.height };
}

if (process.argv[1] && process.argv[1].endsWith("cutout.mjs")) {
  const [file, thr] = process.argv.slice(2);
  const r = cutout(file, thr ? Number(thr) : undefined);
  console.log(`✔ détouré ${file} (${r.width}×${r.height})`);
}
