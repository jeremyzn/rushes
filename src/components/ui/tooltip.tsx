import { Tooltip as T } from "radix-ui";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <T.Provider delayDuration={320} skipDelayDuration={200}>{children}</T.Provider>;
}

export function Tooltip({ children, label, keys }: { children: React.ReactNode; label: string; keys?: string[] }) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          sideOffset={8}
          className="z-[120] flex items-center gap-2 rounded-lg bg-[var(--inverse)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--on-inverse)] shadow-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:zoom-in-95"
        >
          {label}
          {keys?.length ? (
            <span className="flex gap-1">
              {keys.map((k) => (
                <kbd key={k} className="mono grid h-4 min-w-4 place-items-center rounded border border-[var(--on-inverse)]/25 px-1 text-[10px] opacity-70">{k}</kbd>
              ))}
            </span>
          ) : null}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
