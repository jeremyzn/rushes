import { Activity, ChevronRight, Download, Film, HardDrive, Zap } from "../components/icons";
import { DownloadCard } from "../components/DownloadCard";
import { Empty, PageBody, PageHeader, SectionTitle } from "../components/page";
import { UrlAnalyzer, type AnalyzerState } from "../components/UrlAnalyzer";
import { Button } from "../components/ui/button";
import { Tile } from "../components/ui/card";
import { formatBytes, formatSpeed } from "../lib/utils";
import { LibraryGrid } from "./LibraryPage";
import { isActive, type TaskHandlers } from "./DownloadsPage";
import type { DownloadTask, Page } from "../types";

export function HomePage({ analyzer, downloads, handlers, go }: {
  analyzer: AnalyzerState; downloads: DownloadTask[]; handlers: TaskHandlers; go: (p: Page) => void;
}) {
  const active = downloads.filter((t) => isActive(t.state));
  const done = downloads.filter((t) => t.state === "completed");
  const recent = done.slice(0, 8);
  const speed = downloads.reduce((s, t) => s + (t.state === "downloading" ? t.speedBps : 0), 0);
  const stored = done.reduce((s, t) => s + (t.totalBytes ?? t.downloadedBytes), 0);

  return (
    <>
      <PageHeader
        title="Accueil"
        description={active.length
          ? `${active.length} téléchargement${active.length > 1 ? "s" : ""} en cours · ${formatSpeed(speed)}`
          : "Colle un lien pour commencer"}
      />

      <PageBody className="space-y-9">
        <section>
          <UrlAnalyzer state={analyzer} placeholder="Lien Twitch, YouTube, TikTok…" />
        </section>

        {/* Tuiles de mesure : une donnée par tuile, jamais deux. */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile
            label="En cours"
            icon={<Activity size={13} />}
            value={active.length}
            hint={active.length ? `${downloads.length} au total` : "File vide"}
          />
          <Tile
            label="Débit"
            icon={<Zap size={13} />}
            value={speed ? formatSpeed(speed).replace("/s", "") : "0"}
            hint={speed ? "par seconde" : "aucun transfert"}
          />
          <Tile
            label="Terminés"
            icon={<Film size={13} />}
            value={done.length}
            hint={done.length ? "dans la bibliothèque" : "rien encore"}
          />
          <Tile
            label="Stocké"
            icon={<HardDrive size={13} />}
            value={stored ? formatBytes(stored).split(" ")[0] : "0"}
            hint={stored ? formatBytes(stored).split(" ")[1] : "aucun fichier"}
          />
        </section>

        <section>
          <SectionTitle
            title="En cours"
            count={active.length}
            action={downloads.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => go("downloads")}>
                Tout afficher<ChevronRight size={14} />
              </Button>
            )}
          />
          {active.length
            ? <div className="space-y-2.5">{active.slice(0, 4).map((t) => <DownloadCard key={t.id} task={t} {...handlers.for(t)} />)}</div>
            : <Empty compact icon={<Download size={16} />} title="Aucun téléchargement en cours" text="Les transferts lancés depuis la barre ci-dessus apparaissent ici." />}
        </section>

        {recent.length > 0 && (
          <section>
            <SectionTitle
              title="Récemment terminés"
              count={done.length}
              action={<Button variant="ghost" size="sm" onClick={() => go("library")}>Bibliothèque<ChevronRight size={14} /></Button>}
            />
            <LibraryGrid tasks={recent} handlers={handlers} />
          </section>
        )}
      </PageBody>
    </>
  );
}
