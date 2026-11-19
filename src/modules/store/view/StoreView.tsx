'use client';

/**
 * `/market/store/[id]` — App · Mağaza (`G1BX8S`) and its closed state App · Mağaza · Bağlıdır
 * (`wAk8X`). HTML `app-catalog/app-store.html` + `app-store-closed.html`.
 *
 * Regions: breadcrumb `x9rZ1w` → store header `nFksw` → (closed only) notice `XHYLb` → category
 * tabs `hzkYK` with the sort trigger → section head `ehhfQ` → product grid `UHQlb` (4 columns).
 *
 * "Closed" is a **state, not a route** (`?preview=closed` forces it): the notice appears, the add
 * buttons go inert and the grid dims — nothing navigates. It is derived from the detail call's
 * `open_time` / `close_time` (true UTC there → converted to Baku) and `storeHolidays`.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { useIsPreview } from '@/core/query';
import { paths } from '@/core/routes';
import { Bell } from '@/shared/lucide';
import { ClosedBanner, ErrorState, StateButton } from '@/shared/states';
import { Breadcrumbs, toast } from '@/shared/ui';

import { AgeGate, useAgeGate } from '../components/age-gate';
import { CatalogGrid } from '../components/catalog-grid';
import { FilterPanel } from '../components/filter-panel';
import { MobileFilterBar } from '../components/catalog-toolbar';
import { SortMenu } from '../components/sort-menu';
import { StoreHeader } from '../components/store-header';
import { useCatalogFilters } from '../hooks/use-catalog-filters';
import { useProductCategories } from '../hooks/use-product-categories';
import { useStoreDetail } from '../hooks/use-store-detail';
import { useStoreFavorite } from '../hooks/use-store-favorite';
import { useAllProducts } from '../hooks/use-all-products';
import { useStoreProducts } from '../hooks/use-store-products';
import { StoreSkeleton } from './StoreSkeleton';

export interface StoreViewProps {
  storeId: number;
}

export function StoreView({ storeId }: StoreViewProps) {
  const t = useTranslations('store');
  const failureMessage = useFailureMessage();
  const previewClosed = useIsPreview('closed');

  const { store, isOpen, query } = useStoreDetail(storeId);
  const { categories } = useProductCategories(storeId);

  // `null` = "Hamısı", the state this screen opens in — same as `/market`.
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const age = useAgeGate(categoryId, activeCategory?.isAgeRestricted ?? false);

  // Both are always called; `enabled` picks the one that fetches. "Hamısı" cannot be served by
  // `stores/{id}/products` without a `category_id` (it 504s at this page size — the measurements
  // are in `useAllProducts`), so it is assembled from the categories instead.
  const byCategory = useStoreProducts({
    storeId,
    categoryId,
    enabled: categoryId !== null && !age.blocked,
  });
  const everything = useAllProducts({
    storeId,
    categories,
    enabled: categoryId === null && !age.blocked,
  });
  const list = categoryId === null ? everything : byCategory;

  const filters = useCatalogFilters(list.items);
  const favorite = useStoreFavorite(storeId, store?.isFavorite ?? false);

  const isClosed = previewClosed || !isOpen;

  if (query.isPending) return <StoreSkeleton />;

  if (query.isError || !store) {
    return (
      <main id="main" className="flex w-full flex-col gap-8">
        <ErrorState
          failure={query.error}
          title={
            query.error?.kind === 'notFound' ? t('store.notFound.title') : t('error.title')
          }
          message={
            query.error === null
              ? t('store.notFound.body')
              : query.error.kind === 'notFound'
                ? t('store.notFound.body')
                : failureMessage(query.error)
          }
          onRetry={() => query.refetch()}
          retryLabel={t('error.retry')}
          secondaryAction={
            <StateButton variant="soft" href={paths.market}>
              {t('store.backToMarket')}
            </StateButton>
          }
        />
      </main>
    );
  }

  const panel = (
    <FilterPanel
      categories={categories}
      categoryId={categoryId}
      onCategoryChange={setCategoryId}
      bounds={filters.bounds}
      price={filters.price}
      onPriceChange={filters.setPrice}
      discountOnly={filters.discountOnly}
      onDiscountOnlyChange={filters.setDiscountOnly}
    />
  );

  return (
    <main id="main" className="flex w-full flex-col gap-8">
      <Breadcrumbs
        label={t('breadcrumb.label')}
        items={[
          { label: t('breadcrumb.market'), href: paths.market },
          { label: t('breadcrumb.stores'), href: paths.market },
          { label: store.name },
        ]}
      />

      <StoreHeader
        store={store}
        isOpen={!isClosed}
        favorite={favorite.isFavorite}
        favoritePending={favorite.isPending}
        onToggleFavorite={favorite.toggle}
      />

      {isClosed ? (
        <ClosedBanner
          title={t('closed.title')}
          body={t('closed.body', { time: store.hours?.open ?? '' })}
          actionSlot={
            <StateButton
              variant="primary"
              size={40}
              onClick={() =>
                // No endpoint exists for an opening reminder (screen spec AX7) — say so.
                toast.info({ title: t('closed.notifyUnavailable') })
              }
            >
              <Bell size={18} aria-hidden="true" />
              {t('closed.notify')}
            </StateButton>
          }
        />
      ) : null}

      {/*
        The categories live in the left column, exactly as on `/market`.

        They used to be a `<CategoryChips>` row above the grid. With 42 categories on live that row
        wrapped into six lines of pills — a wall taking half the viewport before a single product
        appeared — which is why the chips were dropped from `/market` too. The panel is the same
        control in a shape that holds 42 rows: a scrolling list, 240 wide, beside the grid.
      */}
      <div className="flex w-full flex-row items-start gap-6">
        <aside aria-label={t('filters.title')} className="hidden w-60 shrink-0 lg:block">
          {panel}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="hidden w-full flex-row items-center justify-end lg:flex">
            <SortMenu value={filters.sort} onChange={filters.setSort} />
          </div>

          <div className="flex w-full flex-col gap-3 lg:hidden">
            <MobileFilterBar
              total={list.total}
              activeCount={filters.activeCount}
              sort={filters.sort}
              onSortChange={filters.setSort}
            >
              {panel}
            </MobileFilterBar>
          </div>

          <div className="flex w-full flex-row items-end justify-between gap-4">
            <h2 className="text-h3 font-extrabold text-ink md:text-[26px]">
              {activeCategory?.name ?? t('store.allProducts')}
            </h2>
            {list.total > 0 ? (
              <span className="hidden text-label font-normal text-ink2 lg:inline">
                {t('results', { count: list.total })}
              </span>
            ) : null}
          </div>

          <div className={cn('w-full', isClosed && 'opacity-60')}>
            {age.blocked && activeCategory ? (
              <AgeGate
                categoryName={activeCategory.name}
                onConfirm={age.confirm}
                onCancel={() => setCategoryId(null)}
              />
            ) : (
              <CatalogGrid
                list={list}
                products={filters.visible}
                cols={3}
                addDisabled={isClosed}
                emptyTitle={t('empty.title')}
                emptyBody={t('empty.category')}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
