'use client';

/**
 * The category chip row above every catalog grid (`hzkYK` on Mağaza, the chips strip on Market,
 * `o9i3Y` on Kateqoriya). Measured: height 40, radius pill, padding-inline 18, gap 10;
 * active = `ink` fill with a `bg`/white 14/700 label, idle = `surface` with a 1 px `line` outline
 * and a 14/500–600 `ink` label. `<Chip>` from `@/shared/ui` already carries those metrics.
 *
 * "Hamısı" means "no `category_id`". `stores/{storeId}/products` without a category is ~50 s
 * server-side, so it is never the default selection.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Chip } from '@/shared/ui';

import type { ProductCategory } from '../data/models/product-category';

export interface CategoryChipsProps {
  categories: readonly ProductCategory[];
  /** `null` = "Hamısı". */
  value: number | null;
  onChange: (id: number | null) => void;
  /** Include the "Hamısı" chip (Market / Mağaza do, the category page uses its own label). */
  includeAll?: boolean;
  allLabel?: string;
  label: string;
  className?: string;
}

export function CategoryChips({
  categories,
  value,
  onChange,
  includeAll = true,
  allLabel,
  label,
  className,
}: CategoryChipsProps) {
  const t = useTranslations('store');

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex min-w-0 flex-row flex-nowrap items-center gap-[10px] overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0',
        className,
      )}
    >
      {includeAll ? (
        <Chip selected={value === null} onClick={() => onChange(null)}>
          {allLabel ?? t('chips.all')}
        </Chip>
      ) : null}

      {categories.map((category) => (
        <Chip
          key={category.id}
          selected={value === category.id}
          onClick={() => onChange(category.id)}
          title={category.isAgeRestricted ? t('age.chipHint') : undefined}
        >
          {category.name}
        </Chip>
      ))}
    </div>
  );
}
