import { cn } from "../../lib/utils";
import type { DownloadState } from "../../types";

/* Chaque état a un fond, même neutre : une pastille sans surface se lit
   comme du texte égaré plutôt que comme une étiquette. */
const STATE_STYLE: Record<DownloadState, { label: string; className: string }> = {
  queued:      { label: "En file",      className: "border-[var(--line)] bg-[var(--raised)] text-[var(--faint)]" },
  preparing:   { label: "Préparation",  className: "border-[var(--line)] bg-[var(--raised)] text-[var(--muted)]" },
  downloading: { label: "En cours",     className: "border-[var(--line-strong)] bg-[var(--raised)] text-[var(--ink)]" },
  paused:      { label: "En pause",     className: "border-transparent bg-[var(--warn)]/12 text-[var(--warn)]" },
  finalizing:  { label: "Finalisation", className: "border-[var(--line-strong)] bg-[var(--raised)] text-[var(--ink)]" },
  completed:   { label: "Terminé",      className: "border-transparent bg-[var(--ok)]/12 text-[var(--ok)]" },
  error:       { label: "Erreur",       className: "border-transparent bg-[var(--bad)]/12 text-[var(--bad)]" },
  cancelled:   { label: "Annulé",       className: "border-[var(--line)] bg-[var(--raised)] text-[var(--faint)]" },
};

export function StateBadge({ state, className }: { state: DownloadState; className?: string }) {
  const s = STATE_STYLE[state];
  const live = state === "downloading" || state === "finalizing";
  return (
    <span
      className={cn(
        "inline-flex h-[20px] shrink-0 items-center gap-1.5 rounded-[6px] border px-1.5 text-[10.5px] font-semibold tracking-[-.005em]",
        s.className,
        className,
      )}
    >
      {live && (
        <span className="relative grid size-1.5 place-items-center">
          <span className="absolute size-1.5 rounded-full bg-current animate-pulse-ring" />
          <span className="size-1.5 rounded-full bg-current" />
        </span>
      )}
      {s.label}
    </span>
  );
}
