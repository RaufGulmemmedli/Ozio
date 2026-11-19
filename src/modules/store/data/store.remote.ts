/**
 * Raw calls for the store module. Paths and versions come from `endpoint()` so nothing is retyped.
 *
 * Live notes that shape this file (api/store.md):
 *  - `GET /stores` does not exist — `stores/search` is the only store list, and `lat` + `lng` are
 *    REQUIRED (400 without). `search=` is **ignored** by the server, so it is not sent.
 *  - `GET stores/favorites` is `not-found` on live (shadowed by `/stores/{id}` → 404 "store not
 *    found"); `endpoint()` refuses it, so there is no read function for it here.
 *  - POST / DELETE `stores/favorites` are **unverified** (the `store_id` body is a guess).
 *  - `stores/{storeId}/products` pages with `offset` + `limit` (`page` is ignored) and must stay at
 *    `limit <= 20`: an unfiltered large page took ~50 s and can 500.
 *  - Two concurrent calls to one path answer 429; `api()` serialises per path, so nothing here
 *    fans out.
 */
import { callEndpoint, type RemoteResult } from '@/core/network';
import type {
  StoreDetailData,
  StoreProductCategoriesData,
  StoreProductsData,
  StoreSearchData,
  StoreStoreCategoriesData,
} from '@/core/api/contracts/types';

/** Hard ceiling for `stores/{id}/products` (api/store.md: limit 30 already takes 10 s+). */
export const PRODUCTS_PAGE_LIMIT = 20;

export interface DeliveryPoint {
  lat: number;
  lng: number;
}

export interface ProductsParams {
  storeId: number;
  /** Required in practice: the unfiltered list is ~50 s server-side. */
  categoryId?: number | null;
  /** In-store search. Diacritic-sensitive; `search=` is ignored by the server. */
  keyword?: string | null;
  limit?: number;
  offset?: number;
}

export const storeRemote = {
  /** `GET v1/stores/search?lat&lng` — stores serving this point. */
  search: (point: DeliveryPoint, signal?: AbortSignal): RemoteResult<StoreSearchData> =>
    callEndpoint<StoreSearchData>('StoreSearch', {
      query: { lat: point.lat, lng: point.lng },
      signal,
    }),

  /** `GET v1/stores/{id}` — full detail (times are true UTC here). */
  detail: (id: number, signal?: AbortSignal): RemoteResult<StoreDetailData> =>
    callEndpoint<StoreDetailData>('StoreDetail', { params: { id }, signal }),

  /** `GET v1/categories/stores` — store CATEGORIES (`category_id` is ignored by the server). */
  storeCategories: (signal?: AbortSignal): RemoteResult<StoreStoreCategoriesData> =>
    callEndpoint<StoreStoreCategoriesData>('StoreStoreCategories', { signal }),

  /** `GET v1/categories/products?store_id&parent_id` — categories only, no products inside. */
  productCategories: (
    args: { storeId: number; parentId?: number | null },
    signal?: AbortSignal,
  ): RemoteResult<StoreProductCategoriesData> =>
    callEndpoint<StoreProductCategoriesData>('StoreProductCategories', {
      query: { store_id: args.storeId, parent_id: args.parentId ?? undefined },
      signal,
    }),

  /** `GET v1/stores/{storeId}/products?category_id&keyword&limit&offset`. */
  products: (params: ProductsParams, signal?: AbortSignal): RemoteResult<StoreProductsData> =>
    callEndpoint<StoreProductsData>('StoreProducts', {
      params: { storeId: params.storeId },
      query: {
        category_id: params.categoryId ?? undefined,
        keyword: params.keyword ?? undefined,
        limit: Math.min(params.limit ?? PRODUCTS_PAGE_LIMIT, PRODUCTS_PAGE_LIMIT),
        offset: params.offset ?? 0,
      },
      signal,
    }),

  /** `POST v1/stores/favorites` — **unverified**; the `store_id` body is a guess. */
  addFavorite: (storeId: number, signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint<unknown>('StoreFavoriteAdd', { body: { store_id: storeId }, signal }),

  /** `DELETE v1/stores/favorites?store_id` — **unverified**. */
  removeFavorite: (storeId: number, signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint<unknown>('StoreFavoriteRemove', { query: { store_id: storeId }, signal }),
} as const;
