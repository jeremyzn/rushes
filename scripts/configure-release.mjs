import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = process.env.GITHUB_REPOSITORY || process.env.RUSHES_GITHUB_REPOSITORY;
const pubkey = process.env.TAURI_UPDATER_PUBLIC_KEY;
if (!repo) throw new Error("GITHUB_REPOSITORY / RUSHES_GITHUB_REPOSITORY is missing");
if (!pubkey) throw new Error("TAURI_UPDATER_PUBLIC_KEY is missing");
const config = {
  plugins: {
    updater: {
      active: true,
      dialog: false,
      pubkey,
      endpoints: [`https://github.com/${repo}/releases/latest/download/latest.json`],
      windows: { installMode: "passive" }
    }
  }
};
const out = path.join(root, "src-tauri", "tauri.release.conf.json");
fs.writeFileSync(out, JSON.stringify(config, null, 2) + "\n");
console.log(`[release] updater configured for ${repo}`);
