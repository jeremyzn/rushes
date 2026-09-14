import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "../icons";
import { cn } from "../../lib/utils";

/* Quatre états pour chaque variante : repos, survol, appui, désactivé.
   L'appui passe par la classe `.tactile` : creux interne et demi-pixel
   d'enfoncement, au lieu d'une mise à l'échelle qui floute le texte. */
const buttonVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[11px] font-medium tracking-[-.01em] outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "tactile bg-[image:var(--btn-face)] text-[var(--on-inverse)] hover:bg-[image:var(--btn-face-hover)]",
        secondary:
          "tactile border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--raised)]",
        outline:
          "border border-[var(--line-strong)] bg-transparent text-[var(--ink)] transition-[background-color,border-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[var(--raised)] active:translate-y-px",
        ghost:
          "text-[var(--muted)] transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[var(--raised)] hover:text-[var(--ink)] active:translate-y-px",
        danger:
          "tactile bg-[var(--bad)] text-white hover:brightness-110",
      },
      size: {
        default: "h-9 px-3.5 text-[13px]",
        sm: "h-8 px-3 text-[12.5px]",
        lg: "h-11 px-5 text-[14px]",
        icon: "size-9 p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Affiche un indicateur d'activité et neutralise le bouton. */
  busy?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, busy, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {busy ? (
        <>
          {/* Le libellé garde sa place : pas de saut de largeur au clic. */}
          <span className="absolute inset-0 grid place-items-center">
            <LoaderCircle size={15} className="animate-spin" />
          </span>
          <span className="invisible inline-flex items-center gap-2">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "Button";
