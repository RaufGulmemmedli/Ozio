/**
 * Remote source for price_lock — paths and params only, no mapping.
 *
 * Every call goes through `remote.mock('price_lock')`, i.e. `/api/mock/price_lock/…`. Nothing here
 * ever reaches `api.ozio10.az`.
 *
 * The paths mirror the proposed REST surface in `web-handoff/api/mock-modules.md` §14
 * (`GET /guarantee`, `POST /guarantee/link`, `DELETE /guarantee/link`, `GET /locks`,
 * `POST /locks`, `POST /locks/{id}/use`) under base `/customer/api/v1/price`, so switching to a
 * real backend means changing `remote.mock('price_lock')` to `remote.get('price/…')` here and
 * deleting `price_lock.mock.ts`.
 *
 * `lang` is a query parameter because the mock namespace does not pass through the BFF, which is
 * what attaches `Accept-Language` on the real paths. A real source drops it and keeps the header.
 */
import { remote, type RemoteResult } from '@/core/network';

import { PRICE_LOCK_MOCK_MODULE } from '../price_lock.flags';

const mock = remote.mock(PRICE_LOCK_MOCK_MODULE);

export const priceLockRemote = {
  /** `GET guarantee` — the PL1 payload (`notLinked` or `active`). */
  guarantee: (lang: string, signal?: AbortSignal): RemoteResult<unknown> =>
    mock.get('guarantee', { lang }, { signal }),

  /** `POST guarantee/link` — 422 with the drawn copy when the number is not a card. */
  linkCard: (cardNumber: string, lang: string, signal?: AbortSignal): RemoteResult<unknown> =>
    mock.post('guarantee/link', { card_number: cardNumber }, { query: { lang }, signal }),

  /** `DELETE guarantee/link` — "Kartı ayır". */
  unlinkCard: (lang: string, signal?: AbortSignal): RemoteResult<unknown> =>
    mock.del('guarantee/link', undefined, { query: { lang }, signal }),

  /** `GET locks` — both tabs plus the lock window and deposit terms. */
  locks: (lang: string, signal?: AbortSignal): RemoteResult<unknown> =>
    mock.get('locks', { lang }, { signal }),

  /** `POST locks` — the PL3 freeze dialog. */
  createLock: (
    body: { product_name: string; price: number },
    lang: string,
    signal?: AbortSignal,
  ): RemoteResult<unknown> => mock.post('locks', body, { query: { lang }, signal }),

  /** `POST locks/{id}/use` — marks the lock used. */
  useLock: (id: string, lang: string, signal?: AbortSignal): RemoteResult<unknown> =>
    mock.post(`locks/${encodeURIComponent(id)}/use`, undefined, { query: { lang }, signal }),
} as const;
