'use client';

/**
 * AX2 — results (`IOSGF`): head ("“alma” üçün 24 nəticə" 30/800 + the source line) with the
 * Məhsullar / Mağazalar / Kateqoriyalar chips, the filter row, the 4-up grid at gap 20 and the
 * "Daha çox göstər (16)" button.
 *
 * Only the controls that really work are rendered: "Yalnız endirimli" and the sort are client-side
 * (the server has neither), and the store filter is built from the fan-out legs. The export's
 * "Filtrlər" / "Qiymət" chips open a panel that is not specified anywhere, so they are left out
 * rather than shipped dead.
 *
 * The grid lives in a polite live region, so the result count is announced while typing.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Percent, Store as StoreIcon, ShoppingBasket } from '@/shared/lucide';
import { ProductGridSkeleton, Shimmer } from '@/shared/skeleton';
import { EmptyState } from '@/shared/states';
import { Button, Chip, Select } from '@/shared/ui';
// TODO(store): `<ProductCard>` and `<StoreTile>` are agent M3's components.
import { ProductCard, StoreTile } from '@/modules/store';
import { useGridCart } from '@/modules/product';

import type { ProductRow, Store } from '../data/store-bridge';
import type { SearchSort } from '../hooks/use-search';

export type ResultTab = 'products' | 'stores';

export interface SearchResultsProps {
  keyword: string;
  total: number;
  products: readonly ProductRow[];
  stores: readonly Store[];
  legs: readonly Store[];
  tab: ResultTab;
  onTabChange: (tab: ResultTab) => void;
  sort: SearchSort;
  onSortChange: (sort: SearchSort) => void;
  discountOnly: boolean;
  onDiscountOnlyChange: (next: boolean) => void;
  storeId: number | null;
  onStoreIdChange: (storeId: number | null) => void;
  loading: boolean;
  hasMore: boolean;
  remaining: number;
  loadingMore: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function SearchResults({
  keyword,
  total,
  products,
  stores,
  legs,
  tab,
  onTabChange,
  sort,
  onSortChange,
  discountOnly,
  onDiscountOnlyChange,
  storeId,
  onStoreIdChange,
  loading,
  hasMore,
  remaining,
  loadingMore,
  onLoadMore,
  className,
}: SearchResultsProps) {
  const t = useTranslations('search');
  const cart = useGridCart();

  const matchingStores = stores.filter((store) =>
    store.name.toLowerCase().includes(keyword.toLowerCase()),
  );
  const leadStore = legs[0]?.name ?? '';
  const partnerCount = Math.max(legs.length - 1, 0);

  const sortOptions = [
    { value: 'relevance', label: t('sort.relevance') },
    { value: 'priceAsc', label: t('sort.priceAsc') },
    { value: 'priceDesc', label: t('sort.priceDesc') },
  ];

  const storeOptions = [
    { value: 'all', label: t('filters.store') },
    ...legs.map((store) => ({ value: String(store.id), label: store.name })),
  ];

  return (
    <div className={cn('flex w-full flex-col gap-8', className)}>
      <div className="flex w-full flex-col items-start gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="m-0 text-h2 font-extrabold tracking-[-0.02em] text-ink md:text-[30px]">
            {t('results.title', { query: keyword, count: total })}
          </h1>
          {leadStore ? (
            <p className="m-0 text-label text-ink2">
              {partnerCount > 0
                ? t('results.subtitle', { store: leadStore, count: partnerCount })
                : t('results.subtitleSingle', { store: leadStore })}
            </p>
          ) : null}
        </div>

        <div role="group" aria-label={t('tabs.label')} className="flex shrink-0 flex-row gap-2">
          <Chip
            selected={tab === 'products'}
            count={total}
            leadingIcon={ShoppingBasket}
            onClick={() => onTabChange('products')}
          >
            {t('tabs.products')}
          </Chip>
          <Chip
            selected={tab === 'stores'}
            count={matchingStores.length}
            leadingIcon={StoreIcon}
            onClick={() => onTabChange('stores')}
          >
            {t('tabs.stores')}
          </Chip>
        </div>
      </div>

      {tab === 'products' ? (
        <>
          <div className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <div className="flex flex-row flex-wrap items-center gap-2.5">
              <Chip
                selected={discountOnly}
                leadingIcon={Percent}
                aria-pressed={discountOnly}
                onClick={() => onDiscountOnlyChange(!discountOnly)}
              >
                {t('filters.discountOnly')}
              </Chip>
              {legs.length > 1 ? (
                <Select
                  aria-label={t('filters.store')}
                  value={storeId === null ? 'all' : String(storeId)}
                  options={storeOptions}
                  onValueChange={(value) =>
                    onStoreIdChange(value === 'all' ? null : Number(value))
                  }
                  className="h-10 w-auto min-w-[160px]"
                />
              ) : null}
            </div>

            <Select
              aria-label={t('sort.aria')}
              value={sort}
              options={sortOptions}
              onValueChange={(value) => onSortChange(value as SearchSort)}
              align="end"
              className="h-10 w-auto min-w-[200px]"
            />
          </div>

          <div
            aria-live="polite"
            aria-busy={loading}
            className="flex w-full flex-col items-center gap-8"
          >
            <span className="sr-only">{t('results.announce', { count: total })}</span>

            {loading ? (
              <Shimmer label={t('loading')} className="w-full">
                <ProductGridSkeleton cols={4} count={8} />
              </Shimmer>
            ) : products.length === 0 ? (
              <EmptyState
                compact
                icon={Percent}
                title={t('notFound.title', { query: keyword })}
                body={t('notFound.body')}
              />
            ) : (
              <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product, index) => (
                  <ProductCard
                    key={`${product.storeId}-${product.id}`}
                    product={product}
                    priority={index < 4}
                    quantity={cart.quantityOf(product)}
                    onQuantityChange={(next) => cart.setQuantity(product, next)}
                    step={cart.stepOf(product)}
                    busy={cart.pending}
                  />
                ))}
              </div>
            )}

            {hasMore && !loading ? (
              <Button
                variant="white"
                size="xl"
                loading={loadingMore}
                onClick={onLoadMore}
                className="bg-surface text-ink"
              >
                {t('loadMore', { count: remaining })}
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex w-full flex-col gap-5">
          {matchingStores.length === 0 ? (
            <EmptyState compact icon={StoreIcon} title={t('stores.empty')} />
          ) : (
            <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {matchingStores.map((store) => (
                <StoreTile key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
