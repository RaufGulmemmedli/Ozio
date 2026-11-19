'use client';

/**
 * `/offers` (L3 "Kampaniyalar") — one hook per region.
 *
 * `GET v1/ozio-plus/products` pages by **offset** only: the server ignores `page`, `search`,
 * `sort` and every variant of them, so the view filters and sorts the pages it has loaded.
 */
import { useMemo } from 'react';

import { CACHE, scoped, useLocaleKey, useOffsetInfinite, useScreenQuery, type UseOffsetInfiniteResult } from '@/core/query';
import { unwrap, type Failure } from '@/core/network';
import type { UseQueryResult } from '@tanstack/react-query';

import { offersKeys } from '../home.query-keys';
import { homeRepository } from '../data/home.repository';
import type { Highlight, HomeProduct, PlusCampaign } from '../data/models';
import { useSectionAccess } from './use-section';

/** `GET v1/ozio-plus/campaigns` — gives the campaign end date the hero counts down to. */
export function useCampaigns(): UseQueryResult<PlusCampaign[], Failure> {
  const { resolving } = useSectionAccess();
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: [] as PlusCampaign[] }), []);

  return useScreenQuery<PlusCampaign[]>(
    {
      queryKey: scoped(offersKeys.campaigns, locale),
      queryFn: ({ signal }) => unwrap(homeRepository.campaigns(signal)),
      enabled: !resolving,
      retry: false,
      ...CACHE.static,
    },
    seed,
  );
}

/** `GET v1/highlights` — the named promo groups. Empty on live. */
export function useHighlights(): UseQueryResult<Highlight[], Failure> {
  const { resolving } = useSectionAccess();
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: [] as Highlight[] }), []);

  return useScreenQuery<Highlight[]>(
    {
      queryKey: scoped(offersKeys.highlights, locale),
      queryFn: ({ signal }) => unwrap(homeRepository.highlights(signal)),
      enabled: !resolving,
      retry: false,
      ...CACHE.static,
    },
    seed,
  );
}

/** `GET v1/ozio-plus/products` — offset paging, 20 per page. */
export function usePlusProducts(categoryId?: number | null): UseOffsetInfiniteResult<HomeProduct> {
  const { resolving } = useSectionAccess();
  const locale = useLocaleKey();

  return useOffsetInfinite<HomeProduct>({
    key: scoped(offersKeys.plusProducts(categoryId), locale),
    limit: 20,
    enabled: !resolving,
    staleTime: CACHE.catalog.staleTime,
    gcTime: CACHE.catalog.gcTime,
    fetchPage: ({ offset, limit, signal }) =>
      unwrap(homeRepository.plusProducts({ categoryId, offset, limit, signal })),
  });
}
