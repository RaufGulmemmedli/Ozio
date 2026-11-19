/**
 * The parcel repository — the only thing hooks import.
 *
 * It takes `Result<ApiEnvelope<unknown>>` from the remote source and returns
 * `Result<DomainModel>`. The interface is deliberately identical to a real-API module's: it knows
 * nothing about MSW, nothing about `localStorage` and nothing about the demo timers. Swapping the
 * mock for a backend means pointing `parcel.remote.ts` at the real URLs and deleting the handler.
 */
import { Failure, mapResult, type Result } from '@/core/network';

import {
  parseParcel,
  parseParcelQuote,
  parseParcelRules,
  type Parcel,
  type ParcelDraft,
  type ParcelQuote,
  type ParcelRules,
} from './models/parcel';
import { parcelRemote } from './parcel.remote';

/** `data` can legitimately be `null` on a malformed reply; that is a parse failure, not a crash. */
const required = <T>(r: Result<{ data: unknown }>, parse: (json: unknown) => T): Result<T> => {
  if (!r.ok) return r;
  if (r.value.data === null || r.value.data === undefined) {
    return { ok: false, failure: new Failure('parse', 'parcel: empty payload') };
  }
  return { ok: true, value: parse(r.value.data) };
};

const rows = (r: Result<{ data: unknown }>): Result<Parcel[]> =>
  mapResult(r, (envelope) => {
    const data = envelope.data;
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as { items?: unknown } | null)?.items)
        ? ((data as { items: unknown[] }).items)
        : [];
    return list.map(parseParcel).filter((p) => p.id !== '');
  });

export interface ParcelRepository {
  rules(signal?: AbortSignal): Promise<Result<ParcelRules>>;
  quote(draft: ParcelDraft, signal?: AbortSignal): Promise<Result<ParcelQuote>>;
  create(draft: ParcelDraft, quote: ParcelQuote): Promise<Result<Parcel>>;
  list(signal?: AbortSignal): Promise<Result<Parcel[]>>;
  byId(id: string, signal?: AbortSignal): Promise<Result<Parcel>>;
  cancel(id: string): Promise<Result<Parcel>>;
}

export const parcelRepository: ParcelRepository = {
  async rules(signal) {
    return required(await parcelRemote.rules({ signal }), parseParcelRules);
  },

  async quote(draft, signal) {
    return required(await parcelRemote.quote(draft, { signal }), parseParcelQuote);
  },

  async create(draft, quote) {
    const result = required(await parcelRemote.create(draft, quote), parseParcel);
    // Never claim success on a 2xx that lacks the id (BUILD-CONTRACT "API reality").
    if (result.ok && result.value.id === '') {
      return { ok: false, failure: new Failure('parse', 'parcel: create returned no id') };
    }
    return result;
  },

  async list(signal) {
    return rows(await parcelRemote.list({ limit: 50 }, { signal }));
  },

  async byId(id, signal) {
    return required(await parcelRemote.detail(id, { signal }), parseParcel);
  },

  async cancel(id) {
    return required(await parcelRemote.cancel(id), parseParcel);
  },
};
