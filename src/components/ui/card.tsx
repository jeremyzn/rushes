import * as React from "react";
import { cn } from "../../lib/utils";

/** Surface de contenu. `interactive` ajoute l'élévation au survol,
    à ne mettre que sur une carte réellement cliquable dans son entier. */
export function Card({ className, interactive, ...p }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--e1)]",
        interactive && "lift cursor-pointer hover:border-[var(--line-strong)]",
        className,
      )}
      {...p}
    />
  );
}

export function CardContent({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...p} />;
}

/** Tuile de tableau de bord : une mesure, une étiquette, rien d'autre. */
export function Tile({ label, value, hint, icon, className }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("min-h-[104px] rounded-[var(--radius-tile)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--e1)]", className)}>
      <div className="flex items-center gap-2 text-[var(--faint)]">
        {icon}
        <span className="truncate text-[11.5px] font-medium uppercase tracking-[.08em]">{label}</span>
      </div>
      <div className="mono mt-2.5 text-[25px] font-semibold leading-none tracking-[-.03em] text-[var(--ink)]">{value}</div>
      {hint && <div className="mt-1.5 truncate text-[11.5px] text-[var(--faint)]">{hint}</div>}
    </div>
  );
}
