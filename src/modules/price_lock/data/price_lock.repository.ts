/**
 * The only thing the price_lock hooks import.
 *
 * It implements the `PriceLockRepository` surface from
 * `src/core/api/contracts/mock-contracts.ts` §14 (`guarantee`, `linkCard`, `unlinkCard`, `locks`,
 * `createLock`, `useLock`) over `data/price_lock.remote.ts`, and is deliberately
 * indistinguishable from a real-API repository: envelope in, domain model out, `Result` either
 * way, parsers that never throw. The mock lives one layer below (`price_lock.mock.ts`).
 */
import { ok, type Result } from '@/core/network';

import { EMPTY_GUARANTEE, parseGuarantee, type Guarantee } from './models/guarantee';
import {
  EMPTY_LOCK_LIST,
  parsePriceLockItem,
  parsePriceLockList,
  type PriceLockItem,
  type PriceLockList,
} from './models/price-lock-item';
import { priceLockRemote } from './price_lock.remote';

export const priceLockRepository = {
  /** `GET guarantee` — PL1. */
  async guarantee(locale: string, signal?: AbortSignal): Promise<Result<Guarantee>> {
    const res = await priceLockRemote.guarantee(locale, signal);
    if (!res.ok) return res;
    return ok(parseGuarantee(res.value.data, locale));
  },

  /**
   * `POST guarantee/link` — a wrong number comes back as a 422 `Failure` carrying the source's
   * message, which is what the `State · Kart bağlanmadı` panel shows.
   */
  async linkCard(
    cardNumber: string,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<Guarantee>> {
    const res = await priceLockRemote.linkCard(cardNumber, locale, signal);
    if (!res.ok) return res;
    return ok(parseGuarantee(res.value.data, locale));
  },

  /** `DELETE guarantee/link` — "Kartı ayır". The staples stay listed afterwards. */
  async unlinkCard(locale: string, signal?: AbortSignal): Promise<Result<Guarantee>> {
    const res = await priceLockRemote.unlinkCard(locale, signal);
    if (!res.ok) return res;
    return ok(parseGuarantee(res.value.data, locale));
  },

  /** `GET locks` — both tabs plus `lockDays` / `deposit`. */
  async locks(locale: string, signal?: AbortSignal): Promise<Result<PriceLockList>> {
    const res = await priceLockRemote.locks(locale, signal);
    if (!res.ok) return res;
    return ok(parsePriceLockList(res.value.data, locale));
  },

  /** `POST locks` — the freeze dialog. Demo state only: the 1 ₼ deposit is never charged. */
  async createLock(
    input: { productName: string; price: number },
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<PriceLockItem>> {
    const res = await priceLockRemote.createLock(
      { product_name: input.productName, price: input.price },
      locale,
      signal,
    );
    if (!res.ok) return res;
    return ok(parsePriceLockItem(res.value.data, locale));
  },

  /**
   * `POST locks/{id}/use` — marks the lock used.
   *
   * In a real build this is where the locked price would be carried into the cart. Here it stops
   * at the mock: no cart row is written and nothing is charged.
   */
  async useLock(id: string, locale: string, signal?: AbortSignal): Promise<Result<void>> {
    const res = await priceLockRemote.useLock(id, locale, signal);
    if (!res.ok) return res;
    return ok(undefined);
  },
} as const;

export { EMPTY_GUARANTEE, EMPTY_LOCK_LIST };
