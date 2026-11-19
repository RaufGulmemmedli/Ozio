'use client';

/**
 * `GET v1/stores/{storeId}/products/{variantId}` [verified].
 *
 * `variantId` is `store_product_variants.id`. A list **row** id answers HTTP 200 with `data: null`
 * (the two coincide only in store 1), which the repository already maps to a `notFound` Failure —
 * so `query.error?.kind === 'notFound'` is the not-found state, not an empty product.
 */
import { useLocale } from 'next-intl';

import { unwrap } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';

import { productRepository } from '../data/product.repository';
import type { ProductDetail } from '../data/models/product-detail';
import { productKeys } from '../product.query-keys';

export interface UseProductDetailArgs {
  storeId: number | null;
  variantId: number | null;
}

export function useProductDetail({ storeId, variantId }: UseProductDetailArgs) {
  const locale = useLocale();
  const enabled = storeId !== null && storeId > 0 && variantId !== null && variantId > 0;

  return useScreenQuery<ProductDetail>({
    queryKey: scoped(productKeys.detail(storeId ?? 0, variantId ?? 0), locale),
    enabled,
    queryFn: ({ signal }) =>
      unwrap(
        productRepository.detail(
          { storeId: storeId as number, variantId: variantId as number },
          locale,
          signal,
        ),
      ),
    ...CACHE.catalog,
  });
}
