/**
 * Paths + params only. Every operation is resolved through `endpoint()` so no path literal is
 * retyped and the dead endpoints refuse to be called at all.
 *
 * | operation          | endpoint                                           | live       |
 * | ------------------ | -------------------------------------------------- | ---------- |
 * | `detail`           | `GET v1/stores/{storeId}/products/{variantId}`     | verified   |
 * | `similar`          | `GET v1/stores/{storeId}/similar-products/{id}`    | verified   |
 * | `favoriteAdd`      | `POST v1/stores/favorites`                         | unverified |
 * | `favoriteRemove`   | `DELETE v1/stores/favorites`                       | unverified |
 *
 * `GET v1/stores/favorites` is `not-found` on live and is deliberately absent here: `endpoint()`
 * throws for it, and `/favorites` renders the documented "not available" state instead.
 */
import { callEndpoint, type RemoteResult } from '@/core/network';
import type { ProductDetailData, ProductSimilarData } from '@/core/api/contracts/types';

export interface FavoriteTogglePayload {
  /** `store_id` is the documented **guess** (api/store.md); product favourites are unknown. */
  store_id: number;
  /** Sent alongside the guess so a working server shape is one line away. */
  store_product_variant_id?: number;
}

export const productRemote = {
  detail: (storeId: number, variantId: number, signal?: AbortSignal): RemoteResult<ProductDetailData> =>
    callEndpoint<ProductDetailData>('ProductDetail', {
      params: { storeId, id: variantId },
      signal,
    }),

  similar: (
    storeId: number,
    variantId: number,
    signal?: AbortSignal,
  ): RemoteResult<ProductSimilarData> =>
    callEndpoint<ProductSimilarData>('ProductSimilar', {
      params: { storeId, id: variantId },
      signal,
    }),

  favoriteAdd: (body: FavoriteTogglePayload): RemoteResult<unknown> =>
    callEndpoint<unknown>('StoreFavoriteAdd', { body }),

  favoriteRemove: (body: FavoriteTogglePayload): RemoteResult<unknown> =>
    callEndpoint<unknown>('StoreFavoriteRemove', { body }),
} as const;
