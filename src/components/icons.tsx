import type { ComponentType, SVGProps } from "react";
import ArrowRightRaw from "~icons/lucide/arrow-right";
import AudioLinesRaw from "~icons/lucide/audio-lines";
import CheckRaw from "~icons/lucide/check";
import ChevronDownRaw from "~icons/lucide/chevron-down";
import ChevronRightRaw from "~icons/lucide/chevron-right";
import CircleHelpRaw from "~icons/lucide/circle-help";
import ClipboardPasteRaw from "~icons/lucide/clipboard-paste";
import Clock3Raw from "~icons/lucide/clock-3";
import CloudOffRaw from "~icons/lucide/cloud-off";
import DownloadRaw from "~icons/lucide/download";
import FilmRaw from "~icons/lucide/film";
import FolderOpenRaw from "~icons/lucide/folder-open";
import GaugeRaw from "~icons/lucide/gauge";
import Globe2Raw from "~icons/lucide/globe-2";
import HistoryRaw from "~icons/lucide/history";
import HomeRaw from "~icons/lucide/home";
import Laptop2Raw from "~icons/lucide/laptop-2";
import LibraryRaw from "~icons/lucide/library";
import LoaderCircleRaw from "~icons/lucide/loader-circle";
import MoonRaw from "~icons/lucide/moon";
import PauseRaw from "~icons/lucide/pause";
import PlayRaw from "~icons/lucide/play";
import RadioRaw from "~icons/lucide/radio";
import RefreshCwRaw from "~icons/lucide/refresh-cw";
import RotateCcwRaw from "~icons/lucide/rotate-ccw";
import SearchRaw from "~icons/lucide/search";
import Settings2Raw from "~icons/lucide/settings-2";
import ShieldCheckRaw from "~icons/lucide/shield-check";
import SparklesRaw from "~icons/lucide/sparkles";
import SunRaw from "~icons/lucide/sun";
import VideoRaw from "~icons/lucide/video";
import WifiRaw from "~icons/lucide/wifi";
import XRaw from "~icons/lucide/x";
import GithubRaw from "~icons/simple-icons/github";
import YoutubeRaw from "~icons/simple-icons/youtube";
import TwitchRaw from "~icons/simple-icons/twitch";
import TiktokRaw from "~icons/simple-icons/tiktok";
import KickRaw from "~icons/simple-icons/kick";
import TrashRaw from "~icons/lucide/trash-2";
import BroomRaw from "~icons/lucide/list-x";
import ZapRaw from "~icons/lucide/zap";
import LinkRaw from "~icons/lucide/link";
import CommandRaw from "~icons/lucide/command";
import ArrowUpRightRaw from "~icons/lucide/arrow-up-right";
import HardDriveRaw from "~icons/lucide/hard-drive";
import ActivityRaw from "~icons/lucide/activity";
import ChevronUpRaw from "~icons/lucide/chevron-up";
import CircleAlertRaw from "~icons/lucide/circle-alert";
import CircleCheckRaw from "~icons/lucide/circle-check";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "size"> & { size?: number | string };
type RawIcon = ComponentType<SVGProps<SVGSVGElement>>;

/* Lucide dessine sur une grille de 24 px avec un trait de 2 px. Affichées
   à 13-16 px comme ici, ces icônes paraissent alors plus grasses que le
   texte Geist qu'elles accompagnent. 1,75 les remet au poids de la typo :
   c'est le réglage qui empêche une interface de paraître assemblée par
   trois personnes différentes. */
const STROKE = 1.75;

/** Adapte un composant Iconify à l'API `size` utilisée dans toute l'app. */
const icon = (Raw: RawIcon, displayName: string) => {
  const Component = ({ size = 24, ...props }: IconProps) => <Raw width={size} height={size} strokeWidth={STROKE} {...props} />;
  Component.displayName = displayName;
  return Component;
};

/** Logos de marque : des glyphes pleins, sans contour à accorder. */
const brand = (Raw: RawIcon, displayName: string) => {
  const Component = ({ size = 24, ...props }: IconProps) => <Raw width={size} height={size} {...props} />;
  Component.displayName = displayName;
  return Component;
};

export const ArrowRight = icon(ArrowRightRaw, "ArrowRight");
export const AudioLines = icon(AudioLinesRaw, "AudioLines");
export const Check = icon(CheckRaw, "Check");
export const ChevronDown = icon(ChevronDownRaw, "ChevronDown");
export const ChevronRight = icon(ChevronRightRaw, "ChevronRight");
export const CircleHelp = icon(CircleHelpRaw, "CircleHelp");
export const ClipboardPaste = icon(ClipboardPasteRaw, "ClipboardPaste");
export const Clock3 = icon(Clock3Raw, "Clock3");
export const CloudOff = icon(CloudOffRaw, "CloudOff");
export const Download = icon(DownloadRaw, "Download");
export const Film = icon(FilmRaw, "Film");
export const FolderOpen = icon(FolderOpenRaw, "FolderOpen");
export const Gauge = icon(GaugeRaw, "Gauge");
export const Github = brand(GithubRaw, "Github");
export const Globe2 = icon(Globe2Raw, "Globe2");
export const History = icon(HistoryRaw, "History");
export const Home = icon(HomeRaw, "Home");
export const Laptop2 = icon(Laptop2Raw, "Laptop2");
export const Library = icon(LibraryRaw, "Library");
export const LoaderCircle = icon(LoaderCircleRaw, "LoaderCircle");
export const Moon = icon(MoonRaw, "Moon");
export const Pause = icon(PauseRaw, "Pause");
export const Play = icon(PlayRaw, "Play");
export const Radio = icon(RadioRaw, "Radio");
export const RefreshCw = icon(RefreshCwRaw, "RefreshCw");
export const RotateCcw = icon(RotateCcwRaw, "RotateCcw");
export const Search = icon(SearchRaw, "Search");
export const Settings2 = icon(Settings2Raw, "Settings2");
export const ShieldCheck = icon(ShieldCheckRaw, "ShieldCheck");
export const Sparkles = icon(SparklesRaw, "Sparkles");
export const Sun = icon(SunRaw, "Sun");
export const Video = icon(VideoRaw, "Video");
export const Wifi = icon(WifiRaw, "Wifi");
export const X = icon(XRaw, "X");
export const Youtube = brand(YoutubeRaw, "Youtube");
export const Twitch = brand(TwitchRaw, "Twitch");
export const Tiktok = brand(TiktokRaw, "Tiktok");
export const Kick = brand(KickRaw, "Kick");
export const Trash = icon(TrashRaw, "Trash");
export const Broom = icon(BroomRaw, "Broom");
export const Zap = icon(ZapRaw, "Zap");
export const Link = icon(LinkRaw, "Link");
export const Command = icon(CommandRaw, "Command");
export const ArrowUpRight = icon(ArrowUpRightRaw, "ArrowUpRight");
export const HardDrive = icon(HardDriveRaw, "HardDrive");
export const Activity = icon(ActivityRaw, "Activity");
export const ChevronUp = icon(ChevronUpRaw, "ChevronUp");
export const CircleAlert = icon(CircleAlertRaw, "CircleAlert");
export const CircleCheck = icon(CircleCheckRaw, "CircleCheck");
