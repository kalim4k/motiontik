// Capture d'écran d'une page web publique, pour illustrer une vidéo.
// Usage : npm run capture -- <slug> <nom> "<url>" [--desktop] [--wait <ms>]
// Écrit  public/<slug>/<nom>.png (format téléphone par défaut, 412×915 @2x)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { root } from "./env.mjs";

const args = process.argv.slice(2);
const [slug, name, url] = args;
if (!slug || !name || !url) {
  console.error('Usage : npm run capture -- <slug> <nom> "<url>" [--desktop] [--wait <ms>]');
  process.exit(1);
}
const desktop = args.includes("--desktop");
const waitIdx = args.indexOf("--wait");
const wait = waitIdx > -1 ? args[waitIdx + 1] : "8000";

const chrome = path.join(
  root,
  "node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe"
);
const outDir = path.join(root, "public", slug);
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${name}.png`);

execFileSync(
  chrome,
  [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${desktop ? "1440,900" : "412,915"}`,
    "--force-device-scale-factor=2",
    ...(desktop
      ? []
      : [
          "--user-agent=Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36",
        ]),
    `--virtual-time-budget=${wait}`,
    `--screenshot=${out}`,
    url,
  ],
  { stdio: "ignore", timeout: 90000 }
);
console.log(`✔ ${path.relative(root, out)}`);
