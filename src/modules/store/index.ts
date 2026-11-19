/**
 * Public surface of the store module (Market, Mağaza, Kateqoriya).
 *
 * M2 (home), M4 (product / search) and M5 (cart) import from **here only**. The names below are
 * the agreed contract — add to it, never rename.
 */

/* ---- hooks ------------------------------------------------------------------------------- */
export { useStores, pickDefaultStore } from './hooks/use-stores';
export type { UseStoresArgs, UseStoresResult } from './hooks/use-stores';

export { useStoreDetail } from './hooks/use-store-detail';
export type { UseStoreDetailResult } from './hooks/use-store-detail';

export { useProductCategories } from './hooks/use-product-categories';
export type { UseProductCategoriesResult } from './hooks/use-product-categories';

export { useStoreProducts } from './hooks/use-store-products';
export type { UseStoreProductsArgs } from './hooks/use-store-products';

export { useStoreCategories } from './hooks/use-store-categories';
export type { UseStoreCategoriesResult } from './hooks/use-store-categories';

export { useStoreFavorite, useProductFavorites } from './hooks/use-store-favorite';

/**
 * The cart wiring every `<ProductCard>` grid in this module uses — a per-row hook over
 * `@/modules/cart` (`useCartQuantity` + the debounced `useQuantityCommit`).
 */
export { useRowCart } from './hooks/use-row-cart';
export type { RowCart } from './hooks/use-row-cart';

export { useDeliveryPoint, BAKU_CENTRE } from './hooks/use-delivery-point';
export type { DeliveryPointState } from './hooks/use-delivery-point';

export {
  useCatalogFilters,
  CATALOG_SORTS,
  DEFAULT_PRICE_BOUNDS,
} from './hooks/use-catalog-filters';
export type {
  CatalogSort,
  CatalogFilterState,
  PriceRange,
  UseCatalogFiltersResult,
} from './hooks/use-catalog-filters';

/* ---- components -------------------------------------------------------------------------- */
export { ProductCard } from './components/product-card';
export type { ProductCardProps } from './components/product-card';

export { StoreTile } from './components/store-tile';
export type { StoreTileProps } from './components/store-tile';

export { CatalogGrid } from './components/catalog-grid';
export type { CatalogGridProps } from './components/catalog-grid';

export { CategoryChips } from './components/category-chips';
export type { CategoryChipsProps } from './components/category-chips';

export { StoreHeader } from './components/store-header';
export type { StoreHeaderProps } from './components/store-header';

/* ---- views (route-level) ----------------------------------------------------------------- */
export { MarketView } from './view/MarketView';
export { MarketSkeleton } from './view/MarketSkeleton';
export { StoreView } from './view/StoreView';
export { StoreSkeleton } from './view/StoreSkeleton';
export { CategoryView } from './view/CategoryView';
export { CategorySkeleton } from './view/CategorySkeleton';

/* ---- data ------------------------------------------------------------------------------- */
export { storeRepository } from './data/store.repository';
export { storeRemote, PRODUCTS_PAGE_LIMIT } from './data/store.remote';
export type { DeliveryPoint, ProductsParams } from './data/store.remote';

export {
  parseStore,
  parseStoreDetail,
  parseStoreCategory,
  currentBonusPercentage,
  isOpenNow,
  addMinutesToClock,
  clockInBaku,
  dateInBaku,
  bakuNowMinutes,
  sortStoresByDistance,
  BAKU_TIME_ZONE,
} from './data/models/store';
export type { Store, StoreDetail, StoreHours, StoreCategory } from './data/models/store';

export { parseProductRow, stockInOrderUnit } from './data/models/product-row';
export type { ProductRow } from './data/models/product-row';

export { parseProductCategory } from './data/models/product-category';
export type { ProductCategory } from './data/models/product-category';

export { storeKeys } from './store.query-keys';
export type { ProductsKeyFilters } from './store.query-keys';

export { storeRoutes } from './store.routes';
export type { StoreRoute } from './store.routes';
