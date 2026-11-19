'use client';

/**
 * `GET v1/stores/{storeId}/similar-products/{variantId}` [verified] — the "Bənzər məhsullar" rail.
 *
 * Same row shape as the detail payload, except variants carry `barcodes: string[]` instead of
 * `store_product_variant_barcodes[]`; the parser reads both.
 *
 * It runs on the same screen as `useProductDetail`, but on a **different path**, so the two are
 * safe in parallel (the gateway only 429s concurrent calls to one path).
 */
import { useLocale } from 'next-intl';

import { unwrap, type Page } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';

import { productRepository } from '../data/product.repository';
import type { ProductRow } from '../data/store-bridge';
import { productKeys } from '../product.query-keys';

export interface UseSimilarProductsArgs {
  storeId: number | null;
  variantId: number | null;
  enabled?: boolean;
}

const EMPTY: Page<ProductRow> = { items: [], total: 0, offset: 0, limit: 0 };

export function useSimilarProducts({ storeId, variantId, enabled = true }: UseSimilarProductsArgs) {
  const locale = useLocale();
  const on = enabled && storeId !== null && storeId > 0 && variantId !== null && variantId > 0;

  return useScreenQuery<Page<ProductRow>>(
    {
      queryKey: scoped(productKeys.similar(storeId ?? 0, variantId ?? 0), locale),
      enabled: on,
      queryFn: ({ signal }) =>
        unwrap(
          productRepository.similar(
            { storeId: storeId as number, variantId: variantId as number },
            locale,
            signal,
          ),
        ),
      ...CACHE.catalog,
    },
    { empty: EMPTY },
  );
}
