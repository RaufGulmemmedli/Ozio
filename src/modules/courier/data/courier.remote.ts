/**
 * The courier remote source — paths and params only, all under `/api/mock/courier/…`.
 *
 * **Nothing here may ever reach the real host.** The gateway has no courier service at all: it
 * answers plain text `Backend service does not exist` for `/courier/api/v1/...`, so a stray live
 * call fails loudly rather than silently. `remote.mock('courier')` keeps the traffic same-origin.
 *
 * Swapping in a backend is this file only: `remote.mock('courier')` → the real verbs plus the
 * PROPOSED paths of `api/mock-modules.md` §2 (`couriers/me`, `couriers/applications`,
 * `couriers/me/online`, `couriers/offers`, `couriers/orders/{id}`[`/accept|/decline|/advance`],
 * `couriers/history`, `couriers/earnings`), then delete the handler.
 */
import { remote, type RemoteCallOptions } from '@/core/network';

import type { CourierApplicationWire } from './models/courier';

const mock = remote.mock('courier');

export const courierRemote = {
  /** PROPOSED `GET /couriers/me` → `{ status, application?, shift, earnings, activeOrder }`. */
  me: (opts?: RemoteCallOptions) => mock.get<unknown>('me', undefined, opts),

  /** PROPOSED `POST /couriers/applications`, snake_case body. */
  submitApplication: (body: CourierApplicationWire, opts?: RemoteCallOptions) =>
    mock.post<unknown>('applications', body, opts),

  /** PROPOSED `PUT /couriers/me/online`. */
  setOnline: (online: boolean, opts?: RemoteCallOptions) =>
    mock.put<unknown>('me/online', { online }, opts),

  /** PROPOSED `GET /couriers/offers` — `[]` while offline or with an order in hand. */
  offers: (opts?: RemoteCallOptions) => mock.get<unknown>('offers', undefined, opts),

  /** PROPOSED `GET /couriers/orders/{id}`. */
  order: (id: string, opts?: RemoteCallOptions) =>
    mock.get<unknown>(`orders/${encodeURIComponent(id)}`, undefined, opts),

  accept: (id: string, opts?: RemoteCallOptions) =>
    mock.post<unknown>(`orders/${encodeURIComponent(id)}/accept`, undefined, opts),

  decline: (id: string, reason: string, opts?: RemoteCallOptions) =>
    mock.post<unknown>(`orders/${encodeURIComponent(id)}/decline`, { reason }, opts),

  /** accepted → atStore → pickedUp → delivered. */
  advance: (id: string, opts?: RemoteCallOptions) =>
    mock.post<unknown>(`orders/${encodeURIComponent(id)}/advance`, undefined, opts),

  cancel: (id: string, reason: string, opts?: RemoteCallOptions) =>
    mock.post<unknown>(`orders/${encodeURIComponent(id)}/cancel`, { reason }, opts),

  /** PROPOSED `GET /couriers/history?offset&limit`. */
  history: (query?: { offset?: number; limit?: number }, opts?: RemoteCallOptions) =>
    mock.get<unknown>('history', query, opts),

  /** PROPOSED `GET /couriers/earnings`. */
  earnings: (opts?: RemoteCallOptions) => mock.get<unknown>('earnings', undefined, opts),
} as const;
