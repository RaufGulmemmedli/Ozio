/**
 * Paths + params for orders, checkout and payment. No parsing, no domain types — every operation is
 * resolved through `endpoint()`/`callEndpoint()` so a path literal never appears in this module.
 *
 * `live` status per operation (api/orders.md, api/payment.md):
 *   GET  v2/orders                      verified (paging only; row shape unobserved)
 *   POST v2/orders                      UNVERIFIED — body guessed in models/place-order.ts
 *   GET  v2/orders/{id}                 UNVERIFIED success shape (404 verified)
 *   POST v2/orders/{id}/rate            UNVERIFIED, path itself inferred
 *   GET  v1/profile/me/cards            verified (returned [] — row shape unobserved)
 *   DELETE v1/profile/me/cards/{id}     UNVERIFIED
 *   POST v1/payment/save-card           UNVERIFIED (body probably empty; card data is entered on
 *                                       the bank page, never sent here)
 *
 * `POST v2/orders/checkout` (the verified pricing call) is **not** here — the cart module owns it.
 *
 * There is no cancel, reorder, receipt or tracking endpoint — `/orders/{id}/tracking` and `/track`
 * answer "Cannot GET". Live tracking = polling `GET v2/orders/{id}`.
 */
import { callEndpoint, type RemoteCallOptions, type RemoteResult } from '@/core/network';
import { buildOrdersCreateBody, type PlaceOrderInput } from './models/place-order';

export interface OrdersPageQuery {
  offset: number;
  limit: number;
}

export const ordersRemote = {
  /** `GET v2/orders?offset&limit` — `page` is ignored by the API, never send it. */
  list: (q: OrdersPageQuery, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    callEndpoint('OrdersList', {
      query: { offset: q.offset, limit: q.limit },
      signal: opts?.signal,
    }),

  /** `GET v2/orders/{id}` — also the tracking poll. */
  detail: (id: number | string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    callEndpoint('OrdersDetail', { params: { id }, signal: opts?.signal }),

  /**
   * `POST v2/orders` — places the order. The body comes from `buildOrdersCreateBody()` and from
   * nowhere else, so the single guess stays in one reviewable place.
   */
  create: (input: PlaceOrderInput, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    callEndpoint('OrdersCreate', { body: buildOrdersCreateBody(input), signal: opts?.signal }),

  /** `POST v2/orders/{id}/rate` — unverified; only non-empty fields are sent. */
  rate: (
    id: number | string,
    body: Record<string, unknown>,
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> =>
    callEndpoint('OrdersRate', { params: { id }, body, signal: opts?.signal }),
} as const;

export const paymentRemote = {
  /** `GET v1/profile/me/cards`. */
  cards: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    callEndpoint('PaymentCards', { signal: opts?.signal }),

  /**
   * `POST v1/payment/save-card` → `{ redirect_url | custom_url }`.
   * The body is empty on purpose: the card is entered on the bank's own page. **Never** post a PAN,
   * expiry or CVV to this endpoint.
   */
  saveCard: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    callEndpoint('PaymentSaveCard', { body: {}, signal: opts?.signal }),

  /** `DELETE v1/profile/me/cards/{id}` — unverified. */
  deleteCard: (id: number, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    callEndpoint('PaymentDeleteCard', { params: { id }, signal: opts?.signal }),
} as const;
