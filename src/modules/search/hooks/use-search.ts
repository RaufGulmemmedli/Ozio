'use client';

/**
 * The composed search (AX1–AX3). Sequence, in order:
 *
 *  1. `useDeliveryPoint()` (from `@/modules/store`) gives `lat`/`lng` — `stores/search` answers 400
 *     without them.
 *  2. `searchKeys.stores(lat, lng)` → `GET v1/stores/search`, one call per point, `CACHE.catalog`.
 *     The nearest 3 delivering stores become the fan-out legs.
 *  3. `searchKeys.results(keyword, storeIds)` → one page per leg, **in parallel**, interleaved by
 *     the repository. `limit = 10` per leg; paging adds the same `offset` to every leg.
 *
 * Rate-limit discipline:
 *  - typing is debounced **300 ms** (`useDebouncedValue`), so one keystroke is not one request;
 *  - the key contains the keyword, so a superseded search is a different query and TanStack aborts
 *     the old one through the `signal` the repository forwards to every leg;
 *  - `placeholderData: keep previous` holds the old grid while the new one loads, so the screen
 *     never flashes an empty state mid-typing;
 *  - legs differ by `{storeId}` (different paths), so they are allowed to be concurrent — and
 *     `api()` serialises anything that would still collide on one path.
 */
import { useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import type { InfiniteData } from '@tanstack/react-query';

import { useDebouncedValue } from '@/core/lib/debounce';
import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useScreenInfiniteQuery, useScreenQuery } from '@/core/query';
// TODO(store): `useDeliveryPoint` is agent M3's hook (src/modules/store/hooks/use-delivery-point.ts).
import { useDeliveryPoint } from '@/modules/store';

import { FAN_OUT_STORES, searchRepository, type SearchPage } from '../data/search.repository';
import { SEARCH_PAGE_LIMIT } from '../data/search.remote';
import type { ProductRow, Store } from '../data/store-bridge';
import { searchKeys } from '../search.query-keys';

export const SEARCH_DEBOUNCE_MS = 300;

export type SearchSort = 'relevance' | 'priceAsc' | 'priceDesc';

export interface UseSearchArgs {
  /** The raw field value — debounced inside. */
  term: string;
  /** Client-side filters (the server has no sort or discount filter). */
  sort?: SearchSort;
  discountOnly?: boolean;
  /** Restrict the grid to one of the fan-out stores. */
  storeId?: number | null;
  categoryId?: number | null;
}

export interface UseSearchResult {
  /** The term the results on screen belong to. */
  keyword: string;
  /** True while the field is ahead of the results (debounce window). */
  typing: boolean;
  /** The nearest delivering stores the fan-out ran against. */
  legs: Store[];
  /** Every store serving the point (the "Mağazalar" tab filters this by name, client-side). */
  stores: Store[];
  storesPending: boolean;
  products: ProductRow[];
  /** Sum of the legs' `total`s. */
  total: number;
  /** Rows after the client-side filter + sort. */
  visible: ProductRow[];
  hasMore: boolean;
  remaining: number;
  isPending: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  error: Failure | null;
  /** Loaded, and the fan-out really found nothing → AX3. */
  isEmpty: boolean;
  /** Stores whose leg failed: partial results are shown, never presented as complete. */
  failedStoreIds: number[];
  loadMore: () => void;
  refetch: () => void;
}

const EMPTY_PAGE: SearchPage = {
  items: [],
  total: 0,
  offset: 0,
  limit: SEARCH_PAGE_LIMIT,
  hasMore: false,
  failedStoreIds: [],
};

const EMPTY_SEED: InfiniteData<SearchPage, number> = { pages: [EMPTY_PAGE], pageParams: [0] };

export function useSearch(args: UseSearchArgs): UseSearchResult {
  const locale = useLocale();
  const { point } = useDeliveryPoint();
  const { sort = 'relevance', discountOnly = false, storeId = null, categoryId = null } = args;

  const raw = args.term.trim();
  const keyword = useDebouncedValue(raw, SEARCH_DEBOUNCE_MS);

  const storesQuery = useScreenQuery<Store[]>(
    {
      queryKey: scoped(searchKeys.stores(point.lat, point.lng), locale),
      queryFn: ({ signal }) => unwrap(searchRepository.stores(point, null, { locale, signal })),
      ...CACHE.catalog,
    },
    { empty: [] },
  );

  // Keyed on the query's own array so `legs` keeps its identity between renders.
  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data]);
  const legs = useMemo(
    () => searchRepository.pickFanOut(stores, FAN_OUT_STORES),
    [stores],
  );
  const legIds = useMemo(() => legs.map((store) => store.id), [legs]);

  const enabled = keyword.length > 0 && legIds.length > 0;

  const results = useScreenInfiniteQuery<SearchPage, number>(
    {
      queryKey: scoped(searchKeys.results(keyword, legIds, categoryId), locale),
      enabled,
      initialPageParam: 0,
      queryFn: ({ pageParam, signal }) =>
        unwrap(
          searchRepository.searchProducts(
            {
              keyword,
              storeIds: legIds,
              categoryId,
              offset: pageParam,
              limit: SEARCH_PAGE_LIMIT,
            },
            { locale, signal },
          ),
        ),
      getNextPageParam: (last) => (last.hasMore ? last.offset + last.limit : undefined),
      // Hold the previous grid while a new keyword loads — no flash of the empty state.
      placeholderData: (prev) => prev,
      refetchOnWindowFocus: false,
      ...CACHE.catalog,
    },
    { empty: EMPTY_SEED },
  );

  const pages = results.data?.pages;
  const products = useMemo(() => (pages ?? []).flatMap((page) => page.items), [pages]);
  const lastPage = pages && pages.length > 0 ? pages[pages.length - 1] : undefined;
  const total = lastPage?.total ?? 0;

  const visible = useMemo(() => {
    let rows = products;
    if (storeId !== null) rows = rows.filter((row) => row.storeId === storeId);
    if (discountOnly) rows = rows.filter((row) => row.isDiscounted);
    if (sort === 'priceAsc') rows = [...rows].sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') rows = [...rows].sort((a, b) => b.price - a.price);
    return rows;
  }, [products, storeId, discountOnly, sort]);

  const { fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, refetch } = results;

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetching) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const doRefetch = useCallback(() => {
    void storesQuery.refetch();
    void refetch();
  }, [refetch, storesQuery]);

  return {
    keyword,
    typing: raw !== keyword,
    legs,
    stores,
    storesPending: storesQuery.isPending,
    products,
    total,
    visible,
    hasMore: Boolean(hasNextPage),
    remaining: Math.max(total - products.length, 0),
    isPending: enabled ? results.isPending : false,
    isFetching,
    isFetchingNextPage,
    isError: results.isError || (storesQuery.isError && keyword.length > 0),
    error: results.error ?? storesQuery.error ?? null,
    isEmpty: enabled && results.isSuccess && products.length === 0,
    failedStoreIds: lastPage?.failedStoreIds ?? [],
    loadMore,
    refetch: doRefetch,
  };
}
