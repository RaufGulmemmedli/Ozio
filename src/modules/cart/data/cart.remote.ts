/**
 * Paths and params only — one line per operation, every path resolved through
 * `endpoint()`/`callEndpoint()` so no literal is retyped and a dead endpoint throws instead of
 * being called (`core/network/remote-source.ts`).
 *
 * | operation                      | endpoint                      | live       |
 * | ------------------------------ | ----------------------------- | ---------- |
 * | list the per-store carts       | `GET v2/carts`                | verified   |
 * | add / remove a line            | `POST v2/carts/action`        | verified   |
 * | price a cart (the calculation) | `POST v2/orders/checkout`     | verified   |
 * | per-store delivery estimate    | `GET v1/stores/search`        | verified   |
 * | available promo codes          | `GET v1/promo-code`           | verified (empty on live) |
 * | apply a promo code             | `POST v1/promo-code/apply`    | **unverified** — see the repository |
 *
 * Addresses are **not** here: `GET v1/profile/address` belongs to `@/modules/address` (agent M9)
 * and the cart reads it through `useSelectedAddress()`.
 */
import type {
  CartActionBody,
  CartActionData,
  CartListData,
  OrdersCheckoutData,
  StoreSearchData,
} from '@/core/api/contracts/types';
import { callEndpoint, type RemoteResult } from '@/core/network';

/** Body of `POST v2/orders/checkout` exactly as the server takes it. */
export interface CheckoutRequestBody {
  cart_id: number;
  delivery: { latitude: number; longitude: number; address_id?: number };
  payment_method: 'cash' | 'card';
  use_bonus: boolean;
  payment_card_id?: number;
  promo_code?: string;
  courier_tip?: number;
}

export const cartRemote = {
  /** `GET v2/carts` → a LIST of carts, one per store. */
  list: (signal?: AbortSignal): RemoteResult<CartListData> =>
    callEndpoint<CartListData>('CartList', { signal }),

  /**
   * `POST v2/carts/action` — `{store_id, product_id (row id), quantity, action}`.
   * `quantity` is a DELTA in the product unit; `increase`/`decrease` are rejected (422).
   */
  action: (body: CartActionBody): RemoteResult<CartActionData> =>
    callEndpoint<CartActionData>('CartAction', { body }),

  /** `POST v2/orders/checkout` — the calculation. Never two in flight (the repository serialises). */
  checkout: (body: CheckoutRequestBody, signal?: AbortSignal): RemoteResult<OrdersCheckoutData> =>
    callEndpoint<OrdersCheckoutData>('OrdersCheckout', { body, signal }),

  /** `GET v1/stores/search?lat&lng` — lat + lng are required by the server. */
  deliveryEstimates: (
    point: { lat: number; lng: number },
    signal?: AbortSignal,
  ): RemoteResult<StoreSearchData> =>
    callEndpoint<StoreSearchData>('StoreSearch', { query: point, signal }),

  /** `GET v1/promo-code` → `{promoCodes: [], count}`; empty on live. */
  promoCodes: (signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint<unknown>('CouponsPromoCodes', { signal }),

  /** `POST v1/promo-code/apply` — UNVERIFIED body; only the repository may touch it. */
  applyPromoCode: (code: string): RemoteResult<unknown> =>
    callEndpoint<unknown>('CouponsPromoApply', { body: { code } }),
} as const;
