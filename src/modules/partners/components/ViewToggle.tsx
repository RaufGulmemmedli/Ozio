'use client';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { LayoutGrid, Map } from '@/shared/lucide';

export interface ViewToggleProps {
  /** Which of the two views is showing. */
  active: 'grid' | 'map';
  gridHref: string;
  mapHref: string;
  gridLabel: string;
  mapLabel: string;
  label: string;
  className?: string;
}

/**
 * "Şəbəkə | Xəritə" (`View Toggle`, `app-partnyorlar.html`): a `surface` pill with 4px padding
 * and 4px gap; each item is 40 high, padding-inline 18, icon 18 + label 14/600; the active one is
 * `cta` filled with a `bg`-coloured label.
 *
 * Both items are links — they switch route, so they are navigation, not tabs.
 */
export function ViewToggle({
  active,
  gridHref,
  mapHref,
  gridLabel,
  mapLabel,
  label,
  className,
}: ViewToggleProps) {
  const item = (on: boolean) =>
    cn(
      'flex h-10 flex-row items-center gap-2 rounded-pill px-[18px] text-label font-semibold',
      'transition-[background-color,color] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
      on ? 'bg-cta text-on-cta' : 'text-ink2 hover:text-ink',
    );

  return (
    <nav aria-label={label} className={cn('flex w-fit flex-row gap-1 rounded-pill bg-surface p-1', className)}>
      <Link href={gridHref} aria-current={active === 'grid' ? 'page' : undefined} className={item(active === 'grid')}>
        <LayoutGrid size={18} aria-hidden="true" />
        {gridLabel}
      </Link>
      <Link href={mapHref} aria-current={active === 'map' ? 'page' : undefined} className={item(active === 'map')}>
        <Map size={18} aria-hidden="true" />
        {mapLabel}
      </Link>
    </nav>
  );
}
