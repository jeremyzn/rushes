import { Globe2, Spotify, Tiktok, Twitch, Youtube } from "./icons";
import type { Provider } from "../types";

/** Métadonnées de plateforme : icônes de marque réelles (simple-icons). */
export const providerMeta = {
  twitch: { label: "Twitch", icon: Twitch, blurb: "VOD, clips et directs, jusqu'à la qualité source.", tint: "#9146FF" },
  youtube: { label: "YouTube", icon: Youtube, blurb: "Vidéos, Shorts et pistes audio haute qualité.", tint: "#FF0033" },
  tiktok: { label: "TikTok", icon: Tiktok, blurb: "Vidéos et liens courts, sans filigrane.", tint: "#25F4EE" },
  spotify: { label: "Spotify", icon: Spotify, blurb: "Morceaux identifiés par Spotify, audio récupéré sur YouTube.", tint: "#1DB954" },
  other: { label: "Vimeo et 1800 autres sites", icon: Globe2, blurb: "Vimeo, Dailymotion, X, Instagram, Reddit, Facebook et tout autre lien pris en charge par yt-dlp.", tint: "#8a8f98" },
} as const satisfies Record<Provider, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; blurb: string; tint: string }>;

export function ProviderIcon({ provider, size = 14, className }: { provider: Provider; size?: number; className?: string }) {
  const Icon = providerMeta[provider].icon;
  return <Icon size={size} className={className} />;
}
