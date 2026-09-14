import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import AdmZip from "adm-zip";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "src-tauri", "resources", "engines");
fs.mkdirSync(out, { recursive: true });
const platform = process.platform;
const arch = process.arch;
const ext = platform === "win32" ? ".exe" : "";
const executable = (p) => { if (platform !== "win32") fs.chmodSync(p, 0o755); };

// Les releases GitHub renvoient régulièrement des 5xx passagers. Sans attente entre
// les tentatives, les trois essais de tauri-action tombent dans la même minute et le
// build échoue pour une panne qui dure quelques secondes.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function download(url, destination, attempts = 5) {
  console.log(`[engines] ${url}`);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Rushes-Build/1.0" }, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.writeFileSync(destination, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delay = 2000 * 2 ** (attempt - 1);
      console.warn(`[engines] tentative ${attempt}/${attempts} échouée (${error.message}), nouvelle tentative dans ${delay / 1000} s`);
      await wait(delay);
    }
  }
  throw new Error(`Download failed after ${attempts} attempts (${lastError?.message}): ${url}`);
}
async function ensureFile(name, url) {
  const dest = path.join(out, name);
  if (!fs.existsSync(dest) || process.env.RUSHES_REFRESH_ENGINES === "1") await download(url, dest);
  executable(dest); return dest;
}

// FFmpeg/FFprobe are installed as build dependencies and copied into the app bundle.
fs.copyFileSync(ffmpegPath, path.join(out, `ffmpeg${ext}`)); executable(path.join(out, `ffmpeg${ext}`));
fs.copyFileSync(ffprobePath, path.join(out, `ffprobe${ext}`)); executable(path.join(out, `ffprobe${ext}`));

// Official yt-dlp executable: EJS scripts are already bundled in official executables.
let ytdlpAsset;
if (platform === "darwin") ytdlpAsset = "yt-dlp_macos";
else if (platform === "win32") ytdlpAsset = arch === "arm64" ? "yt-dlp_arm64.exe" : "yt-dlp.exe";
else throw new Error(`Unsupported build platform: ${platform}`);
await ensureFile(`yt-dlp${ext}`, `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${ytdlpAsset}`);

// Deno pesait 77 Mo pour ne servir qu'à YouTube : l'application le télécharge
// désormais à la demande (commande install_js_runtime). Poser RUSHES_BUNDLE_DENO=1
// pour le réintégrer au paquet, par exemple pour une distribution hors ligne.
if (process.env.RUSHES_BUNDLE_DENO === "1") {
  const denoTriple = platform === "darwin"
    ? (arch === "arm64" ? "aarch64-apple-darwin" : "x86_64-apple-darwin")
    : (arch === "arm64" ? "aarch64-pc-windows-msvc" : "x86_64-pc-windows-msvc");
  const denoZip = path.join(out, ".deno.zip");
  if (!fs.existsSync(path.join(out, `deno${ext}`)) || process.env.RUSHES_REFRESH_ENGINES === "1") {
    await download(`https://github.com/denoland/deno/releases/latest/download/deno-${denoTriple}.zip`, denoZip);
    const zip = new AdmZip(denoZip); zip.extractAllTo(out, true); fs.rmSync(denoZip, { force: true });
  }
  executable(path.join(out, `deno${ext}`));
}


fs.writeFileSync(path.join(out, "engines.json"), JSON.stringify({ generatedAt: new Date().toISOString(), platform, arch }, null, 2));
console.log(`[engines] Ready in ${out}`);
