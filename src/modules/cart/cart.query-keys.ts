/**
 * Query keys for the cart module.
 *
 * Rule (04-data-layer.md): the first element is always the module name, so a sign-out can drop
 * everything user-bound in one go. `cartKeys.all` is the cross-module key (`queryKeys.cart`) so M2
 * (shell badge), M3 (store/product steppers) and M4 (checkout) invalidate exactly what this module
 * writes.
 */
import { queryKeys } from '@/core/query';

export const cartKeys = {
  /** `['cart']` — the same array as `queryKeys.cart`; every cart mutation invalidates it. */
  all: queryKeys.cart,
  /** `GET v2/carts` — the list of per-store carts. There is no single "active cart" on the server. */
  list: () => [...queryKeys.cart, 'list'] as const,
  /** `POST v2/orders/checkout` for one cart + one selection (address, payment, bonus, promo, tip). */
  checkout: (cartId: number | null, selection: unknown) =>
    [...queryKeys.cart, 'checkout', cartId ?? 0, selection] as const,
  /** `GET v1/stores/search?lat&lng` — per-store delivery fee / estimate for the selected point. */
  deliveryEstimate: (lat: number | null, lng: number | null) =>
    [...queryKeys.cart, 'delivery-estimate', lat ?? 0, lng ?? 0] as const,
  /** `GET v1/promo-code` — the customer's available promo codes (empty on live). */
  promoCodes: () => [...queryKeys.cart, 'promo-codes'] as const,
} as const;
