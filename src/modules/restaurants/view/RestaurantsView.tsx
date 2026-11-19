'use client';

/**
 * `/market/restaurants` — the restaurant list.
 *
 * Laid out like `/market`: a 240-wide filter column from `lg`, the results beside it, a sort pill
 * above them, and the filter column folded into a sheet below `lg`. The data is demo data, so the
 * screen opens with `<DemoBanner>` rather than pretending otherwise.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, EmptyState, ErrorState, StateButton } from '@/shared/states';
import { SearchX, SlidersHorizontal } from '@/shared/lucide';
import { Breadcrumbs, Sheet } from '@/shared/ui';

import { RestaurantCard } from '../components/restaurant-card';
import { RestaurantFilters } from '../components/restaurant-filters';
import { RestaurantSortMenu } from '../components/restaurant-sort-menu';
import { useRestaurantFilters } from '../hooks/use-restaurant-filters';
import { useRestaurants } from '../hooks/use-restaurants';
import { RestaurantsSkeleton } from './RestaurantsSkeleton';

export function RestaurantsView() {
  const t = useTranslations('restaurants');
  const failureMessage = useFailureMessage();

  const query = useRestaurants();
  const filters = useRestaurantFilters(query.data ?? []);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (query.isPending) return <RestaurantsSkeleton />;

  if (query.isError) {
    return (
      <div className="flex w-full flex-col gap-8">
        <PageHeader title={t('title')} />
        <ErrorState
          failure={query.error}
          title={t('error.title')}
          message={failureMessage(query.error)}
          onRetry={() => query.refetch()}
          retryLabel={t('error.retry')}
        />
      </div>
    );
  }

  const panel = <RestaurantFilters state={filters} />;

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle', { count: filters.visible.length })}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[{ label: t('breadcrumb.market'), href: paths.market }, { label: t('title') }]}
          />
        }
      />

      <DemoBanner title={t('demo.title')} body={t('demo.body')} />

      <div className="flex w-full flex-row items-start gap-6">
        <aside aria-label={t('filters.title')} className="hidden w-60 shrink-0 lg:block">
          {panel}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex w-full flex-row items-center justify-between gap-3">
            {/* The filter trigger only exists where the column is hidden. */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              className="inline-flex h-10 flex-row items-center gap-2 rounded-pill bg-surface px-4 text-label font-semibold text-ink transition-[background-color,transform] duration-[var(--oz-dur-fast)] hover:bg-surface2 active:scale-[.97] lg:hidden"
            >
              <SlidersHorizontal size={16} aria-hidden="true" className="text-ink2" />
              {filters.activeCount > 0
                ? t('filters.buttonCount', { count: filters.activeCount })
                : t('filters.button')}
            </button>
            <span className="hidden lg:block" />

            <RestaurantSortMenu value={filters.sort} onChange={filters.setSort} />
          </div>

          {filters.visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              tone="brand"
              panel
              title={t('empty.title')}
              body={t('empty.body')}
              action={
                <StateButton onClick={filters.clear} variant="soft">
                  {t('empty.clear')}
                </StateButton>
              }
            />
          ) : (
            <ul className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filters.visible.map((restaurant) => (
                <li key={restaurant.id} className="flex">
                  <RestaurantCard restaurant={restaurant} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={t('filters.title')}
      >
        {panel}
      </Sheet>
    </div>
  );
}
