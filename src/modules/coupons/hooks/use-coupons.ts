'use client';

/**
 * Query / mutation wrappers for the coupons module.
 *
 * `useCoupons()` is imported by the home and offers screens as well, so its name and
 * its "no arguments needed" signature are part of the module's public contract.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import { unwrap, type Failure, type Page } from '@/core/network';
import { CACHE, scoped, useLocaleKey, useScreenQuery } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';

import { couponKeys } from '../coupons.query-keys';
import { couponsRepository, type PromoApplyResult } from '../data/coupons.repository';
import type { Coupon } from '../data/models/coupon';

const EMPTY_PAGE: Page<Coupon> = { items: [], total: 0, offset: 0, limit: 0 };

export interface UseCouponsOptions {
  /** Off for guests / previews that must not fire the request. */
  enabled?: boolean;
}

/**
 * The merged coupon list (`coupons/global` **verified** + `promo-code` **verified**,
 * the latter empty on live). Both endpoints need a bearer token, so the query is
 * disabled for guests rather than firing a guaranteed 401.
 */
export function useCoupons(options: UseCouponsOptions = {}): UseQueryResult<Page<Coupon>, Failure> {
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();
  const enabled = (options.enabled ?? true) && authenticated;

  const seed = useMemo(() => ({ empty: EMPTY_PAGE }), []);

  return useScreenQuery<Page<Coupon>>(
    {
      queryKey: scoped(couponKeys.merged(), locale),
      queryFn: ({ signal }) => unwrap(couponsRepository.list(signal)),
      enabled,
      ...CACHE.profile,
    },
    seed,
  );
}

/**
 * One coupon. `data === null` means "the id is not in either list" — the screen renders
 * its not-found state, not an error panel (there is no `GET coupons/{id}` to 404).
 */
export function useCoupon(id: string): UseQueryResult<Coupon | null, Failure> {
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();
  const trimmed = id.trim();

  const seed = useMemo(() => ({ empty: null }), []);

  return useScreenQuery<Coupon | null>(
    {
      queryKey: scoped(couponKeys.detail(trimmed), locale),
      queryFn: ({ signal }) => unwrap(couponsRepository.detail(trimmed, signal)),
      enabled: trimmed.length > 0 && authenticated,
      ...CACHE.profile,
    },
    seed,
  );
}

/**
 * `POST v1/promo-code/apply` — **unverified**.
 *
 * The result always carries `verified: false`; callers show a neutral "sent, we cannot
 * confirm it server-side" message and refetch the lists rather than announcing success.
 */
export function useApplyPromoCode(): UseMutationResult<PromoApplyResult, Failure, string> {
  const client = useQueryClient();

  return useMutation<PromoApplyResult, Failure, string>({
    mutationFn: (code) => unwrap(couponsRepository.applyPromoCode(code)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}
