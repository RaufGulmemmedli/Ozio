'use client';

/** "Sırala: …" for the restaurant list — the same pill and menu as the store module's. */

import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { ChevronDown } from '@/shared/lucide';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui';

import { RESTAURANT_SORTS, type RestaurantSort } from '../hooks/use-restaurant-filters';

export interface RestaurantSortMenuProps {
  value: RestaurantSort;
  onChange: (sort: RestaurantSort) => void;
  className?: string;
}

export function RestaurantSortMenu({ value, onChange, className }: RestaurantSortMenuProps) {
  const t = useTranslations('restaurants');

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
        {`${t('sort.label')}: ${t(`sort.${value}`)}`}
        <ChevronDown size={16} aria-hidden="true" className="text-ink2" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as RestaurantSort)}
        >
          {RESTAURANT_SORTS.map((sort) => (
            <DropdownMenuRadioItem key={sort} value={sort}>
              {t(`sort.${sort}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
