/**
 * The parcel remote source — paths and params only.
 *
 * Every call goes through `remote.mock('parcel')`, i.e. `/api/mock/parcel/…`, which MSW answers
 * from `parcel.mock.ts`. **Nothing here ever reaches the real host**: there is no parcel service
 * on `api.ozio10.az`, so a stray live call would fail loudly.
 *
 * Swapping in a backend is this file only: replace `remote.mock('parcel')` with `remote` (v1) and
 * the documented PROPOSED paths (`parcels/rules`, `parcels/quote`, `parcels`, `parcels/{id}`,
 * `parcels/{id}/cancel`, see `api/mock-modules.md` §1), then delete the handler. The repository,
 * hooks and views do not change.
 */
import { remote, type RemoteCallOptions } from '@/core/network';

import type { ParcelDraft, ParcelQuote } from './models/parcel';

const mock = remote.mock('parcel');

export const parcelRemote = {
  /** PROPOSED `GET v1/parcels/rules`. */
  rules: (opts?: RemoteCallOptions) => mock.get<unknown>('rules', undefined, opts),

  /** PROPOSED `POST v1/parcels/quote`, body `ParcelDraft`. 422 on a rule breach. */
  quote: (draft: ParcelDraft, opts?: RemoteCallOptions) =>
    mock.post<unknown>('quote', draft, opts),

  /** PROPOSED `POST v1/parcels`, body `{ draft, quote }`. */
  create: (draft: ParcelDraft, quote: ParcelQuote, opts?: RemoteCallOptions) =>
    mock.post<unknown>('parcels', { draft, quote }, opts),

  /** PROPOSED `GET v1/parcels?offset&limit` — newest first. */
  list: (query?: { offset?: number; limit?: number }, opts?: RemoteCallOptions) =>
    mock.get<unknown>('parcels', query, opts),

  /** PROPOSED `GET v1/parcels/{id}`. */
  detail: (id: string, opts?: RemoteCallOptions) =>
    mock.get<unknown>(`parcels/${encodeURIComponent(id)}`, undefined, opts),

  /** PROPOSED `POST v1/parcels/{id}/cancel`. */
  cancel: (id: string, opts?: RemoteCallOptions) =>
    mock.post<unknown>(`parcels/${encodeURIComponent(id)}/cancel`, undefined, opts),
} as const;
