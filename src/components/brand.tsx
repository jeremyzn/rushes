import type { ComponentType } from "react";
import { Clock3, Download, Home, Library, Radio, Settings2, type IconProps } from "./icons";
import type { Page } from "../types";

export const PAGES: readonly { id: Page; label: string; short: string; icon: ComponentType<IconProps>; key: string }[] = [
  { id: "home", label: "Accueil", short: "Accueil", icon: Home, key: "1" },
  { id: "downloads", label: "Téléchargements", short: "Files", icon: Download, key: "2" },
  { id: "live", label: "Directs", short: "Directs", icon: Radio, key: "3" },
  { id: "library", label: "Bibliothèque", short: "Biblio", icon: Library, key: "4" },
  { id: "history", label: "Historique", short: "Histo", icon: Clock3, key: "5" },
  { id: "settings", label: "Réglages", short: "Réglages", icon: Settings2, key: "6" },
];

/** Pages exposées dans la barre de navigation ; les réglages ont leur propre bouton. */
export const NAV_PAGES = PAGES.filter((p) => p.id !== "settings");

/** macOS : la barre de titre est en overlay, les feux de signalisation occupent le coin haut-gauche. */
export const isMac = navigator.userAgent.includes("Mac");

/** Marque : trois pistes décalées, comme des rushes posés sur une timeline de montage. */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden className="shrink-0">
      <rect width="28" height="28" rx="7" className="fill-[var(--inverse)]" />
      <rect x="6" y="7.5" width="11" height="3" rx="1.5" className="fill-[var(--on-inverse)]" />
      <rect x="11" y="12.5" width="11" height="3" rx="1.5" className="fill-[var(--on-inverse)]" opacity=".6" />
      <rect x="6" y="17.5" width="8" height="3" rx="1.5" className="fill-[var(--on-inverse)]" opacity=".35" />
    </svg>
  );
}
