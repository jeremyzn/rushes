import { Switch as S } from "radix-ui";

/** Interrupteur : le rail est creusé, la pastille posée dessus.
    Sans ce contraste de relief, l'objet ne se lit pas comme saisissable. */
export function Switch({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <S.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="relative h-[23px] w-[40px] shrink-0 rounded-full border border-[var(--line-strong)] bg-[var(--raised)] shadow-[inset_0_1px_3px_rgb(0_0_0/.12)] outline-none transition-[background-color,border-color] duration-200 ease-[var(--ease-out)] disabled:opacity-40 data-[state=checked]:border-transparent data-[state=checked]:bg-[image:var(--btn-face)]"
    >
      <S.Thumb className="block size-[17px] translate-x-[2px] rounded-full bg-[var(--faint)] shadow-[0_1px_2px_rgb(0_0_0/.3)] transition-[transform,background-color] duration-200 ease-[var(--ease-spring)] data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-[var(--on-inverse)]" />
    </S.Root>
  );
}
