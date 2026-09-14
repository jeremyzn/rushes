import { Progress as P } from "radix-ui";
import { cn } from "../../lib/utils";

export function Progress({ value, className, tone = "default", thick }: {
  value: number; className?: string; tone?: "default" | "ok" | "bad"; thick?: boolean;
}) {
  const bar = tone === "ok" ? "bg-[var(--ok)]" : tone === "bad" ? "bg-[var(--bad)]" : "bg-[var(--inverse)]";
  const pct = Math.max(0, Math.min(100, value));

  return (
    <P.Root
      value={pct}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-[var(--line)] shadow-[inset_0_1px_1px_rgb(0_0_0/.06)]",
        thick ? "h-[5px]" : "h-[3px]",
        className,
      )}
    >
      <P.Indicator
        className={cn("h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out)]", bar)}
        style={{ width: `${pct}%` }}
      />
    </P.Root>
  );
}
