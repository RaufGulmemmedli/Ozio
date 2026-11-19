'use client';

/**
 * The "Sırala: …" trigger (`DUIAF` on Market, `y6pQGR` on Mağaza, `QRm7a` on Kateqoriya):
 * `surface` pill, height 40, padding-inline 16, gap 8, label 14/600 `ink` + a 16 px chevron.
 *
 * The API has **no sort parameter** (`sort`, `order_by`, `sortBy`, `order` are all ignored), so
 * this reorders the pages that are already loaded. The menu says that under the options rather
 * than pretending the whole catalogue was sorted.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { ChevronDown } from '@/shared/lucide';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';

import { CATALOG_SORTS, type CatalogSort } from '../hooks/use-catalog-filters';

export interface SortMenuProps {
  value: CatalogSort;
  onChange: (sort: CatalogSort) => void;
  className?: string;
}

export function SortMenu({ value, onChange, className }: SortMenuProps) {
  const t = useTranslations('store');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-10 shrink-0 flex-row items-center gap-2 rounded-pill bg-surface px-4',
          'text-label font-semibold text-ink',
          'transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-out hover:bg-surface2 active:scale-[.97]',
          className,
        )}
      >
        {t('sort.trigger', { value: t(`sort.${value}`) })}
        <ChevronDown size={16} aria-hidden="true" className="text-ink2" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as CatalogSort)}
        >
          {CATALOG_SORTS.map((sort) => (
            <DropdownMenuRadioItem key={sort} value={sort}>
              {t(`sort.${sort}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('sort.clientSideNote')}</DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
