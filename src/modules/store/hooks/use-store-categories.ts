'use client';

/**
 * `GET v1/categories/stores` [verified] — the store CATEGORIES (4 on live), **not** stores.
 * `category_id` makes no difference, and there is no "stores of a category" call: filter the
 * `stores/search` rows by `storeCategoryId` instead.
 */
import { useLocale } from 'next-intl';
import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';

import { storeRepository } from '../data/store.repository';
import type { StoreCategory } from '../data/models/store';
import { storeKeys } from '../store.query-keys';

const EMPTY: StoreCategory[] = [];

export interface UseStoreCategoriesResult {
  categories: StoreCategory[];
  query: UseQueryResult<StoreCategory[], Failure>;
}

export function useStoreCategories(
  opts: { enabled?: boolean } = {},
): UseStoreCategoriesResult {
  const locale = useLocale();

  const query = useScreenQuery<StoreCategory[]>(
    {
      queryKey: scoped(storeKeys.storeCategories(), locale),
      queryFn: ({ signal }) => unwrap(storeRepository.storeCategories({ locale, signal })),
      enabled: opts.enabled ?? true,
      ...CACHE.static,
    },
    { empty: EMPTY },
  );

  return { categories: query.data ?? EMPTY, query };
}
