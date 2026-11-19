/**
 * Query keys for the store module (Market, Mağaza, Kateqoriya).
 *
 * First element is always `'store'` so a sign-out / city change can drop the whole module with one
 * `invalidateQueries({ queryKey: storeKeys.all })`. Wrap every key with `scoped(key, locale)` in
 * the hook: all of this text is server-translated through `Accept-Language`.
 */
import { moduleKeys } from '@/core/query';

export interface ProductsKeyFilters {
  categoryId: number | null;
  keyword: string | null;
}

export const storeKeys = {
  ...moduleKeys('store'),
  /** `GET v1/stores/search?lat&lng` — the list is "stores serving this point". */
  list: (point: { lat: number; lng: number } | null) =>
    ['store', 'list', point ? `${point.lat},${point.lng}` : null] as const,
  /** `GET v1/stores/{id}`. */
  detail: (id: number | string) => ['store', 'detail', Number(id)] as const,
  /** `GET v1/categories/stores` (store categories, NOT stores). */
  storeCategories: () => ['store', 'store-categories'] as const,
  /** `GET v1/categories/products?store_id&parent_id`. */
  productCategories: (storeId: number, parentId?: number | null) =>
    ['store', 'product-categories', storeId, parentId ?? null] as const,
  /** `GET v1/stores/{storeId}/products?category_id&keyword` (offset paging). */
  products: (storeId: number, filters: ProductsKeyFilters) =>
    ['store', 'products', storeId, filters.categoryId ?? null, filters.keyword ?? null] as const,
} as const;
