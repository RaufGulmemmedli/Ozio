/** Query keys for the product module. First element is always the module name (04-data-layer.md). */
import { moduleKeys } from '@/core/query';

export const productKeys = {
  ...moduleKeys('product'),
  /** A product is only addressable as (store, variant) — both belong in the key. */
  detail: (storeId: number | string, variantId: number | string) =>
    ['product', 'detail', storeId, variantId] as const,
  similar: (storeId: number | string, variantId: number | string) =>
    ['product', 'similar', storeId, variantId] as const,
  favorites: () => ['product', 'favorites'] as const,
} as const;
