import { Dialog as D } from "radix-ui";
import { X } from "../icons";

export function Dialog({ open, onOpenChange, title, description, children }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <D.Content className="glass fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] p-5 outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 sm:p-6">
          <div className="pr-9">
            <D.Title className="text-[17px] font-semibold tracking-[-.02em] text-[var(--ink)]">{title}</D.Title>
            {description && <D.Description className="mt-1.5 text-[13px] leading-5 text-[var(--muted)]">{description}</D.Description>}
          </div>
          {children}
          <D.Close className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-[10px] text-[var(--faint)] transition-colors duration-150 hover:bg-[var(--raised)] hover:text-[var(--ink)]">
            <X size={16} />
          </D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
