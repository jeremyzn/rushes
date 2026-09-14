import { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CloudOff, Command, Link, Moon, Settings2, Sun } from "./icons";
import { isMac, Logo, NAV_PAGES } from "./brand";
import { Kbd } from "./ui/badge";
import { Tooltip } from "./ui/tooltip";
import { isDesktop } from "../lib/backend";
import { cn, formatSpeed } from "../lib/utils";
import type { NetworkStatus, Page } from "../types";

/* Sur macOS la barre de titre est en overlay : on réserve la place
   des feux de signalisation à l'intérieur même du verre. */
const macInset = isMac && isDesktop();

export type HeaderProps = {
  page: Page;
  go: (p: Page) => void;
  network: NetworkStatus;
  activeCount: number;
  totalSpeed: number;
  globalProgress: number;
  isDark: boolean;
  demo: boolean;
  toggleTheme: () => void;
  openPalette: () => void;
  focusUrl: () => void;
};

export function AppHeader(props: HeaderProps) {
  const { page, go, network, activeCount, totalSpeed, globalProgress, isDark, demo, toggleTheme, openPalette, focusUrl } = props;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <div
        data-tauri-drag-region
        className={`glass pointer-events-auto relative mx-auto flex h-[54px] max-w-[1240px] items-center gap-2 rounded-[18px] pr-2 ${macInset ? "pl-[76px]" : "pl-2.5"}`}
      >
        {/* Marque */}
        <button
          onClick={() => go("home")}
          className="group flex shrink-0 items-center gap-2.5 rounded-xl px-1 py-1 outline-none"
          aria-label="Rushes, accueil"
        >
          <span className="transition-transform duration-300 group-hover:scale-[1.06] group-active:scale-95"><Logo size={24} /></span>
          <span className="hidden text-[14px] font-semibold tracking-[-.025em] sm:block">Rushes</span>
        </button>

        {demo && (
          <Tooltip label="Interface branchée sur des données simulées. Les téléchargements réels nécessitent l'application de bureau.">
            <span className="mono hidden shrink-0 rounded-md border border-[var(--line)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[.12em] text-[var(--faint)] md:block">
              Démo
            </span>
          </Tooltip>
        )}

        <span className="mx-1 hidden h-5 w-px shrink-0 bg-[var(--line)] lg:block" />

        <NavPills page={page} go={go} activeCount={activeCount} />

        {/* Barre de commande : zone de déplacement de la fenêtre de part et d'autre */}
        <span data-tauri-drag-region className="min-w-0 flex-1" />

        <button
          onClick={focusUrl}
          className="group hidden h-[34px] min-w-0 max-w-[300px] flex-[2] items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--canvas)]/60 px-2.5 text-left transition-[border-color,background-color] duration-200 hover:border-[var(--line-strong)] hover:bg-[var(--canvas)] md:flex"
        >
          <Link size={13} className="shrink-0 text-[var(--faint)] transition-colors group-hover:text-[var(--muted)]" />
          <span className="truncate text-[12.5px] text-[var(--faint)] transition-colors group-hover:text-[var(--muted)]">Coller un lien…</span>
          <Kbd className="ml-auto shrink-0">⌘L</Kbd>
        </button>

        <span data-tauri-drag-region className="hidden min-w-0 flex-1 lg:block" />

        {/* Cluster d'état */}
        <ActivityCluster network={network} activeCount={activeCount} totalSpeed={totalSpeed} />

        <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-[var(--line)] sm:block" />

        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip label="Palette de commandes">
            <IconButton onClick={openPalette} label="Ouvrir la palette de commandes"><Command size={15} /></IconButton>
          </Tooltip>
          <Tooltip label={isDark ? "Thème clair" : "Thème sombre"}>
            <IconButton onClick={toggleTheme} label="Changer de thème">
              <motion.span key={isDark ? "sun" : "moon"} initial={{ rotate: -35, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: .22 }} className="grid place-items-center">
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </motion.span>
            </IconButton>
          </Tooltip>
          <Tooltip label="Réglages">
            <IconButton onClick={() => go("settings")} label="Réglages" active={page === "settings"}><Settings2 size={15} /></IconButton>
          </Tooltip>
        </div>

        <GlobalProgress value={globalProgress} visible={activeCount > 0} />
      </div>
    </header>
  );
}

/* Navigation */

