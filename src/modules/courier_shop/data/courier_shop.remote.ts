/**
 * Raw calls for the `courier_shop` module.
 *
 * Shaped exactly like a real-API module's remote source: paths, params and verbs only, each
 * returning `Result<ApiEnvelope<T>>`. Today they resolve to `/api/mock/courier_shop/<path>`
 * because `remote.mock()` is used; when the service in
 * `web-handoff/api/mock-modules.md` ("PROPOSED REST, base `/customer/api/v1/courier-shop`") exists,
 * swapping `transport` for `remote.v1` and prefixing `COURIER_SHOP_BASE` is the only change, and
 * `data/courier_shop.mock.ts` gets deleted.
 */
import { remote, type RemoteCallOptions, type RemoteResult } from '@/core/network';

/** The module namespace. Under `remote.v1` this becomes `courier-shop`. */
export const COURIER_SHOP_MODULE = 'courier_shop';

const transport = remote.mock(COURIER_SHOP_MODULE);

export interface BagLinePayload {
  id: string;
  quantity: number;
}

export const courierShopRemote = {
  /** `GET bag/items` — what the courier is carrying right now. */
  bagItems: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.get('bag/items', undefined, opts),

  /** `POST bag/quote` — lines, delivery, saving and total for a selection. */
  bagQuote: (items: readonly BagLinePayload[], opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.post('bag/quote', { items }, opts),

  /** `POST bag/confirm` — takes the units out of the bag and returns the receipt. */
  bagConfirm: (items: readonly BagLinePayload[], opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.post('bag/confirm', { items }, opts),

  /** `GET fit/product` — the product offered in two sizes. */
  fitProduct: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.get('fit/product', undefined, opts),

  /** `GET fit/sessions/current` — the live doorstep session, or `null`. */
  fitSession: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.get('fit/sessions/current', undefined, opts),

  /** `POST fit/sessions` — order the chosen sizes and start the countdown. */
  startFit: (sizes: readonly string[], opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.post('fit/sessions', { sizes }, opts),

  /** `POST fit/sessions/confirm` — keep / return, settling the session. */
  confirmFit: (kept: readonly string[], opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.post('fit/sessions/confirm', { kept }, opts),

  /** `GET fit/results/latest` — the settled session, so a reload keeps the result screen. */
  fitResult: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.get('fit/results/latest', undefined, opts),

  /** `GET expert/catalog?product=` — services + slots for one product kind. */
  expertCatalog: (product: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.get('expert/catalog', { product }, opts),

  /** `POST expert/bookings` — reserve a slot. */
  book: (
    payload: { product: string; service: string; slot: string },
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> => transport.post('expert/bookings', payload, opts),

  /** `GET expert/bookings/latest` — the reservation to confirm. */
  latestBooking: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.get('expert/bookings/latest', undefined, opts),

  /** Debug hooks the mock answers; a real service simply 404s them. */
  failNextCall: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.post('debug/fail-next', undefined, opts),
  resetDemo: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    transport.post('debug/reset', undefined, opts),
} as const;
