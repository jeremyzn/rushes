import { motion } from "motion/react";
import { FolderOpen, Pause, Play, RotateCcw, Trash, X } from "./icons";
import type { DownloadTask } from "../types";
import { formatBytes, formatSpeed } from "../lib/utils";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import { StateBadge } from "./ui/stat";
import { ProviderIcon, providerMeta } from "./providers";

export function DownloadCard({ task, onAction, onOpen, onReveal, onRemove }: {
  task: DownloadTask;
  onAction: (a: "pause" | "resume" | "cancel" | "retry") => void;
  onOpen: () => void;
  onReveal: () => void;
  onRemove?: () => void;
}) {
  const pct = Math.round(task.progress * 1000) / 10;
  const done = task.state === "completed";
  const failed = task.state === "error";
  const running = task.state === "downloading";
  const finished = ["completed", "cancelled", "error"].includes(task.state);

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: .15 } }}
      transition={{ duration: .24, ease: [.22, 1, .36, 1] }}
      className="group relative grid grid-cols-[84px_1fr] gap-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-2.5 shadow-[var(--e1)] transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)] hover:border-[var(--line-strong)] hover:shadow-[var(--e2)] sm:grid-cols-[132px_1fr] sm:gap-4 sm:p-3"
    >
      <Thumbnail task={task} pct={pct} done={done} onOpen={onOpen} />

      <div className="flex min-w-0 flex-col">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <ProviderIcon provider={task.provider} size={11} className="shrink-0 text-[var(--faint)]" />
              <span className="truncate text-[10px] font-bold uppercase tracking-[.11em] text-[var(--faint)]">
                {providerMeta[task.provider].label}
              </span>
              <StateBadge state={task.state} className="ml-0.5" />
            </div>

            <strong className="mt-1.5 block truncate text-[13.5px] font-semibold leading-snug tracking-[-.015em]">{task.title}</strong>

            <p className="mt-1 flex items-center gap-1.5 truncate text-[11.5px] text-[var(--faint)]">
              <span className="truncate">{task.author}</span>
              <Dot />
              <span className="shrink-0">{task.mode === "audio" ? "Audio" : task.quality}</span>
              <Dot className="hidden xs:block" />
              <span className="mono hidden shrink-0 xs:block">{task.engine || "Auto"}</span>
            </p>
          </div>

          {/* Les actions restent atteignables au clavier même sans survol. */}
          <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            {running && <Action label="Mettre en pause" onClick={() => onAction("pause")}><Pause size={14} /></Action>}
            {task.state === "paused" && <Action label="Reprendre" onClick={() => onAction("resume")}><Play size={14} /></Action>}
            {failed && <Action label="Réessayer" onClick={() => onAction("retry")}><RotateCcw size={14} /></Action>}
            {done && <Action label="Lire" onClick={onOpen}><Play size={14} /></Action>}
            {done && <Action label="Afficher dans le dossier" onClick={onReveal}><FolderOpen size={14} /></Action>}
            {!finished && <Action label="Annuler" onClick={() => onAction("cancel")}><X size={14} /></Action>}
            {finished && onRemove && <Action label="Retirer de la liste" onClick={onRemove}><Trash size={13} /></Action>}
          </div>
        </div>

        <div className="mt-auto pt-2.5">
          <Progress value={done ? 100 : pct} tone={done ? "ok" : failed ? "bad" : "default"} thick={!finished} />

          <div className="mono mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium tabular-nums text-[var(--faint)]">
            <span className={`font-bold ${done ? "text-[var(--ok)]" : failed ? "text-[var(--bad)]" : "text-[var(--ink)]"}`}>
              {done ? "100 %" : failed ? "Échec" : `${pct.toFixed(1)} %`}
            </span>
            <Dot />
            <span>
              {formatBytes(task.downloadedBytes)}
              {task.totalBytes ? <span className="text-[var(--faint)]/70"> / {formatBytes(task.totalBytes)}</span> : null}
            </span>
            {running && (
              <>
                <Dot />
                <span className="text-[var(--ink)]">{formatSpeed(task.speedBps)}</span>
              </>
            )}
            {running && task.etaSeconds ? (
              <>
                <Dot />
                <span>{formatEta(task.etaSeconds)} restantes</span>
              </>
            ) : null}
          </div>

          {task.error && (
            <p className="mt-2 rounded-lg border border-[var(--bad)]/20 bg-[var(--bad)]/8 px-2 py-1.5 text-[11px] leading-4 text-[var(--bad)]">
              {task.error}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/** Vignette. Pendant le téléchargement, elle porte elle-même la
    progression : le regard n'a pas à descendre chercher le chiffre. */
function Thumbnail({ task, pct, done, onOpen }: { task: DownloadTask; pct: number; done: boolean; onOpen: () => void }) {
  const playable = done && !!task.outputPath;

  return (
    <div className="relative aspect-video self-start overflow-hidden rounded-[11px] bg-[var(--raised)] shadow-[inset_0_0_0_1px_var(--line)]">
      {task.thumbnail
        ? <img src={task.thumbnail} alt="" className="size-full object-cover" />
        : <div className="grid size-full place-items-center text-[var(--faint)]"><ProviderIcon provider={task.provider} size={18} /></div>}

      {!done && task.progress > 0 && (
        <>
          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-black/45">
            <motion.span
              className="block h-full bg-white"
              animate={{ width: `${pct}%` }}
              transition={{ duration: .45, ease: [.22, 1, .36, 1] }}
            />
          </span>
          <span className="mono absolute bottom-1.5 right-1.5 rounded-[5px] bg-black/70 px-1 py-px text-[9.5px] font-bold text-white backdrop-blur-sm">
            {Math.floor(pct)} %
          </span>
        </>
      )}

      {playable && (
        <button
          onClick={onOpen}
          aria-label={`Lire ${task.title}`}
          className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100"
        >
          <span className="grid size-8 place-items-center rounded-full bg-white/92 text-black shadow-lg">
            <Play size={13} fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}

function Action({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Tooltip label={label}>
      <Button variant="ghost" size="icon-sm" onClick={onClick} aria-label={label}>{children}</Button>
    </Tooltip>
  );
}

function Dot({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`size-[2.5px] shrink-0 rounded-full bg-current opacity-40 ${className}`} />;
}

function formatEta(s: number) {
  if (s < 60) return `${Math.round(s)} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}
