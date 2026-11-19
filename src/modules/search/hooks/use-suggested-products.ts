'use client';

/**
 * The "Populyar məhsullar" (AX3) / "Sənə maraqlı ola bilər" (`CoL5u`) rail.
 *
 * The screen spec points these at `GET v1/highlights`, which is **empty on live** (re-checked
 * 2026-11-12), so the rail is filled from real catalog data instead: one short page of the nearest
 * market store's first product category. `category_id` is passed because the unfiltered list takes
 * ~50 s server-side.
 */
import { useLocale } from 'next-intl';

import { unwrap, type Page } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';

import { searchRepository } from '../data/search.repository';
import type { ProductRow } from '../data/store-bridge';
import { searchKeys } from '../search.query-keys';

const EMPTY: Page<ProductRow> = { items: [], total: 0, offset: 0, limit: 0 };

export interface UseSuggestedProductsArgs {
  storeId: number | null;
  categoryId: number | null;
  limit?: number;
  enabled?: boolean;
}

export function useSuggestedProducts({
  storeId,
  categoryId,
  limit = 4,
  enabled = true,
}: UseSuggestedProductsArgs) {
  const locale = useLocale();
  const on = enabled && storeId !== null && storeId > 0 && categoryId !== null && categoryId > 0;

  return useScreenQuery<Page<ProductRow>>(
    {
      queryKey: scoped(
        [...searchKeys.all, 'suggested', storeId ?? 0, categoryId ?? 0, limit],
        locale,
      ),
      enabled: on,
      queryFn: ({ signal }) =>
        unwrap(
          searchRepository.products(
            { storeId: storeId as number, categoryId, limit, offset: 0 },
            { locale, signal },
          ),
        ),
      ...CACHE.catalog,
    },
    { empty: EMPTY },
  );
}
