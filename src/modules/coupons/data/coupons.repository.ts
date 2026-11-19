/**
 * The only thing the coupon hooks import.
 *
 * Shape decisions that live here (and nowhere above):
 *  - the two sources are merged into one list, `promo` rows first, de-duplicated by id;
 *  - `GET v1/promo-code` is empty on live and its row shape is unobserved, so a failure
 *    there must never take the (verified) global catalogue down with it — it is downgraded
 *    to "no promo rows";
 *  - there is **no per-coupon endpoint**: `detail(id)` resolves the id out of the same two
 *    lists, which is also what a deep link does;
 *  - `applyPromoCode` is behind an `unverified` endpoint, so the result carries
 *    `verified: false` and the caller is forbidden from claiming success (see
 *    {@link PromoApplyResult}).
 */
import { asObj, fail, money, num, ok, parsePage, str, type Page, type Result } from '@/core/network';

import { couponsRemote } from './coupons.remote';
import { parseCoupon, promoRows, type Coupon } from './models/coupon';

const emptyList = (): Page<Coupon> => ({ items: [], total: 0, offset: 0, limit: 0 });

/**
 * What `POST v1/promo-code/apply` might answer. Every field is optional because the
 * response is an APK-era guess that has never been seen on live.
 */
export interface PromoApplyResult {
  /**
   * `false` for every answer this endpoint gives, because the operation is
   * `live: 'unverified'`: a 2xx here does not prove the code was applied. The verified
   * path is `promo_code` on `POST v2/orders/checkout` (cart module).
   */
  verified: false;
  code: string;
  /** Server message, when it sent one. */
  message: string;
  totalDiscount: number | null;
  payableAmount: number | null;
}

export const couponsRepository = {
  /** `GET v1/coupons/global` — the public catalogue (verified). */
  async global(signal?: AbortSignal): Promise<Result<Page<Coupon>>> {
    const res = await couponsRemote.global(signal);
    if (!res.ok) return res;
    return ok(parsePage<Coupon>(res.value.data, (raw) => parseCoupon(raw, 'global'), { key: 'data' }));
  },

  /**
   * `GET v1/promo-code` — the customer's own codes (verified, empty on live).
   * Never fails the screen: a failure becomes an empty page.
   */
  async promoCodes(signal?: AbortSignal): Promise<Result<Page<Coupon>>> {
    const res = await couponsRemote.promoCodes(signal);
    if (!res.ok) return ok(emptyList());
    const rows = promoRows(res.value.data);
    const items = rows.map((raw) => parseCoupon(raw, 'promo'));
    const count = num(asObj(res.value.data).count, items.length);
    return ok({ items, total: Math.max(count, items.length), offset: 0, limit: items.length });
  },

  /**
   * Both lists merged — what `/coupons` renders.
   *
   * The two calls hit different paths, so they may run together (the gateway's 429 rule is
   * per path). `Promise.all` is safe here; it must not be used for two calls to one path.
   */
  async list(signal?: AbortSignal): Promise<Result<Page<Coupon>>> {
    const [globalRes, promoRes] = await Promise.all([
      this.global(signal),
      this.promoCodes(signal),
    ]);
    if (!globalRes.ok) return globalRes;

    const promo = promoRes.ok ? promoRes.value.items : [];
    const seen = new Set<string>();
    const items: Coupon[] = [];
    for (const coupon of [...promo, ...globalRes.value.items]) {
      const key = coupon.id || coupon.code;
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      items.push(coupon);
    }
    return ok({ items, total: items.length, offset: 0, limit: items.length });
  },

  /**
   * One coupon by id. There is no `GET coupons/{id}` in the API, so this reads the lists
   * and picks the row — the documented behaviour for a deep link.
   * A missing id is **not** a failure: it resolves to `null` so the screen can render its
   * "not found" state rather than an error panel.
   */
  async detail(id: string, signal?: AbortSignal): Promise<Result<Coupon | null>> {
    const res = await this.list(signal);
    if (!res.ok) return fail(res.failure);
    const wanted = id.trim();
    const found = res.value.items.find((c) => c.id === wanted || c.code === wanted) ?? null;
    return ok(found);
  },

  /**
   * `POST v1/promo-code/apply` (unverified). Kept behind the repository exactly so a wrong
   * guess about the body key or the response is a one-line fix here.
   */
  async applyPromoCode(code: string, signal?: AbortSignal): Promise<Result<PromoApplyResult>> {
    const trimmed = code.trim().toUpperCase();
    const res = await couponsRemote.applyPromoCode(trimmed, signal);
    if (!res.ok) return fail(res.failure);

    const data = asObj(res.value.data);
    const promo = asObj(data.applied_promo);
    const discount = data.total_discount;
    const payable = data.payable_amount ?? data.total_amount;

    return ok({
      verified: false,
      code: str(promo.code) || str(data.code) || trimmed,
      message: str(data.message) || res.value.message,
      totalDiscount: discount === undefined || discount === null ? null : money(discount),
      payableAmount: payable === undefined || payable === null ? null : money(payable),
    });
  },
} as const;
