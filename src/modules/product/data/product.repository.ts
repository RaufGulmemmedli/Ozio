/**
 * The only thing the product hooks import. Remote envelopes in, domain models out, never a throw.
 *
 * The two traps this layer absorbs:
 *  1. `{id}` on both product endpoints is the **variant id**. A row id answers HTTP 200 with
 *     `data: null` (they coincide only in store 1) — mapped to a `notFound` Failure here, so the
 *     screen renders the not-found state rather than an "empty product".
 *  2. the favourite toggle is `unverified` (the body `store_id` is a guess and product-level
 *     favourites are undocumented), and the favourites LIST is dead on live — a 2xx here is never
 *     reported as "saved", and the list is served by `@/modules/search`'s own repository.
 */
import {
  Failure,
  fail,
  mapResult,
  ok,
  parsePage,
  type Page,
  type Result,
} from '@/core/network';

import {
  isMissingProduct,
  parseProductDetail,
  type ProductDetail,
} from './models/product-detail';
import { productRemote, type FavoriteTogglePayload } from './product.remote';
// Similar products are ordinary catalog rows, so the catalog module's parser reads them (it already
// handles both barcode shapes). See `store-bridge.ts` for the full list of borrowed exports.
import { parseProductRow, type ProductRow } from './store-bridge';

const notFound = (message: string) => new Failure('notFound', message, 404);

export interface ProductRef {
  storeId: number;
  /** `store_product_variants.id` — NOT the list row id. */
  variantId: number;
}

export const productRepository = {
  /**
   * Product detail. `data: null` → `notFound`, which is also what a row id passed as `{id}` gives.
   */
  async detail(
    ref: ProductRef,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<ProductDetail>> {
    const res = await productRemote.detail(ref.storeId, ref.variantId, signal);
    if (!res.ok) return res;
    if (isMissingProduct(res.value.data)) {
      return fail(notFound('product not found'));
    }
    const product = parseProductDetail(res.value.data, locale);
    // The store is only embedded in the payload; keep the id from the URL when it is absent.
    return ok({
      ...product,
      storeId: product.storeId ?? ref.storeId,
      variantId: product.variantId ?? ref.variantId,
    });
  },

  /**
   * Similar products — the same catalog row shape, except variants carry `barcodes: string[]`
   * instead of `store_product_variant_barcodes[]`. `parseProductRow` reads both, so the rail feeds
   * `<ProductCard>` directly.
   */
  async similar(
    ref: ProductRef,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<Page<ProductRow>>> {
    const res = await productRemote.similar(ref.storeId, ref.variantId, signal);
    return mapResult(res, (env) =>
      parsePage<ProductRow>(env.data, (row) => parseProductRow(row, { locale }), {
        key: 'products',
      }),
    );
  },

  /**
   * Favourite toggle — **unverified**: the method is in the APK, the body (`store_id`) is a guess
   * and product-level favourites are entirely unknown. The caller toggles optimistically and must
   * revert on failure; a 2xx with `success: false` already arrives here as a `Failure`.
   */
  async setFavorite(
    payload: FavoriteTogglePayload,
    next: boolean,
  ): Promise<Result<boolean>> {
    const res = next
      ? await productRemote.favoriteAdd(payload)
      : await productRemote.favoriteRemove(payload);
    if (!res.ok) return res;
    // Nothing in the response is documented, so "it did not fail" is all that can be claimed.
    return ok(next);
  },

  // The favourites LIST lives in `@/modules/search` (`searchRepository.favorites`), which owns the
  // `/favorites` screen; `GET v1/stores/favorites` is 404 on live, so it is never called from here
  // either.
} as const;
