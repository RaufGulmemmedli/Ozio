'use client';

/**
 * "Ozio 10-lar" hooks.
 *
 * `useTenCarts()` is imported by the home and offers screens as well, so its name and its
 * "no arguments needed" signature are part of this module's public contract.
 */
import { useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useLocaleKey, useScreenQuery } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';

import { lotteryRepository, type TenCartSelectResult } from '../data/lottery.repository';
import type { TenCart } from '../data/models/ten-cart';
import { tenCartKeys } from '../lottery.query-keys';

const EMPTY: TenCart[] = [];

/**
 * `GET v1/ten-carts` (verified, 5 rows on live). Stamp cards — no price, no store, no
 * product list. `current_step` is absent on cards that are not selected.
 *
 * The endpoint needs a bearer token, so the query is disabled for guests and `/market/tens`
 * shows `<GuestGate>` for the card itself while the static rules stay visible.
 */
export function useTenCarts(): UseQueryResult<TenCart[], Failure> {
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();
  const seed = useMemo(() => ({ empty: EMPTY }), []);

  return useScreenQuery<TenCart[]>(
    {
      queryKey: scoped(tenCartKeys.list(), locale),
      queryFn: ({ signal }) => unwrap(lotteryRepository.tenCarts(locale, signal)),
      enabled: authenticated,
      ...CACHE.profile,
    },
    seed,
  );
}

/**
 * `POST v1/ten-carts/add` — **unverified**: the body key is a guess, and whether it
 * selects, toggles, or allows several selections at once is unknown. The result carries
 * `verified: false`; the caller refetches the list and lets the server's own answer decide
 * what the card looks like, instead of flipping `is_selected` optimistically.
 */
export function useSelectTenCart(): UseMutationResult<TenCartSelectResult, Failure, number> {
  const client = useQueryClient();

  return useMutation<TenCartSelectResult, Failure, number>({
    mutationFn: (tenCartId) => unwrap(lotteryRepository.selectTenCart(tenCartId)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: tenCartKeys.all });
    },
  });
}
