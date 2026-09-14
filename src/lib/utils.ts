import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatBytes(bytes = 0) { if (!bytes) return "0 B"; const units=["B","KB","MB","GB","TB"]; const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1); return `${(bytes/1024**i).toFixed(i>1?1:0)} ${units[i]}`; }
export function formatSpeed(bytes = 0) { return bytes ? `${formatBytes(bytes)}/s` : "0 B/s"; }
export function formatDuration(seconds = 0) { if (!seconds) return "0:00"; const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=Math.floor(seconds%60); return h?`${h} h ${m.toString().padStart(2,"0")} min`:`${m}:${s.toString().padStart(2,"0")}`; }
