/**
 * Query keys for the home / offers / notifications screens.
 *
 * One key per **section**, because every home section is its own query: a failing section must not
 * blank the page (04-data-layer.md + the home brief).
 *
 * Keys this module deliberately does **not** define: `profile/me` (`cardKeys.card()` in
 * `@/modules/loyalty_card` and `profileKeys.me()` in `@/modules/profile`), `v2/orders`
 * (`orderKeys.list()`), `v2/bonus/transactions` (`cardKeys.transactions()`) and `stores/search` /
 * `categories/stores` (`storeKeys.*`). Two different models under one key would collide, so each
 * path keeps exactly one owner and `api()` de-dupes the request itself.
 */
import { moduleKeys, queryKeys } from '@/core/query';

export const homeKeys = {
  ...moduleKeys('home'),
  /** `GET v1/sliders/images`. */
  sliders: ['home', 'sliders'] as const,
  /** `GET v1/profile/address` → the lat/lng handed to `@/modules/store`'s `useStores`. */
  deliveryPoint: ['home', 'delivery-point'] as const,
  /** `GET v1/highlights` (+ `highlights/products/{id}` for the first group). */
  highlights: ['home', 'highlights'] as const,
  highlightProducts: (id: number) => ['home', 'highlights', id, 'products'] as const,
  /** `GET v1/coupons/global`. */
  coupons: ['home', 'coupons'] as const,
  /** `GET v1/ten-carts`. */
  tenCarts: ['home', 'ten-carts'] as const,
} as const;

export const offersKeys = {
  ...moduleKeys('offers'),
  campaigns: ['offers', 'campaigns'] as const,
  coupons: homeKeys.coupons,
  highlights: homeKeys.highlights,
  plusProducts: (categoryId?: number | null) =>
    ['offers', 'plus-products', categoryId ?? null] as const,
} as const;

export const notificationKeys = {
  ...moduleKeys('notifications'),
  feed: ['notifications', 'feed'] as const,
  /** The bell badge count — shared with the shell through `queryKeys.unreadCount`. */
  unread: queryKeys.unreadCount,
} as const;
