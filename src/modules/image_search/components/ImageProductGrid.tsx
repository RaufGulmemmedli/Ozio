'use client';

/**
 * `Products Grid` node: 4 columns of the shared catalog card at gap 20 (3 at tablet, 2 at mobile).
 *
 * The cards are the **store module's** `<ProductCard>` — this module writes no product card and no
 * product search of its own. The rows come from `useImageProducts`, i.e. from the real catalog.
 *
 * `<CatalogGrid>` is not reused here because it takes one `UseOffsetInfiniteResult`, and a photo
 * search fans out over several nearby stores (the design's "Ən yaxın mağazalar üzrə"); the card,
 * the skeleton and the pagination footer are still the shared ones.
 */
import { ProductCard, useProductFavorites, useRowCart } from '@/modules/store';
import type { ProductRow } from '@/modules/store';
import { InfiniteList } from '@/shared/ui';

export interface ImageProductGridProps {
  products: readonly ProductRow[];
  hasMore: boolean;
  isFetchingMore?: boolean;
  onLoadMore: () => void;
  error?: unknown;
  errorMessage?: string;
  retryLabel: string;
  loadingLabel: string;
  onRetry?: () => void;
}

/**
 * 2 / 3 / 4 columns at gap 16 → 20, exactly the breakpoints `<ProductGridSkeleton cols={4}>` uses,
 * so the skeleton and the loaded grid cannot disagree about a column.
 */
export const IMAGE_GRID_CLASS =
  'grid w-full grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4';

export function ImageProductGrid({
  products,
  hasMore,
  isFetchingMore = false,
  onLoadMore,
  error,
  errorMessage,
  retryLabel,
  loadingLabel,
  onRetry,
}: ImageProductGridProps) {
  const favorites = useProductFavorites();

  return (
    <InfiniteList<ProductRow>
      items={[...products]}
      itemKey={(row) => `${row.storeId}-${row.id}`}
      className={IMAGE_GRID_CLASS}
      hasNextPage={hasMore}
      isFetchingNextPage={isFetchingMore}
      fetchNextPage={onLoadMore}
      error={error}
      onRetry={onRetry}
      errorMessage={errorMessage}
      retryLabel={retryLabel}
      loadingLabel={loadingLabel}
      renderItem={(row) => (
        <ImageProductCard
          row={row}
          favorite={favorites.isFavorite(row.id, row.isFavorite)}
          onToggleFavorite={() => favorites.toggle(row.id)}
        />
      )}
    />
  );
}

/**
 * One card. `useRowCart` is a **per-row** hook (it wires `@/modules/cart`'s `useCartQuantity` +
 * debounced `useQuantityCommit` for this row), so it is called here, never in a loop in the grid.
 */
function ImageProductCard({
  row,
  favorite,
  onToggleFavorite,
}: {
  row: ProductRow;
  favorite: boolean;
  onToggleFavorite: () => void;
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
    />
  );
}
