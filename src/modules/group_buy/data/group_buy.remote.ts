/**
 * Remote source for group_buy — paths and params only, no mapping.
 *
 * Every call goes through `remote.mock('group_buy')`, i.e. `/api/mock/group_buy/…`. Nothing here
 * ever reaches `api.ozio10.az`.
 *
 * The paths mirror the proposed REST surface in `web-handoff/api/mock-modules.md` §15
 * (`GET /deals`, `GET /deals/{id}`, `GET /products`, `POST /deals`, `POST /deals/{id}/join`), so
 * switching to a real backend means changing `remote.mock('group_buy')` to
 * `remote.get('group-buy/…')` here and deleting `group_buy.mock.ts` — no other file moves.
 *
 * `lang` is a query parameter because the mock namespace does not pass through the BFF, which is
 * what attaches `Accept-Language` on the real paths. A real source drops it and keeps the header.
 */
import { remote, type RemoteResult } from '@/core/network';

import { GROUP_BUY_MOCK_MODULE } from '../group_buy.flags';

const mock = remote.mock(GROUP_BUY_MOCK_MODULE);

export const groupBuyRemote = {
  /** `GET deals` — `{ nearby, mine, total }`. */
  overview: (lang: string, signal?: AbortSignal): RemoteResult<unknown> =>
    mock.get('deals', { lang }, { signal }),

  /** `GET deals/{id}` — one deal, 404 when the id is unknown. */
  deal: (id: string, lang: string, signal?: AbortSignal): RemoteResult<unknown> =>
    mock.get(`deals/${encodeURIComponent(id)}`, { lang }, { signal }),

  /** `GET deals/{id}/quote?qty=` — the confirm-dialog breakdown for a quantity. */
  quote: (id: string, qty: number, lang: string, signal?: AbortSignal): RemoteResult<unknown> =>
    mock.get(`deals/${encodeURIComponent(id)}/quote`, { qty, lang }, { signal }),

  /** `GET products` — the create-form catalog, targets, deadlines and the delivery address. */
  products: (lang: string, signal?: AbortSignal): RemoteResult<unknown> =>
    mock.get('products', { lang, limit: 20 }, { signal }),

  /** `POST deals` — opens a group. */
  create: (
    body: { product_id: string; target: number; hours: number; qty: number },
    lang: string,
    signal?: AbortSignal,
  ): RemoteResult<unknown> => mock.post('deals', body, { query: { lang }, signal }),

  /** `POST deals/{id}/join` — joins a group. 409 when the window already elapsed. */
  join: (
    id: string,
    qty: number,
    lang: string,
    signal?: AbortSignal,
  ): RemoteResult<unknown> =>
    mock.post(`deals/${encodeURIComponent(id)}/join`, { qty }, { query: { lang }, signal }),
} as const;
