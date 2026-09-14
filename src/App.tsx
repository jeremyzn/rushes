import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { toast, Toaster } from "sonner";
import { Broom, ClipboardPaste, Download, FolderOpen, Laptop2, LoaderCircle, Moon, RefreshCw, Sun } from "./components/icons";
import {
  analyzeUrl, clearFinished, engineStatus, isDemo, listDownloads, loadSettings, removeTask, runtimeInfo,
  installJsRuntime, removeJsRuntime, saveSettings, startDownload, taskAction, updateEngines,
} from "./lib/backend";
import {
  checkForUpdate, notify, openPath, pickFolder, relaunchApp, revealItemInDir,
  type AppUpdate, type DownloadEvent,
} from "./lib/platform";
import { useNetworkStatus } from "./hooks/use-network-status";
import { Logo, PAGES } from "./components/brand";
import { AppHeader } from "./components/AppHeader";
import { providerMeta } from "./components/providers";
import { NetworkBanner } from "./components/NetworkBanner";
import { CommandPalette, type Command as Cmd } from "./components/CommandPalette";
import type { AnalyzerState } from "./components/UrlAnalyzer";
import { Button } from "./components/ui/button";
import { Progress } from "./components/ui/progress";
import { Dialog } from "./components/ui/dialog";
import { TooltipProvider } from "./components/ui/tooltip";
import { HomePage } from "./pages/HomePage";
import { DownloadsPage, isActive, type TaskHandlers } from "./pages/DownloadsPage";
import { LivePage } from "./pages/LivePage";
import { LibraryPage } from "./pages/LibraryPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { DownloadMode, DownloadTask, EngineStatus, MediaInfo, Page, RuntimeInfo, Settings } from "./types";

