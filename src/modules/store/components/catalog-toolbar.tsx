'use client';

/**
 * The mobile catalog toolbar from `app-market-mobil-390.html`: the product count on the left, then
 * a "Filtr" and a "Sırala" pill (height 40, `surface`, 1 px `line` outline, padding-inline 14,
 * gap 8, 16 px icon + 13/600 label). Each opens a bottom `<Sheet>`; the filter sheet holds the
 * same `<FilterPanel>` the desktop column renders, since below `lg` there is no column.
 *
 * The "Filtr" pill carries the active-filter count (`filters.shortCount`), which is why there is
 * no separate row of active-filter chips: on desktop the panel itself shows its own state, and on
 * mobile the count on the pill says it in one place.
 */
import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { ArrowDownUp, SlidersHorizontal } from '@/shared/lucide';
import { Sheet } from '@/shared/ui';

import { CATALOG_SORTS, type CatalogSort } from '../hooks/use-catalog-filters';

const PILL =
  'inline-flex h-10 shrink-0 flex-row items-center gap-2 rounded-pill bg-surface px-[14px] outline outline-1 -outline-offset-[0.5px] outline-line text-caption font-semibold text-ink transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-out hover:bg-surface2 active:scale-[.97]';

export interface MobileFilterBarProps {
  /** `total` from the list envelope. */
  total: number;
  activeCount: number;
  sort: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
  /** The filter column, rendered inside the bottom sheet. */
  children: ReactNode;
  className?: string;
}

export function MobileFilterBar({
  total,
  activeCount,
  sort,
  onSortChange,
  children,
  className,
}: MobileFilterBarProps) {
  const t = useTranslations('store');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div className={cn('flex w-full flex-row items-center justify-between gap-3', className)}>
      <span className="text-label font-normal text-ink2">{t('results', { count: total })}</span>

      <div className="flex flex-row items-center gap-2">
        <button
          type="button"
          className={PILL}
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          {activeCount > 0 ? t('filters.shortCount', { count: activeCount }) : t('filters.short')}
        </button>

        <button
          type="button"
          className={PILL}
          aria-haspopup="dialog"
          aria-expanded={sortOpen}
          onClick={() => setSortOpen(true)}
        >
          <ArrowDownUp size={16} aria-hidden="true" />
          {t('sort.short')}
        </button>
      </div>

      <Sheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title={t('filters.title')}
        closeLabel={t('close')}
      >
        {children}
      </Sheet>

      <Sheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        title={t('sort.title')}
        closeLabel={t('close')}
      >
        <div role="radiogroup" aria-label={t('sort.title')} className="flex flex-col gap-1">
          {CATALOG_SORTS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === sort}
              onClick={() => {
                onSortChange(option);
                setSortOpen(false);
              }}
              className={cn(
                'flex h-12 flex-row items-center rounded-md px-4 text-left text-body-sm',
                option === sort ? 'bg-surface2 font-semibold text-ink' : 'font-normal text-ink2',
              )}
            >
              {t(`sort.${option}`)}
            </button>
          ))}
        </div>
        <p className="pt-3 text-caption font-normal text-ink2">{t('sort.clientSideNote')}</p>
      </Sheet>
    </div>
  );
}
