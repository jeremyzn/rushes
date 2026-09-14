/*
   Capacités de la plateforme hôte.

   L'interface est développée dans le navigateur puis livrée dans
   l'application de bureau. Chaque capacité native (sélecteur de
   dossier, ouverture Finder/Explorateur, notifications, mises à
   jour) est ici derrière une fonction unique : dans le navigateur,
   on retombe sur l'équivalent web le plus proche, ou sur rien.

   Les modules Tauri sont chargés dynamiquement : le bundle servi
   au navigateur n'embarque pas de code natif inutilisable.
   */
import type { DownloadEvent, Update } from "@tauri-apps/plugin-updater";
import { isDesktop } from "./backend";

export type AppUpdate = Pick<Update, "version" | "body" | "downloadAndInstall">;
export type { DownloadEvent };

/** Sélecteur de dossier natif. Retourne null si l'utilisateur annule ou si la plateforme ne sait pas le faire. */
export async function pickFolder(defaultPath?: string): Promise<string | null> {
  if (!isDesktop()) {
    const typed = window.prompt("Dossier de destination (démo navigateur)", defaultPath ?? "");
    return typed?.trim() ? typed.trim() : null;
  }
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({ directory: true, multiple: false, defaultPath, title: "Dossier de destination" });
  return typeof selected === "string" ? selected : null;
}

/** Ouvre un fichier ou un dossier avec l'application par défaut du système. */
export async function openPath(path: string): Promise<void> {
  if (!isDesktop()) throw new Error("Le navigateur ne peut pas ouvrir un fichier local. Disponible dans l'application de bureau.");
  const { openPath: open } = await import("@tauri-apps/plugin-opener");
  await open(path);
}

/** Révèle un fichier dans le Finder ou l'Explorateur. */
export async function revealItemInDir(path: string): Promise<void> {
  if (!isDesktop()) throw new Error("L'affichage dans le dossier est disponible dans l'application de bureau.");
  const { revealItemInDir: reveal } = await import("@tauri-apps/plugin-opener");
  await reveal(path);
}

/** Ouvre un lien externe dans le navigateur par défaut. */
export async function openExternal(url: string): Promise<void> {
  if (!isDesktop()) { window.open(url, "_blank", "noopener,noreferrer"); return; }
  const { openUrl } = await import("@tauri-apps/plugin-opener");
  await openUrl(url);
}

/** Notification système de fin de téléchargement. Silencieuse si la permission est refusée. */
export async function notify(title: string, body: string): Promise<void> {
  try {
    if (!isDesktop()) {
      if (!("Notification" in window)) return;
      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();
      if (permission === "granted") new Notification(title, { body });
      return;
    }
    const { isPermissionGranted, requestPermission, sendNotification } = await import("@tauri-apps/plugin-notification");
    let granted = await isPermissionGranted();
    if (!granted) granted = (await requestPermission()) === "granted";
    if (granted) sendNotification({ title, body });
  } catch { /* notification facultative */ }
}

/** Recherche une mise à jour signée. Retourne null quand il n'y en a pas, ou hors application de bureau. */
export async function checkForUpdate(): Promise<AppUpdate | null> {
  if (!isDesktop()) return null;
  const { check } = await import("@tauri-apps/plugin-updater");
  return await check();
}

/** Redémarre l'application après installation d'une mise à jour. */
export async function relaunchApp(): Promise<void> {
  if (!isDesktop()) { window.location.reload(); return; }
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}

/** Lecture du presse-papiers, avec le message d'erreur adapté à l'hôte. */
export async function readClipboard(): Promise<string> {
  const text = await navigator.clipboard.readText();
  return text.trim();
}
