'use client';

/**
 * `GET v1/categories/products?store_id&parent_id` [verified] — categories only, no products
 * inside. 42 rows for store 1; the first one ("discounted products") has neither products nor
 * children on live, so a category can legitimately come back empty.
 */
import { useLocale } from 'next-intl';
import { unwrap, type Failure, type Page } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';

import { storeRepository } from '../data/store.repository';
import type { ProductCategory } from '../data/models/product-category';
import { storeKeys } from '../store.query-keys';

const EMPTY: Page<ProductCategory> = { items: [], total: 0, offset: 0, limit: 0 };

export interface UseProductCategoriesResult {
  categories: ProductCategory[];
  total: number;
  query: UseQueryResult<Page<ProductCategory>, Failure>;
}

export function useProductCategories(
  storeId: number | null,
  opts: { parentId?: number | null; enabled?: boolean } = {},
): UseProductCategoriesResult {
  const locale = useLocale();
  const parentId = opts.parentId ?? null;

  const query = useScreenQuery<Page<ProductCategory>>(
    {
      queryKey: scoped(storeKeys.productCategories(storeId ?? 0, parentId), locale),
      queryFn: ({ signal }) =>
        unwrap(
          storeRepository.productCategories(
            { storeId: storeId as number, parentId },
            { locale, signal },
          ),
        ),
      enabled: (opts.enabled ?? true) && storeId !== null && storeId > 0,
      // Categories change rarely: the `static` bucket (10 min) per 04-data-layer.md.
      ...CACHE.static,
    },
    { empty: EMPTY },
  );

  const page = query.data ?? EMPTY;
  return { categories: page.items, total: page.total, query };
}
