'use client';

/**
 * Wires one catalog row to the real cart. This is what makes the add button on `/market`,
 * `/market/store/[id]` and `/market/category/[id]` do something.
 *
 * It is the wiring `@/modules/cart`'s own public surface documents for `<ProductCard>`:
 *
 *   const qty    = useCartQuantity(storeId, row.id);
 *   const commit = useQuantityCommit({ storeId, productId: row.id, serverQty: qty });
 *
 * so everything that must not be re-implemented here is not: `useQuantityCommit` debounces rapid
 * taps (250 ms) and sends the **net delta** as one `add` / `remove`, `useCartAction` underneath it
 * runs `requireAuth()`, patches the line optimistically, reverts on failure and re-reads
 * `GET v2/carts`. The quantity the stepper shows therefore comes from the server cart and survives
 * a reload.
 *
 * Two invariants this module owns:
 *  - the cart key is the **store-product ROW id** (`row.id`), never `row.variantId` (which is only
 *    the product-detail URL);
 *  - the step for a weight row is **0,1 kq** ("Addım 0,1 kq", screens/app-catalog.md §5) and the
 *    quantity crosses the wire in kilograms — `cartStep()` / `toCartQty()` in the cart repository
 *    are the only places that know the grams ↔ cart-unit boundary.
 *
 * It is a **per-row** hook (one instance per card), so it is called from the card component, not
 * in a loop over the grid.
 */
import { cartStep, useCartQuantity, useQuantityCommit } from '@/modules/cart';

import type { ProductRow } from '../data/models/product-row';

export interface RowCart {
  /** Quantity of this row in the cart, in the product unit (kg for a weight row). */
  quantity: number;
  /** One stepper tap: 0.1 for a weight row, 1 otherwise. */
  step: number;
  /** A cart write for this row is in flight. */
  busy: boolean;
  /** Target quantity in the product unit; the delta and the auth prompt are handled downstream. */
  setQuantity: (next: number) => void;
}

export function useRowCart(row: ProductRow): RowCart {
  const serverQty = useCartQuantity(row.storeId, row.id);
  const commit = useQuantityCommit({
    storeId: row.storeId,
    productId: row.id,
    serverQty,
    silent: true,
  });

  return {
    quantity: commit.value,
    step: cartStep(row),
    busy: commit.isPending,
    setQuantity: commit.setQuantity,
  };
}
