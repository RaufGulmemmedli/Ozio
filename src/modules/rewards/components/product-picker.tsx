'use client';

/**
 * The product picker inside "Məhsul izlə" (N6).
 *
 * Creating an alert needs a product, so this reuses the **real** search instead of inventing one:
 * `<SearchField>` + `useSearch` from `@/modules/search` (the same fan-out the search screen runs)
 * and `<ProductImage>` for the thumbnails. Picking a row hands the caller the product's name, its
 * store and the price the API reports, which becomes the alert's starting "tracked price".
 *
 * The name and store fields stay editable next to it: the catalog search depends on a delivery
 * point and on `stores/{id}/products`, so it can legitimately come back empty — and this is a demo
 * screen that must still be walkable when it does.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Check } from '@/shared/lucide';
import { ProductImage } from '@/shared/media';
import { SearchField, useSearch } from '@/modules/search';

export interface PickedProduct {
  name: string;
  storeName: string;
  price: number;
}

export interface ProductPickerProps {
  /** The row currently chosen, so it can be shown as selected. */
  picked: PickedProduct | null;
  onPick: (product: PickedProduct) => void;
  /** How many rows to offer. */
  limit?: number;
}

export function ProductPicker({ picked, onPick, limit = 5 }: ProductPickerProps) {
  const t = useTranslations('rewards');
  const format = useFormat();
  const [term, setTerm] = useState('');

  const search = useSearch({ term });
  const rows = search.visible.slice(0, limit);
  const searching = term.trim().length > 1;

  return (
    <div className="flex flex-col gap-3">
      <SearchField value={term} onValueChange={setTerm} />

      {searching && !search.isPending && rows.length === 0 ? (
        <p className="text-caption text-ink3">{t('priceAlerts.new.noResults')}</p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="flex max-h-[240px] flex-col gap-1.5 overflow-y-auto">
          {rows.map((row) => {
            const selected = picked?.name === row.name && picked?.storeName === row.storeName;
            return (
              <li key={`${row.storeId}-${row.id}`}>
                <button
                  type="button"
                  onClick={() =>
                    onPick({ name: row.name, storeName: row.storeName, price: row.price })
                  }
                  className={cn(
                    'flex w-full flex-row items-center gap-3 rounded-md p-2 text-left',
                    selected ? 'bg-brand-soft' : 'hover:bg-surface2',
                  )}
                >
                  <ProductImage
                    src={row.imageUrl}
                    alt={row.name}
                    ratio="1/1"
                    radius="inner"
                    fallbackIconSize={20}
                    className="size-11 shrink-0"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-label font-bold text-ink">{row.name}</span>
                    <span className="truncate text-caption text-ink3">{row.storeName}</span>
                  </span>
                  <span className="shrink-0 text-label font-bold text-ink">
                    {format.money(row.price)}
                  </span>
                  {selected ? (
                    <Check size={16} aria-hidden="true" className="shrink-0 text-brand" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
