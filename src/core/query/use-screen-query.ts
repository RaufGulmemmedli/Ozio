'use client';

/**
 * `useScreenQuery` / `useScreenInfiniteQuery` — the wrapper every data screen uses instead of
 * `useQuery` / `useInfiniteQuery`.
 *
 * It behaves exactly like the TanStack hook, except that when `?preview=` is present (and
 * `NEXT_PUBLIC_ENABLE_PREVIEW === '1'`) it hands the screen a synthetic result so the loading,
 * empty, error and offline states can be rendered and screenshotted without the API:
 *
 *   ?preview=loading  → a result that stays pending forever (the skeleton shows indefinitely)
 *   ?preview=error    → an error result carrying `new Failure('server', 'preview')`
 *   ?preview=offline  → an error result carrying `new Failure('network', 'preview')`
 *   ?preview=empty    → a success result holding `seed.empty` (when the screen provided one)
 *   ?preview=<other>  → a success result holding `seed.data` (when the screen provided one),
 *                       otherwise the real query — this is how module-specific previews such as
 *                       `?preview=closed` seed one specific shape.
 *
 * React's rules of hooks hold: `useQuery` is **always** called, with the same hook order on every
 * render. Only the returned object is replaced.
 */
import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { Failure } from '@/core/network';
import { usePreview, type Preview } from './use-preview';

/** What a screen can hand the wrapper so `?preview=empty` / `?preview=<custom>` have something to show. */
export interface ScreenQuerySeed<T> {
  /** Rendered for `?preview=empty` — usually `{ items: [], total: 0 }` or `[]`. */
  empty?: T;
  /** Rendered for any other `?preview=` value, e.g. `closed`, `expired-card`, `tier-gold`. */
  data?: T;
}

type PreviewMode = 'none' | 'loading' | 'error' | 'offline' | 'empty' | 'seeded';

function previewMode(preview: Preview, seed?: ScreenQuerySeed<unknown>): PreviewMode {
  if (preview === null) return 'none';
  if (preview === 'loading') return 'loading';
  if (preview === 'error') return 'error';
  if (preview === 'offline') return 'offline';
  if (preview === 'empty') return seed?.empty !== undefined ? 'empty' : 'loading';
  // `expired` and `guest` are handled by the session layer, not by the query; any other value is a
  // module-specific preview and only takes over when the screen seeded data for it.
  return seed?.data !== undefined ? 'seeded' : 'none';
}

/** A frozen "nothing has happened yet" base, built on top of the real result so no field is missing. */
function idleFrom<R extends object>(real: R) {
  return {
    ...real,
    data: undefined,
    error: null,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isEnabled: true,
    isError: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isLoading: false,
    isLoadingError: false,
    isInitialLoading: false,
    isPaused: false,
    isPending: true,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: false,
    status: 'pending' as const,
    fetchStatus: 'idle' as const,
  };
}

function pendingResult<R extends object>(real: R) {
  return { ...idleFrom(real), isFetching: true, isLoading: true, fetchStatus: 'fetching' as const };
}

function errorResult<R extends object>(real: R, failure: Failure) {
  return {
    ...idleFrom(real),
    error: failure,
    failureReason: failure,
    failureCount: 1,
    errorUpdateCount: 1,
    errorUpdatedAt: 1,
    isError: true,
    isLoadingError: true,
    isFetched: true,
    isFetchedAfterMount: true,
    isPending: false,
    status: 'error' as const,
  };
}

function successResult<R extends object, T>(real: R, data: T) {
  return {
    ...idleFrom(real),
    data,
    dataUpdatedAt: 1,
    isFetched: true,
    isFetchedAfterMount: true,
    isPending: false,
    isSuccess: true,
    status: 'success' as const,
  };
}

/** Stable `Failure` instances, so an effect that depends on `error` does not loop. */
function usePreviewFailures() {
  return useMemo(
    () => ({
      server: new Failure('server', 'preview'),
      network: new Failure('network', 'preview'),
    }),
    [],
  );
}

/**
 * Drop-in replacement for `useQuery` with `?preview=` support.
 *
 * ```ts
 * const q = useScreenQuery<Page<Store>>(
 *   { queryKey: scoped(storeKeys.list(f), locale, cityId), queryFn: ({ signal }) => unwrap(storeRepository.list(f, signal)), ...CACHE.catalog },
 *   { empty: { items: [], total: 0 } },
 * );
 * ```
 */
export function useScreenQuery<T>(
  opts: UseQueryOptions<T, Failure>,
  seed?: ScreenQuerySeed<T>,
): UseQueryResult<T, Failure> {
  const preview = usePreview();
  const failures = usePreviewFailures();
  const mode = previewMode(preview, seed);

  // Always called — and switched off while previewing so no request is fired.
  const real = useQuery<T, Failure>(
    mode === 'none' ? opts : { ...opts, enabled: false, retry: false, refetchInterval: undefined },
  );

  return useMemo(() => {
    switch (mode) {
      case 'none':
        return real;
      case 'loading':
        return asQueryResult<T>(pendingResult(real));
      case 'error':
        return asQueryResult<T>(errorResult(real, failures.server));
      case 'offline':
        return asQueryResult<T>(errorResult(real, failures.network));
      case 'empty':
        return asQueryResult<T>(successResult(real, seed?.empty as T));
      case 'seeded':
        return asQueryResult<T>(successResult(real, seed?.data as T));
    }
  }, [mode, real, failures, seed?.empty, seed?.data]);
}

/**
 * Drop-in replacement for `useInfiniteQuery` with the same `?preview=` behaviour. `seed.empty` /
 * `seed.data` are whole `InfiniteData` values, e.g. `{ pages: [{ items: [], total: 0 }], pageParams: [0] }`.
 * Most screens use `useOffsetInfinite` (./use-paged) instead, which builds those for them.
 */
export function useScreenInfiniteQuery<
  TQueryFnData,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
>(
  opts: UseInfiniteQueryOptions<TQueryFnData, Failure, TData, QueryKey, TPageParam>,
  seed?: ScreenQuerySeed<TData>,
): UseInfiniteQueryResult<TData, Failure> {
  const preview = usePreview();
  const failures = usePreviewFailures();
  const mode = previewMode(preview, seed);

  const real = useInfiniteQuery<TQueryFnData, Failure, TData, QueryKey, TPageParam>(
    mode === 'none' ? opts : { ...opts, enabled: false, retry: false },
  );

  return useMemo(() => {
    switch (mode) {
      case 'none':
        return real;
      case 'loading':
        return asInfiniteResult<TData>(pendingResult(real));
      case 'error':
        return asInfiniteResult<TData>(errorResult(real, failures.server));
      case 'offline':
        return asInfiniteResult<TData>(errorResult(real, failures.network));
      case 'empty':
        return asInfiniteResult<TData>(successResult(real, seed?.empty as TData));
      case 'seeded':
        return asInfiniteResult<TData>(successResult(real, seed?.data as TData));
    }
  }, [mode, real, failures, seed?.empty, seed?.data]);
}

/*
 * `UseQueryResult` / `UseInfiniteQueryResult` are discriminated unions of ~6 interfaces, so a
 * hand-built object can only be narrowed by assertion. Every field of the union is filled in above
 * (the base is spread from the real result), which is why these two casts are safe.
 */
const asQueryResult = <T>(v: object): UseQueryResult<T, Failure> =>
  v as unknown as UseQueryResult<T, Failure>;

const asInfiniteResult = <TData>(v: object): UseInfiniteQueryResult<TData, Failure> =>
  v as unknown as UseInfiniteQueryResult<TData, Failure>;
