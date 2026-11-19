/**
 * The only thing the hooks import. Envelope → tolerant domain model, `Result` in / `Result` out,
 * never a throw (`unwrap()` in the hook is the single throw).
 */
import {
  mapResult,
  parsePage,
  type Page,
  type Result,
} from '@/core/network';

import {
  parseProductCategory,
  type ProductCategory,
} from './models/product-category';
import { parseProductRow, type ProductRow } from './models/product-row';
import {
  parseStore,
  parseStoreCategory,
  parseStoreDetail,
  sortStoresByDistance,
  type Store,
  type StoreCategory,
  type StoreDetail,
} from './models/store';
import {
  PRODUCTS_PAGE_LIMIT,
  storeRemote,
  type DeliveryPoint,
  type ProductsParams,
} from './store.remote';

export interface RepoOptions {
  locale?: string;
  signal?: AbortSignal;
}

export const storeRepository = {
  /**
   * Stores serving `point`. Delivering rows (those with a `delivery_fee`) come first, nearest
   * first; non-delivery partners (travel, cinema…) keep the server order behind them.
   * The server IGNORES `search=`, so a keyword filter is applied by the caller, client-side.
   */
  list: (point: DeliveryPoint, opts: RepoOptions = {}): Promise<Result<Store[]>> =>
    storeRemote.search(point, opts.signal).then((r) =>
      mapResult(r, (env) => {
        const page = parsePage<Store>(
          env.data,
          (raw) => parseStore(raw, { locale: opts.locale, source: 'search' }),
          { key: 'stores' },
        );
        return sortStoresByDistance(page.items);
      }),
    ),

  detail: (id: number, opts: RepoOptions = {}): Promise<Result<StoreDetail>> =>
    storeRemote
      .detail(id, opts.signal)
      .then((r) => mapResult(r, (env) => parseStoreDetail(env.data, { locale: opts.locale }))),

  /** `GET v1/categories/stores` — 4 store categories on live. */
  storeCategories: (opts: RepoOptions = {}): Promise<Result<StoreCategory[]>> =>
    storeRemote.storeCategories(opts.signal).then((r) =>
      mapResult(
        r,
        (env) =>
          parsePage<StoreCategory>(env.data, (raw) =>
            parseStoreCategory(raw, { locale: opts.locale }),
          ).items,
      ),
    ),

  /** Product categories of a store (or the children of `parentId`). */
  productCategories: (
    args: { storeId: number; parentId?: number | null },
    opts: RepoOptions = {},
  ): Promise<Result<Page<ProductCategory>>> =>
    storeRemote.productCategories(args, opts.signal).then((r) =>
      mapResult(r, (env) =>
        parsePage<ProductCategory>(
          env.data,
          (raw) => parseProductCategory(raw, { locale: opts.locale }),
          { key: 'categories' },
        ),
      ),
    ),

  /** One page of a store's products. `offset` + `limit` only — `page` is ignored by the API. */
  products: (
    params: ProductsParams,
    opts: RepoOptions = {},
  ): Promise<Result<Page<ProductRow>>> =>
    storeRemote.products(params, opts.signal).then((r) =>
      mapResult(r, (env) =>
        parsePage<ProductRow>(
          env.data,
          (raw) => parseProductRow(raw, { locale: opts.locale }),
          {
            key: 'products',
            offset: params.offset ?? 0,
            limit: Math.min(params.limit ?? PRODUCTS_PAGE_LIMIT, PRODUCTS_PAGE_LIMIT),
          },
        ),
      ),
    ),

  /**
   * Favourite a store. **Unverified** on live: the method/body (`{store_id}`) are guesses and
   * `GET stores/favorites` is 404, so the result can never be read back. A 2xx here is NOT proof
   * that anything persisted — the UI must stay optimistic and say so.
   */
  setFavorite: (
    storeId: number,
    next: boolean,
    opts: RepoOptions = {},
  ): Promise<Result<{ persisted: false }>> =>
    (next
      ? storeRemote.addFavorite(storeId, opts.signal)
      : storeRemote.removeFavorite(storeId, opts.signal)
    ).then((r) => mapResult(r, () => ({ persisted: false as const }))),
} as const;

export type { DeliveryPoint };
