import { Select as S } from "radix-ui";
import { Check, ChevronDown } from "../icons";
import { cn } from "../../lib/utils";

export function SelectBox({ value, onChange, items, placeholder = "Choisir", className }: {
  value: string; onChange: (v: string) => void;
  items: { value: string; label: string; detail?: string }[];
  placeholder?: string; className?: string;
}) {
  return (
    <S.Root value={value} onValueChange={onChange}>
      <S.Trigger
        className={cn(
          "tactile group flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[11px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[13px] font-medium text-[var(--ink)] outline-none hover:border-[var(--line-strong)] hover:bg-[var(--raised)] data-[state=open]:border-[var(--line-strong)] sm:w-auto sm:min-w-[152px]",
          className,
        )}
      >
        <S.Value placeholder={placeholder} />
        <S.Icon className="shrink-0 text-[var(--faint)] transition-transform duration-200 ease-[var(--ease-out)] group-data-[state=open]:rotate-180">
          <ChevronDown size={14} />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={6}
          className="glass z-[100] max-h-[min(320px,60dvh)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[14px] p-1 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1"
        >
          <S.Viewport>
            {items.map((i) => (
              <S.Item
                key={i.value}
                value={i.value}
                className="relative flex h-8 cursor-default select-none items-center rounded-[9px] pl-7 pr-2.5 text-[13px] text-[var(--ink)] outline-none transition-colors duration-100 data-[highlighted]:bg-[var(--raised)] data-[state=checked]:font-medium"
              >
                <S.ItemIndicator className="absolute left-2"><Check size={13} /></S.ItemIndicator>
                <S.ItemText>{i.label}</S.ItemText>
                {i.detail && <span className="mono ml-auto pl-4 text-[11px] text-[var(--faint)]">{i.detail}</span>}
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
