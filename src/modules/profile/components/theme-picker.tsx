'use client';

/**
 * `Theme · İşıqlı / Qaranlıq / Sistem` from `app-parametrler.html`: three 92-high r20 tiles with a
 * 24px icon and a 14/600 label; the active tile is `brand-soft` with `brand-dark` text.
 *
 * Each tile also carries a **live preview** of what that choice looks like. The dark palette in
 * `globals.css` is scoped to `:root[data-theme="dark"]`, so a nested element cannot borrow it —
 * the previews are therefore drawn with the two theme-constant tokens (`--oz-white` is `#fff` and
 * `--oz-on-yellow` is `#111` in BOTH themes), which is why they read correctly either way.
 *
 * A real radio group: `<fieldset>` + native radios, so arrow keys and `aria-checked` are free.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import type { ThemePref } from '@/core/theme';
import { Monitor, Moon, Sun, type LucideIcon } from '@/shared/lucide';

const OPTIONS: ReadonlyArray<{ pref: ThemePref; icon: LucideIcon }> = [
  { pref: 'light', icon: Sun },
  { pref: 'dark', icon: Moon },
  { pref: 'system', icon: Monitor },
];

/** Mini window: a title bar and two text bars, in the palette the option would apply. */
function Preview({ pref }: { pref: ThemePref }) {
  const light = (
    <span className="flex h-full w-full flex-col gap-1 rounded-sm bg-[var(--oz-white)] p-1.5">
      <span className="h-1.5 w-2/3 rounded-xs bg-[var(--oz-on-yellow)]/80" />
      <span className="h-1 w-full rounded-xs bg-[var(--oz-on-yellow)]/25" />
      <span className="h-1 w-4/5 rounded-xs bg-[var(--oz-on-yellow)]/25" />
    </span>
  );
  const dark = (
    <span className="flex h-full w-full flex-col gap-1 rounded-sm bg-[var(--oz-on-yellow)] p-1.5">
      <span className="h-1.5 w-2/3 rounded-xs bg-[var(--oz-white)]/85" />
      <span className="h-1 w-full rounded-xs bg-[var(--oz-white)]/30" />
      <span className="h-1 w-4/5 rounded-xs bg-[var(--oz-white)]/30" />
    </span>
  );

  if (pref === 'light') return <span className="block h-9 w-full">{light}</span>;
  if (pref === 'dark') return <span className="block h-9 w-full">{dark}</span>;
  return (
    <span className="flex h-9 w-full gap-1 overflow-hidden">
      <span className="block w-1/2 overflow-hidden">{light}</span>
      <span className="block w-1/2 overflow-hidden">{dark}</span>
    </span>
  );
}

export interface ThemePickerProps {
  value: ThemePref;
  onSelect: (pref: ThemePref) => void;
  className?: string;
}

export function ThemePicker({ value, onSelect, className }: ThemePickerProps) {
  const t = useTranslations('settings');

  return (
    <fieldset className={cn('m-0 w-full min-w-0 border-0 p-0', className)}>
      <legend className="sr-only">{t('theme.groupLabel')}</legend>
      <div className="grid w-full grid-cols-3 gap-3">
        {OPTIONS.map(({ pref, icon: Icon }) => {
          const selected = pref === value;
          return (
            <label
              key={pref}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg px-3 py-4',
                'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
                'focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 focus-within:ring-offset-surface',
                selected ? 'bg-brand-soft' : 'bg-bg hover:bg-surface2',
              )}
            >
              <input
                type="radio"
                name="ozio-theme"
                value={pref}
                checked={selected}
                onChange={() => onSelect(pref)}
                className="sr-only"
              />
              <Preview pref={pref} />
              <Icon
                size={24}
                aria-hidden="true"
                className={selected ? 'text-brand-dark' : 'text-ink'}
              />
              <span
                className={cn(
                  'text-label',
                  selected ? 'font-bold text-brand-dark' : 'font-semibold text-ink',
                )}
              >
                {t(`theme.${pref}`)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
