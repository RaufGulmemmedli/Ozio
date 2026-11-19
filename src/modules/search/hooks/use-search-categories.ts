'use client';

/**
 * `GET v1/categories/products?store_id=` [verified] — the "Kateqoriyalar üzrə" tiles (AX1) and the
 * category chips on the results screen, taken from the nearest market store.
 */
import { useLocale } from 'next-intl';

import { unwrap } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';

import { searchRepository } from '../data/search.repository';
import type { ProductCategory } from '../data/store-bridge';
import { searchKeys } from '../search.query-keys';

export function useSearchCategories(storeId: number | null) {
  const locale = useLocale();

  return useScreenQuery<ProductCategory[]>(
    {
      queryKey: scoped(searchKeys.categories(storeId ?? 0), locale),
      enabled: storeId !== null && storeId > 0,
      queryFn: ({ signal }) =>
        unwrap(searchRepository.categories(storeId as number, { locale, signal })),
      ...CACHE.static,
    },
    { empty: [] },
  );
}
