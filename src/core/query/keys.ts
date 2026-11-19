/**
 * Cross-module query keys + the conventions every module's `<group>.query-keys.ts` follows.
 *
 * Rule (04-data-layer.md): the first element of a key is always the module name, so signing out can
 * drop everything user-bound with a single `queryClient.clear()` / per-module invalidation.
 *
 * Only genuinely shared keys belong here. A key used by one module belongs in that module's own
 * `<group>.query-keys.ts`, built with `moduleKeys()`.
 */
import { useLocale } from 'next-intl';

/** Keys that more than one module reads or invalidates. */
export const queryKeys = {
  /** The signed-in session itself (status + user). */
  session: ['session'] as const,
  /** The active cart. Cart mutations invalidate this wholesale. */
  cart: ['cart'] as const,
  /** `GET v1/profile/me`. */
  profileMe: ['profile', 'me'] as const,
  /** `GET v2/bonus/transactions`. */
  bonusTx: ['bonus', 'tx'] as const,
  /** Unread notification badge count. */
  unreadCount: ['notifications', 'unread'] as const,
} as const;

export type CrossModuleKey = keyof typeof queryKeys;

/**
 * The key factory every module uses:
 *
 * ```ts
 * export const storeKeys = {
 *   ...moduleKeys('store'),
 *   products: (id: number, f?: unknown) => ['store', id, 'products', f] as const,
 * };
 * ```
 */
export const moduleKeys = <M extends string>(m: M) => ({
  all: [m] as const,
  list: (f?: unknown) => [m, 'list', f] as const,
  detail: (id: string | number) => [m, 'detail', id] as const,
});

/**
 * The active locale, for keys whose response text comes from the API (`Accept-Language` is set from
 * the active locale by the BFF), so switching language never shows stale text.
 */
export const useLocaleKey = () => useLocale();

/**
 * Appends the locale and the selected city to a base key. Use it on every localized / geo-scoped
 * query: `scoped(storeKeys.list(filters), useLocaleKey(), cityId)`.
 */
export const scoped = (base: readonly unknown[], locale: string, cityId?: number | null) =>
  [...base, locale, cityId ?? null] as const;

export interface CachePolicy {
  staleTime: number;
  gcTime: number;
}

/**
 * The caching table from 04-data-layer.md. Spread it into query options:
 * `useScreenQuery({ queryKey, queryFn, ...CACHE.catalog })`.
 *
 * | bucket   | what                                        | staleTime | gcTime |
 * | static   | sliders, categories, partners, policies     | 10 min    | 30 min |
 * | catalog  | stores, products, search                    | 60 s      | 5 min  |
 * | profile  | profile/me, loyalty card, bonus             | 30 s      | 10 min |
 * | cart     | the cart (always refetch on focus)          | 0         | 5 min  |
 * | orders   | orders list + detail                        | 30 s      | 5 min  |
 * | tracking | live order tracking (polled)                | 0         | 0      |
 */
export const CACHE: Record<
  'static' | 'catalog' | 'profile' | 'cart' | 'orders' | 'tracking',
  CachePolicy
> = {
  static: { staleTime: 10 * 60_000, gcTime: 30 * 60_000 },
  catalog: { staleTime: 60_000, gcTime: 5 * 60_000 },
  profile: { staleTime: 30_000, gcTime: 10 * 60_000 },
  cart: { staleTime: 0, gcTime: 5 * 60_000 },
  orders: { staleTime: 30_000, gcTime: 5 * 60_000 },
  // "—" in the doc: tracking data is worthless once the user leaves the page, so it is dropped as
  // soon as the last observer unmounts.
  tracking: { staleTime: 0, gcTime: 0 },
} as const;

export type CacheBucket = keyof typeof CACHE;
