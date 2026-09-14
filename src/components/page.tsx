import { cn } from "../lib/utils";

/** Largeur de lecture commune à toutes les pages, alignée sur le header. */
const SHELL = "mx-auto w-full max-w-[1120px] px-6";

/** Titre de page. La navigation vit dans le header flottant : ici, on
    n'affiche plus que l'identité de la page et ses actions propres. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className={cn(SHELL, "flex items-end gap-4 pb-5 pt-5")}>
      <div className="min-w-0 flex-1">
        <h1 className="text-[23px] font-semibold leading-none tracking-[-.03em]">{title}</h1>
        {description && <p className="mt-2 truncate text-[12.5px] text-[var(--faint)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 pb-0.5">{actions}</div>}
    </div>
  );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(SHELL, "pb-14", className)}>{children}</div>;
}

export function SectionTitle({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex h-8 items-center gap-2">
      <h2 className="text-[13px] font-semibold tracking-[-.01em]">{title}</h2>
      {count !== undefined && <span className="mono text-[11.5px] text-[var(--faint)]">{count}</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

export function Empty({ icon, title, text, action, compact }: {
  icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode; compact?: boolean;
}) {
  return (
    <div className={cn("grid place-items-center rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] px-6 text-center", compact ? "py-7" : "min-h-[240px] py-12")}>
      <div>
        <div className="mx-auto grid size-9 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--faint)]">{icon}</div>
        <strong className="mt-3 block text-[13px] font-semibold">{title}</strong>
        {text && <span className="mx-auto mt-1 block max-w-xs text-[12px] leading-5 text-[var(--faint)]">{text}</span>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

export function Panel({ title, description, icon, children }: {
  title: string; description?: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-start gap-2.5 px-1">
        {icon && (
          <span className="mt-px grid size-[22px] shrink-0 place-items-center rounded-[7px] border border-[var(--line)] bg-[var(--raised)] text-[var(--muted)] shadow-[inset_0_1px_0_var(--sheen)]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold tracking-[-.015em]">{title}</h2>
          {description && <p className="mt-1 text-[12px] leading-5 text-[var(--faint)]">{description}</p>}
        </div>
      </div>
      <div className="divide-y divide-[var(--line)] rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] px-4 shadow-[var(--e1)]">{children}</div>
    </section>
  );
}

export function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <strong className="block text-[13px] font-medium tracking-[-.01em]">{title}</strong>
        {description && <span className="mt-0.5 block truncate text-[12px] text-[var(--faint)]">{description}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
