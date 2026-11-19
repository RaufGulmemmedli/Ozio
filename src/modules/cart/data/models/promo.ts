/**
 * Promo codes (`?sheet=promo`, screen OD3, export `app-orders/app-promo-code.html`).
 *
 * `GET v1/promo-code` is **verified but empty on live** — `{ promoCodes: [], count }`, so the row
 * shape has never been observed. The keys below follow the verified `coupons/global` item
 * (`promo_code.dart:3`): `discount_type` (`percent` | `cashback` | `fixed`) + `discount_value`
 * (a string like "15") + `end_date`. Everything is optional and tolerated.
 *
 * `POST v1/promo-code/apply` is **unverified** (its body is a guess and removal is undocumented),
 * so the UI does not depend on it: the sheet stores the code and `orders/checkout` — which **is**
 * verified and takes `promo_code` — decides whether it is valid. See `cart.repository.ts`.
 */
import { asList, asObj, bool, money, num, str } from '@/core/network';

export type PromoDiscountType = 'percent' | 'fixed' | 'cashback' | 'unknown';

export interface PromoCode {
  code: string;
  title: string | null;
  description: string | null;
  discountType: PromoDiscountType;
  /** Percent points for `percent`, manat for `fixed`/`cashback`; `null` when not sent. */
  discountValue: number | null;
  /** ISO date string as sent. */
  endDate: string | null;
}

export interface PromoCodeList {
  codes: PromoCode[];
  total: number;
}

/** Outcome of the unverified apply call — never claim success on a 2xx without a code echo. */
export interface PromoApplyResult {
  accepted: boolean;
  code: string | null;
  message: string | null;
}

const nullableString = (v: unknown): string | null => {
  const s = str(v).trim();
  return s.length > 0 ? s : null;
};

const pick = (o: Record<string, unknown>, keys: readonly string[]): unknown => {
  for (const key of keys) {
    const value = o[key];
    if (value !== null && value !== undefined) return value;
  }
  return undefined;
};

function parseDiscountType(v: unknown): PromoDiscountType {
  const raw = str(v).toLowerCase();
  if (raw.includes('percent')) return 'percent';
  if (raw.includes('cashback')) return 'cashback';
  if (raw.includes('fixed') || raw.includes('amount')) return 'fixed';
  return 'unknown';
}

export function parsePromoCode(json: unknown): PromoCode {
  const o = asObj(json);
  return {
    code: str(pick(o, ['code', 'promo_code', 'name'])).trim().toUpperCase(),
    title: nullableString(pick(o, ['title', 'description', 'name'])),
    description: nullableString(pick(o, ['description', 'subtitle', 'details'])),
    discountType: parseDiscountType(pick(o, ['discount_type', 'type'])),
    discountValue: (() => {
      const raw = pick(o, ['discount_value', 'value', 'discount']);
      return raw === null || raw === undefined || raw === '' ? null : money(raw);
    })(),
    endDate: nullableString(pick(o, ['end_date', 'expires_at', 'valid_until'])),
  };
}

/** `{ promoCodes: [], count }`, with a bare array and the usual alternates tolerated. */
export function parsePromoCodeList(json: unknown): PromoCodeList {
  const o = asObj(json);
  const rows = Array.isArray(json)
    ? json
    : asList(pick(o, ['promoCodes', 'promo_codes', 'codes', 'items', 'data']));
  const codes = rows.map(parsePromoCode).filter((row) => row.code.length > 0);
  const total = o.count === undefined ? codes.length : num(o.count, codes.length);
  return { codes, total };
}

export function parsePromoApplyResult(json: unknown, requested: string): PromoApplyResult {
  const o = asObj(json);
  const echoed = nullableString(pick(o, ['code', 'promo_code']));
  const explicit = o.success === undefined ? null : bool(o.success);
  return {
    // A 2xx that echoes nothing proves nothing (README: never claim success without the id).
    accepted: explicit !== null ? explicit : echoed !== null && echoed.toUpperCase() === requested.toUpperCase(),
    code: echoed,
    message: nullableString(pick(o, ['message', 'notification_message'])),
  };
}

/** Normalises what the user typed: trimmed, upper-case, no spaces. */
export const normalizePromoInput = (value: string): string =>
  value.trim().toUpperCase().replace(/\s+/g, '');
