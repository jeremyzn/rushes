import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog as D } from "radix-ui";
import { motion } from "motion/react";
import { ArrowRight, Search } from "./icons";
import { Kbd } from "./ui/badge";

export type Command = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ReactNode;
  run: () => void;
};

/** Palette ⌘K : navigation et actions au clavier, sans quitter les mains du clavier. */
export function CommandPalette({ open, onOpenChange, commands }: {
  open: boolean; onOpenChange: (v: boolean) => void; commands: Command[];
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.hint ?? ""} ${c.group}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => { setIndex(0); }, [query, open]);
  useEffect(() => { if (!open) setQuery(""); }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => (i + 1) % Math.max(results.length, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => (i - 1 + results.length) % Math.max(results.length, 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const c = results[index]; if (c) { c.run(); onOpenChange(false); } }
  }

  let lastGroup = "";

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <D.Content
          onKeyDown={onKeyDown}
          className="glass fixed left-1/2 top-[12vh] z-[130] w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-[20px] outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2"
        >
          <D.Title className="sr-only">Palette de commandes</D.Title>
          <D.Description className="sr-only">Recherche une page ou une action</D.Description>

          <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4">
            <Search size={16} className="shrink-0 text-[var(--faint)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une action…"
              className="h-12 min-w-0 flex-1 bg-transparent text-[14px] tracking-[-.01em] outline-none placeholder:text-[var(--faint)]"
            />
            <Kbd className="hidden sm:grid">ESC</Kbd>
          </div>

          <div ref={listRef} className="max-h-[min(380px,55dvh)] overflow-y-auto p-1.5">
            {results.length === 0 && (
              <p className="px-3 py-8 text-center text-[13px] text-[var(--faint)]">Aucun résultat pour « {query} »</p>
            )}
            {results.map((c, i) => {
              const newGroup = c.group !== lastGroup;
              lastGroup = c.group;
              const active = i === index;
              return (
                <div key={c.id}>
                  {newGroup && (
                    <div className="px-2.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--faint)]">{c.group}</div>
                  )}
                  <button
                    data-index={i}
                    onMouseMove={() => setIndex(i)}
                    onClick={() => { c.run(); onOpenChange(false); }}
                    className="relative isolate flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] tracking-[-.01em] text-[var(--ink)] outline-none"
                  >
                    {active && <motion.span layoutId="cmd-active" transition={{ type: "spring", stiffness: 600, damping: 40 }} className="absolute inset-0 -z-10 rounded-lg bg-[var(--raised)]" />}
                    <span className="grid size-4 shrink-0 place-items-center text-[var(--muted)]">{c.icon}</span>
                    <span className="truncate">{c.label}</span>
                    {c.hint && <span className="ml-auto truncate pl-3 text-[11px] text-[var(--faint)]">{c.hint}</span>}
                    {active && <ArrowRight size={13} className="ml-1 shrink-0 text-[var(--faint)]" />}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 border-t border-[var(--line)] px-4 py-2 text-[10px] text-[var(--faint)]">
            <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> naviguer</span>
            <span className="flex items-center gap-1"><Kbd>↵</Kbd> ouvrir</span>
            <span className="ml-auto hidden items-center gap-1 sm:flex"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}


