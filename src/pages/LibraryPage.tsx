import { useState } from "react";
import { Film, FolderOpen, Play, Search, X } from "../components/icons";
import { ProviderIcon } from "../components/providers";
import { Empty, PageBody, PageHeader } from "../components/page";
import { Button } from "../components/ui/button";
import { Tooltip } from "../components/ui/tooltip";
import { formatBytes } from "../lib/utils";
import type { TaskHandlers } from "./DownloadsPage";
import type { DownloadTask, Page } from "../types";

export function LibraryPage({ tasks, handlers, openOutputDir, go }: {
  tasks: DownloadTask[]; handlers: TaskHandlers; openOutputDir: () => void; go: (p: Page) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? tasks.filter((t) => `${t.title} ${t.author}`.toLowerCase().includes(q)) : tasks;
  const size = tasks.reduce((s, t) => s + (t.totalBytes ?? t.downloadedBytes), 0);

  return (
    <>
      <PageHeader
        title="Bibliothèque"
        description={tasks.length ? `${tasks.length} média${tasks.length > 1 ? "s" : ""} · ${formatBytes(size)}` : "Aucun média"}
        actions={<Button variant="secondary" size="sm" onClick={openOutputDir}><FolderOpen size={14} />Ouvrir le dossier</Button>}
      />
      <PageBody>
        {tasks.length > 0 && (
          <div className="mb-5 flex h-9 max-w-xs items-center gap-2 rounded-[11px] border border-[var(--line)] bg-[var(--surface)] px-3 shadow-[var(--e1)] transition-[border-color,box-shadow] duration-200 focus-within:border-[var(--line-strong)] focus-within:shadow-[0_0_0_3px_var(--line)]">
            <Search size={14} className="shrink-0 text-[var(--faint)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer par titre ou chaîne"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--faint)]"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Effacer" className="grid size-5 shrink-0 place-items-center rounded-md text-[var(--faint)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--ink)]">
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {shown.length
          ? <LibraryGrid tasks={shown} handlers={handlers} />
          : <Empty
              icon={<Film size={16} />}
              title={tasks.length ? "Aucun résultat" : "Bibliothèque vide"}
              text={tasks.length ? `Rien ne correspond à « ${query} ».` : "Les médias téléchargés apparaissent ici."}
              action={tasks.length
                ? <Button variant="secondary" size="sm" onClick={() => setQuery("")}>Effacer le filtre</Button>
                : <Button size="sm" onClick={() => go("home")}>Nouveau téléchargement</Button>}
            />}
      </PageBody>
    </>
  );
}

export function LibraryGrid({ tasks, handlers }: { tasks: DownloadTask[]; handlers: TaskHandlers }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tasks.map((t) => {
        const h = handlers.for(t);
        return (
          <article
            key={t.id}
            className="lift group overflow-hidden rounded-[var(--radius-tile)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--e1)] hover:border-[var(--line-strong)]"
          >
            <button onClick={h.onOpen} className="relative block aspect-video w-full overflow-hidden bg-[var(--raised)]" aria-label={`Lire ${t.title}`}>
              {t.thumbnail
                ? <img src={t.thumbnail} alt="" className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.04]" />
                : <span className="grid size-full place-items-center text-[var(--faint)]"><ProviderIcon provider={t.provider} size={22} /></span>}

              <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity duration-250 group-hover:opacity-100">
                <span className="grid size-10 place-items-center rounded-full bg-white/94 text-black shadow-lg transition-transform duration-250 ease-[var(--ease-spring)] group-hover:scale-100 scale-90">
                  <Play size={15} fill="currentColor" />
                </span>
              </span>

              <span className="mono absolute bottom-2 left-2 rounded-[6px] bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                {t.mode === "audio" ? "Audio" : t.quality}
              </span>
            </button>

            <div className="flex items-start gap-2 p-3">
              <div className="min-w-0 flex-1">
                <strong className="line-clamp-2 text-[12.5px] font-medium leading-snug tracking-[-.01em]">{t.title}</strong>
                <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11.5px] text-[var(--faint)]">
                  <ProviderIcon provider={t.provider} size={10} className="shrink-0" />
                  <span className="truncate">{t.author}</span>
                  <span aria-hidden className="size-[2.5px] shrink-0 rounded-full bg-current opacity-40" />
                  <span className="mono shrink-0">{formatBytes(t.totalBytes ?? t.downloadedBytes)}</span>
                </p>
              </div>
              <Tooltip label="Afficher dans le dossier">
                <Button variant="ghost" size="icon-sm" onClick={h.onReveal} aria-label="Afficher dans le dossier" className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <FolderOpen size={14} />
                </Button>
              </Tooltip>
            </div>
          </article>
        );
      })}
    </div>
  );
}
