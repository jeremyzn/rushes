/*
   Backend de démonstration, navigateur uniquement.

   Rushes télécharge via des moteurs locaux (yt-dlp, FFmpeg) qui
   n'existent pas dans un navigateur. Ce module rejoue la même API
   que le backend Rust afin de pouvoir dessiner et éprouver toute
   l'interface sans compiler l'application de bureau.

   Aucun octet n'est réellement téléchargé : la progression, les
   débits et les erreurs sont simulés à partir du temps écoulé.
   */
import type {
  DownloadRequest, DownloadState, DownloadTask, EngineStatus,
  MediaInfo, NetworkStatus, Provider, Settings,
} from "../types";

const KEY_SETTINGS = "rushes-demo-settings";
const KEY_TASKS = "rushes-demo-tasks";

/* Vignettes
   Générées localement en SVG : la démo reste fonctionnelle hors
   ligne et ne dépend d'aucun service d'images distant. */
export function demoThumbnail(seed: string, label: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const a = 12 + (h % 26);
  const b = a + 16 + ((h >> 8) % 22);
  const angle = (h >> 4) % 360;
  const bars = Array.from({ length: 34 }, (_, i) => {
    const v = ((h >> (i % 12)) % 100) / 100;
    const barHeight = 6 + v * 46;
    return `<rect x="${18 + i * 19}" y="${150 - barHeight}" width="9" height="${barHeight}" rx="4" fill="white" opacity="${0.06 + v * 0.14}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
<defs><linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)">
<stop offset="0" stop-color="hsl(0 0% ${a}%)"/><stop offset="1" stop-color="hsl(0 0% ${b}%)"/></linearGradient></defs>
<rect width="640" height="360" fill="url(#g)"/>
<g transform="translate(0 150)">${bars}</g>
<circle cx="320" cy="180" r="34" fill="white" opacity=".1"/>
<path d="M311 166l24 14-24 14z" fill="white" opacity=".55"/>
<text x="24" y="336" font-family="ui-sans-serif,system-ui" font-size="19" font-weight="600" fill="white" opacity=".5">${escapeXml(label)}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!));

/* Réglages */
const DEFAULT_SETTINGS: Settings = {
  outputDir: "/Users/demo/Movies/Rushes", theme: "system", reducedMotion: false, quality: "best",
  speedProfile: "auto", concurrentDownloads: 2, smartFallback: true,
  downloadThumbnail: true, notifications: true, autoCheckUpdates: true, autoUpdateEngines: false,
  container: "auto", audioFormat: "m4a", cookiesBrowser: "none",
};

function readJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? { ...fallback, ...JSON.parse(raw) } : fallback; }
  catch { return fallback; }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
}

let settings: Settings = readJson(KEY_SETTINGS, DEFAULT_SETTINGS);

/* Catalogue de démonstration */
type Seed = { provider: Provider; title: string; author: string; quality: string; mediaType: DownloadTask["mediaType"]; mb: number };

const SEEDS: Seed[] = [
  { provider: "twitch",  title: "Speedrun Elden Ring : run sans dégâts, segment final", author: "kayzo", quality: "1080p60", mediaType: "vod", mb: 2480 },
  { provider: "youtube", title: "Comment le montage vidéo a changé en dix ans", author: "Studio Fracture", quality: "2160p", mediaType: "video", mb: 1890 },
  { provider: "twitch",  title: "Le clip de la soirée", author: "neeko", quality: "1080p60", mediaType: "clip", mb: 74 },
  { provider: "tiktok",  title: "Transition caméra au ralenti", author: "@luma.films", quality: "1080p", mediaType: "short", mb: 38 },
  { provider: "youtube", title: "Bande originale : session live au studio", author: "Maison Bleue", quality: "Audio", mediaType: "video", mb: 96 },
  { provider: "twitch",  title: "Tournoi régional : demi-finale intégrale", author: "arena_fr", quality: "1080p60", mediaType: "vod", mb: 5310 },
  { provider: "youtube", title: "Retour sur le matériel de tournage 2026", author: "Atelier Optique", quality: "1440p", mediaType: "video", mb: 1240 },
  { provider: "tiktok",  title: "Recette express en trente secondes", author: "@cuisine.rapide", quality: "1080p", mediaType: "short", mb: 22 },
];

const MB = 1024 * 1024;
const uid = () => `demo-${Math.random().toString(36).slice(2, 10)}`;

function seedToTask(seed: Seed, index: number, state: DownloadState, ageMinutes: number): DownloadTask {
  const total = Math.round(seed.mb * MB);
  const done = state === "completed";
  const id = `demo-seed-${index}`;
  return {
    id,
    url: `https://${seed.provider}.com/demo/${index}`,
    provider: seed.provider,
    title: seed.title,
    author: seed.author,
    thumbnail: demoThumbnail(id, seed.author),
    quality: seed.quality,
    mode: seed.quality === "Audio" ? "audio" : "video",
    state,
    progress: done ? 1 : 0,
    speedBps: 0,
    downloadedBytes: done ? total : 0,
    totalBytes: total,
    engine: seed.provider === "twitch" && seed.mediaType === "vod" ? "TwitchDownloaderCLI" : "yt-dlp",
    error: state === "error" ? "Contenu réservé aux abonnés de la chaîne." : undefined,
    outputPath: done ? `${settings.outputDir}/${seed.author} · ${seed.title.slice(0, 32)}.mp4` : undefined,
    createdAt: new Date(Date.now() - ageMinutes * 60_000).toISOString(),
    mediaType: seed.mediaType,
  };
}

function initialTasks(): DownloadTask[] {
  return [
    seedToTask(SEEDS[0], 0, "downloading", 3),
    seedToTask(SEEDS[1], 1, "downloading", 5),
    seedToTask(SEEDS[2], 2, "queued", 6),
    seedToTask(SEEDS[3], 3, "completed", 44),
    seedToTask(SEEDS[4], 4, "completed", 120),
    seedToTask(SEEDS[5], 5, "error", 190),
    seedToTask(SEEDS[6], 6, "completed", 1450),
    seedToTask(SEEDS[7], 7, "completed", 2880),
  ].map((t) => (t.state === "downloading" ? { ...t, progress: 0.08 + Math.random() * 0.35 } : t))
   .map((t) => ({ ...t, downloadedBytes: Math.round((t.totalBytes ?? 0) * t.progress) }));
}

let tasks: DownloadTask[] = (() => {
  const stored = readJson<{ tasks?: DownloadTask[] }>(KEY_TASKS, {});
  return stored.tasks?.length ? stored.tasks : initialTasks();
})();

const persist = () => writeJson(KEY_TASKS, { tasks });

/* Simulation temporelle
   La progression est recalculée à chaque lecture, à partir du temps
   réellement écoulé : l'interface reste juste même si l'onglet a
   été mis en veille par le navigateur. */
let lastTick = Date.now();

const PROFILE_BPS: Record<Settings["speedProfile"], number> = {
  eco: 1.6 * MB, normal: 5.5 * MB, auto: 9 * MB, turbo: 18 * MB, max: 34 * MB,
};

function advance() {
  const now = Date.now();
  const dt = Math.min((now - lastTick) / 1000, 5);
  lastTick = now;
  if (dt <= 0) return;

  // Les tâches en file démarrent dès qu'un emplacement se libère.
  const running = () => tasks.filter((t) => t.state === "downloading" || t.state === "preparing" || t.state === "finalizing").length;
  for (const task of tasks) {
    if (task.state === "queued" && running() < settings.concurrentDownloads) task.state = "preparing";
  }

  for (const task of tasks) {
    if (task.state === "preparing") {
      // Analyse des formats puis bascule en téléchargement.
      if (Math.random() < dt * 1.4) task.state = "downloading";
      continue;
    }
    if (task.state !== "downloading") {
      if (task.state !== "finalizing") task.speedBps = 0;
      continue;
    }

    const target = PROFILE_BPS[settings.speedProfile] ?? PROFILE_BPS.auto;
    // Débit bruité, façon connexion réelle, avec un plancher.
    const jitter = 0.55 + Math.random() * 0.75;
    task.speedBps = Math.max(target * 0.25, target * jitter);

    const total = task.totalBytes ?? 0;
    task.downloadedBytes = Math.min(total, task.downloadedBytes + task.speedBps * dt);
    task.progress = total ? task.downloadedBytes / total : 0;
    const remaining = total - task.downloadedBytes;
    task.etaSeconds = task.speedBps > 0 ? remaining / task.speedBps : undefined;

    if (task.downloadedBytes >= total) {
      task.state = "finalizing";
      task.speedBps = 0;
      task.etaSeconds = undefined;
    }
  }

  // La finalisation (remux/fusion audio-vidéo) prend un court instant.
  for (const task of tasks) {
    if (task.state === "finalizing" && Math.random() < dt * 0.9) {
      task.state = "completed";
      task.progress = 1;
      task.outputPath = `${settings.outputDir}/${task.author} · ${task.title.slice(0, 32)}.${task.mode === "audio" ? settings.audioFormat : "mp4"}`;
    }
  }
  persist();
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* API : miroir exact des commandes Tauri */

export async function analyzeUrl(url: string): Promise<MediaInfo> {
  await wait(650 + Math.random() * 500);
  let parsed: URL;
  try { parsed = new URL(url.startsWith("http") ? url : `https://${url}`); }
  catch { throw new Error("Lien invalide. Collez l'adresse complète de la page."); }

  const host = parsed.hostname.replace(/^www\./, "");
  const provider: Provider =
    host.includes("twitch") ? "twitch" : host.includes("youtu") ? "youtube" : host.includes("tiktok") ? "tiktok" : "other";

  const segments = parsed.pathname.split("/").filter(Boolean);
  const isLive = provider === "twitch" ? segments.length <= 1 : /live/.test(parsed.pathname);
  const mediaType: MediaInfo["mediaType"] =
    isLive ? "live"
    : provider === "tiktok" ? "short"
    : provider === "twitch" ? (parsed.pathname.includes("clip") ? "clip" : "vod")
    : parsed.pathname.includes("shorts") ? "short" : "video";

  const author = segments[0] || host.split(".")[0] || "chaîne";
  const id = segments.at(-1) || parsed.searchParams.get("v") || uid();
  const title = isLive
    ? `Direct en cours : ${author}`
    : `${TITLES[Math.floor(Math.random() * TITLES.length)]}`;

  const ladder = provider === "tiktok"
    ? [["1080p", "H.264 · 30 fps"], ["720p", "H.264 · 30 fps"]]
    : provider === "twitch"
      ? [["Source", "1080p60 · 8 500 kb/s"], ["1080p60", "H.264 · 6 000 kb/s"], ["720p60", "H.264 · 3 500 kb/s"], ["480p", "H.264 · 1 400 kb/s"], ["360p", "H.264 · 700 kb/s"]]
      : [["2160p", "AV1 · 24 000 kb/s"], ["1440p", "VP9 · 13 000 kb/s"], ["1080p60", "VP9 · 6 500 kb/s"], ["720p", "H.264 · 2 800 kb/s"], ["480p", "H.264 · 1 200 kb/s"]];

  return {
    url: parsed.toString(),
    provider,
    mediaType,
    id,
    title,
    author,
    category: provider === "twitch" ? "Just Chatting" : undefined,
    duration: isLive ? 0 : 420 + Math.floor(Math.random() * 8400),
    thumbnail: demoThumbnail(id, author),
    isLive,
    qualities: [
      { id: "best", label: "Meilleure qualité", detail: "Choix automatique" },
      ...ladder.map(([label, detail]) => ({ id: label.toLowerCase(), label, detail })),
    ],
  };
}

const TITLES = [
  "Session de montage en direct : projet de fin d'année",
  "Analyse image par image de la dernière séquence",
  "Tout le matériel du studio, expliqué simplement",
  "Rediffusion intégrale du tournoi de samedi",
  "Le making-of du court-métrage",
  "Trois heures de travail condensées en dix minutes",
];

export async function startDownload(request: DownloadRequest): Promise<DownloadTask> {
  await wait(180);
  const sizeMb = request.mode === "audio" ? 40 + Math.random() * 90 : 380 + Math.random() * 3200;
  const task: DownloadTask = {
    id: uid(),
    url: request.url,
    provider: request.provider,
    title: request.title,
    author: request.author,
    thumbnail: request.thumbnail,
    quality: request.mode === "audio" ? (request.audioFormat ?? "m4a").toUpperCase() : request.quality,
    mode: request.mode,
    state: "queued",
    progress: 0,
    speedBps: 0,
    downloadedBytes: 0,
    totalBytes: Math.round(sizeMb * MB),
    engine: request.provider === "twitch" && request.mediaType === "vod" ? "TwitchDownloaderCLI" : "yt-dlp",
    createdAt: new Date().toISOString(),
    mediaType: request.mediaType,
  };
  tasks = [task, ...tasks];
  persist();
  return task;
}

export async function listDownloads(): Promise<DownloadTask[]> {
  advance();
  return tasks.map((t) => ({ ...t }));
}

export async function taskAction(id: string, action: "pause" | "resume" | "cancel" | "retry") {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  if (action === "pause" && (task.state === "downloading" || task.state === "preparing")) { task.state = "paused"; task.speedBps = 0; }
  if (action === "resume" && task.state === "paused") task.state = "downloading";
  if (action === "cancel") { task.state = "cancelled"; task.speedBps = 0; task.etaSeconds = undefined; }
  if (action === "retry") {
    task.state = "queued"; task.progress = 0; task.downloadedBytes = 0;
    task.error = undefined; task.speedBps = 0; task.etaSeconds = undefined;
  }
  persist();
}

export async function removeTask(id: string) {
  tasks = tasks.filter((t) => t.id !== id);
  persist();
}

export async function clearFinished() {
  tasks = tasks.filter((t) => !["completed", "cancelled", "error"].includes(t.state));
  persist();
}

export async function loadSettings(): Promise<Settings> {
  return { ...settings };
}

export async function saveSettings(next: Settings) {
  settings = { ...next };
  writeJson(KEY_SETTINGS, settings);
}

export async function engineStatus(): Promise<EngineStatus[]> {
  await wait(120);
  return [
    { name: "yt-dlp", version: "2026.09.02", available: true, bundled: true, path: "(démo navigateur)" },
    { name: "FFmpeg", version: "7.1", available: true, bundled: true, path: "(démo navigateur)" },
    { name: "FFprobe", version: "7.1", available: true, bundled: true, path: "(démo navigateur)" },
    { name: "Deno", version: "2.6.1", available: true, bundled: true, path: "(démo navigateur)" },
    { name: "TwitchDownloaderCLI", version: "1.55.7", available: true, bundled: true, path: "(démo navigateur)" },
  ];
}

export async function updateEngines(): Promise<string> {
  await wait(1200);
  return "Démo navigateur : aucun moteur réel à mettre à jour.";
}

export async function networkStatus(): Promise<NetworkStatus> {
  return { online: navigator.onLine, latencyMs: 18 + Math.round(Math.random() * 30), checkedAt: new Date().toISOString() };
}

export async function runtimeInfo() {
  return { os: "navigateur", arch: navigator.platform || "web", version: "1.0.0", updaterEnabled: false };
}

/** Démo navigateur : l'installation du moteur JavaScript n'a rien à télécharger. */
export async function installJsRuntime(): Promise<string> {
  await new Promise((r) => setTimeout(r, 600));
  return "deno 2.6.1 (démo navigateur)";
}

export async function removeJsRuntime(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
}
