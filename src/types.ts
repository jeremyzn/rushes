export type Page = "home" | "downloads" | "live" | "library" | "history" | "settings";
export type Provider = "twitch" | "youtube" | "tiktok" | "spotify" | "other";
export type MediaType = "vod" | "clip" | "live" | "video" | "short" | "music";
export type DownloadState = "queued" | "preparing" | "downloading" | "paused" | "finalizing" | "completed" | "error" | "cancelled";
export type DownloadMode = "video" | "audio";

export interface QualityOption { id: string; label: string; detail?: string; height?: number; fps?: number; }
/** Morceau d'un album, d'une playlist ou d'un artiste Spotify. Durée en secondes. */
export interface TrackEntry { id: string; url: string; title: string; artist: string; duration: number; }
export interface MediaInfo {
  url: string; provider: Provider; mediaType: MediaType; id: string; title: string; author: string; category?: string;
  duration: number; thumbnail?: string; isLive: boolean; qualities: QualityOption[];
  /** Vide sauf pour une liste Spotify. */
  entries?: TrackEntry[];
  /** Nombre réel de morceaux quand Spotify n'en expose qu'une partie. */
  total?: number;
}
export interface DownloadTask {
  id: string; url: string; provider: Provider; title: string; author: string; thumbnail?: string; quality: string; mode: DownloadMode;
  state: DownloadState; progress: number; speedBps: number; downloadedBytes: number; totalBytes?: number; etaSeconds?: number;
  engine?: string; error?: string; outputPath?: string; createdAt: string; mediaType: MediaType;
}
export interface DownloadRequest {
  url: string; provider: Provider; title: string; author: string; thumbnail?: string; quality: string; mediaType: MediaType;
  speedProfile: Settings["speedProfile"]; mode: DownloadMode; audioFormat?: Settings["audioFormat"]; container?: Settings["container"];
  /** Durée attendue en secondes, pour choisir la bonne version d'un morceau Spotify. */
  duration?: number;
}
export interface Settings {
  outputDir: string; theme: "dark" | "light" | "system"; reducedMotion: boolean; quality: string;
  speedProfile: "eco" | "normal" | "auto" | "turbo" | "max"; concurrentDownloads: number; smartFallback: boolean;
  downloadThumbnail: boolean; notifications: boolean; autoCheckUpdates: boolean; autoUpdateEngines: boolean;
  container: "auto" | "mp4" | "mkv"; audioFormat: "m4a" | "mp3" | "flac"; cookiesBrowser: "none" | "chrome" | "edge" | "firefox" | "safari";
}
export interface EngineStatus { name: string; version: string; available: boolean; path?: string; bundled: boolean; }
export interface NetworkStatus { online: boolean; latencyMs?: number; checkedAt: string; }
export interface RuntimeInfo { os: string; arch: string; version: string; updaterEnabled: boolean; }
