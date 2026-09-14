import { AnimatePresence, motion } from "motion/react";
import { Tabs } from "radix-ui";
import { toast } from "sonner";
import { ArrowRight, AudioLines, ClipboardPaste, Download, Link, LoaderCircle, Video } from "./icons";
import { ProviderIcon, providerMeta } from "./providers";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { SelectBox } from "./ui/select";
import { Tooltip } from "./ui/tooltip";
import { Badge, Kbd } from "./ui/badge";
import { readClipboard } from "../lib/platform";
import { formatDuration } from "../lib/utils";
import type { DownloadMode, MediaInfo, Provider } from "../types";

export type AnalyzerState = {
  url: string; setUrl: (s: string) => void; analyze: () => void; analyzing: boolean; info: MediaInfo | null;
  quality: string; setQuality: (s: string) => void; mode: DownloadMode; setMode: (m: DownloadMode) => void;
  download: () => void; online: boolean; inputRef: React.RefObject<HTMLInputElement | null>;
};

const HINTS: Provider[] = ["twitch", "youtube", "tiktok"];

export function UrlAnalyzer({ state, placeholder }: { state: AnalyzerState; placeholder: string }) {
  const { url, setUrl, analyze, analyzing, info, online, inputRef } = state;

  async function paste() {
    try {
      const text = await readClipboard();
      if (text) { setUrl(text); inputRef.current?.focus(); }
      else toast.info("Le presse-papiers est vide");
    } catch { toast.error("Presse-papiers inaccessible"); }
  }

  return (
    <div>
      {/* Le halo de focus remplace la bordure épaisse : il signale l'état
          actif sans faire bouger d'un pixel la mise en page. */}
      <div
        className={`group flex items-center gap-2 rounded-[15px] border bg-[var(--surface)] p-1.5 pl-3.5 shadow-[var(--e1)] transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)] focus-within:border-[var(--line-strong)] focus-within:shadow-[0_0_0_4px_var(--line),var(--e2)] ${
          online ? "border-[var(--line)]" : "border-[var(--line)] opacity-60"
        }`}
      >
        <Link size={16} className="shrink-0 text-[var(--faint)] transition-colors group-focus-within:text-[var(--muted)]" />
        <input
          ref={inputRef}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          disabled={!online}
          placeholder={online ? placeholder : "Connexion Internet requise"}
          spellCheck={false}
          autoComplete="off"
          className="h-10 min-w-0 flex-1 bg-transparent text-[14px] tracking-[-.01em] outline-none placeholder:text-[var(--faint)]"
        />
        {!url && <Kbd className="mr-0.5 hidden shrink-0 sm:grid">⌘L</Kbd>}
        <Tooltip label="Coller depuis le presse-papiers">
          <Button variant="ghost" size="icon-sm" disabled={!online} onClick={paste} aria-label="Coller">
            <ClipboardPaste size={15} />
          </Button>
        </Tooltip>
        <Button onClick={analyze} disabled={!online || !url.trim()} busy={analyzing}>
          <ArrowRight size={14} />Analyser
        </Button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {analyzing && <AnalyzingCard key="skeleton" />}
        {info && !analyzing && <MediaCard key={info.url} state={state} info={info} />}
        {!info && !analyzing && (
          <motion.div key="hints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 flex flex-wrap items-center gap-2">
            {HINTS.map((p) => (
              <span key={p} className="flex h-[26px] items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 text-[11.5px] text-[var(--muted)] shadow-[var(--e1)]">
                <ProviderIcon provider={p} size={11} className="shrink-0 text-[var(--faint)]" />
                {providerMeta[p].label}
              </span>
            ))}
            <span className="text-[11.5px] text-[var(--faint)]">et tout site pris en charge par yt-dlp</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Squelette calé sur les dimensions exactes de la carte finale, pour que
    rien ne saute quand l'analyse répond. */
function AnalyzingCard() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
      <Card className="grid gap-4 overflow-hidden p-3 sm:grid-cols-[264px_1fr] sm:p-0">
        <Skeleton className="aspect-video rounded-[11px] sm:rounded-none" />
        <div className="flex flex-col gap-2.5 p-1 sm:py-4 sm:pr-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-3 w-2/5" />
          <div className="mt-auto flex gap-2 pt-4">
            <Skeleton className="h-9 w-[152px]" />
            <Skeleton className="h-9 w-[152px]" />
            <Skeleton className="ml-auto h-9 w-[130px]" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function MediaCard({ state, info }: { state: AnalyzerState; info: MediaInfo }) {
  const { quality, setQuality, mode, setMode, download } = state;
  const meta = providerMeta[info.provider];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: .26, ease: [.22, 1, .36, 1] }}
      className="mt-3"
    >
      <Card className="overflow-hidden shadow-[var(--e2)]">
        <div className="grid sm:grid-cols-[264px_1fr]">
          <div className="relative aspect-video bg-[var(--raised)] sm:aspect-auto sm:min-h-[190px]">
            {info.thumbnail
              ? <img src={info.thumbnail} alt="" className="absolute inset-0 size-full object-cover" />
              : <div className="absolute inset-0 grid place-items-center text-[var(--faint)]"><ProviderIcon provider={info.provider} size={32} /></div>}

            {/* Dégradé d'ancrage : les pastilles restent lisibles sur
                n'importe quelle vignette. */}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />

            {info.isLive && (
              <Badge className="absolute left-2.5 top-2.5 border-0 bg-[var(--bad)] font-bold tracking-[.04em] text-white shadow-lg">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />EN DIRECT
              </Badge>
            )}
            {!info.isLive && info.duration > 0 && (
              <span className="mono absolute bottom-2 right-2 rounded-[6px] bg-black/75 px-1.5 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-sm">
                {formatDuration(info.duration)}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col p-4">
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--muted)]">
              <ProviderIcon provider={info.provider} size={12} className="shrink-0" />
              <span className="truncate">{meta.label}</span>
              <span aria-hidden className="size-[2.5px] shrink-0 rounded-full bg-current opacity-40" />
              <span className="truncate">{info.author}</span>
            </div>

            <h3 className="mt-1.5 line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-.022em]">{info.title}</h3>
            {info.category && <p className="mt-1 truncate text-[12px] text-[var(--faint)]">{info.category}</p>}

            <div className="mt-auto flex flex-wrap items-end gap-2.5 pt-5">
              <Tabs.Root value={mode} onValueChange={(v) => setMode(v as DownloadMode)}>
                <Tabs.List aria-label="Type" className="inline-flex h-9 items-center rounded-[11px] border border-[var(--line)] bg-[var(--raised)] p-[3px] shadow-[inset_0_1px_2px_rgb(0_0_0/.06)]">
                  {([["video", "Vidéo", Video], ["audio", "Audio", AudioLines]] as const).map(([v, label, Icon]) => (
                    <Tabs.Trigger
                      key={v}
                      value={v}
                      className="flex h-full items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-medium text-[var(--muted)] transition-all duration-200 ease-[var(--ease-out)] hover:text-[var(--ink)] data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--ink)] data-[state=active]:shadow-[inset_0_1px_0_var(--sheen),var(--e1)]"
                    >
                      <Icon size={13} />{label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs.Root>

              {mode === "video" && (
                <SelectBox
                  value={quality}
                  onChange={setQuality}
                  className="sm:min-w-[176px]"
                  items={info.qualities.map((q) => ({ value: q.id, label: q.label, detail: q.detail }))}
                />
              )}

              <Button className="ml-auto" onClick={download}>
                <Download size={14} />{info.isLive ? "Enregistrer" : "Télécharger"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
