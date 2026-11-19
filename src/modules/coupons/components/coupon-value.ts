'use client';

/**
 * How a coupon's value is rendered.
 *
 * `discount_type` decides the **unit**, not just the wording:
 *   `percent`  → percentage points   → "20%"   · "endirim"
 *   `cashback` → percentage points   → "7%"    · "keşbek"   (NOT money!)
 *   `fixed`    → AZN                 → "3 ₼"   · "endirim"
 *   anything else → the raw number with a neutral caption.
 *
 * The stub shows the compact money form ("3 ₼"), matching the export, so the amount is
 * built from `number()` + the ₼ glyph instead of `money()`'s always-two-decimals form.
 */
import { useTranslations } from 'next-intl';

import { MANAT, useFormat } from '@/core/i18n';

import type { Coupon } from '../data/models/coupon';

export interface CouponValueText {
  /** The big figure on the stub, e.g. "20%" or "3 ₼". */
  value: string;
  /** The caption under it, e.g. "endirim". */
  label: string;
}

/** Non-breaking space: the amount and the ₼ must never wrap apart. */
const NBSP = ' ';

export function useCouponValue(): (coupon: Coupon) => CouponValueText {
  const t = useTranslations('coupons');
  const { number } = useFormat();

  return (coupon) => {
    const amount = number(coupon.discountValue, { maximumFractionDigits: 2 });
    switch (coupon.discountKind) {
      case 'percent':
        return { value: `${amount}%`, label: t('value.discount') };
      case 'cashback':
        // A percentage of the basket, not a sum — rendering it as money would be a lie.
        return { value: `${amount}%`, label: t('value.cashback') };
      case 'fixed':
        return { value: `${amount}${NBSP}${MANAT}`, label: t('value.discount') };
      default:
        return {
          value: coupon.discountValue > 0 ? amount : t('value.offerShort'),
          label: t('value.offer'),
        };
    }
  };
}
