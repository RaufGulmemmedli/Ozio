/**
 * The only thing the search hooks import.
 *
 * ## How the global search is sequenced
 *
 * There is no global search endpoint, so one search is three steps:
 *
 *  1. **the point** — `lat` + `lng` of the delivery address (required; `stores/search` answers 400
 *     without them). Supplied by the caller through `@/modules/store`'s `useDeliveryPoint()`.
 *  2. **the stores** — `GET v1/stores/search?lat&lng`, cached for the whole session of a point
 *     (`CACHE.catalog`). Rows that deliver to the point carry `delivery_fee{distance}`; those are
 *     kept, sorted by distance ascending, and the **nearest 3 market stores** become the legs.
 *     The server ignores `search=`, so a store-name query is filtered client-side.
 *  3. **the legs** — `GET v1/stores/{storeId}/products?keyword=&limit=10&offset=` for each of the
 *     three stores, **in parallel**. Different `{storeId}` means a different path, so the gateway's
 *     one-call-per-path rule is not broken; two overlapping searches against the *same* store are,
 *     which is why the hook debounces 300 ms and hands every leg the query's `AbortSignal`.
 *     First pages are **interleaved** (store A, store B, store C, store A…) so no single store
 *     dominates the top of the grid, `total` is the sum of the legs' totals, and the search only
 *     fails when **every** leg failed — a timeout on one store is never "nothing found".
 *
 * Steps 2 and 3 are strictly ordered (the legs need the store ids); everything inside step 3 is
 * concurrent.
 */
import {
  Failure,
  asList,
  fail,
  mapResult,
  ok,
  parsePage,
  type Page,
  type Result,
} from '@/core/network';

import {
  parseProductCategory,
  parseProductRow,
  parseStore,
  sortStoresByDistance,
  type ProductCategory,
  type ProductRow,
  type Store,
} from './store-bridge';
import {
  SEARCH_PAGE_LIMIT,
  searchRemote,
  type DeliveryPointParams,
  type StoreProductsParams,
} from './search.remote';

/** api/search.md: the nearest **3** market stores are searched. */
export const FAN_OUT_STORES = 3;

export interface SearchPage {
  items: ProductRow[];
  /** Sum of the legs' `total`s. */
  total: number;
  offset: number;
  limit: number;
  /** True while at least one leg still has rows past this offset. */
  hasMore: boolean;
  /** Store ids whose leg failed — the grid shows partial results and says nothing about them. */
  failedStoreIds: number[];
}

export interface SearchProductsArgs {
  keyword: string;
  storeIds: readonly number[];
  categoryId?: number | null;
  offset?: number;
  limit?: number;
}

export interface RepoOptions {
  locale?: string;
  signal?: AbortSignal;
}

/** Interleave first pages: A0 B0 C0 A1 B1 C1 … (api/search.md "first pages interleaved"). */
function interleave(legs: readonly ProductRow[][]): ProductRow[] {
  const out: ProductRow[] = [];
  const longest = legs.reduce((n, leg) => Math.max(n, leg.length), 0);
  for (let i = 0; i < longest; i += 1) {
    for (const leg of legs) {
      const row = leg[i];
      if (row) out.push(row);
    }
  }
  return out;
}

