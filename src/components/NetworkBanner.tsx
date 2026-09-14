import { AnimatePresence, motion } from "motion/react";
import { CloudOff, Wifi } from "./icons";
import { Button } from "./ui/button";
import type { NetworkStatus } from "../types";

export function NetworkBanner({ status, checking, onRetry }: { status: NetworkStatus; checking: boolean; onRetry: () => void }) {
  return (
    <AnimatePresence>
      {!status.online && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <div className="mx-auto mt-4 flex w-[calc(100%-3rem)] max-w-[1072px] flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] px-3 py-3 shadow-[var(--e1)] sm:flex-nowrap">
            <span className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-[var(--warn)]/25 bg-[var(--warn)]/10 text-[var(--warn)]">
              <CloudOff size={15} />
            </span>
            <div className="min-w-[14rem] flex-1">
              <strong className="block text-[13px] font-medium tracking-[-.01em]">Pas de connexion Internet</strong>
              <span className="text-[11px] leading-4 text-[var(--muted)]">
                Bibliothèque et historique restent accessibles. Les téléchargements en cours réessaieront automatiquement.
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={onRetry} busy={checking} className="ml-auto">
              <Wifi size={13} />Réessayer
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
