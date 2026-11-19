'use client';

/**
 * Partner query hooks. Every one of them goes through `useScreenQuery`, so
 * `?preview=loading|empty|error|offline` works on every partner screen.
 *
 * Partner data is static-ish catalog content → `CACHE.static` (10 min stale / 30 min gc).
 */
import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import type { UseQueryResult } from '@tanstack/react-query';

import { CACHE, useScreenQuery } from '@/core/query';
import { unwrap, type Failure } from '@/core/network';

import { partnersRepository, type BrandResolution } from '../data/partners.repository';
import type { Branch, Campaign, PartnerBrand, PartnerCategory, PlusChain } from '../data/models/partner';
import { partnerKeys } from '../partners.query-keys';

const EMPTY_CATEGORIES: PartnerCategory[] = [];
const EMPTY_BRANDS: PartnerBrand[] = [];
const EMPTY_BRANCHES: Branch[] = [];
const EMPTY_CAMPAIGNS: Campaign[] = [];
const EMPTY_CHAINS: PlusChain[] = [];

/** `GET v1/ozio-partners` — the partner CATEGORIES (verified). */
export function usePartnerCategories(): UseQueryResult<PartnerCategory[], Failure> {
  const locale = useLocale();
  return useScreenQuery<PartnerCategory[]>(
    {
      queryKey: [...partnerKeys.categories(), locale],
      queryFn: ({ signal }) => unwrap(partnersRepository.categories(locale, signal)),
      ...CACHE.static,
    },
    { empty: EMPTY_CATEGORIES },
  );
}

/**
 * `GET v1/ozio-partners/modules/{categoryId}` — the brands of one category (verified).
 * Disabled until a category is chosen.
 */
export function usePartnerModule(
  category: { id: string; name: string } | null,
): UseQueryResult<PartnerBrand[], Failure> {
  const locale = useLocale();
  const id = category?.id ?? null;
  const name = category?.name ?? '';
  const target = useMemo(() => (id ? { id, name } : null), [id, name]);

  return useScreenQuery<PartnerBrand[]>(
    {
      queryKey: [...partnerKeys.brands(id), locale],
      queryFn: ({ signal }) =>
        unwrap(partnersRepository.brands(target ?? { id: '', name: '' }, locale, signal)),
      enabled: target !== null,
      ...CACHE.static,
    },
    { empty: EMPTY_BRANDS },
  );
}

/**
 * One brand by id. There is no brand-by-id endpoint, so this resolves it from the category
 * listings — pass `categoryId` (the link's `?category=`) to make it a single request.
 */
export function usePartnerBrand(
  brandId: string,
  categoryId: string | null,
): UseQueryResult<BrandResolution, Failure> {
  const locale = useLocale();
  return useScreenQuery<BrandResolution>({
    queryKey: [...partnerKeys.brand(brandId, categoryId), locale],
    queryFn: ({ signal }) => unwrap(partnersRepository.brand(brandId, categoryId, locale, signal)),
    enabled: brandId.length > 0,
    ...CACHE.static,
  });
}

/**
 * `GET v1/ozio-partners/modules/branch/{brandId}` — verified, but **the coordinates are not
 * usable**: 191 of 197 live branches have `lat = lng = null` and 3 carry the junk value `"1"`.
 * Consumers must treat `branch.point === null` as the normal case and never build a map that
 * assumes a branch has a location.
 */
export function useBranches(brandId: string | null): UseQueryResult<Branch[], Failure> {
  const locale = useLocale();
  return useScreenQuery<Branch[]>(
    {
      queryKey: [...partnerKeys.branches(brandId ?? ''), locale],
      queryFn: ({ signal }) => unwrap(partnersRepository.branches(brandId ?? '', locale, signal)),
      enabled: Boolean(brandId),
      ...CACHE.static,
    },
    { empty: EMPTY_BRANCHES },
  );
}

/**
 * `GET v1/ozio-plus/campaigns` (verified) with the chain names from `ozio-plus/categories`.
 * A campaign's `name` is its **period** ("2-16 noyabr"); there is no title and no discount field.
 */
export function useCampaigns(): UseQueryResult<Campaign[], Failure> {
  const locale = useLocale();
  return useScreenQuery<Campaign[]>(
    {
      queryKey: [...partnerKeys.campaigns(), locale],
      queryFn: ({ signal }) => unwrap(partnersRepository.campaigns(locale, signal)),
      ...CACHE.static,
    },
    { empty: EMPTY_CAMPAIGNS },
  );
}

/** `GET v1/ozio-plus/categories` — the discount-catalog store chains (verified). */
export function usePlusChains(): UseQueryResult<PlusChain[], Failure> {
  const locale = useLocale();
  return useScreenQuery<PlusChain[]>(
    {
      queryKey: [...partnerKeys.plusChains(), locale],
      queryFn: ({ signal }) => unwrap(partnersRepository.plusChains(locale, signal)),
      ...CACHE.static,
    },
    { empty: EMPTY_CHAINS },
  );
}