function resolveDark(theme: Settings["theme"]) {
  return theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
}
export function applyTheme(theme: Settings["theme"]) {
  document.documentElement.classList.toggle("dark", resolveDark(theme));
  // Mémorisé pour l'appliquer avant le premier rendu (évite le flash au démarrage)
  try { localStorage.setItem("rushes-theme", theme); } catch { /* stockage indisponible */ }
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [page, setPage] = useState<Page>("home");
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [quality, setQuality] = useState("best");
  const [mode, setMode] = useState<DownloadMode>("video");
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [engineBusy, setEngineBusy] = useState(false);
  const [jsRuntimeBusy, setJsRuntimeBusy] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{ downloaded: number; total?: number } | null>(null);
  const [updateDialog, setUpdateDialog] = useState<{ version: string; body?: string; update: AppUpdate } | null>(null);

  const previousStates = useRef<Record<string, string>>({});
  const jsRuntimeOffered = useRef(false);
  const settingsRef = useRef<Settings | null>(null);
  const engineAutoChecked = useRef(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLElement>(null);

  const { status: network, checking: networkChecking, refresh: refreshNetwork } = useNetworkStatus();

  useEffect(() => {
    Promise.all([loadSettings(), listDownloads(), engineStatus(), runtimeInfo()]).then(([s, d, e, r]) => {
      setSettings(s); setDownloads(d); setEngines(e); setRuntime(r); applyTheme(s.theme);
    }).catch((e) => toast.error("Initialisation incomplète", { description: String(e) })).finally(() => setInitializing(false));
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    if (!settings) return;
    applyTheme(settings.theme);
    document.documentElement.dataset.reduceMotion = String(settings.reducedMotion);
    const q = matchMedia("(prefers-color-scheme: dark)");
    const handler = () => settings.theme === "system" && applyTheme("system");
    q.addEventListener("change", handler);
    return () => q.removeEventListener("change", handler);
  }, [settings]);

  // L'updater n'existe que dans les builds de release : en développement, aucune vérification.
  // Vérification au lancement puis toutes les six heures, pour que les sessions
  // longues finissent par voir une version publiée après leur démarrage.
  useEffect(() => {
    if (!settings?.autoCheckUpdates || !runtime?.updaterEnabled) return;
    let cancelled = false;
    const look = () => checkForUpdate()
      .then((u) => { if (u && !cancelled) setUpdateDialog((current) => current ?? { version: u.version, body: u.body ?? undefined, update: u }); })
      .catch(() => {});
    void look();
    const timer = setInterval(() => void look(), 6 * 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [settings?.autoCheckUpdates, runtime?.updaterEnabled]);

  // Proposé une seule fois par session, et seulement si le moteur manque vraiment.
  useEffect(() => {
    if (!engines.length || jsRuntimeOffered.current || !network.online || jsRuntimeBusy) return;
    const js = engines.find((e) => e.name === "Deno");
    if (!js || js.available) return;
    jsRuntimeOffered.current = true;
    toast("Moteur JavaScript manquant", {
      description: "YouTube en a besoin pour proposer toutes les qualités. Environ 40 Mo à télécharger.",
      duration: 12000,
      action: { label: "Installer", onClick: () => void installJsRuntimeNow() },
    });
  }, [engines, network.online, jsRuntimeBusy]);

  useEffect(() => {
    if (!settings?.autoUpdateEngines || !network.online || engineAutoChecked.current) return;
    engineAutoChecked.current = true;
    const timer = window.setTimeout(() => {
      updateEngines().then(() => engineStatus()).then(setEngines).catch(() => {});
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [settings?.autoUpdateEngines, network.online]);

  useEffect(() => {
    const id = window.setInterval(async () => {
      try {
        const next = await listDownloads();
        for (const t of next) {
          const prev = previousStates.current[t.id];
          if (prev && prev !== "completed" && t.state === "completed") {
            toast.success("Téléchargement terminé", { description: t.title });
            if (settingsRef.current?.notifications) void notify("Rushes", `Téléchargement terminé : ${t.title}`);
          }
          previousStates.current[t.id] = t.state;
        }
        setDownloads(next);
      } catch { /* app en cours de fermeture */ }
    }, 700);
    return () => clearInterval(id);
  }, []);

  /* Dérivés */
  const active = useMemo(() => downloads.filter((d) => isActive(d.state)), [downloads]);
  const activeCount = active.length;
  const completed = useMemo(() => downloads.filter((d) => d.state === "completed"), [downloads]);
  const totalSpeed = useMemo(() => downloads.reduce((sum, d) => sum + (d.state === "downloading" ? d.speedBps : 0), 0), [downloads]);

  /** Progression de la file entière, pondérée par la taille : une petite
      tâche terminée ne doit pas faire bondir le fil du header. */
  const globalProgress = useMemo(() => {
    if (!active.length) return 0;
    const known = active.filter((t) => t.totalBytes);
    if (!known.length) return active.reduce((s, t) => s + t.progress, 0) / active.length;
    const total = known.reduce((s, t) => s + (t.totalBytes ?? 0), 0);
    const done = known.reduce((s, t) => s + t.downloadedBytes, 0);
    return total ? done / total : 0;
  }, [active]);

  /* Navigation */
  const go = useCallback((p: Page) => {
    setPage(p);
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const focusUrl = useCallback(() => {
    setPage((p) => (p === "home" || p === "live" ? p : "home"));
    setTimeout(() => urlInputRef.current?.focus(), 60);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = settingsRef.current;
    if (!current) return;
    void save({ theme: resolveDark(current.theme) ? "light" : "dark" });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "k") { e.preventDefault(); setPaletteOpen((v) => !v); return; }
      if (k === "l") { e.preventDefault(); focusUrl(); return; }
      if (k === ",") { e.preventDefault(); go("settings"); return; }
      const target = PAGES.find((p) => p.key === e.key);
      if (target) { e.preventDefault(); go(target.id); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusUrl, go]);

  /* Actions */
  async function analyze() {
    if (!url.trim() || analyzing) return;
    if (!network.online) { toast.error("Connexion Internet requise"); return; }
    setAnalyzing(true); setInfo(null);
    try {
      const media = await analyzeUrl(url.trim());
      setInfo(media); setQuality(media.qualities[0]?.id || "best");
    } catch (e) { toast.error("Analyse impossible", { description: String(e) }); }
    finally { setAnalyzing(false); }
  }

  async function download() {
    if (!info || !settings || !network.online) return;
    try {
      const task = await startDownload({
        url: info.url, provider: info.provider, title: info.title, author: info.author, thumbnail: info.thumbnail,
        quality, mediaType: info.mediaType, speedProfile: settings.speedProfile, mode,
        audioFormat: settings.audioFormat, container: settings.container,
      });
      setDownloads((v) => [task, ...v.filter((t) => t.id !== task.id)]);
      setInfo(null); setUrl("");
      toast.success("Ajouté à la file", { description: `${providerMeta[info.provider].label} · ${info.title}` });
    } catch (e) { toast.error("Impossible de démarrer", { description: String(e) }); }
  }

  async function refreshAfter(action: () => Promise<unknown>, errorTitle: string) {
    try { await action(); setDownloads(await listDownloads()); }
    catch (e) { toast.error(errorTitle, { description: String(e) }); }
  }

  const handlers: TaskHandlers = {
    for: (t) => ({
      onAction: (a) => void refreshAfter(() => taskAction(t.id, a), "Action impossible"),
      onRemove: () => void refreshAfter(() => removeTask(t.id), "Suppression impossible"),
      onOpen: () => { if (t.outputPath) openPath(t.outputPath).catch((e) => toast.error("Ouverture impossible", { description: String(e) })); },
      onReveal: () => { if (t.outputPath) revealItemInDir(t.outputPath).catch((e) => toast.error("Dossier introuvable", { description: String(e) })); },
    }),
  };

  async function save(patch: Partial<Settings>) {
    const current = settingsRef.current;
    if (!current) return;
    const next = { ...current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    try { await saveSettings(next); }
    catch (e) { toast.error("Réglage non enregistré", { description: String(e) }); }
  }

  async function chooseFolder() {
    const current = settingsRef.current;
    if (!current) return;
    try {
      const selected = await pickFolder(current.outputDir);
      if (selected) await save({ outputDir: selected });
    } catch (e) { toast.error("Sélecteur de dossier indisponible", { description: String(e) }); }
  }

  function openOutputDir() {
    const dir = settingsRef.current?.outputDir;
    if (dir) openPath(dir).catch((e) => toast.error("Dossier introuvable", { description: String(e) }));
  }

  async function updateAllEngines() {
    if (!network.online) { toast.error("Connexion Internet requise"); return; }
    setEngineBusy(true);
    try { const result = await updateEngines(); setEngines(await engineStatus()); toast.success("Moteurs vérifiés", { description: result }); }
    catch (e) { toast.error("Mise à jour impossible", { description: String(e) }); }
    finally { setEngineBusy(false); }
  }

  // Deno n'est plus embarqué : il pèse à lui seul un tiers de l'installateur et ne
  // sert qu'à YouTube. On le récupère à la demande.
  async function installJsRuntimeNow() {
    if (!network.online) { toast.error("Connexion Internet requise"); return; }
    setJsRuntimeBusy(true);
    try {
      const version = await installJsRuntime();
      setEngines(await engineStatus());
      toast.success("Moteur JavaScript installé", { description: version });
    } catch (e) { toast.error("Installation impossible", { description: String(e) }); }
    finally { setJsRuntimeBusy(false); }
  }

  async function removeJsRuntimeNow() {
    setJsRuntimeBusy(true);
    try {
      await removeJsRuntime();
      setEngines(await engineStatus());
      jsRuntimeOffered.current = true;
      toast.success("Moteur JavaScript supprimé", { description: "YouTube proposera moins de qualités." });
    } catch (e) { toast.error("Suppression impossible", { description: String(e) }); }
    finally { setJsRuntimeBusy(false); }
  }

  async function checkUpdateManually() {
    if (!runtime?.updaterEnabled) {
      toast.info("Mises à jour désactivées", { description: "Cette version n'est reliée à aucun canal de publication signé." });
      return;
    }
    if (!network.online) { toast.error("Connexion Internet requise"); return; }
    setUpdateProgress(null); setUpdateBusy(true);
    try { const u = await checkForUpdate(); if (!u) toast.success("Rushes est à jour"); else setUpdateDialog({ version: u.version, body: u.body ?? undefined, update: u }); }
    catch (e) { toast.error("Vérification impossible", { description: String(e) }); }
    finally { setUpdateBusy(false); }
  }

  async function installUpdate() {
    if (!updateDialog?.update) return;
    setUpdateBusy(true); setUpdateProgress({ downloaded: 0 });
    try {
      let downloaded = 0; let total: number | undefined;
      await updateDialog.update.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === "Started") { total = event.data.contentLength ?? undefined; setUpdateProgress({ downloaded, total }); }
        else if (event.event === "Progress") { downloaded += event.data.chunkLength; setUpdateProgress({ downloaded, total }); }
        else if (event.event === "Finished") { setUpdateProgress({ downloaded: total ?? downloaded, total }); }
      });
      await relaunchApp();
    } catch (e) { toast.error("Installation impossible", { description: String(e) }); setUpdateBusy(false); setUpdateProgress(null); }
  }

  const commands: Cmd[] = useMemo(() => [
    ...PAGES.map((p) => ({ id: `nav-${p.id}`, label: p.label, hint: `⌘${p.key}`, group: "Aller à", icon: <p.icon size={14} />, run: () => go(p.id) })),
    { id: "act-url", label: "Nouveau téléchargement", hint: "⌘L", group: "Actions", icon: <ClipboardPaste size={14} />, run: focusUrl },
    { id: "act-folder", label: "Ouvrir le dossier de destination", group: "Actions", icon: <FolderOpen size={14} />, run: openOutputDir },
    { id: "act-clear", label: "Retirer les téléchargements terminés", group: "Actions", icon: <Broom size={14} />, run: () => void refreshAfter(clearFinished, "Nettoyage impossible") },
    { id: "act-engines", label: "Mettre à jour yt-dlp", group: "Actions", icon: <Download size={14} />, run: updateAllEngines },
    { id: "act-update", label: "Rechercher une mise à jour de Rushes", group: "Actions", icon: <RefreshCw size={14} />, run: checkUpdateManually },
    { id: "th-dark", label: "Thème sombre", group: "Apparence", icon: <Moon size={14} />, run: () => void save({ theme: "dark" }) },
    { id: "th-light", label: "Thème clair", group: "Apparence", icon: <Sun size={14} />, run: () => void save({ theme: "light" }) },
    { id: "th-system", label: "Thème du système", group: "Apparence", icon: <Laptop2 size={14} />, run: () => void save({ theme: "system" }) },
  ],[go, focusUrl, runtime, network.online]);

  if (initializing) return <Splash />;

  const isDark = settings ? resolveDark(settings.theme) : true;
  const analyzer: AnalyzerState = {
    url, setUrl, analyze, analyzing, info, quality, setQuality, mode, setMode, download, online: network.online, inputRef: urlInputRef,
  };

  return (
    <MotionConfig reducedMotion={settings?.reducedMotion ? "always" : "user"}>
      <TooltipProvider>
        <div className="relative flex h-dvh flex-col overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
          <div className="scene" aria-hidden />

          <AppHeader
            page={page} go={go} network={network} activeCount={activeCount} totalSpeed={totalSpeed}
            globalProgress={globalProgress} isDark={isDark} demo={isDemo()}
            toggleTheme={toggleTheme} openPalette={() => setPaletteOpen(true)} focusUrl={focusUrl}
          />

          {/* Le défilement appartient à cette zone : le verre du header a
              ainsi du contenu à échantillonner sous lui. */}
          <main ref={scrollRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-[78px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: .16, ease: [.22, 1, .36, 1] }}
              >
                {page !== "settings" && <NetworkBanner status={network} checking={networkChecking} onRetry={refreshNetwork} />}
                {page === "home" && <HomePage analyzer={analyzer} downloads={downloads} handlers={handlers} go={go} />}
                {page === "downloads" && <DownloadsPage downloads={downloads} handlers={handlers} go={go} onClear={() => void refreshAfter(clearFinished, "Nettoyage impossible")} />}
                {page === "live" && <LivePage analyzer={analyzer} downloads={downloads} handlers={handlers} />}
                {page === "library" && <LibraryPage tasks={completed} handlers={handlers} openOutputDir={openOutputDir} go={go} />}
                {page === "history" && <HistoryPage tasks={downloads} />}
                {page === "settings" && settings && (
                  <SettingsPage
                    settings={settings} save={save} chooseFolder={chooseFolder} engines={engines} runtime={runtime}
                    updateBusy={updateBusy} engineBusy={engineBusy} checkUpdate={checkUpdateManually}
                    jsRuntimeBusy={jsRuntimeBusy} installJs={() => void installJsRuntimeNow()} removeJs={() => void removeJsRuntimeNow()}
                    updateEngines={updateAllEngines} online={network.online}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <Toaster
            closeButton position="bottom-right" theme={isDark ? "dark" : "light"}
            toastOptions={{ classNames: { toast: "!rounded-xl !border-[var(--line)] !bg-[var(--overlay)] !text-[var(--ink)] !shadow-2xl !font-sans", description: "!text-[var(--muted)]" } }}
          />

          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />

          <Dialog
            open={!!updateDialog}
            onOpenChange={(v) => { if (!v) { setUpdateDialog(null); setUpdateProgress(null); } }}
            title={`Rushes ${updateDialog?.version || ""}`}
            description="Une nouvelle version signée est disponible."
          >
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--raised)] p-3.5 text-[13px] leading-5 text-[var(--muted)]">
              <p className="whitespace-pre-line">{updateDialog?.body || "Correctifs et mises à jour des moteurs embarqués."}</p>
            </div>
            {updateProgress && (
              <div className="mt-4 space-y-2">
                <div className="mono flex justify-between text-[11px] font-semibold text-[var(--faint)]">
                  <span>Téléchargement…</span>
                  <span>{updateProgress.total ? `${Math.min(100, Math.round(updateProgress.downloaded / updateProgress.total * 100))}%` : "…"}</span>
                </div>
                <Progress value={updateProgress.total ? updateProgress.downloaded / updateProgress.total * 100 : 8} />
              </div>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => { setUpdateDialog(null); setUpdateProgress(null); }} disabled={updateBusy}>Plus tard</Button>
              <Button onClick={installUpdate} disabled={updateBusy}>
                {updateBusy ? <LoaderCircle className="animate-spin" size={15} /> : <Download size={15} />}Installer et redémarrer
              </Button>
            </div>
          </Dialog>
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}

/* Écran de démarrage */

function Splash() {
  return (
    <div data-tauri-drag-region className="relative grid h-dvh place-items-center bg-[var(--canvas)] text-[var(--ink)]">
      <div className="scene" aria-hidden />
      <div className="relative flex flex-col items-center gap-4">
        <Logo size={40} />
        <div className="h-[2px] w-24 overflow-hidden rounded-full bg-[var(--line)]">
          <motion.div className="h-full w-1/3 rounded-full bg-[var(--ink)]" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      </div>
    </div>
  );
}
