import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Tabs } from "radix-ui";
import { Broom, Download } from "../components/icons";
import { DownloadCard } from "../components/DownloadCard";
import { Empty, PageBody, PageHeader } from "../components/page";
import { Button } from "../components/ui/button";
import type { DownloadState, DownloadTask, Page } from "../types";

export type TaskHandlers = {
  for: (t: DownloadTask) => {
    onAction: (a: "pause" | "resume" | "cancel" | "retry") => void;
    onOpen: () => void;
    onReveal: () => void;
    onRemove: () => void;
  };
};

const ACTIVE: DownloadState[] = ["queued", "preparing", "downloading", "paused", "finalizing"];
const FINISHED: DownloadState[] = ["completed", "cancelled", "error"];
export const isActive = (s: DownloadState) => ACTIVE.includes(s);
export const isFinished = (s: DownloadState) => FINISHED.includes(s);

const FILTERS = [
  { id: "all", label: "Tous", test: () => true },
  { id: "active", label: "En cours", test: (t: DownloadTask) => isActive(t.state) },
  { id: "done", label: "Terminés", test: (t: DownloadTask) => t.state === "completed" },
  { id: "failed", label: "Échecs", test: (t: DownloadTask) => t.state === "error" || t.state === "cancelled" },
] as const;

export function DownloadsPage({ downloads, handlers, onClear, go }: {
  downloads: DownloadTask[]; handlers: TaskHandlers; onClear: () => void; go: (p: Page) => void;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const test = FILTERS.find((f) => f.id === filter)!.test;
  const shown = downloads.filter(test);
  const finished = downloads.filter((t) => isFinished(t.state)).length;
  const active = downloads.filter((t) => isActive(t.state)).length;

  return (
    <>
      <PageHeader
        title="Téléchargements"
        description={`${active} en cours · ${downloads.length} au total`}
        actions={finished > 0 && <Button variant="secondary" size="sm" onClick={onClear}><Broom size={14} />Retirer les terminés</Button>}
      />
      <PageBody>
        <Tabs.Root value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <Tabs.List aria-label="Filtrer" className="mb-5 inline-flex h-9 items-center rounded-[11px] border border-[var(--line)] bg-[var(--raised)] p-[3px] shadow-[inset_0_1px_2px_rgb(0_0_0/.06)]">
            {FILTERS.map((f) => (
              <Tabs.Trigger key={f.id} value={f.id}
                className="flex h-full items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-medium text-[var(--muted)] transition-all duration-200 ease-[var(--ease-out)] hover:text-[var(--ink)] data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--ink)] data-[state=active]:shadow-[inset_0_1px_0_var(--sheen),var(--e1)]">
                {f.label}
                <span className="mono text-[11px] tabular-nums text-[var(--faint)]">{downloads.filter(f.test).length}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        <div className="space-y-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((t) => <DownloadCard key={t.id} task={t} {...handlers.for(t)} />)}
          </AnimatePresence>
        </div>
        {shown.length === 0 && (
          <Empty
            icon={<Download size={16} />}
            title={downloads.length ? "Rien dans cette catégorie" : "Aucun téléchargement"}
            text={downloads.length ? undefined : "Les téléchargements lancés depuis l'accueil apparaissent ici."}
            action={!downloads.length && <Button size="sm" onClick={() => go("home")}>Nouveau téléchargement</Button>}
          />
        )}
      </PageBody>
    </>
  );
}
