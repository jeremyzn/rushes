import { openExternal } from "../lib/platform";
import { Download, FolderOpen, Gauge, Github, HardDrive, Moon, RefreshCw, ShieldCheck, Sparkles } from "../components/icons";
import { PageBody, PageHeader, Panel, Row } from "../components/page";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { SelectBox } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import type { EngineStatus, RuntimeInfo, Settings } from "../types";

export function SettingsPage({ settings, save, chooseFolder, engines, runtime, updateBusy, engineBusy, checkUpdate, updateEngines, online }: {
  settings: Settings; save: (p: Partial<Settings>) => Promise<void>; chooseFolder: () => void;
  engines: EngineStatus[]; runtime: RuntimeInfo | null; updateBusy: boolean; engineBusy: boolean;
  checkUpdate: () => void; updateEngines: () => void; online: boolean;
}) {
  const updaterEnabled = !!runtime?.updaterEnabled;
  const updateDescription = !updaterEnabled
    ? "Désactivées dans cette version de développement"
    : online ? `Version installée : ${runtime?.version}` : "Connexion Internet requise";

  return (
    <>
      <PageHeader title="Réglages" />
      <PageBody className="max-w-[720px] space-y-7">
        <Panel title="Téléchargements" icon={<Gauge size={12} />}>
          <Row title="Dossier de destination" description={settings.outputDir}>
            <Button variant="secondary" size="sm" onClick={chooseFolder}><FolderOpen size={14} />Modifier</Button>
          </Row>
          <Row title="Fragments parallèles" description="Plus de fragments accélèrent les VOD longues">
            <SelectBox value={settings.speedProfile} onChange={(v) => void save({ speedProfile: v as Settings["speedProfile"] })}
              items={[{ value: "eco", label: "Éco", detail: "2" }, { value: "normal", label: "Normal", detail: "4" }, { value: "auto", label: "Auto", detail: "6" }, { value: "turbo", label: "Rapide", detail: "8" }, { value: "max", label: "Maximum", detail: "10" }]} />
          </Row>
          <Row title="Téléchargements simultanés" description="Les suivants attendent dans la file">
            <SelectBox value={String(settings.concurrentDownloads)} onChange={(v) => void save({ concurrentDownloads: Number(v) })}
              items={[1, 2, 3, 4].map((v) => ({ value: String(v), label: String(v) }))} />
          </Row>
          <Row title="Conteneur vidéo" description="Auto conserve le format d'origine quand c'est possible">
            <SelectBox value={settings.container} onChange={(v) => void save({ container: v as Settings["container"] })}
              items={[{ value: "auto", label: "Auto" }, { value: "mp4", label: "MP4" }, { value: "mkv", label: "MKV" }]} />
          </Row>
          <Row title="Format audio" description="Utilisé en mode Audio">
            <SelectBox value={settings.audioFormat} onChange={(v) => void save({ audioFormat: v as Settings["audioFormat"] })}
              items={[{ value: "m4a", label: "M4A" }, { value: "mp3", label: "MP3" }, { value: "flac", label: "FLAC" }]} />
          </Row>
          <Row title="Métadonnées" description="Fichier .info.json à côté du média">
            <Switch checked={settings.downloadMetadata} onCheckedChange={(v) => void save({ downloadMetadata: v })} />
          </Row>
          <Row title="Miniature" description="Image de couverture à côté du média">
            <Switch checked={settings.downloadThumbnail} onCheckedChange={(v) => void save({ downloadThumbnail: v })} />
          </Row>
          <Row title="Notification de fin" description="Notification système quand un téléchargement se termine">
            <Switch checked={settings.notifications} onCheckedChange={(v) => void save({ notifications: v })} />
          </Row>
        </Panel>

        <Panel title="Apparence" icon={<Moon size={12} />}>
          <Row title="Thème">
            <SelectBox value={settings.theme} onChange={(v) => void save({ theme: v as Settings["theme"] })}
              items={[{ value: "system", label: "Système" }, { value: "light", label: "Clair" }, { value: "dark", label: "Sombre" }]} />
          </Row>
          <Row title="Réduire les animations">
            <Switch checked={settings.reducedMotion} onCheckedChange={(v) => void save({ reducedMotion: v })} />
          </Row>
        </Panel>

        <Panel title="Accès aux contenus" icon={<ShieldCheck size={12} />} description="À utiliser uniquement pour des contenus dont le téléchargement est autorisé. Aucun contournement de DRM.">
          <Row title="Cookies du navigateur" description="Pour les contenus réservés à un compte connecté">
            <SelectBox value={settings.cookiesBrowser} onChange={(v) => void save({ cookiesBrowser: v as Settings["cookiesBrowser"] })}
              items={[{ value: "none", label: "Aucun" }, { value: "chrome", label: "Chrome" },
                ...(runtime?.os === "windows" ? [{ value: "edge", label: "Edge" }] : []),
                { value: "firefox", label: "Firefox" },
                ...(runtime?.os === "macos" ? [{ value: "safari", label: "Safari" }] : [])]} />
          </Row>
        </Panel>

        <Panel title="Mises à jour" icon={<Sparkles size={12} />}>
          <Row title="Rushes" description={updateDescription}>
            <Button variant="secondary" size="sm" onClick={checkUpdate} busy={updateBusy} disabled={!updaterEnabled || !online}>
              <RefreshCw size={14} />Rechercher
            </Button>
          </Row>
          <Row title="Vérifier au démarrage">
            <Switch checked={settings.autoCheckUpdates} disabled={!updaterEnabled} onCheckedChange={(v) => void save({ autoCheckUpdates: v })} />
          </Row>
          <Row title="Mettre à jour yt-dlp automatiquement" description="Les plateformes changent souvent : un yt-dlp récent évite la plupart des erreurs">
            <Switch checked={settings.autoUpdateEngines} onCheckedChange={(v) => void save({ autoUpdateEngines: v })} />
          </Row>
          <Row title="Mettre à jour yt-dlp maintenant">
            <Button variant="secondary" size="sm" onClick={updateEngines} busy={engineBusy} disabled={!online}>
              <Download size={14} />Mettre à jour
            </Button>
          </Row>
        </Panel>

        <Panel title="Moteurs" description="Binaires embarqués dans l'application, mis à jour indépendamment d'elle." icon={<HardDrive size={12} />}>
          {engines.map((e) => (
            <Row key={e.name} title={e.name} description={e.path || "Introuvable"}>
              <div className="flex items-center gap-2">
                <span className="mono text-[11.5px] text-[var(--muted)]">{e.available ? (e.version.length > 28 ? `${e.version.slice(0, 28)}…` : e.version) : ""}</span>
                {e.available
                  ? e.bundled ? <Badge>Intégré</Badge> : <Badge>Système</Badge>
                  : <Badge className="border-transparent bg-[var(--bad)]/12 text-[var(--bad)]">Absent</Badge>}
              </div>
            </Row>
          ))}
        </Panel>

        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[12px] text-[var(--faint)] shadow-[var(--e1)]">
          <div className="flex flex-col gap-0.5">
            <span className="mono">Rushes {runtime?.version} · {runtime?.os} {runtime?.arch}</span>
            <span>© 2026 ZenoX HQ · zenoxhq.fr · Tous droits réservés</span>
          </div>
          {import.meta.env.VITE_PROJECT_URL && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void openExternal(import.meta.env.VITE_PROJECT_URL)}>
              <Github size={13} />Code source
            </Button>
          )}
        </div>
      </PageBody>
    </>
  );
}
