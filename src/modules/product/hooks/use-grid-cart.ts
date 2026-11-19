'use client';

/**
 * The glue every `<ProductCard>` grid needs: the quantity a row already has in the cart, and a
 * setter that turns a new quantity into the **delta** `POST v2/carts/action` expects.
 *
 * `<ProductCard quantity onQuantityChange>` (agent M3) is inert without these, so the similar rail,
 * the search grid and the favourites grid all feed it from here.
 *
 *  - the cart key is the **row id** (`row.id`), never the variant id in the product URL;
 *  - `quantity` is a delta in the product unit — kilograms for a weight row (1 = 1 kg), never
 *    grams, and `cart.repository` is the only place that converts;
 *  - `useCartAction()` already wraps the mutation in `requireAuth()`, patches the line
 *    optimistically, reverts on failure and re-reads `GET v2/carts`, so there is nothing to add.
 */
import { useCallback, useMemo } from 'react';

import { useCart, useCartAction } from '@/modules/cart';

import type { ProductRow } from '../data/store-bridge';

export interface GridCart {
  /** Cart quantity of a row, in the product unit. */
  quantityOf: (row: ProductRow) => number;
  setQuantity: (row: ProductRow, next: number) => void;
  /**
   * "Hamısını səbətə at": one `carts/action` per row, **sequentially** — they all hit the same
   * path, which the gateway 429s when called concurrently — stopping at the first failure
   * (a 422 means that row cannot be added, and the rest are not worth trying blindly).
   * Resolves with the number of rows that were added.
   */
  addAll: (rows: readonly ProductRow[]) => Promise<number>;
  /** Stepper step: the catalog step for weight rows (`<ProductCard>` defaults to 0.1 kg). */
  stepOf: (row: ProductRow) => number;
  pending: boolean;
}

export function useGridCart(): GridCart {
  const { data } = useCart();
  const action = useCartAction();

  /** `itemsMap` is `{ "<rowId>": qty }` per store cart — the fastest card lookup. */
  const quantities = useMemo(() => {
    const map = new Map<string, number>();
    for (const cart of data?.carts ?? []) {
      for (const [rowId, qty] of Object.entries(cart.itemsMap)) {
        map.set(`${cart.storeId}:${rowId}`, qty);
      }
      for (const line of cart.lines) {
        map.set(`${line.storeId}:${line.id}`, line.quantity);
      }
    }
    return map;
  }, [data]);

  const quantityOf = useCallback(
    (row: ProductRow) => quantities.get(`${row.storeId}:${row.id}`) ?? 0,
    [quantities],
  );

  const setQuantity = useCallback(
    (row: ProductRow, next: number) => {
      const current = quantities.get(`${row.storeId}:${row.id}`) ?? 0;
      const delta = Math.abs(Math.round((next - current) * 1000) / 1000);
      if (delta === 0) return;
      action.mutate({
        storeId: row.storeId,
        productId: row.id,
        quantity: delta,
        action: next > current ? 'add' : 'remove',
        label: row.name,
        silent: true,
      });
    },
    [action, quantities],
  );

  const addAll = useCallback(
    async (rows: readonly ProductRow[]): Promise<number> => {
      let added = 0;
      for (const row of rows) {
        if (!row.inStock) continue;
        if ((quantities.get(`${row.storeId}:${row.id}`) ?? 0) > 0) continue;
        try {
          // Awaited one at a time: `carts/action` is a single path and 429s on concurrency.
          await action.mutateAsync({
            storeId: row.storeId,
            productId: row.id,
            quantity: row.hasWeight ? 0.5 : 1,
            action: 'add',
            label: row.name,
            silent: true,
          });
          added += 1;
        } catch {
          // The mutation already surfaced the failure; stop rather than hammer the rest.
          break;
        }
      }
      return added;
    },
    [action, quantities],
  );

  const stepOf = useCallback((row: ProductRow) => (row.hasWeight ? 0.1 : 1), []);

  return { quantityOf, setQuantity, addAll, stepOf, pending: action.isPending };
}
