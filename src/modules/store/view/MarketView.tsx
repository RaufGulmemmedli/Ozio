'use client';

/**
 * `/market` — App · Market (`q5wgL8`), HTML `app-core/app-market.html`.
 *
 * Layout (Content gap 32, the page padding comes from the app shell): header `Rx4Iz`
 * (36/800 title + 16/400 `ink2` subtitle, gap 6) → promo banner `ZaUmX` (140 high) → body `tDjc3`
 * (row, gap 24): the 240-wide filter column `CIvVJ` beside the results column — the category chip
 * row plus the "Sırala: …" trigger above a 3-column grid at gap 20.
 * Below `lg` the filter column becomes a bottom sheet behind the "Filtr" button and the grid drops
 * to 2 columns (`app-market-mobil-390.html`).
 *
 * Data: `stores/search?lat&lng` picks the store (there is no global product endpoint — products
 * are always per store), `categories/products?store_id` fills the category controls and
 * `stores/{storeId}/products?category_id` fills the grid. The price range, the "Yalnız endirimli"
 * switch and the sort order are **client-side over the loaded pages** (the API supports none of
 * them) and the UI says so.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { useIsPreview, usePreview } from '@/core/query';
import { Store as StoreIcon } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { ClosedBanner, EmptyState, ErrorState, StateButton } from '@/shared/states';

import { AgeGate, useAgeGate } from '../components/age-gate';
import { CatalogGrid } from '../components/catalog-grid';
import { MobileFilterBar } from '../components/catalog-toolbar';
import { FilterPanel } from '../components/filter-panel';
import { PromoBanner } from '../components/promo-banner';
import { SortMenu } from '../components/sort-menu';
import { isOpenNow } from '../data/models/store';
import { useCatalogFilters } from '../hooks/use-catalog-filters';
import { useDeliveryPoint } from '../hooks/use-delivery-point';
import { useAllProducts } from '../hooks/use-all-products';
import { useProductCategories } from '../hooks/use-product-categories';
import { useStoreProducts } from '../hooks/use-store-products';
import { pickDefaultStore, useStores } from '../hooks/use-stores';
import { MarketSkeleton } from './MarketSkeleton';

export function MarketView() {
  const t = useTranslations('store');

  const failureMessage = useFailureMessage();
  const previewClosed = useIsPreview('closed');
  const preview = usePreview();

  const { point } = useDeliveryPoint();
  const storesQuery = useStores({ point });
  const store = useMemo(() => pickDefaultStore(storesQuery.stores), [storesQuery.stores]);

  const { categories } = useProductCategories(store?.id ?? null);

  // `null` = "Hamısı", and it is where the screen opens.
  //
  // It used to open on an auto-picked category instead, because `stores/{id}/products` without a
  // `category_id` 504s at the page size this grid uses. "Hamısı" is served by `useAllProducts`,
  // which assembles the shelf from the categories themselves — the measurements behind that are
  // in the hook.
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const activeCategory = categories.find((c) => c.id === categoryId) ?? null;

  const age = useAgeGate(categoryId, activeCategory?.isAgeRestricted ?? false);

  // Both hooks are always called (rules of hooks); `enabled` decides which one actually fetches.
  const byCategory = useStoreProducts({
    storeId: store?.id ?? null,
    categoryId,
    enabled: categoryId !== null && !age.blocked,
  });
  const everything = useAllProducts({
    storeId: store?.id ?? null,
    categories,
    enabled: categoryId === null && !age.blocked,
  });
  const list = categoryId === null ? everything : byCategory;

  const filters = useCatalogFilters(list.items);
  const isClosed = previewClosed || (store ? !isOpenNow(store.hours) : false);

  const subtitle =
    store && store.deliveryTimeMin !== null && store.deliveryTimeMax !== null
      ? t('market.subtitle', {
          count: list.total,
          min: store.deliveryTimeMin,
          max: store.deliveryTimeMax,
        })
      : list.total > 0
        ? t('results', { count: list.total })
        : undefined;

  if (storesQuery.query.isPending) return <MarketSkeleton />;

  if (storesQuery.query.isError) {
    return (
      <main id="main" className="flex w-full flex-col gap-8">
        <PageHeader title={t('market.title')} />
        <ErrorState
          failure={storesQuery.query.error}
          title={t('error.title')}
          message={failureMessage(storesQuery.query.error)}
          onRetry={() => storesQuery.query.refetch()}
          retryLabel={t('error.retry')}
        />
      </main>
    );
  }

  // `?preview=empty` empties the store list too; the state the screen is asked to show is the
  // grid's "Nəticə tapılmadı", so the no-stores block is skipped while previewing.
  if (!store && !preview) {
    return (
      <main id="main" className="flex w-full flex-col gap-8">
        <PageHeader title={t('market.title')} />
        <EmptyState
          icon={StoreIcon}
          title={t('market.noStores.title')}
          body={t('market.noStores.body')}
          action={
            <StateButton variant="primary" href={paths.addresses}>
              {t('market.noStores.cta')}
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
      <PageHeader title={t('market.title')} subtitle={subtitle} />

      <PromoBanner />

      {isClosed ? (
        <ClosedBanner
          title={t('closed.title')}
          body={t('closed.body', { time: store?.hours?.open ?? '' })}
        />
      ) : null}

      {/* Categories live in the left column only. The export also drew them as a chip row above
          the grid, but with 42 categories that row became a wall of pills duplicating the panel
          right under it, so it was dropped on the owner's instruction. Below `lg` there is no
          column, so the panel moves into the filter sheet behind the "Filtr" pill. */}
      <div className="flex w-full flex-row items-start gap-6">
        <aside aria-label={t('filters.title')} className="hidden w-60 shrink-0 lg:block">
          {panel}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="hidden w-full flex-row items-center justify-end gap-4 lg:flex">
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
    </main>
  );
}
