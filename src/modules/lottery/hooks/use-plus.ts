'use client';

/**
 * "Ozio Plus" discounts-catalogue hooks (`/offers/discounts`).
 *
 * The server has no search and no sort for `ozio-plus/products` — it ignores every such
 * parameter — so `usePlusProducts` only pages by offset and the view filters and sorts the
 * pages it has already loaded. Nothing here implies a global ordering.
 */
import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useLocaleKey, useOffsetInfinite, useScreenQuery, type UseOffsetInfiniteResult } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';

import { lotteryRepository } from '../data/lottery.repository';
import { PLUS_MAX_LIMIT } from '../data/lottery.remote';
import type { PlusCampaign, PlusChain, PlusProduct } from '../data/models/plus';
import { plusKeys } from '../lottery.query-keys';

const NO_CHAINS: PlusChain[] = [];
const NO_CAMPAIGNS: PlusCampaign[] = [];

/**
 * `GET v1/ozio-plus/categories` (verified) — the **store chains** that the filter chips
 * show. Whether this answers without a token was never checked, so for a guest the query
 * stays disabled and the page renders its guest state.
 */
export function usePlusChains(): UseQueryResult<PlusChain[], Failure> {
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();
  const seed = useMemo(() => ({ empty: NO_CHAINS }), []);

  return useScreenQuery<PlusChain[]>(
    {
      queryKey: scoped(plusKeys.chains(), locale),
      queryFn: ({ signal }) => unwrap(lotteryRepository.plusChains(signal)),
      enabled: authenticated,
      ...CACHE.static,
    },
    seed,
  );
}

/** `GET v1/ozio-plus/campaigns` (verified) — the period name plus its end date. */
export function usePlusCampaigns(): UseQueryResult<PlusCampaign[], Failure> {
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();
  const seed = useMemo(() => ({ empty: NO_CAMPAIGNS }), []);

  return useScreenQuery<PlusCampaign[]>(
    {
      queryKey: scoped(plusKeys.campaigns(), locale),
      queryFn: ({ signal }) => unwrap(lotteryRepository.plusCampaigns(signal)),
      enabled: authenticated,
      ...CACHE.static,
    },
    seed,
  );
}

/**
 * `GET v1/ozio-plus/products?category_id=&limit=&offset=` (verified).
 *
 * `limit` is capped at 50 by the server. `category_id` is the chain; passing it is what
 * fills `price_info`, so the view always has a chain selected.
 */
export interface UsePlusProductsOptions {
  limit?: number;
  /**
   * Off while the screen is still deciding which chain to show, so the first render does not
   * fire a chain-less request whose rows would come back without `price_info`.
   */
  enabled?: boolean;
}

export function usePlusProducts(
  categoryId: number | null,
  options: UsePlusProductsOptions | number = {},
): UseOffsetInfiniteResult<PlusProduct> {
  // A bare number keeps the older `usePlusProducts(id, 24)` call shape working.
  const { limit = 20, enabled = true } =
    typeof options === 'number' ? { limit: options, enabled: true } : options;
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();

  return useOffsetInfinite<PlusProduct>({
    key: scoped(plusKeys.products(categoryId), locale),
    limit: Math.min(limit, PLUS_MAX_LIMIT),
    enabled: authenticated && enabled,
    fetchPage: ({ offset, limit: pageLimit, signal }) =>
      unwrap(
        lotteryRepository.plusProducts(
          { ...(categoryId ? { categoryId } : {}), offset, limit: pageLimit },
          signal,
        ),
      ),
    ...CACHE.catalog,
  });
}
