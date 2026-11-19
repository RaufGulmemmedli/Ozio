'use client';

/**
 * The seam between this module and the cart (agent M5 owns `POST v2/carts/action`, **verified**).
 *
 * `useCartAction()` from `@/modules/cart` already does the hard parts: it wraps `mutate` in
 * `requireAuth()` (a guest gets `<GuestPrompt>` instead of a 401), patches the line optimistically,
 * reverts on failure and re-reads `GET v2/carts` afterwards. This file only renames the fields so
 * the product page can keep talking about the **row id** explicitly:
 *
 *  - `carts/action.product_id` is the store-product **ROW** id (`row.id`), never the variant id the
 *    product URL carries;
 *  - `quantity` is a **delta in the product unit** — kilograms for a weight product (1 = 1 kg),
 *    never grams. The gram → unit conversion lives in `cart.repository` (`toCartQty`), not here.
 *
 * The product page draws its own stepper + "Səbətə at · <total>" CTA (design `TOKFS`), which is why
 * it calls the mutation directly instead of using the cart module's `<AddToCartButton>` stepper.
 */
import { useCallback } from 'react';

import { useCartAction as useCartActionMutation } from '@/modules/cart';

export interface CartAddInput {
  storeId: number;
  /** The store-product ROW id (`row.id`) — what `carts/action` takes. */
  rowId: number;
  /** Delta in the product unit: pieces, or kilograms for a weight product. */
  quantity: number;
  /** Product name, so the cart's toast can name the line. */
  label?: string;
}

export interface CartAddOptions {
  /**
   * Runs once the server has accepted the line — used by the quick view to dismiss itself.
   *
   * Success only: a guest is stopped by `requireAuth()` before the mutation starts and a failed
   * add is reverted, and neither should close anything the visitor is looking at.
   */
  onSuccess?: () => void;
}

export interface CartActionState {
  add: (input: CartAddInput, options?: CartAddOptions) => void;
  /** Drives the CTA spinner. */
  pending: boolean;
}

export function useCartAction(): CartActionState {
  const mutation = useCartActionMutation();

  const add = useCallback(
    (input: CartAddInput, options?: CartAddOptions) => {
      mutation.mutate(
        {
          storeId: input.storeId,
          productId: input.rowId,
          quantity: input.quantity,
          action: 'add',
          label: input.label,
        },
        // `mutate`'s second argument survives the `requireAuth()` wrapper, which forwards it.
        options?.onSuccess ? { onSuccess: options.onSuccess } : undefined,
      );
    },
    [mutation],
  );

  return { add, pending: mutation.isPending };
}
