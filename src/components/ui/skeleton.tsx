import { cn } from "../../lib/utils";

/** Réserve la place exacte du contenu à venir : sans hauteur explicite,
    la mise en page saute au moment où les données arrivent. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg bg-[var(--raised)]", className)} />;
}
