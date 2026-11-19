'use client';

/**
 * `useCartAction()` — `POST v2/carts/action` (**verified**) with the optimistic pattern from
 * 04-data-layer.md §"Optimistic cart".
 *
 * The body is exactly `{store_id, product_id (row id), quantity, action}`:
 * - `action` is only `"add"` or `"remove"` — `increase` / `decrease` answer 422, and the old
 *   `store_product_variant_id` field is rejected;
 * - `quantity` is a **DELTA** in the **product unit** (kg for a weight product, 1 = 1 kg, never
 *   grams — `toCartQty()` in the repository is the only converter);
 * - removing the line's full quantity deletes it; a partial remove is **unverified**.
 *
 * ```ts
 * const action = useCartAction();
 * action.mutate({ storeId, productId, quantity: 1, action: 'add' });
 * ```
 *
 * `mutate` / `mutateAsync` are wrapped in `requireAuth()`: the API cart is per account and a guest
 * cart is explicitly not persisted, so a guest gets the sign-in prompt instead of a 401.
 *
 * **One documented deviation from the doc's snippet:** `onSuccess` cannot "replace the cart with
 * the server's response", because `carts/action` answers `{id, action_status,
 * notification_message}` — not a cart. `api/cart.md` says to re-read `GET v2/carts` after each
 * action, so the canonical cart arrives through the `onSettled` invalidation, and `onSuccess` only
 * surfaces the server's `notification_message`.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useFailureMessage } from '@/core/i18n';
import { unwrap, type Failure } from '@/core/network';
import { requireAuth } from '@/core/session';
import { toast } from '@/shared/ui';

import { cartKeys } from '../cart.query-keys';
import { cartRepository, normalizeCartQuantity } from '../data/cart.repository';
import type { Cart, CartActionResult, CartBundle } from '../data/models/cart';

export interface CartActionInput {
  storeId: number;
  /** Store-product **ROW** id (`id` / `product.id` / the `items_map` key). */
  productId: number;
  /** A DELTA in the product unit — for `remove`, the amount to take off the line. */
  quantity: number;
  action: 'add' | 'remove';
  /** Optional: the product name, so a toast or snackbar can name it. */
  label?: string;
  /** Optional: suppress the server's `notification_message` toast (the stepper does). */
  silent?: boolean;
}

interface CartMutationContext {
  previous: CartBundle | undefined;
}

/** Patches **only** the line quantity. Totals, fees, bonus and the payable amount stay server-side. */
export function applyOptimistic(bundle: CartBundle, input: CartActionInput): CartBundle {
  const delta = input.action === 'add' ? input.quantity : -input.quantity;

  let touched = false;
  const carts: Cart[] = bundle.carts.map((cart) => {
    if (cart.storeId !== input.storeId) return cart;

    const lines = cart.lines.flatMap((line) => {
      if (line.id !== input.productId) return [line];
      touched = true;
      const next = normalizeCartQuantity(line.quantity + delta);
      // Removing the full quantity deletes the line.
      return next > 0 ? [{ ...line, quantity: next }] : [];
    });

    if (!touched) return cart;

    const itemsMap = { ...cart.itemsMap };
    const patched = lines.find((line) => line.id === input.productId);
    if (patched) itemsMap[String(input.productId)] = patched.quantity;
    else delete itemsMap[String(input.productId)];

    // `totals` is deliberately carried over untouched: it is server data.
    return { ...cart, lines, itemsMap };
  });

  // A brand-new line cannot be invented (no name, image or server price), so the optimistic step is
  // skipped and the refetch brings it in.
  if (!touched) return bundle;

  const nonEmpty = carts.filter((cart) => cart.lines.some((line) => !line.savedForLater));
  return {
    carts,
    storeCount: nonEmpty.length,
    itemCount: nonEmpty.reduce(
      (total, cart) => total + cart.lines.filter((line) => !line.savedForLater).length,
      0,
    ),
    activeCartId:
      nonEmpty.find((cart) => cart.id === bundle.activeCartId)?.id ?? nonEmpty[0]?.id ?? null,
  };
}

export function useCartAction(): UseMutationResult<
  CartActionResult,
  Failure,
  CartActionInput,
  CartMutationContext
> {
  const qc = useQueryClient();
  const failureMessage = useFailureMessage();

  const mutation = useMutation<CartActionResult, Failure, CartActionInput, CartMutationContext>({
    mutationKey: cartKeys.all,
    mutationFn: (input) =>
      unwrap(
        cartRepository.action({
          store_id: input.storeId,
          product_id: input.productId,
          quantity: normalizeCartQuantity(input.quantity),
          action: input.action,
        }),
      ),

    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: cartKeys.all });
      const previous = qc.getQueryData<CartBundle>(cartKeys.list());
      qc.setQueryData<CartBundle>(cartKeys.list(), (bundle) =>
        bundle ? applyOptimistic(bundle, input) : bundle,
      );
      return { previous };
    },

    onError: (failure, _input, context) => {
      qc.setQueryData<CartBundle>(cartKeys.list(), context?.previous);
      toast.error(failureMessage(failure));
    },

    onSuccess: (result, input) => {
      if (!input.silent && result.notificationMessage) toast.info(result.notificationMessage);
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });

  // `requireAuth()` runs BEFORE anything is mutated, so a guest never produces an optimistic patch.
  return useMemo(() => {
    const guardedMutate: typeof mutation.mutate = (input, options) => {
      requireAuth(() => mutation.mutate(input, options), 'cart');
    };
    const guardedMutateAsync: typeof mutation.mutateAsync = (input, options) =>
      new Promise((resolve, reject) => {
        const allowed = requireAuth(() => {
          mutation.mutateAsync(input, options).then(resolve, reject);
        }, 'cart');
        if (!allowed) reject(new Error('guest'));
      });

    return { ...mutation, mutate: guardedMutate, mutateAsync: guardedMutateAsync };
  }, [mutation]);
}
