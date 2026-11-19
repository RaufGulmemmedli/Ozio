/**
 * Every network path the home / offers / notifications screens own, resolved through `endpoint()`
 * so no path or version prefix is ever retyped and a `not-found` / `server-error` endpoint can
 * never be called by accident.
 *
 * `live` status (from `core/api/contracts/endpoints.ts`):
 *   HomeSliders verified (**empty on live**) · HomeHighlights verified (**empty**, key misspelled
 *   `hightlights`) · HomeHighlightProducts verified (**empty**) · AddressList verified ·
 *   CouponsGlobal verified · PartnersTenCarts verified · PartnersPlusCampaigns verified ·
 *   PartnersPlusProducts verified · NotificationsList verified · NotificationsUnreadCount verified
 *   (`data` is a bare integer) · NotificationsMarkRead **unverified** · NotificationsClear
 *   **unverified**.
 *
 * Deliberately **not** here, to keep one owner (and one cache entry) per path:
 *   `profile/me` → `useCard()` in `@/modules/loyalty_card`;
 *   `v2/orders` → `useOrders()` in `@/modules/orders`;
 *   `v2/bonus/transactions` → `useBonusTransactions()` in `@/modules/loyalty_card`;
 *   `stores/search` + `categories/stores` → `useStores()` / `useStoreCategories()` in
 *   `@/modules/store`; `v2/carts/action` → `@/modules/cart`.
 *
 * Rule inherited from `api()`: identical in-flight GETs are de-duplicated and calls to one path are
 * serialised — so the one thing this file must never do is fire the same path twice with different
 * params at the same moment (the gateway answers 429). Where that would happen the repository
 * sequences the calls instead.
 */
import { callEndpoint, type RemoteResult } from '@/core/network';

export interface PageArgs {
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}

export const homeRemote = {
  /* ------------------------------------------------------------------ home */

  sliders: (signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('HomeSliders', { signal }),

  /** Only for the delivery point the store rail is searched with. */
  addresses: (signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('AddressList', { signal }),

  highlights: (signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('HomeHighlights', { signal }),

  highlightProducts: (id: number, signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('HomeHighlightProducts', { params: { id }, signal }),

  coupons: (signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('CouponsGlobal', { signal }),

  tenCarts: (signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('PartnersTenCarts', { signal }),

  /* ---------------------------------------------------------------- offers */

  campaigns: (signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('PartnersPlusCampaigns', { signal }),

  /**
   * Offset paging works; the server **ignores** `page`, `skip`, `search`, `keyword`, `q`, `name`,
   * `sort`, `order_by`, `order` and `sub_category_id`, so filtering and sorting are client-side.
   */
  plusProducts: (args: { categoryId?: number | null } & PageArgs = {}): RemoteResult<unknown> =>
    callEndpoint('PartnersPlusProducts', {
      query: {
        ...(args.categoryId ? { category_id: args.categoryId } : {}),
        offset: args.offset ?? 0,
        limit: args.limit ?? 20,
      },
      signal: args.signal,
    }),

  /* --------------------------------------------------------- notifications */

  notifications: ({ offset = 0, limit = 10, signal }: PageArgs = {}): RemoteResult<unknown> =>
    callEndpoint('NotificationsList', { query: { offset, limit }, signal }),

  unreadCount: (signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('NotificationsUnreadCount', { signal }),

  /** UNVERIFIED: body `{ids}` is a swagger guess and the response is unknown. */
  markRead: (ids: readonly number[], signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('NotificationsMarkRead', { body: { ids: [...ids] }, signal }),

  /** UNVERIFIED: never called; body / query (ids? all?) and response unknown. */
  clearAll: (signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint('NotificationsClear', { signal }),
} as const;
