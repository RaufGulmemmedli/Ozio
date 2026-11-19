'use client';

/**
 * "Hamısı" — the market grid with no category chosen.
 *
 * The obvious implementation is `GET v1/stores/{id}/products` with no `category_id`. Measured
 * against the live gateway for store 9 (6 184 products), it is not usable:
 *
 *   limit=4   → 15 s, 200 (and 370 ms on the repeat, so the gateway does cache per query)
 *   limit=8   → still running at 20 s
 *   limit=12  → still running at 45 s
 *   limit=20  → 504 Gateway Timeout after 25 s
 *
 * The grid's own page size is 20, so the unfiltered list times out at exactly the size it needs.
 * That is why the screen used to auto-pick a category instead and opened on "Meyvə & Tərəvəz".
 *
 * The same endpoint WITH a `category_id` answers in ~200–600 ms, so "Hamısı" is assembled from the
 * categories instead: one page of this list is the first {@link PER_CATEGORY} products of the next
 * {@link CATEGORIES_PER_PAGE} categories, fetched together, and "load more" walks on through the
 * category list. The result is a mixed shelf that fills in under a second rather than a 504.
 *
 * `CATEGORIES_PER_PAGE` is 3 because the gateway rate-limits this path: a burst of 8 concurrent
 * category requests came back as 4×200 and 4×429. `api()` already serialises same-path calls, so 3
 * is a page that is quick to fill while staying well under the ceiling.
 */
import { useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';

import { unwrap, type Failure, type Page } from '@/core/network';
import {
  CACHE,
  scoped,
  useScreenInfiniteQuery,
  type UseOffsetInfiniteResult,
} from '@/core/query';

import { storeRepository } from '../data/store.repository';
import type { ProductCategory } from '../data/models/product-category';
import type { ProductRow } from '../data/models/product-row';
import { storeKeys } from '../store.query-keys';

/** Categories pulled in per "page" of the infinite list. */
const CATEGORIES_PER_PAGE = 3;
/** Products taken from each of them. 3 × 8 = 24, one full grid page. */
const PER_CATEGORY = 8;

export interface UseAllProductsArgs {
  storeId: number | null;
  /** Every category of the store, in the order the panel lists them. */
  categories: readonly ProductCategory[];
  enabled?: boolean;
}

export function useAllProducts({
  storeId,
  categories,
  enabled = true,
}: UseAllProductsArgs): UseOffsetInfiniteResult<ProductRow> {
  const locale = useLocale();

  // Only the ids matter to the fetcher, and they keep the query key stable while the category
  // objects are re-parsed.
  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);
  const idsKey = categoryIds.join(',');

  const active = storeId !== null && storeId > 0 && categoryIds.length > 0 && enabled;

  const query = useScreenInfiniteQuery<Page<ProductRow>, number>(
    {
      queryKey: scoped(
        [...storeKeys.products(storeId ?? 0, { categoryId: null, keyword: null }), 'all', idsKey],
        locale,
      ),
      initialPageParam: 0,
      // The page param is an INDEX INTO `categoryIds`, not an offset: this list pages over
      // categories, not over one category's rows.
      queryFn: async ({ pageParam, signal }) => {
        const slice = categoryIds.slice(pageParam, pageParam + CATEGORIES_PER_PAGE);

        const pages = await Promise.all(
          slice.map((categoryId) =>
            unwrap(
              storeRepository.products(
                { storeId: storeId as number, categoryId, offset: 0, limit: PER_CATEGORY },
                { locale, signal },
              ),
            ),
          ),
        );

        return {
          items: pages.flatMap((page) => page.items),
          // `total` is the store's real product count as far as it has been read: the sum of the
          // per-category totals seen so far. It grows while paging, which is honest — the only
          // call that knows the true figure up front is the one that 504s.
          total: pages.reduce((sum, page) => sum + page.total, 0),
          limit: CATEGORIES_PER_PAGE * PER_CATEGORY,
          offset: pageParam,
        };
      },
      // Driven by the category cursor, NOT by `loaded < total`: a category that happens to be
      // empty (store 9's "Endirimli Məhsullar" returns 0) must not end the list.
      getNextPageParam: (_last, allPages) => {
        const next = allPages.length * CATEGORIES_PER_PAGE;
        return next < categoryIds.length ? next : undefined;
      },
      enabled: active,
      staleTime: CACHE.catalog.staleTime,
      gcTime: CACHE.catalog.gcTime,
      refetchOnWindowFocus: false,
    },
    { empty: { pages: [], pageParams: [] } },
  );

  const pages = query.data?.pages;
  const items = useMemo(() => (pages ?? []).flatMap((p) => p.items), [pages]);
  const total = useMemo(
    () => (pages ?? []).reduce((sum, p) => sum + p.total, 0),
    [pages],
  );

  const { fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, refetch } = query;

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetching) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const doRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    items,
    total,
    loadedCount: items.length,
    hasMore: hasNextPage,
    isPending: query.isPending,
    isLoading: query.isLoading,
    isFetching,
    isFetchingNextPage,
    isError: query.isError,
    error: (query.error as Failure | null) ?? null,
    isEmpty: query.isSuccess && items.length === 0,
    isPlaceholderData: query.isPlaceholderData,
    loadMore,
    refetch: doRefetch,
    query,
  };
}
