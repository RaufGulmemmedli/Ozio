/**
 * Coupon domain model over `GET v1/coupons/global` (verified) and `GET v1/promo-code`
 * (verified but empty on live, row shape unobserved).
 *
 * What the live payload actually carries (api/coupons.md):
 *   `{id, code, status ("unlimit"), name, description, price ("0"), type (channel),
 *     is_popular, discount_type, discount_value, is_qr, start_date, end_date,
 *     is_expired, used_at, image{object_key}}`
 *
 * What it does NOT carry — and is therefore absent from this model on purpose:
 *   partner / brand, store, terms, minimum basket, max cashback, usage limit,
 *   barcode image, redemption token.
 *
 * `discount_type` is **not** a unit: `percent` and `cashback` are both percentages,
 * only `fixed` is money. Read {@link Coupon.discountKind} before formatting
 * {@link Coupon.discountValue}.
 *
 * Parsers never throw (BUILD-CONTRACT rule 6).
 */
import { asList, asObj, bakuWallClock, bool, int, money, num, str } from '@/core/network';

/** How `discount_value` must be read. */
export type CouponDiscountKind = 'percent' | 'cashback' | 'fixed' | 'other';
/** Live `type` is a redemption CHANNEL, not a coupon kind. */
export type CouponChannel = 'online' | 'offline' | 'both';
/** Which list the row came from. */
export type CouponSource = 'global' | 'promo';
/** Derived, never sent by the server. */
export type CouponState = 'active' | 'expiring' | 'used' | 'expired';

/**
 * A timestamp the API writes as **Baku wall-clock with a fake trailing `Z`**.
 *
 * `23:59:00.000Z` on a coupon means 23:59 in Baku, not 23:59 UTC. Taking the `Z`
 * at face value keeps a coupon looking active four hours too long
 * (api/README.md "Timestamps").
 */
export interface WallMoment {
  /**
   * The real instant: the literal digits interpreted as Asia/Baku. Formatting it with
   * `useFormat().date()` (which renders in Asia/Baku) prints exactly the digits that
   * arrived, and comparing it with `Date.now()` is correct.
   */
  at: Date;
  /** The original string, for `title` attributes and `<time dateTime>`. */
  raw: string;
}

const DATE_PART = /(\d{4})-(\d{2})-(\d{2})/;

/**
 * Azerbaijan is a fixed UTC+4 — DST was abolished in 2016 — so one constant is enough
 * to turn a Baku wall-clock reading into a true instant.
 */
const BAKU_UTC_OFFSET_HOURS = 4;

/** Reads `2026-11-25T23:59:00.000Z` as 25 Nov 2026, 23:59 **Baku**. */
export function wallMoment(v: unknown): WallMoment | null {
  const raw = str(v);
  const date = DATE_PART.exec(raw);
  if (!date) return null;
  const { hh, mm } = bakuWallClock(raw);
  const at = new Date(
    Date.UTC(int(date[1]), int(date[2]) - 1, int(date[3]), hh - BAKU_UTC_OFFSET_HOURS, mm, 0, 0),
  );
  return Number.isFinite(at.getTime()) ? { at, raw } : null;
}

export interface Coupon {
  id: string;
  /** The code the cashier types / the checkout receives. May be empty. */
  code: string;
  title: string;
  description: string;
  /** Raw server `status`; live sends `"unlimit"`. Kept verbatim, never shown. */
  status: string;
  discountKind: CouponDiscountKind;
  /** Percentage points for `percent`/`cashback`; AZN for `fixed`. */
  discountValue: number;
  channel: CouponChannel;
  /** What the coupon costs to take. Live: always 0. */
  price: number;
  isPopular: boolean;
  /** `true` → show the code as a QR at the till. */
  isQr: boolean;
  imageUrl: string | null;
  startsAt: WallMoment | null;
  endsAt: WallMoment | null;
  isExpired: boolean;
  usedAt: WallMoment | null;
  source: CouponSource;
}

