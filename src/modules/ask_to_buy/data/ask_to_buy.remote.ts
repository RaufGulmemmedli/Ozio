/**
 * Remote source for ask_to_buy — paths + params only, no mapping.
 *
 * Everything goes through `api(..., { version: 'mock', module: 'ask_to_buy' })`, which resolves to
 * `/api/mock/ask_to_buy/<path>` and is answered by `ask_to_buy.mock.ts`. The real host is never
 * contacted. `api/mock-modules.md` §11 documents the PROPOSED REST shape this mirrors
 * (`/customer/api/v1/ask-to-buy/requests`), so moving to a backend is a change of `version` and
 * `path` here and nothing else.
 */
import { api, type ApiEnvelope, type Result } from '@/core/network';

import { ASK_TO_BUY_MOCK_MODULE } from '../ask_to_buy.flags';
import type { AskDirection, AskRole } from './models/ask-request';

type Call<T> = Promise<Result<ApiEnvelope<T>>>;

const mock = { version: 'mock', module: ASK_TO_BUY_MOCK_MODULE } as const;

export interface ListParams {
  direction: AskDirection;
  locale: string;
  offset?: number;
  limit?: number;
}

export const askToBuyRemote = {
  /** `GET context` → role + parents + cards + the draft basket. */
  context: (locale: string, signal?: AbortSignal): Call<unknown> =>
    api('GET', 'context', { ...mock, query: { locale }, signal }),

  /** `POST role` → flips the demo's side. Mock-only: there is no family API. */
  setRole: (role: AskRole, signal?: AbortSignal): Call<unknown> =>
    api('POST', 'role', { ...mock, body: { role }, signal }),

  /** `GET requests?direction=&offset=&limit=` — `offset`/`limit` paging, like the real lists. */
  list: ({ direction, locale, offset, limit }: ListParams, signal?: AbortSignal): Call<unknown> =>
    api('GET', 'requests', { ...mock, query: { direction, locale, offset, limit }, signal }),

  /** `GET requests/{id}`. */
  get: (id: string, locale: string, signal?: AbortSignal): Call<unknown> =>
    api('GET', `requests/${encodeURIComponent(id)}`, { ...mock, query: { locale }, signal }),

  /** `POST requests` — the child sends the current basket. */
  send: (parentId: string, note: string, locale: string, signal?: AbortSignal): Call<unknown> =>
    api('POST', 'requests', { ...mock, query: { locale }, body: { parent_id: parentId, note }, signal }),

  /** `POST requests/{id}/approve` — mock state only, nothing is charged. */
  approve: (id: string, cardId: string, locale: string, signal?: AbortSignal): Call<unknown> =>
    api('POST', `requests/${encodeURIComponent(id)}/approve`, {
      ...mock,
      query: { locale },
      body: { card_id: cardId },
      signal,
    }),

  /** `POST requests/{id}/decline`. */
  decline: (id: string, locale: string, signal?: AbortSignal): Call<unknown> =>
    api('POST', `requests/${encodeURIComponent(id)}/decline`, { ...mock, query: { locale }, signal }),

  /** `POST requests/{id}/resend` — a new 24 h clock on an expired request. */
  resend: (id: string, locale: string, signal?: AbortSignal): Call<unknown> =>
    api('POST', `requests/${encodeURIComponent(id)}/resend`, { ...mock, query: { locale }, signal }),
} as const;
