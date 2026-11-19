'use client';

/**
 * The restaurant filter column.
 *
 * Same skin and the same reading order as `<FilterPanel>` in the store module (title, uppercase
 * section labels, a scrolling list, switches at the bottom) so the two filter columns are visibly
 * one control, not two. What differs is the facets, which are the ones a delivery list is actually
 * narrowed by — and, unlike the store's categories, cuisine is MULTI-select here: there is no
 * server to send a single `category_id` to.
 */

import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Button, Checkbox, Switch } from '@/shared/ui';

import { CUISINE_ICON, type Cuisine } from '../data/models/restaurant';
import type { UseRestaurantFiltersResult } from '../hooks/use-restaurant-filters';

const SECTION_LABEL = 'text-micro font-bold uppercase tracking-[0.08em] text-ink3';

/** Rating floors offered, high to low. `null` is "any". */
const RATING_STEPS: readonly (number | null)[] = [null, 4.0, 4.5, 4.7];

/** Delivery-window ceilings in minutes. `null` is "any". */
const TIME_STEPS: readonly (number | null)[] = [null, 30, 45, 60];

export interface RestaurantFiltersProps {
  state: UseRestaurantFiltersResult;
  className?: string;
}

export function RestaurantFilters({ state, className }: RestaurantFiltersProps) {
  const t = useTranslations('restaurants');

  return (
    <div
      className={cn('flex w-full flex-col gap-6 rounded-card bg-surface p-5 lg:p-6', className)}
    >
      <div className="flex flex-row items-center justify-between gap-3">
        <h2 className="text-h4 font-bold text-ink">{t('filters.title')}</h2>
        {state.activeCount > 0 ? (
          <Button variant="ghost" size="md" onClick={state.clear}>
            {t('filters.clear')}
          </Button>
        ) : null}
      </div>

      {state.availableCuisines.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className={SECTION_LABEL}>{t('filters.cuisine')}</h3>
          <ul className="flex max-h-[280px] flex-col gap-2 overflow-y-auto pe-1">
            {state.availableCuisines.map((cuisine: Cuisine) => {
              const Icon = CUISINE_ICON[cuisine];
              return (
                <li key={cuisine}>
                  <Checkbox
                    checked={state.filters.cuisines.includes(cuisine)}
                    onCheckedChange={() => state.toggleCuisine(cuisine)}
                    label={
                      <span className="flex flex-row items-center gap-2">
                        <Icon size={16} aria-hidden="true" className="shrink-0 text-ink3" />
                        {t(`cuisine.${cuisine}`)}
                      </span>
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h3 className={SECTION_LABEL}>{t('filters.delivery')}</h3>
        <div className="flex flex-row flex-wrap gap-2">
          {TIME_STEPS.map((minutes) => (
            <FacetPill
              key={String(minutes)}
              selected={state.filters.maxDeliveryMinutes === minutes}
              onClick={() => state.setMaxDeliveryMinutes(minutes)}
            >
              {minutes === null ? t('filters.anyTime') : t('filters.upToMinutes', { minutes })}
            </FacetPill>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className={SECTION_LABEL}>{t('filters.rating')}</h3>
        <div className="flex flex-row flex-wrap gap-2">
          {RATING_STEPS.map((rating) => (
            <FacetPill
              key={String(rating)}
              selected={state.filters.minRating === rating}
              onClick={() => state.setMinRating(rating)}
            >
              {rating === null
                ? t('filters.anyRating')
                : t('filters.ratingFrom', { value: rating.toFixed(1) })}
            </FacetPill>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <Switch
          checked={state.filters.openOnly}
          onCheckedChange={state.setOpenOnly}
          label={t('filters.openOnly')}
        />
        <Switch
          checked={state.filters.freeDeliveryOnly}
          onCheckedChange={state.setFreeDeliveryOnly}
          label={t('filters.freeOnly')}
        />
      </div>
    </div>
  );
}

/**
 * A small selectable pill. `<Chip>` is 40 high and built for a horizontal category row; inside a
 * 240-wide column that wraps badly, so these are the same idea at list scale.
 */
function FacetPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'h-9 rounded-pill px-3.5 text-caption font-semibold transition-colors duration-[var(--oz-dur-fast)]',
        selected ? 'bg-ink text-bg' : 'bg-surface2 text-ink2 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
