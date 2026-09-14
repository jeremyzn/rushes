import { cn } from "../../lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-[7px] border border-[var(--line)] bg-[var(--raised)] px-2 text-[11px] font-medium tracking-[-.01em] text-[var(--muted)] shadow-[inset_0_1px_0_var(--sheen)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Touche de clavier. Même gabarit partout : la palette, les infobulles
    et les raccourcis en ligne doivent s'aligner au pixel. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "mono grid h-[18px] min-w-[18px] place-items-center rounded-[5px] border border-[var(--line)] bg-[var(--raised)] px-1 text-[10px] font-medium leading-none text-[var(--faint)] shadow-[inset_0_1px_0_var(--sheen)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
