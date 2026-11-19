/**
 * TanStack Query client + the global defaults from `architecture/04-data-layer.md`.
 *
 *   retry        network/timeout failures twice, everything else never
 *   focus        refetch on window focus (lists that keep scroll position opt out per query)
 *   networkMode  'online' — never fire while the browser reports offline
 *   staleTime    30 s default; per-domain values live in `CACHE` (./keys)
 *   gcTime       5 min default
 */
import { QueryClient } from '@tanstack/react-query';
import { Failure } from '@/core/network';

/**
 * Makes `useQuery().error` / `useMutation().error` typed as our `Failure` everywhere, because every
 * `queryFn` goes through `unwrap(result)` which throws the `Failure` into Query's error channel.
 */
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: Failure;
  }
}

export const QUERY_DEFAULT_STALE_TIME = 30_000;
export const QUERY_DEFAULT_GC_TIME = 5 * 60_000;

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (n: number, f: Failure) =>
          f?.kind === 'network' || f?.kind === 'timeout' ? n < 2 : false,
        retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        networkMode: 'online',
        staleTime: QUERY_DEFAULT_STALE_TIME,
        gcTime: QUERY_DEFAULT_GC_TIME,
      },
      mutations: {
        retry: false,
        networkMode: 'online',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Browser: one singleton for the whole tab (so a re-render of the root layout never throws the
 * cache away). Server: a fresh client per request, so no data ever leaks between users.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

/** Drops every cached query — call on sign-out (all user-bound keys live under a module key). */
export function clearQueryCache(): void {
  browserQueryClient?.clear();
}
