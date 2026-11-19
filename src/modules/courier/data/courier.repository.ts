/**
 * The courier repository — the only thing hooks import.
 *
 * `Result<ApiEnvelope<unknown>>` in, `Result<DomainModel>` out. The interface is the one a
 * real-API module would expose; it knows nothing about MSW, `localStorage` or the 4 s auto-approve.
 */
import { Failure, mapResult, type Result } from '@/core/network';

import {
  parseCourierApplication,
  parseCourierEarnings,
  parseCourierMe,
  parseCourierOrder,
  parseCourierStatus,
  toCourierApplicationWire,
  type CourierApplication,
  type CourierEarnings,
  type CourierMe,
  type CourierOrder,
  type CourierStatus,
} from './models/courier';
import { courierRemote } from './courier.remote';

const required = <T>(r: Result<{ data: unknown }>, parse: (json: unknown) => T): Result<T> => {
  if (!r.ok) return r;
  if (r.value.data === null || r.value.data === undefined) {
    return { ok: false, failure: new Failure('parse', 'courier: empty payload') };
  }
  return { ok: true, value: parse(r.value.data) };
};

const orderRows = (r: Result<{ data: unknown }>): Result<CourierOrder[]> =>
  mapResult(r, (envelope) => {
    const data = envelope.data;
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as { items?: unknown } | null)?.items)
        ? (data as { items: unknown[] }).items
        : [];
    return list.map(parseCourierOrder).filter((o) => o.id !== '');
  });

export interface CourierRepository {
  me(signal?: AbortSignal): Promise<Result<CourierMe>>;
  submitApplication(application: CourierApplication): Promise<Result<CourierStatus>>;
  application(signal?: AbortSignal): Promise<Result<CourierApplication | null>>;
  setOnline(online: boolean): Promise<Result<CourierMe>>;
  offers(signal?: AbortSignal): Promise<Result<CourierOrder[]>>;
  order(id: string, signal?: AbortSignal): Promise<Result<CourierOrder>>;
  accept(id: string): Promise<Result<CourierOrder>>;
  decline(id: string, reason: string): Promise<Result<void>>;
  advance(id: string): Promise<Result<CourierOrder>>;
  cancel(id: string, reason: string): Promise<Result<void>>;
  history(signal?: AbortSignal): Promise<Result<CourierOrder[]>>;
  earnings(signal?: AbortSignal): Promise<Result<CourierEarnings>>;
}

export const courierRepository: CourierRepository = {
  async me(signal) {
    return required(await courierRemote.me({ signal }), parseCourierMe);
  },

  async application(signal) {
    const result = await courierRemote.me({ signal });
    return mapResult(result, (envelope) => {
      const data = envelope.data as { application?: unknown } | null;
      return parseCourierApplication(data?.application);
    });
  },

  async submitApplication(application) {
    const result = await courierRemote.submitApplication(
      toCourierApplicationWire(application),
    );
    return required(result, parseCourierStatus);
  },

  async setOnline(online) {
    return required(await courierRemote.setOnline(online), parseCourierMe);
  },

  async offers(signal) {
    return orderRows(await courierRemote.offers({ signal }));
  },

  async order(id, signal) {
    return required(await courierRemote.order(id, { signal }), parseCourierOrder);
  },

  async accept(id) {
    const result = required(await courierRemote.accept(id), parseCourierOrder);
    // Never claim success on a 2xx that lacks the id.
    if (result.ok && result.value.id === '') {
      return { ok: false, failure: new Failure('parse', 'courier: accept returned no order') };
    }
    return result;
  },

  async decline(id, reason) {
    return mapResult(await courierRemote.decline(id, reason), () => undefined);
  },

  async advance(id) {
    return required(await courierRemote.advance(id), parseCourierOrder);
  },

  async cancel(id, reason) {
    return mapResult(await courierRemote.cancel(id, reason), () => undefined);
  },

  async history(signal) {
    return orderRows(await courierRemote.history({ limit: 50 }, { signal }));
  },

  async earnings(signal) {
    return required(await courierRemote.earnings({ signal }), parseCourierEarnings);
  },
};
