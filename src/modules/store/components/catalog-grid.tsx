'use client';

/**
 * The product grid every catalog screen shares (`bI2BN` / `UHQlb` / `HtqRU`): 3 columns of 269 at
 * 1440 (4 on the store page), 2 at tablet and mobile, gap 20 (16 on mobile per
 * `app-market-mobil-390.html`).
 *
 * Owns the three states of the list:
 *  - first page in flight → `<ProductGridSkeleton>` with the same columns and gap (no layout shift)
 *  - loaded and empty → `<EmptyState>` with the per-screen copy and a clear-filters action
 *  - first page failed → `<ErrorState>`; a later page failing is the footer retry row inside
 *    `<InfiniteList>`, whose spinner is one of the three places a spinner is allowed.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import type { UseOffsetInfiniteResult } from '@/core/query';
import { SearchX } from '@/shared/lucide';
import { ProductGridSkeleton, Shimmer } from '@/shared/skeleton';
import { EmptyState, ErrorState, StateButton } from '@/shared/states';
import { InfiniteList } from '@/shared/ui';

import type { ProductRow } from '../data/models/product-row';
import { useRowCart } from '../hooks/use-row-cart';
import { useProductFavorites } from '../hooks/use-store-favorite';
import { ProductCard } from './product-card';

export interface CatalogGridProps {
  /** The infinite query: paging flags, error and retry. */
  list: UseOffsetInfiniteResult<ProductRow>;
  /** The rows to render — already filtered / sorted client-side. */
  products: readonly ProductRow[];
  cols?: 2 | 3 | 4;
  /** Store closed → add buttons are inert (no route change, screen AX7). */
  addDisabled?: boolean;
  emptyTitle: string;
  emptyBody?: string;
  /** Rendered as the empty-state action when client-side filters hid everything. */
  onClearFilters?: () => void;
  className?: string;
}

const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
};

export function CatalogGrid({
  list,
  products,
  cols = 3,
  addDisabled = false,
  emptyTitle,
  emptyBody,
  onClearFilters,
  className,
}: CatalogGridProps) {
  const t = useTranslations('store');
  const failureMessage = useFailureMessage();
  const favorites = useProductFavorites();

  const gridClasses = cn('grid w-full gap-4 md:gap-5', GRID_COLS[cols], className);
  const errorText = list.error ? failureMessage(list.error) : undefined;

  // First page failed: nothing to show, so the page-level error block.
  if (list.isError && list.loadedCount === 0) {
    return (
      <ErrorState
        failure={list.error}
        title={t('error.title')}
        message={errorText}
        onRetry={list.refetch}
        retryLabel={t('error.retry')}
      />
    );
  }

  // First page in flight: the mirror skeleton, same columns and gap as the loaded grid.
  if (list.isPending) {
    return (
      <Shimmer label={t('loading')} className="w-full">
        <ProductGridSkeleton cols={cols} count={cols * 2} className={gridClasses} />
      </Shimmer>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={emptyTitle}
        body={emptyBody}
        action={
          onClearFilters ? (
            <StateButton variant="primary" onClick={onClearFilters}>
              {t('empty.clearFilters')}
            </StateButton>
          ) : undefined
        }
      />
    );
  }

  return (
    <InfiniteList<ProductRow>
      items={[...products]}
      itemKey={(row) => String(row.id)}
      className={gridClasses}
      hasNextPage={list.hasMore}
      isFetchingNextPage={list.isFetchingNextPage}
      fetchNextPage={list.loadMore}
      error={list.isError ? list.error : undefined}
      onRetry={list.refetch}
      errorMessage={errorText}
      retryLabel={t('error.retry')}
      loadingLabel={t('loadingMore')}
      renderItem={(row) => (
        <CatalogCard
          row={row}
          favorite={favorites.isFavorite(row.id, row.isFavorite)}
          onToggleFavorite={() => favorites.toggle(row.id)}
          disabled={addDisabled}
        />
      )}
    />
  );
}

/**
 * One card. The cart wiring is a **per-row** hook (`useCartQuantity` + the debounced
 * `useQuantityCommit` from `@/modules/cart`), so it lives in this component rather than in a loop
 * inside the grid.
 */
function CatalogCard({
  row,
  favorite,
  onToggleFavorite,
  disabled,
}: {
  row: ProductRow;
  favorite: boolean;
  onToggleFavorite: () => void;
  disabled: boolean;
}) {
  const cart = useRowCart(row);

  return (
    <ProductCard
      product={row}
      quantity={cart.quantity}
      step={cart.step}
      busy={cart.busy}
      onQuantityChange={cart.setQuantity}
      favorite={favorite}
      onToggleFavorite={onToggleFavorite}
      disabled={disabled}
    />
  );
}