const KINDS: Record<string, CouponDiscountKind> = {
  percent: 'percent',
  percentage: 'percent',
  cashback: 'cashback',
  fixed: 'fixed',
  amount: 'fixed',
};

const CHANNELS: Record<string, CouponChannel> = {
  online: 'online',
  offline: 'offline',
  both: 'both',
};

/** `image: {object_key}` where `object_key` is already a full CDN URL. */
function imageUrl(raw: unknown): string | null {
  const o = asObj(raw);
  const url = str(o.object_key) || str(o.image_url) || str(o.url);
  return url ? url : null;
}

/**
 * Tolerant row parser, mirroring the Flutter `pick()` fallbacks so a promo-code row
 * (shape unobserved) still lands in the same model.
 */
export function parseCoupon(raw: unknown, source: CouponSource = 'global'): Coupon {
  const o = asObj(raw);
  const kindKey = str(o.discount_type).toLowerCase();
  const kind = KINDS[kindKey] ?? (kindKey ? 'other' : 'other');
  const rawValue = o.discount_value ?? o.value ?? o.discount_percentage ?? o.percentage;

  return {
    id: str(o.id) || str(o.promo_id) || str(o.code),
    code: str(o.code) || str(o.coupon_code) || str(o.promo_code),
    title: str(o.name) || str(o.title),
    description: str(o.description).trim(),
    status: str(o.status),
    discountKind: kind,
    // percent / cashback are percentage points; fixed is money. `money()` rounds to
    // 2dp either way, which is right for both.
    discountValue: kind === 'fixed' ? money(rawValue) : num(rawValue),
    channel: CHANNELS[str(o.type).toLowerCase()] ?? 'online',
    price: money(o.price),
    isPopular: bool(o.is_popular),
    isQr: bool(o.is_qr),
    imageUrl: imageUrl(o.image),
    startsAt: wallMoment(o.start_date),
    endsAt: wallMoment(o.end_date ?? o.expires_at),
    isExpired: bool(o.is_expired),
    usedAt: wallMoment(o.used_at),
    source,
  };
}

/** `v1/promo-code` → `{promoCodes: [], count}`; also accepts `promo_codes` / `data`. */
export function promoRows(envelopeData: unknown): unknown[] {
  const o = asObj(envelopeData);
  for (const key of ['promoCodes', 'promo_codes', 'data', 'items']) {
    const list = asList(o[key]);
    if (list.length > 0) return list;
  }
  return Array.isArray(envelopeData) ? envelopeData : [];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days until `end_date`; `null` when the row carries no end date. */
export function daysLeft(coupon: Coupon, now: Date = new Date()): number | null {
  if (!coupon.endsAt) return null;
  return Math.floor((coupon.endsAt.at.getTime() - now.getTime()) / DAY_MS);
}

/**
 * The four card states. Derived here and nowhere else:
 * the server sends `status: "unlimit"` for everything, so `used_at`,
 * `is_expired` and `end_date` are the only signals that exist.
 */
export function couponState(coupon: Coupon, now: Date = new Date()): CouponState {
  if (coupon.usedAt) return 'used';
  const used = /^(used|redeemed)$/i.test(coupon.status);
  if (used) return 'used';
  const expiredFlag = coupon.isExpired || /^(expired|inactive)$/i.test(coupon.status);
  const past = coupon.endsAt ? coupon.endsAt.at.getTime() < now.getTime() : false;
  if (expiredFlag || past) return 'expired';
  const left = daysLeft(coupon, now);
  return left !== null && left <= 3 ? 'expiring' : 'active';
}

/** Usable at web checkout: not spent, not over, and redeemable online. */
export function isRedeemableOnline(coupon: Coupon, now: Date = new Date()): boolean {
  const state = couponState(coupon, now);
  return (state === 'active' || state === 'expiring') && coupon.channel !== 'offline';
}

/** Started but not finished — what the `Aktiv` tab shows. */
export function isLive(coupon: Coupon, now: Date = new Date()): boolean {
  const state = couponState(coupon, now);
  return state === 'active' || state === 'expiring';
}