export const searchRepository = {
  /**
   * Stores serving the point. Delivering rows first (nearest first); non-delivery partners
   * (travel, cinema…) keep the server order behind them. `keyword` filters **names client-side**
   * because the server ignores `search=`.
   */
  async stores(
    point: DeliveryPointParams,
    keyword: string | null,
    opts: RepoOptions = {},
  ): Promise<Result<Store[]>> {
    const res = await searchRemote.stores(point, opts.signal);
    return mapResult(res, (env) => {
      const page = parsePage<Store>(
        env.data,
        (raw) => parseStore(raw, { locale: opts.locale, source: 'search' }),
        { key: 'stores' },
      );
      const sorted = sortStoresByDistance(page.items);
      const needle = keyword?.trim().toLowerCase() ?? '';
      if (needle.length === 0) return sorted;
      return sorted.filter((store) => store.name.toLowerCase().includes(needle));
    });
  },

  /** The legs of the fan-out: the nearest `FAN_OUT_STORES` stores that deliver to the point. */
  pickFanOut(stores: readonly Store[], count = FAN_OUT_STORES): Store[] {
    return stores.filter((store) => store.deliversHere).slice(0, count);
  },

  /** One page of one store's products — also the category drill-down from the search landing. */
  async products(
    params: StoreProductsParams,
    opts: RepoOptions = {},
  ): Promise<Result<Page<ProductRow>>> {
    const res = await searchRemote.products(params, opts.signal);
    return mapResult(res, (env) =>
      parsePage<ProductRow>(env.data, (raw) => parseProductRow(raw, { locale: opts.locale }), {
        key: 'products',
        offset: params.offset ?? 0,
        limit: params.limit ?? SEARCH_PAGE_LIMIT,
      }),
    );
  },

  /**
   * The fan-out. Legs run in parallel (different paths); the result is their interleaved first
   * pages. Fails only when every leg failed.
   */
  async searchProducts(
    args: SearchProductsArgs,
    opts: RepoOptions = {},
  ): Promise<Result<SearchPage>> {
    const keyword = args.keyword.trim();
    const limit = args.limit ?? SEARCH_PAGE_LIMIT;
    const offset = args.offset ?? 0;
    const storeIds = args.storeIds.slice(0, FAN_OUT_STORES);

    if (keyword.length === 0 || storeIds.length === 0) {
      return ok({ items: [], total: 0, offset, limit, hasMore: false, failedStoreIds: [] });
    }

    const legs = await Promise.all(
      storeIds.map((storeId) =>
        searchRemote
          .products(
            { storeId, keyword, categoryId: args.categoryId ?? null, limit, offset },
            opts.signal,
          )
          .then((res) => ({ storeId, res })),
      ),
    );

    const rows: ProductRow[][] = [];
    const failedStoreIds: number[] = [];
    let total = 0;
    let hasMore = false;
    let firstFailure: Failure | null = null;

    for (const leg of legs) {
      if (!leg.res.ok) {
        failedStoreIds.push(leg.storeId);
        firstFailure = firstFailure ?? leg.res.failure;
        continue;
      }
      const page = parsePage<ProductRow>(
        leg.res.value.data,
        (raw) => parseProductRow(raw, { locale: opts.locale }),
        { key: 'products', offset, limit },
      );
      rows.push(page.items);
      total += page.total;
      if (offset + page.items.length < page.total) hasMore = true;
    }

    // A timeout on one store is never "nothing found" — only a total wipe-out is a failure.
    if (rows.length === 0 && firstFailure) return fail(firstFailure);

    return ok({ items: interleave(rows), total, offset, limit, hasMore, failedStoreIds });
  },

  /** Category shortcuts for the search landing (`AX1` tiles) — of the nearest market store. */
  async categories(
    storeId: number,
    opts: RepoOptions = {},
  ): Promise<Result<ProductCategory[]>> {
    const res = await searchRemote.productCategories({ storeId }, opts.signal);
    return mapResult(res, (env) => {
      const page = parsePage<ProductCategory>(
        env.data,
        (raw) => parseProductCategory(raw, { locale: opts.locale }),
        { key: 'categories' },
      );
      // Only top-level categories make useful shortcuts, and the first row of store 1 is an empty
      // "discounted products" bucket with no products and no children (audit 2026-11-12).
      return page.items.filter((category) => category.isParent || category.searchCount !== null);
    });
  },

  /**
   * Favourites (AX8). `GET v1/stores/favorites` is shadowed by `/stores/{id}` and answers
   * 404 `store not found` on live, so it is **never called** and `/favorites` renders the
   * documented "not available" state.
   *
   * ONE-LINE SWAP once the backend ships the list — replace the body with:
   *   return mapResult(await searchRemote.favorites(opts.signal), (env) =>
   *     parsePage<ProductRow>(env.data, (raw) => parseProductRow(raw, { locale: opts.locale }), { key: 'products' }));
   * (and add `favorites: (signal) => callEndpoint('StoreFavoritesList', { signal })` to
   * `search.remote.ts`, which `endpoint()` refuses while the operation is still `not-found`.)
   */
  async favorites(_opts: RepoOptions = {}): Promise<Result<Page<ProductRow>>> {
    void _opts;
    return fail(new Failure('notFound', 'favorites list is not available on live', 404));
  },

  /** Client-side "did you mean" over the terms we already know (recent + popular). */
  suggestions(term: string, pool: readonly string[], max = 3): string[] {
    const needle = term.trim().toLowerCase();
    if (needle.length < 2) return [];
    const scored = pool
      .map((candidate) => ({ candidate, score: similarity(needle, candidate.toLowerCase()) }))
      .filter((entry) => entry.candidate.toLowerCase() !== needle && entry.score >= 0.5)
      .sort((a, b) => b.score - a.score);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const entry of scored) {
      const key = entry.candidate.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(entry.candidate);
      if (out.length >= max) break;
    }
    return out;
  },
} as const;

/** Normalised Levenshtein, enough for a three-chip "Bəlkə bunu nəzərdə tutdunuz" row. */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  let prev = new Array<number>(cols);
  let curr = new Array<number>(cols);
  for (let j = 0; j < cols; j += 1) prev[j] = j;
  for (let i = 1; i < rows; i += 1) {
    curr[0] = i;
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  const distance = prev[cols - 1];
  return 1 - distance / Math.max(a.length, b.length);
}

/** Popular searches have no endpoint (screen spec AX1) — the drawn list is the config. */
export const POPULAR_SEARCHES: readonly string[] = [
  'çörək',
  'süd',
  'yumurta',
  'banan',
  'toyuq filesi',
  'pendir',
  'kartof',
  'su 5 L',
  'qəhvə',
];

/** `asList` is re-exported so views never reach into `@/core/network`. */
export const toList = asList;
