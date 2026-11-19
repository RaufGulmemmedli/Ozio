'use client';

/**
 * The REAL step: the recognised text drives an ordinary catalog search.
 *
 * `08-feature-flags-mocks.md` (image_search row): *recognition = MSW; products real
 * `stores/search`*. So nothing here is mocked — it is the store module's own repository, the same
 * one `/market` uses:
 *   `GET v1/stores/search?lat&lng`              → the nearby stores (the only working store list)
 *   `GET v1/stores/{storeId}/products?keyword=` → the rows, offset paged
 *
 * Everything below comes from `@/modules/store`'s public surface — this module owns no product
 * search and no product card of its own.
 *
 * TODO(search): if M4 ever publishes a cross-store `useSearch` on `@/modules/search`
 * (`import { useSearch } from '@/modules/search';`), it replaces the fan-out below wholesale. Until
 * then the real API offers no cross-store product search: `GET /search` and `GET /products` are
 * dead (BUILD-CONTRACT "API reality"), and the only working path is per store.
 */
import { useMemo } from 'react';
import type { Failure } from '@/core/network';

import {
  pickDefaultStore,
  useDeliveryPoint,
  useStoreProducts,
  useStores,
  type ProductRow,
  type Store,
} from '@/modules/store';

/**
 * How many nearby stores one photo search fans out over. Fixed so the hook count is constant, and
 * small so the gateway is never flooded: each store is a different path, which `api()` runs in
 * parallel while serialising repeats of the same path.
 */
const STORE_FANOUT = 4;
const PER_STORE_LIMIT = 8;

export interface UseImageProductsArgs {
  /** The recognised (or hand-edited) query. `null` keeps every request disabled. */
  query: string | null;
  enabled?: boolean;
}

export interface UseImageProductsResult {
  items: ProductRow[];
  /** Sum of the `total`s the searched stores reported. */
  total: number;
  /** The stores this search covered, nearest first. */
  stores: Store[];
  /** First page in flight → render the mirror skeleton. */
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Failure | null;
  /** Loaded and there is nothing at all → the "no products" screen. */
  isEmpty: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

/** Nearest delivering stores first, so the fan-out spends its 4 slots well. */
function pickStores(stores: readonly Store[]): Store[] {
  const delivering = stores.filter((s) => s.deliversHere);
  const pool = delivering.length > 0 ? delivering : [...stores];
  const preferred = pickDefaultStore(pool);
  const ordered = preferred ? [preferred, ...pool.filter((s) => s.id !== preferred.id)] : pool;
  return ordered.slice(0, STORE_FANOUT);
}

/** Round-robin across stores, so the grid reads as "nearby stores", not "store 1 then store 2". */
function interleave(pages: readonly ProductRow[][]): ProductRow[] {
  const out: ProductRow[] = [];
  const longest = pages.reduce((max, p) => Math.max(max, p.length), 0);
  const seen = new Set<string>();
  for (let i = 0; i < longest; i++) {
    for (const page of pages) {
      const row = page[i];
      if (!row) continue;
      const key = `${row.storeId}:${row.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

export function useImageProducts(args: UseImageProductsArgs): UseImageProductsResult {
  const { query, enabled = true } = args;
  const keyword = query?.trim() ?? '';
  const active = enabled && keyword.length > 0;

  const { point } = useDeliveryPoint();
  const storeList = useStores({ point, deliveringOnly: false, enabled: active });
  const stores = useMemo(() => pickStores(storeList.stores), [storeList.stores]);

  // A fixed number of slots keeps the hook order stable; empty slots are disabled queries.
  const slot0 = useStoreProducts({
    storeId: stores[0]?.id ?? null,
    keyword,
    limit: PER_STORE_LIMIT,
    enabled: active,
  });
  const slot1 = useStoreProducts({
    storeId: stores[1]?.id ?? null,
    keyword,
    limit: PER_STORE_LIMIT,
    enabled: active,
  });
  const slot2 = useStoreProducts({
    storeId: stores[2]?.id ?? null,
    keyword,
    limit: PER_STORE_LIMIT,
    enabled: active,
  });
  const slot3 = useStoreProducts({
    storeId: stores[3]?.id ?? null,
    keyword,
    limit: PER_STORE_LIMIT,
    enabled: active,
  });

  const slots = useMemo(() => [slot0, slot1, slot2, slot3], [slot0, slot1, slot2, slot3]);
  const live = useMemo(
    () => slots.filter((_, i) => stores[i] !== undefined),
    [slots, stores],
  );

  const items = useMemo(() => interleave(live.map((s) => s.items)), [live]);

  const storesPending = storeList.query.isPending && active;
  const slotsPending = live.length > 0 && live.some((s) => s.isPending);
  /**
   * Pending means "a request is in flight", never "there is nothing yet": once the store list has
   * landed with no nearby store, there is nothing left to wait for and the screen must fall through
   * to the "no products" state instead of sitting on the skeleton for ever.
   */
  const isPending = active && (storesPending || slotsPending);

  const storeError = storeList.query.error ?? null;
  // One failing store must not blank the grid: it is an error only when nothing came back at all.
  const allFailed = live.length > 0 && live.every((s) => s.isError);
  const firstSlotError = live.find((s) => s.error !== null)?.error ?? null;

  const isError = active && (storeList.query.isError || allFailed);
  const error: Failure | null = storeList.query.isError ? storeError : allFailed ? firstSlotError : null;

  return {
    items,
    total: live.reduce((sum, s) => sum + s.total, 0),
    stores,
    isPending,
    isFetching: storeList.query.isFetching || live.some((s) => s.isFetching),
    isError,
    error,
    isEmpty: active && !isPending && !isError && items.length === 0,
    hasMore: live.some((s) => s.hasMore),
    loadMore: () => {
      for (const s of live) s.loadMore();
    },
    refetch: () => {
      void storeList.query.refetch();
      for (const s of live) s.refetch();
    },
  };
}
