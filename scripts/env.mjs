import fs from "node:fs";
import path from "node:path";

export const root = path.resolve(import.meta.dirname, "..");

export const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

export const config = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf8"));
