'use client';

/**
 * `useCheckoutCalc()` — `POST v2/orders/checkout` (**verified**), the call that prices the cart.
 *
 * It is a **calculation**, not an order. It is the only source of totals, fees, discounts, bonus,
 * tip, the earned bonus and the payable `amount`; `v2/carts.totals` is the items total and nothing
 * else (BUILD-CONTRACT rule 7).
 *
 * **Serialisation** (the 429 rule) happens in three layers:
 * 1. the selection is debounced 250 ms, so dragging a switch is one request, not five;
 * 2. the query key carries the whole selection, so only the newest key's answer is ever rendered
 *    and TanStack aborts the previous one;
 * 3. `cartRepository.checkout()` runs every call through a one-lane queue and drops a call whose
 *    signal was already aborted — so two POSTs are never in flight on this path.
 *
 * `expires_at` (epoch ms) is honoured: the calc is refetched when it stops being valid.
 */
import { useDebouncedValue } from '@/core/lib/debounce';
import { unwrap } from '@/core/network';
import { CACHE, useScreenQuery, usePreview } from '@/core/query';

import { cartKeys } from '../cart.query-keys';
import { previewCalc } from '../data/cart.preview';
import { cartRepository } from '../data/cart.repository';
import type { CheckoutCalc, CheckoutSelection } from '../data/models/checkout';
import { useCartSelection } from './use-cart-selection';
import { useDeliveryAddress } from './use-delivery-address';

/** How long a selection has to settle before it is priced. */
const SELECTION_DEBOUNCE_MS = 250;
/** Never refetch more often than this, even if the server sends a short `expires_at`. */
const MIN_REFRESH_MS = 15_000;

export interface CheckoutCalcArgs {
  /** The cart being priced. `null` → nothing is requested. */
  cartId: number | null;
}

/** The selection as the checkout body sees it, assembled from the store + the chosen address. */
export function useCheckoutSelection(cartId: number | null): CheckoutSelection {
  const selection = useCartSelection();
  const { address, point } = useDeliveryAddress();

  return {
    cartId,
    // Only a real saved address carries an id; without it the server answers 200 with
    // `purchasing_disabled: true` + `address_incomplete`, which is the documented state.
    addressId: address?.id ?? null,
    latitude: address?.latitude ?? point?.lat ?? null,
    longitude: address?.longitude ?? point?.lng ?? null,
    paymentMethod: selection.paymentMethod,
    paymentCardId: selection.paymentCardId,
    useBonus: selection.useBonus,
    promoCode: selection.promoCode,
    courierTip: selection.courierTip,
    // `deliveryTime` is intentionally absent: no endpoint documents it (see models/delivery-time.ts).
  };
}

export function useCheckoutCalc({ cartId }: CheckoutCalcArgs) {
  const preview = usePreview();
  const live = useCheckoutSelection(cartId);
  const selection = useDebouncedValue(live, SELECTION_DEBOUNCE_MS);

  const ready =
    selection.cartId !== null && selection.latitude !== null && selection.longitude !== null;

  return useScreenQuery<CheckoutCalc>(
    {
      queryKey: cartKeys.checkout(selection.cartId, {
        addressId: selection.addressId,
        paymentMethod: selection.paymentMethod,
        paymentCardId: selection.paymentCardId,
        useBonus: selection.useBonus,
        promoCode: selection.promoCode,
        courierTip: selection.courierTip,
      }),
      queryFn: ({ signal }) => unwrap(cartRepository.checkout(selection, signal)),
      enabled: ready,
      // A price is never served from cache: the fees depend on the whole selection.
      ...CACHE.cart,
      // Writes are not retried, and this POST is rate-limited per path.
      retry: false,
      refetchOnWindowFocus: false,
      refetchInterval: (query) => {
        const expiresAt = query.state.data?.expiresAt;
        if (!expiresAt) return false;
        return Math.max(expiresAt - Date.now(), MIN_REFRESH_MS);
      },
    },
    { data: previewCalc(preview) },
  );
}
