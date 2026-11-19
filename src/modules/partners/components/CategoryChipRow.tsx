'use client';

import { cn } from '@/core/lib/cn';
import { Chip } from '@/shared/ui';

import type { PartnerCategory } from '../data/models/partner';

export interface CategoryChipRowProps {
  categories: readonly PartnerCategory[];
  /** `null` = "Hamısı". */
  value: string | null;
  onChange: (categoryId: string | null) => void;
  allLabel: string;
  label: string;
  className?: string;
}

/**
 * `Category Chips` (`app-partnyorlar.html`): a row of 40-high pills, gap 10, label 14/600; the
 * active one is `cta`-filled. The chips are the live partner **categories** — `GET
 * v1/ozio-partners` returns categories, so this row is the real catalog, not a client-side filter
 * over partner rows.
 *
 * It scrolls horizontally below 768 instead of wrapping, so the row never pushes the grid down.
 */
export function CategoryChipRow({
  categories,
  value,
  onChange,
  allLabel,
  label,
  className,
}: CategoryChipRowProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex w-full flex-row gap-[10px] overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0',
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      <Chip selected={value === null} onClick={() => onChange(null)} aria-pressed={value === null}>
        {allLabel}
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.id}
          selected={value === category.id}
          aria-pressed={value === category.id}
          onClick={() => onChange(category.id)}
        >
          {category.name}
        </Chip>
      ))}
    </div>
  );
}
