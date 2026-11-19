'use client';

/**
 * The category chips, in both drawn shapes:
 *  - **read-only** on the member page (`limits-member.html`): allowed = `Chip/Active`
 *    (`cta` fill, `on-cta` 14/600), not allowed = `Chip/Inactive` (`surface` fill, `ink` 14/500);
 *  - **toggles** in the editor drawer (`limits-editor-drawer.html`): the same two looks, as
 *    `aria-pressed` buttons, 40 high, radius 999, padding-inline 18, gap 10.
 *
 * TODO(core): `@/shared/ui`'s `<Chip>` paints its unselected state `surface2`, while the drawn
 * inactive chip is `surface` on a `surface` card; hence the local styling here.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';

import { LIMIT_CATEGORIES, type LimitCategory } from '../data/models/limit-member';

const BASE =
  'inline-flex h-10 min-h-11 shrink-0 items-center rounded-pill px-[18px] text-label';
const ON = 'bg-cta text-on-cta font-semibold';
const OFF = 'bg-surface text-ink font-medium border border-line';

export interface CategoryChipsProps {
  /** The allowed set. */
  value: readonly LimitCategory[];
  /** Omit for the read-only member page; pass it to make the chips toggles. */
  onToggle?: (category: LimitCategory) => void;
  /** Dims and disables the row (the editor's "Limit aktivdir" switch is off). */
  disabled?: boolean;
  /** Accessible name of the group. */
  label: string;
  className?: string;
}

export function CategoryChips({ value, onToggle, disabled = false, label, className }: CategoryChipsProps) {
  const t = useTranslations('family_limits');
  const interactive = typeof onToggle === 'function';

  return (
    <ul
      aria-label={label}
      className={cn(
        'flex w-full flex-row flex-wrap gap-[10px]',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {LIMIT_CATEGORIES.map((category) => {
        const on = value.includes(category);
        const text = t(`category.${category}`);

        return (
          <li key={category}>
            {interactive ? (
              <button
                type="button"
                aria-pressed={on}
                disabled={disabled}
                onClick={() => onToggle(category)}
                className={cn(BASE, on ? ON : OFF)}
              >
                {text}
              </button>
            ) : (
              <span className={cn(BASE, on ? ON : OFF)}>
                {text}
                <span className="sr-only">
                  {' '}
                  {on ? t('category.allowed') : t('category.notAllowed')}
                </span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
