import { invoke } from "@tauri-apps/api/core";
import * as demo from "./mock-backend";
import type { DownloadRequest, DownloadTask, EngineStatus, MediaInfo, NetworkStatus, RuntimeInfo, Settings } from "../types";

/** Vrai si l'interface tourne dans l'application de bureau (et non dans un navigateur). */
export const isDesktop = () => "__TAURI_INTERNALS__" in window;

/** Hors application de bureau, l'interface est branchée sur le backend de démonstration. */
export const isDemo = () => !isDesktop();

/** Aiguille vers la commande Rust, ou vers son équivalent simulé dans le navigateur. */
function bridge<A extends unknown[], R>(native: (...args: A) => Promise<R>, mock: (...args: A) => Promise<R>) {
  return (...args: A): Promise<R> => (isDesktop() ? native(...args) : mock(...args));
}

export const analyzeUrl = bridge(
  (url: string): Promise<MediaInfo> => invoke("analyze_url", { url }),
  demo.analyzeUrl,
);

export const startDownload = bridge(
  (request: DownloadRequest): Promise<DownloadTask> => invoke("start_download", { request }),
  demo.startDownload,
);

export const listDownloads = bridge(
  (): Promise<DownloadTask[]> => invoke("list_downloads"),
  demo.listDownloads,
);

export const taskAction = bridge(
  async (id: string, action: "pause" | "resume" | "cancel" | "retry") => { await invoke("task_action", { id, action }); },
  demo.taskAction,
);

export const removeTask = bridge(
  async (id: string) => { await invoke("remove_task", { id }); },
  demo.removeTask,
);

export const clearFinished = bridge(
  async () => { await invoke("clear_finished"); },
  demo.clearFinished,
);

export const loadSettings = bridge(
  (): Promise<Settings> => invoke("load_settings"),
  demo.loadSettings,
);

export const saveSettings = bridge(
  async (settings: Settings) => { await invoke("save_settings", { settings }); },
  demo.saveSettings,
);

export const engineStatus = bridge(
  (): Promise<EngineStatus[]> => invoke("engine_status"),
  demo.engineStatus,
);

export const updateEngines = bridge(
  (): Promise<string> => invoke("update_engines"),
  demo.updateEngines,
);

export const networkStatus = bridge(
  (): Promise<NetworkStatus> => invoke("network_status"),
  demo.networkStatus,
);

export const runtimeInfo = bridge(
  (): Promise<RuntimeInfo> => invoke("runtime_info"),
  demo.runtimeInfo,
);