function NavPills({ page, go, activeCount }: { page: Page; go: (p: Page) => void; activeCount: number }) {
  return (
    <nav className="flex shrink-0 items-center gap-0.5" aria-label="Navigation principale">
      {NAV_PAGES.map((item) => {
        const on = page === item.id;
        const Icon = item.icon;
        const badge = item.id === "downloads" ? activeCount : 0;
        return (
          <button
            key={item.id}
            onClick={() => go(item.id)}
            aria-current={on ? "page" : undefined}
            className={`relative flex h-[34px] items-center gap-1.5 rounded-xl px-2.5 text-[12.5px] font-medium transition-colors duration-150 ${
              on ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {on && (
              <motion.span
                layoutId="nav-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 -z-10 rounded-xl border border-[var(--line)] bg-[var(--raised)] shadow-[0_1px_2px_rgb(0_0_0/.14),inset_0_1px_0_rgb(255_255_255/.06)]"
              />
            )}
            <Icon size={14.5} className={on ? "" : "text-[var(--faint)]"} />
            <span className="hidden lg:block">{item.short}</span>
            {badge > 0 && (
              <span className="mono grid h-[15px] min-w-[15px] place-items-center rounded-full bg-[var(--inverse)] px-1 text-[9.5px] font-bold text-[var(--on-inverse)]">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* État temps réel */

function ActivityCluster({ network, activeCount, totalSpeed }: { network: NetworkStatus; activeCount: number; totalSpeed: number }) {
  const history = useSpeedHistory(totalSpeed, network.online);
  const busy = activeCount > 0;

  if (!network.online) {
    return (
      <Tooltip label="Aucune connexion Internet">
        <span className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-xl px-2 text-[12px] font-medium text-[var(--warn)]">
          <CloudOff size={14} />
          <span className="hidden sm:block">Hors ligne</span>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={busy ? `${activeCount} téléchargement${activeCount > 1 ? "s" : ""} en cours` : `Connecté${network.latencyMs ? ` · ${network.latencyMs} ms` : ""}`}>
      <span className="flex h-[34px] shrink-0 items-center gap-2 rounded-xl px-2">
        {busy ? <Sparkline values={history} /> : <span className="relative grid size-1.5 place-items-center">
          <span className="absolute size-1.5 rounded-full bg-[var(--ok)] animate-pulse-ring" />
          <span className="size-1.5 rounded-full bg-[var(--ok)]" />
        </span>}
        <span className={`mono hidden text-[11.5px] font-semibold tabular-nums sm:block ${busy ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>
          {busy ? formatSpeed(totalSpeed) : "En ligne"}
        </span>
      </span>
    </Tooltip>
  );
}

/** Conserve les derniers relevés de débit pour dessiner la courbe d'activité. */
function useSpeedHistory(totalSpeed: number, online: boolean, length = 28) {
  const [values, setValues] = useState<number[]>(() => Array(length).fill(0));
  const latest = useRef(totalSpeed);
  latest.current = totalSpeed;

  useEffect(() => {
    if (!online) return;
    const id = window.setInterval(() => {
      setValues((prev) => [...prev.slice(1), latest.current]);
    }, 700);
    return () => window.clearInterval(id);
  }, [online]);

  return values;
}

function Sparkline({ values, width = 46, height = 16 }: { values: number[]; width?: number; height?: number }) {
  const max = Math.max(...values, 1);
  const step = width / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => [i * step, height - (v / max) * (height - 2) - 1] as const);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="shrink-0 overflow-visible text-[var(--ink)]">
      <defs>
        <linearGradient id="spark-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fade)" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity=".85" />
    </svg>
  );
}

/** Fil de progression agrégé, ancré sur l'arête basse du verre. */
function GlobalProgress({ value, visible }: { value: number; visible: boolean }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-3 bottom-0 h-px overflow-hidden rounded-full">
      <motion.span
        className="absolute inset-y-0 left-0 w-full origin-left bg-[var(--ink)]"
        initial={false}
        animate={{ scaleX: visible ? Math.max(.02, Math.min(1, value)) : 0, opacity: visible ? 0.55 : 0 }}
        transition={{ duration: .5, ease: [.22, 1, .36, 1] }}
      />
    </span>
  );
}

/* Primitive locale
   `Tooltip` monte son déclencheur en `asChild` : le bouton doit donc
   transmettre sa ref et les props que Radix lui ajoute, sinon
   l'infobulle n'a rien à ancrer. */

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean };

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ children, label, active, className, ...props }, ref) => (
  <button
    ref={ref}
    aria-label={label}
    className={cn(
      "grid size-[30px] shrink-0 place-items-center rounded-[10px] transition-[background-color,color] duration-150",
      active ? "bg-[var(--raised)] text-[var(--ink)]" : "text-[var(--faint)] hover:bg-[var(--raised)] hover:text-[var(--ink)]",
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";
