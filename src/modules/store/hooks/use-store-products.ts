'use client';

/**
 * `GET v1/stores/{storeId}/products?category_id&keyword&limit&offset` [verified].
 *
 * - Paging is `offset` + `limit`; `page` is ignored. `limit` is capped at 20 in the remote source.
 * - `category_id` is required **in practice**: the unfiltered list is ~50 s server-side and can
 *   500, so `categoryId: null` ("Hamısı") is only ever requested when the user asks for it.
 * - Switching category changes the query key, so the old page is replaced, not raced; `api()`
 *   additionally serialises every call to this path (the gateway answers 429 to concurrent ones).
 */
import { useLocale } from 'next-intl';
import { unwrap } from '@/core/network';
import { CACHE, scoped, useOffsetInfinite, type UseOffsetInfiniteResult } from '@/core/query';

import { storeRepository } from '../data/store.repository';
import { PRODUCTS_PAGE_LIMIT } from '../data/store.remote';
import type { ProductRow } from '../data/models/product-row';
import { storeKeys } from '../store.query-keys';

export interface UseStoreProductsArgs {
  storeId: number | null;
  categoryId?: number | null;
  /** In-store keyword search (diacritic-sensitive). */
  keyword?: string | null;
  limit?: number;
  enabled?: boolean;
}

export function useStoreProducts(
  args: UseStoreProductsArgs,
): UseOffsetInfiniteResult<ProductRow> {
  const locale = useLocale();
  const { storeId, categoryId = null, keyword = null, limit = PRODUCTS_PAGE_LIMIT } = args;

  return useOffsetInfinite<ProductRow>({
    key: scoped(
      storeKeys.products(storeId ?? 0, { categoryId, keyword: keyword?.trim() || null }),
      locale,
    ),
    limit,
    enabled: (args.enabled ?? true) && storeId !== null && storeId > 0,
    staleTime: CACHE.catalog.staleTime,
    gcTime: CACHE.catalog.gcTime,
    // The grid keeps its scroll position while paging.
    refetchOnWindowFocus: false,
    fetchPage: ({ offset, limit: pageLimit, signal }) =>
      unwrap(
        storeRepository.products(
          { storeId: storeId as number, categoryId, keyword, offset, limit: pageLimit },
          { locale, signal },
        ),
      ),
  });
}
