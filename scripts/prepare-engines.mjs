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

async function download(url, destination) {
  console.log(`[engines] ${url}`);
  const res = await fetch(url, { headers: { "User-Agent": "Rushes-Build/1.0" }, redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  fs.writeFileSync(destination, Buffer.from(await res.arrayBuffer()));
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

// Deno is the recommended JS runtime for full YouTube support in yt-dlp.
const denoTriple = platform === "darwin"
  ? (arch === "arm64" ? "aarch64-apple-darwin" : "x86_64-apple-darwin")
  : (arch === "arm64" ? "aarch64-pc-windows-msvc" : "x86_64-pc-windows-msvc");
const denoZip = path.join(out, ".deno.zip");
if (!fs.existsSync(path.join(out, `deno${ext}`)) || process.env.RUSHES_REFRESH_ENGINES === "1") {
  await download(`https://github.com/denoland/deno/releases/latest/download/deno-${denoTriple}.zip`, denoZip);
  const zip = new AdmZip(denoZip); zip.extractAllTo(out, true); fs.rmSync(denoZip, { force: true });
}
executable(path.join(out, `deno${ext}`));

// TwitchDownloader is bundled for Twitch-specific extras. yt-dlp remains the universal primary engine.
try {
  const release = await fetch("https://api.github.com/repos/lay295/TwitchDownloader/releases/latest", { headers: { "User-Agent": "Rushes-Build/1.0", "Accept": "application/vnd.github+json" } }).then(r => r.json());
  let needle = null;
  if (platform === "darwin") needle = arch === "arm64" ? "MacOSArm64.zip" : "MacOS-x64.zip";
  if (platform === "win32" && arch !== "arm64") needle = "Windows-x64.zip";
  if (needle) {
    const asset = release.assets?.find(a => a.name?.startsWith("TwitchDownloaderCLI-") && a.name.endsWith(needle));
    if (asset) {
      const target = path.join(out, `TwitchDownloaderCLI${ext}`);
      if (!fs.existsSync(target) || process.env.RUSHES_REFRESH_ENGINES === "1") {
        const temp = path.join(out, ".twitchdownloader.zip"); await download(asset.browser_download_url, temp);
        const zip = new AdmZip(temp); const entry = zip.getEntries().find(e => !e.isDirectory && /TwitchDownloaderCLI(\.exe)?$/i.test(e.entryName));
        if (entry) fs.writeFileSync(target, entry.getData()); fs.rmSync(temp, { force: true });
      }
      if (fs.existsSync(target)) executable(target);
    }
  }
} catch (error) { console.warn("[engines] TwitchDownloader optional bundle failed:", error.message); }

fs.writeFileSync(path.join(out, "engines.json"), JSON.stringify({ generatedAt: new Date().toISOString(), platform, arch }, null, 2));
console.log(`[engines] Ready in ${out}`);
