'use client';

/**
 * One hook per `/home` region this module owns (`app-core.md` §1): the promo slider, the delivery
 * point the store rail is searched with, the coupon + 10-lar stat tiles and the product grid.
 * Each owns its loading / empty / error state and each supports
 * `?preview=loading|empty|error|offline` through `useScreenQuery`.
 *
 * The other regions read their data from the module that owns the endpoint, so `/home` never opens
 * a second query on one path: the Ozio card and the balance come from `useCard()`
 * (`@/modules/loyalty_card`), the hero tracker from `useOrders()` (`@/modules/orders`), this
 * month's cashback from `useBonusTransactions()` + `monthlyBonusSummary()`
 * (`@/modules/loyalty_card`) and the stores from `useStores()` (`@/modules/store`).
 */
import { useMemo } from 'react';

import { CACHE, scoped, useLocaleKey, useScreenQuery } from '@/core/query';
import { unwrap, type Failure } from '@/core/network';
import type { UseQueryResult } from '@tanstack/react-query';

import { homeKeys } from '../home.query-keys';
import { homeRepository, type CouponSummary, type TenSummary } from '../data/home.repository';
import {
  CITY_DEFAULT_POINT,
  type HomeDeliveryPoint,
  type HomeProduct,
  type HomeSlide,
} from '../data/models';
import { useSectionAccess } from './use-section';

/* --------------------------------------------------------------- hero slider */

/** `GET v1/sliders/images` — empty on live, which is the normal state. */
export function useHomeSliders(): UseQueryResult<HomeSlide[], Failure> {
  const { authenticated } = useSectionAccess();
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: [] as HomeSlide[] }), []);

  return useScreenQuery<HomeSlide[]>(
    {
      queryKey: scoped(homeKeys.sliders, locale),
      queryFn: ({ signal }) => unwrap(homeRepository.sliders(signal)),
      enabled: authenticated,
      ...CACHE.static,
    },
    seed,
  );
}

/* ------------------------------------------------------------ delivery point */

/**
 * `GET v1/profile/address` → the lat/lng `stores/search` requires (400 without it). Guests and
 * accounts with no saved address fall back to the city centre, so the rail still renders.
 *
 * TODO(store): once `useDeliveryPoint()` in `@/modules/store` reads the saved addresses itself,
 * drop this hook and use that one, so `/home` and `/market` always search the same point.
 */
export function useHomeDeliveryPoint(): {
  point: HomeDeliveryPoint;
  isPending: boolean;
  query: UseQueryResult<HomeDeliveryPoint, Failure>;
} {
  const { authenticated } = useSectionAccess();
  const seed = useMemo(() => ({ empty: CITY_DEFAULT_POINT }), []);

  const query = useScreenQuery<HomeDeliveryPoint>(
    {
      queryKey: homeKeys.deliveryPoint,
      queryFn: ({ signal }) => unwrap(homeRepository.deliveryPoint(signal)),
      enabled: authenticated,
      retry: false,
      ...CACHE.profile,
    },
    seed,
  );

  return {
    point: query.data ?? CITY_DEFAULT_POINT,
    isPending: authenticated && query.isPending,
    query,
  };
}

/* --------------------------------------------------------------- stat tiles */

/** `GET v1/coupons/global` — guest-reachable (one of the three guest home calls). */
export function useGlobalCoupons(): UseQueryResult<CouponSummary, Failure> {
  const { resolving } = useSectionAccess();
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: { items: [], total: 0 } as CouponSummary }), []);

  return useScreenQuery<CouponSummary>(
    {
      queryKey: scoped(homeKeys.coupons, locale),
      queryFn: ({ signal }) => unwrap(homeRepository.coupons(signal)),
      enabled: !resolving,
      retry: false,
      ...CACHE.static,
    },
    seed,
  );
}

/** `GET v1/ten-carts` — stamp cards (`current_step` / `steps`), not priced bundles. */
export function useTenCarts(): UseQueryResult<TenSummary, Failure> {
  const { authenticated } = useSectionAccess();
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: { best: null, cards: [] } as TenSummary }), []);

  return useScreenQuery<TenSummary>(
    {
      queryKey: scoped(homeKeys.tenCarts, locale),
      queryFn: ({ signal }) => unwrap(homeRepository.tenCarts(locale, signal)),
      enabled: authenticated,
      ...CACHE.static,
    },
    seed,
  );
}

/* ----------------------------------------------------------- product grid */

/** `GET v1/highlights` → `GET v1/highlights/products/{id}`. Both empty on live. */
export function useFeaturedProducts(): UseQueryResult<HomeProduct[], Failure> {
  const { resolving } = useSectionAccess();
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: [] as HomeProduct[] }), []);

  return useScreenQuery<HomeProduct[]>(
    {
      queryKey: scoped(homeKeys.highlightProducts(0), locale),
      queryFn: ({ signal }) => unwrap(homeRepository.featuredProducts(locale, signal)),
      enabled: !resolving,
      retry: false,
      ...CACHE.catalog,
    },
    seed,
  );
}
