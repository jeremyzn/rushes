import { Clock3 } from "../components/icons";
import { ProviderIcon, providerMeta } from "../components/providers";
import { Empty, PageBody, PageHeader } from "../components/page";
import { StateBadge } from "../components/ui/stat";
import { formatBytes } from "../lib/utils";
import type { DownloadTask } from "../types";

/* Les données tabulaires restent dans un tableau : une grille de tuiles
   empêche de comparer une colonne d'une ligne à l'autre. */
const COLUMNS = "minmax(0,1fr) 132px 96px 104px";

export function HistoryPage({ tasks }: { tasks: DownloadTask[] }) {
  return (
    <>
      <PageHeader
        title="Historique"
        description={tasks.length ? `${tasks.length} opération${tasks.length > 1 ? "s" : ""} sur cet appareil` : "Toutes les opérations sur cet appareil"}
      />
      <PageBody>
        {tasks.length ? (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--e1)]">
            <div
              className="grid gap-3 border-b border-[var(--line)] bg-[var(--raised)]/60 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[.08em] text-[var(--faint)]"
              style={{ gridTemplateColumns: COLUMNS }}
            >
              <span>Média</span>
              <span>Date</span>
              <span className="text-right">Taille</span>
              <span className="text-right">État</span>
            </div>

            {tasks.map((t, i) => (
              <div
                key={t.id}
                className={`grid items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-[var(--raised)] ${i ? "border-t border-[var(--line)]" : ""}`}
                style={{ gridTemplateColumns: COLUMNS }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--raised)] text-[var(--faint)]">
                    <ProviderIcon provider={t.provider} size={12} />
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-[12.5px] font-medium tracking-[-.01em]">{t.title}</strong>
                    <span className="block truncate text-[11px] text-[var(--faint)]">
                      {providerMeta[t.provider].label} · {t.author}
                      {t.error ? ` · ${t.error}` : ""}
                    </span>
                  </div>
                </div>

                <span className="mono text-[11.5px] text-[var(--muted)]">
                  {new Date(t.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="mono text-right text-[11.5px] tabular-nums text-[var(--muted)]">
                  {formatBytes(t.totalBytes ?? t.downloadedBytes)}
                </span>
                <span className="flex justify-end"><StateBadge state={t.state} /></span>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={<Clock3 size={16} />} title="Aucune activité" text="Chaque téléchargement, réussi ou non, est consigné ici." />
        )}
      </PageBody>
    </>
  );
}
