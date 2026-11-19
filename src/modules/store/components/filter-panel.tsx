'use client';

/**
 * The catalog filter column (`app-market.html`, node `tDjc3` left side): "Filtrlər" over a
 * KATEQORİYA list, a QİYMƏT range and a "Yalnız endirimli" switch.
 *
 * Two things worth knowing before changing it:
 *
 * 1. **The category list is single-select.** The export draws checkboxes, but the server takes one
 *    `category_id` per request — firing one request per ticked box would race the gateway's
 *    same-path 429 and page incoherently. So the boxes behave as an exclusive choice (ticking one
 *    unticks the rest, ticking the active one clears back to "Hamısı"), which is also what the
 *    chips used to do. They stay `<Checkbox>` to match the drawn control.
 * 2. **Price and the discount switch are client-side only** and say so in the panel
 *    (`filters.clientSideNote`), because `stores/{storeId}/products` accepts neither.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Checkbox, Slider, Switch } from '@/shared/ui';

import type { ProductCategory } from '../data/models/product-category';
import type { PriceRange } from '../hooks/use-catalog-filters';

export interface FilterPanelProps {
  categories: readonly ProductCategory[];
  categoryId: number | null;
  onCategoryChange: (id: number | null) => void;
  bounds: PriceRange;
  price: PriceRange | null;
  onPriceChange: (range: PriceRange | null) => void;
  discountOnly: boolean;
  onDiscountOnlyChange: (only: boolean) => void;
  className?: string;
}

const SECTION_LABEL = 'text-micro font-bold uppercase tracking-[0.08em] text-ink3';

export function FilterPanel({
  categories,
  categoryId,
  onCategoryChange,
  bounds,
  price,
  onPriceChange,
  discountOnly,
  onDiscountOnlyChange,
  className,
}: FilterPanelProps) {
  const t = useTranslations('store');
  const fmt = useFormat();

  const active = price ?? bounds;

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-6 rounded-card bg-surface p-5 lg:p-6',
        className,
      )}
    >
      <h2 className="text-h4 font-bold text-ink">{t('filters.title')}</h2>

      {categories.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className={SECTION_LABEL}>{t('filters.category')}</h3>
          <ul className="flex max-h-[320px] flex-col gap-2 overflow-y-auto pe-1">
            {/*
              "Hamısı" is the no-category state the rest of this list already clears back to; it
              used to be reachable only by unticking the active box, which left visitors with no
              way to see it was the default. It is a row of its own now, and unticking it is a
              no-op rather than a toggle into nothing.
            */}
            <li>
              <Checkbox
                checked={categoryId === null}
                onCheckedChange={(checked) => {
                  if (checked === true) onCategoryChange(null);
                }}
                label={t('filters.allCategories')}
              />
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Checkbox
                  checked={category.id === categoryId}
                  onCheckedChange={(checked) =>
                    onCategoryChange(checked === true ? category.id : null)
                  }
                  label={category.name}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h3 className={SECTION_LABEL}>{t('filters.price')}</h3>
        <Slider
          min={bounds.min}
          max={bounds.max}
          step={0.1}
          value={[active.min, active.max]}
          thumbLabels={[t('filters.priceMin'), t('filters.priceMax')]}
          onValueChange={([min, max]) =>
            onPriceChange(
              min === undefined || max === undefined
                ? null
                : // Back to "untouched" when both ends are at the bounds, so the chip and the
                  // active-count do not claim a filter the visitor did not set.
                  min <= bounds.min && max >= bounds.max
                  ? null
                  : { min, max },
            )
          }
        />
        <p className="text-caption font-normal tabular-nums text-ink2">
          {fmt.money(active.min)} – {fmt.money(active.max)}
        </p>
      </section>

      <Switch
        checked={discountOnly}
        onCheckedChange={onDiscountOnlyChange}
        label={t('filters.discountOnly')}
      />

      <p className="text-caption font-normal text-ink2">{t('filters.clientSideNote')}</p>
    </div>
  );
}
