'use client';

/**
 * `/market/category/[id]` — App · Kateqoriya (`Iy7XQ`), HTML `app-catalog/app-category.html`.
 *
 * Regions: breadcrumb `Fe2fs` → header `EzmFT` (title + "N məhsul · <store>") → subcategory chips
 * `o9i3Y` → body `X9gHzg` (row, gap 24): the 240-wide filter column `F22MCB`, then the active
 * filter chips `Dovgr`, the sort trigger `QRm7a` and the grid `HtqRU`.
 *
 * A category id alone is not enough for this API: products are always per store
 * (`stores/{storeId}/products?category_id`), and so are categories
 * (`categories/products?store_id&parent_id`). The store therefore comes from `?store=<id>` and
 * falls back to the nearest delivering store for the current point.
 *
 * The drawn "Daha çox yüklə" button is replaced by `<InfiniteList>`'s sentinel + footer spinner.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { useRouter } from '@/core/i18n/navigation';
import { usePreview } from '@/core/query';
import { paths } from '@/core/routes';
import { ErrorState, StateButton } from '@/shared/states';
import { PageHeader } from '@/shared/layout';
import { Breadcrumbs } from '@/shared/ui';

import { AgeGate, useAgeGate } from '../components/age-gate';
import { CatalogGrid } from '../components/catalog-grid';
import { MobileFilterBar } from '../components/catalog-toolbar';
import { FilterPanel } from '../components/filter-panel';
import { CategoryChips } from '../components/category-chips';
import { SortMenu } from '../components/sort-menu';
import { useCatalogFilters } from '../hooks/use-catalog-filters';
import { useDeliveryPoint } from '../hooks/use-delivery-point';
import { useProductCategories } from '../hooks/use-product-categories';
import { useStoreProducts } from '../hooks/use-store-products';
import { pickDefaultStore, useStores } from '../hooks/use-stores';
import { CategorySkeleton } from './CategorySkeleton';

export interface CategoryViewProps {
  categoryId: number;
  /** `?store=` — the store whose catalogue this category is read from. */
  storeId?: number | null;
}

export function CategoryView({ categoryId, storeId: storeIdParam }: CategoryViewProps) {
  const t = useTranslations('store');
  const failureMessage = useFailureMessage();
  const router = useRouter();
  const preview = usePreview();

  const { point } = useDeliveryPoint();
  const storesQuery = useStores({
    point,
    enabled: storeIdParam === null || storeIdParam === undefined,
  });
  const fallbackStore = useMemo(
    () => pickDefaultStore(storesQuery.stores),
    [storesQuery.stores],
  );
  const storeId = storeIdParam ?? fallbackStore?.id ?? null;
  const storeName = storeIdParam ? '' : (fallbackStore?.name ?? '');

  const all = useProductCategories(storeId);
  const subs = useProductCategories(storeId, { parentId: categoryId });

  const category = useMemo(
    () => all.categories.find((c) => c.id === categoryId) ?? null,
    [all.categories, categoryId],
  );

  const [sub, setSub] = useState<number | null>(null);
  const effectiveCategory = sub ?? categoryId;
  const activeSub = useMemo(
    () => subs.categories.find((c) => c.id === sub) ?? null,
    [subs.categories, sub],
  );

  const restricted = (activeSub ?? category)?.isAgeRestricted ?? false;
  const age = useAgeGate(effectiveCategory, restricted);

  const list = useStoreProducts({
    storeId,
    categoryId: effectiveCategory,
    enabled: !age.blocked,
  });
  const filters = useCatalogFilters(list.items);

  if (all.query.isPending || (storeId === null && storesQuery.query.isPending)) {
    return <CategorySkeleton />;
  }

  // While previewing, a missing store must not replace the state the screen is asked to show.
  if ((storeId === null && !preview) || all.query.isError) {
    const failure = all.query.error ?? storesQuery.query.error;
    return (
      <main id="main" className="flex w-full flex-col gap-8">
        <ErrorState
          failure={failure}
          title={t('error.title')}
          message={failure ? failureMessage(failure) : t('category.noStore')}
          onRetry={() => all.query.refetch()}
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

  const title = category?.name ?? t('category.fallbackTitle');
  const subtitle = storeName
    ? t('category.subtitle', { count: list.total, store: storeName })
    : t('results', { count: list.total });

  const panel = (
    <FilterPanel
      categories={all.categories}
      categoryId={categoryId}
      onCategoryChange={(id) => router.push(id === null ? paths.market : paths.category(id))}
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
          { label: t('breadcrumb.categories'), href: paths.market },
          { label: title },
        ]}
      />

      <PageHeader title={title} subtitle={subtitle} />

      {subs.categories.length > 0 ? (
        <CategoryChips
          categories={subs.categories}
          value={sub}
          onChange={setSub}
          label={t('chips.subLabel')}
          allLabel={t('chips.all')}
        />
      ) : null}

      {/* Top-level categories live in the left column; the chip row above is the SUB-categories of
          this one, which the panel does not duplicate. Below `lg` the panel moves into the filter
          sheet behind the "Filtr" pill. */}
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

          {age.blocked ? (
            <AgeGate
              categoryName={(activeSub ?? category)?.name ?? title}
              onConfirm={age.confirm}
              onCancel={() => router.push(paths.market)}
            />
          ) : (
            <CatalogGrid
              list={list}
              products={filters.visible}
              cols={3}
              emptyTitle={t('empty.title')}
              emptyBody={t('empty.categoryEmpty')}
            />
          )}
        </div>
      </div>
    </main>
  );
}
