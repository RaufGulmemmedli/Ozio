/**
 * The 4 stat tiles (`Phh2w`): Bonus balansı · Bu ay keşbek · Aktiv kuponlar · Ozio 10-lar.
 *
 * Each tile has its own source, and **each one is nullable**: a failed request leaves its tile on
 * the "—" neutral value instead of blanking the row (home_stats.dart does the same).
 */
import { asList, asObj, bakuWallClock, bool, int, money, nullableStr, num, pickTranslation, str } from '@/core/network';

/* ------------------------------------------------------------------ coupons */

export interface Coupon {
  /** uuid string on live. */
  id: string;
  code: string;
  title: string;
  description: string | null;
  /** `percent` | `cashback` (also a percentage!) | `fixed`. */
  discountType: 'percent' | 'cashback' | 'fixed' | 'unknown';
  /** A percentage for percent/cashback, an amount in AZN for fixed. */
  discountValue: number;
  /** Minimum order the coupon applies to, when the server sends one. */
  minOrder: number | null;
  /** Baku wall-clock, read literally. */
  endDate: string | null;
  isExpired: boolean;
  isPopular: boolean;
  imageUrl: string | null;
  usedAt: string | null;
}

const DISCOUNT_TYPES = new Set(['percent', 'cashback', 'fixed']);

export function parseCoupon(raw: unknown): Coupon {
  const o = asObj(raw);
  const type = str(o.discount_type).toLowerCase();
  const price = o.price === undefined || o.price === null ? null : money(o.price);
  return {
    id: str(o.id),
    code: str(o.code),
    title: str(o.name) || str(o.code),
    description: nullableStr(o.description),
    discountType: DISCOUNT_TYPES.has(type) ? (type as Coupon['discountType']) : 'unknown',
    discountValue: num(o.discount_value),
    minOrder: price !== null && price > 0 ? price : null,
    endDate: nullableStr(o.end_date),
    isExpired: bool(o.is_expired),
    isPopular: bool(o.is_popular),
    imageUrl: nullableStr(asObj(o.image).object_key),
    usedAt: nullableStr(o.used_at),
  };
}

/** `HH:mm`-safe end date for display: coupon dates are Baku wall-clock with a fake `Z`. */
export const couponEndClock = (coupon: Coupon): string => bakuWallClock(coupon.endDate).text;

export const isUsableCoupon = (c: Coupon): boolean => !c.isExpired && !c.usedAt;

/* ------------------------------------------------------------------ ten-cart */

export interface TenProgress {
  id: number;
  name: string;
  /** 9 on live — the number of stamps a card needs. */
  steps: number;
  /** Absent when `is_selected` is false → 0. */
  currentStep: number;
  completed: boolean;
  isSelected: boolean;
  imageUrl: string | null;
}

/** `GET v1/ten-carts` (verified, 5 rows). These are **stamp cards**, not priced bundles. */
export function parseTenProgress(raw: unknown, locale = 'az'): TenProgress {
  const o = asObj(raw);
  const steps = int(o.steps);
  const current = int(o.current_step);
  return {
    id: int(o.id),
    name: pickTranslation(o.ten_cart_translations, locale),
    steps,
    currentStep: Math.max(0, Math.min(current, steps)),
    completed: bool(o.completed),
    isSelected: bool(o.is_selected),
    imageUrl: nullableStr(asObj(asObj(asList(o.ten_carts_uploads)[0]).uploads).object_key),
  };
}

/** The card the tile shows: the selected one, else the furthest along. */
export function bestTenProgress(cards: readonly TenProgress[]): TenProgress | null {
  if (cards.length === 0) return null;
  const selected = cards.find((c) => c.isSelected);
  if (selected) return selected;
  return cards.reduce((best, c) => (c.currentStep > best.currentStep ? c : best), cards[0]);
}
