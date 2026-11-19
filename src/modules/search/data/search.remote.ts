/**
 * Search has **no endpoint of its own**: `GET v1/search` and `GET v1/products` answer `Cannot GET`
 * on live (api/search.md). It is composed from the catalog operations:
 *
 * | need                       | endpoint                                                  | live     |
 * | -------------------------- | --------------------------------------------------------- | -------- |
 * | stores serving a point     | `GET v1/stores/search?lat&lng`  (`lat`+`lng` REQUIRED)    | verified |
 * | products / in-store search | `GET v1/stores/{storeId}/products?keyword&category_id…`   | verified |
 * | category shortcuts         | `GET v1/categories/products?store_id&parent_id`           | verified |
 *
 * Rate limit: the gateway answers 429 when **one path** is called twice concurrently. The fan-out
 * legs differ in their `{storeId}` path segment, so they are different paths and safe in parallel;
 * two searches against the *same* store must not overlap — the hook debounces 300 ms and passes the
 * query's `signal`, and `api()` additionally serialises same-path calls.
 *
 * `GET v1/stores/favorites` is **not-found** on live and is deliberately not callable from here.
 */
import { callEndpoint, type RemoteResult } from '@/core/network';
import type {
  StoreProductCategoriesData,
  StoreProductsData,
  StoreSearchData,
} from '@/core/api/contracts/types';

/** Large pages are slow server-side (10 s+ at limit=30); the fan-out asks for 10 per leg. */
export const SEARCH_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 20;

export interface DeliveryPointParams {
  lat: number;
  lng: number;
}

export interface StoreProductsParams {
  storeId: number;
  /** In-store keyword search — diacritic-sensitive. `search=` is ignored by the server. */
  keyword?: string | null;
  categoryId?: number | null;
  limit?: number;
  offset?: number;
}

export const searchRemote = {
  /** `search=` is ignored by the server — the name filter is applied client-side. */
  stores: (point: DeliveryPointParams, signal?: AbortSignal): RemoteResult<StoreSearchData> =>
    callEndpoint<StoreSearchData>('StoreSearch', {
      query: { lat: point.lat, lng: point.lng },
      signal,
    }),

  products: (params: StoreProductsParams, signal?: AbortSignal): RemoteResult<StoreProductsData> =>
    callEndpoint<StoreProductsData>('StoreProducts', {
      params: { storeId: params.storeId },
      query: {
        keyword: params.keyword?.trim() || undefined,
        category_id: params.categoryId ?? undefined,
        limit: Math.min(params.limit ?? SEARCH_PAGE_LIMIT, MAX_PAGE_LIMIT),
        offset: params.offset ?? 0,
      },
      signal,
    }),

  productCategories: (
    args: { storeId: number; parentId?: number | null },
    signal?: AbortSignal,
  ): RemoteResult<StoreProductCategoriesData> =>
    callEndpoint<StoreProductCategoriesData>('StoreProductCategories', {
      query: { store_id: args.storeId, parent_id: args.parentId ?? undefined },
      signal,
    }),
} as const;
