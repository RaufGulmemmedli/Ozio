'use client';

/**
 * `offset` / `limit` infinite lists.
 *
 * This API ignores `page` on every endpoint (api/README.md) and every list response carries
 * `total`, so the page param is the **offset** and there is a next page while
 * `loadedCount < total`.
 *
 * Used by: products (store / category / search), orders, bonus transactions, coupons, lottery
 * tickets — everything `<InfiniteList>` renders.
 */
import { useCallback, useMemo } from 'react';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { Failure, Page } from '@/core/network';
import { useScreenInfiniteQuery } from './use-screen-query';

/** `Page<T>` — `{ items, total, offset, limit }`, what `parsePage()` in `@/core/network` returns. */
export type { Page };

export const emptyPage = <T>(limit = 0): Page<T> => ({ items: [], total: 0, limit, offset: 0 });

export interface UseOffsetInfiniteArgs<T> {
  /** The full query key, locale/city already folded in (see `scoped()`). */
  key: readonly unknown[];
  /** Page size. Default 20. */
  limit?: number;
  fetchPage: (p: { offset: number; limit: number; signal: AbortSignal }) => Promise<Page<T>>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  /** Keep the previous list visible while the key changes (search-as-you-type). */
  keepPrevious?: boolean;
  /** Lists that keep scroll position opt out of focus refetching. */
  refetchOnWindowFocus?: boolean;
}

export interface UseOffsetInfiniteResult<T> {
  /** Every loaded page flattened, in order. */
  items: T[];
  /** `total` from the newest page (0 before the first page lands). */
  total: number;
  loadedCount: number;
  hasMore: boolean;
  /** First page in flight (nothing to show yet) → render the mirror skeleton. */
  isPending: boolean;
  /** `isPending && isFetching` — false while the query is disabled. */
  isLoading: boolean;
  isFetching: boolean;
  /** A later page in flight → the pagination footer spinner. */
  isFetchingNextPage: boolean;
  isError: boolean;
  error: Failure | null;
  /** Loaded successfully and there is nothing at all → render `<EmptyState>`. */
  isEmpty: boolean;
  isPlaceholderData: boolean;
  /** Safe to call from an IntersectionObserver: it no-ops while fetching or when done. */
  loadMore: () => void;
  refetch: () => void;
  /** The underlying result, for anything not surfaced above. */
  query: UseInfiniteQueryResult<InfiniteData<Page<T>, number>, Failure>;
}

export function useOffsetInfinite<T>(args: UseOffsetInfiniteArgs<T>): UseOffsetInfiniteResult<T> {
  const {
    key,
    limit = 20,
    fetchPage,
    enabled = true,
    staleTime,
    gcTime,
    keepPrevious = false,
    refetchOnWindowFocus,
  } = args;

  const seed = useMemo(
    () => ({ empty: { pages: [emptyPage<T>(limit)], pageParams: [0] } }),
    [limit],
  );

  const query = useScreenInfiniteQuery<Page<T>, number>(
    {
      queryKey: [...key, { limit }],
      queryFn: ({ pageParam, signal }) => fetchPage({ offset: pageParam, limit, signal }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.items.length === 0) return undefined;
        const loaded = allPages.reduce((n, p) => n + p.items.length, 0);
        return loaded < lastPage.total ? loaded : undefined;
      },
      enabled,
      ...(staleTime === undefined ? {} : { staleTime }),
      ...(gcTime === undefined ? {} : { gcTime }),
      ...(refetchOnWindowFocus === undefined ? {} : { refetchOnWindowFocus }),
      ...(keepPrevious ? { placeholderData: (prev) => prev } : {}),
    },
    seed,
  );

  const pages = query.data?.pages;
  // Keyed on `pages` (stable while the cache entry is unchanged) so `items` keeps its identity and
  // an effect that depends on it does not re-run on every render.
  const items = useMemo(() => (pages ?? []).flatMap((p) => p.items), [pages]);
  const total = pages && pages.length > 0 ? (pages[pages.length - 1]?.total ?? 0) : 0;

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
    error: query.error,
    isEmpty: query.isSuccess && items.length === 0,
    isPlaceholderData: query.isPlaceholderData,
    loadMore,
    refetch: doRefetch,
    query,
  };
}
