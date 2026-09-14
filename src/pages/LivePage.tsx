import { Radio } from "../components/icons";
import { DownloadCard } from "../components/DownloadCard";
import { Empty, PageBody, PageHeader, SectionTitle } from "../components/page";
import { UrlAnalyzer, type AnalyzerState } from "../components/UrlAnalyzer";
import type { TaskHandlers } from "./DownloadsPage";
import type { DownloadTask } from "../types";

export function LivePage({ analyzer, downloads, handlers }: { analyzer: AnalyzerState; downloads: DownloadTask[]; handlers: TaskHandlers }) {
  const recordings = downloads.filter((t) => t.mediaType === "live");

  return (
    <>
      <PageHeader title="Directs" description="Enregistrement de diffusions en cours" />
      <PageBody className="space-y-9">
        <section>
          <SectionTitle title="Enregistrer un direct" />
          <UrlAnalyzer state={analyzer} placeholder="Lien de la chaîne en direct, ex. twitch.tv/nom" />
          <p className="mt-2 px-1 text-[12px] text-[var(--faint)]">
            L'enregistrement démarre au début du direct quand la plateforme le permet et relance la connexion en cas de coupure.
          </p>
        </section>

        <section>
          <SectionTitle title="Enregistrements" count={recordings.length} />
          {recordings.length
            ? <div className="space-y-2.5">{recordings.map((t) => <DownloadCard key={t.id} task={t} {...handlers.for(t)} />)}</div>
            : <Empty compact icon={<Radio size={16} />} title="Aucun enregistrement" text="Les directs capturés apparaissent ici." />}
        </section>
      </PageBody>
    </>
  );
}
