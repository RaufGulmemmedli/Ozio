/**
 * `POST v2/orders/checkout` — the **calculation** call (`api/orders.md`, **verified** 2026-11-12).
 * It prices a cart; it does **not** place an order (that is `POST v2/orders`, unverified, M6).
 *
 * This is the only source of totals, fees, discounts, bonus, tip and the payable amount
 * (BUILD-CONTRACT rule 7). Every money field is `number | null`: `null` means "the server sent
 * nothing", and the view must then render a skeleton, never a `0`.
 *
 * Request body that works:
 * `{ cart_id, delivery: { latitude, longitude, address_id }, payment_method, use_bonus,
 *    payment_card_id?, promo_code? }`
 * Without `delivery.address_id` the call still answers 200, with `purchasing_disabled: true` and
 * `purchasing_disabled_reasons: { address_incomplete: … }`.
 */
import { asList, asObj, bool, money, num, str } from '@/core/network';

export type PaymentMethod = 'cash' | 'card';

/** What the client chose. Every change triggers one (serialised) recalculation. */
export interface CheckoutSelection {
  cartId: number | null;
  addressId: number | null;
  latitude: number | null;
  longitude: number | null;
  paymentMethod: PaymentMethod;
  paymentCardId: number | null;
  useBonus: boolean;
  promoCode: string | null;
  /** `tip_config.options[].value`; sent as `courier_tip`. */
  courierTip: number | null;
}

export interface CheckoutBreakdown {
  itemTotalPrice: number | null;
  itemTotalMrp: number | null;
  totalDiscount: number | null;
  minimumOrderFee: number | null;
  serviceFee: number | null;
  packetFee: number | null;
  deliveryFee: number | null;
  courierTip: number | null;
  bonusPayment: number | null;
}

export interface CheckoutDeliveryDetails {
  isFree: boolean;
  outOfZone: boolean;
  distanceMeters: number | null;
  isAccurate: boolean;
}

export interface CheckoutTipConfig {
  maxAllowedTip: number | null;
  options: number[];
}

/** An item the server changed or dropped while pricing (`cart_updated` / `updated_items[]`). */
export interface CheckoutUpdatedItem {
  /** Store-product row id when the server names one. */
  id: number | null;
  name: string | null;
  /** Server wording for what happened, when present. */
  message: string | null;
  /** Quantity the server kept; `0` is the out-of-stock case. */
  quantity: number | null;
}

export interface CheckoutCalc {
  /** The calc's id (a UUID string live). What placing the order refers to (`checkout_id`, a guess). */
  id: string | null;
  /** **The payable amount**, exactly as sent. `null` → confirming must be blocked. */
  amount: number | null;
  breakdown: CheckoutBreakdown;
  delivery: CheckoutDeliveryDetails;
  tipConfig: CheckoutTipConfig;
  isStoreClosed: boolean;
  purchasingDisabled: boolean;
  /** The server's own reason texts — shown verbatim, never replaced with our own wording. */
  purchasingDisabledReasons: string[];
  earnedBonus: number | null;
  lastPaymentMethod: string | null;
  /** `applied_promo` — shape unobserved on live; the code is echoed when the server echoes one. */
  appliedPromoCode: string | null;
  appliedPromoDiscount: number | null;
  cartUpdated: boolean;
  updatedItems: CheckoutUpdatedItem[];
  /** Epoch ms; the calc stops being valid then → recalculate. */
  expiresAt: number | null;
}

const nullableMoney = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : money(v);

const nullableNumber = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : num(v);

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

/** `purchasing_disabled_reasons` is an object of `{ code: "server text" }`. */
function parseReasons(json: unknown): string[] {
  const reasons: string[] = [];
  const o = asObj(json);
  for (const value of Object.values(o)) {
    const text = str(value).trim();
    if (text.length > 0) reasons.push(text);
  }
  for (const value of asList(json)) {
    const text = str(value).trim();
    if (text.length > 0) reasons.push(text);
  }
  return reasons;
}

function parseUpdatedItem(json: unknown): CheckoutUpdatedItem {
  const o = asObj(json);
  const product = asObj(o.product);
  return {
    id: nullableNumber(pick(o, ['id', 'product_id', 'store_product_id']) ?? product.id),
    name: nullableString(pick(o, ['name', 'product_name']) ?? product.name),
    message: nullableString(pick(o, ['message', 'reason', 'notification_message'])),
    quantity: nullableNumber(pick(o, ['quantity', 'available_quantity', 'stock'])),
  };
}

/**
 * Tolerant parse of the calc. Legacy flat keys the Flutter parser still reads are accepted as
 * fallbacks (`checkout_calc.dart:85-106`), and the calc may also arrive under `price_details`.
 */
export function parseCheckoutCalc(json: unknown): CheckoutCalc {
  const m = asObj(json);
  const b = { ...asObj(m.price_details), ...asObj(m.breakdown) };
  const d = asObj(m.delivery_details);
  const tip = asObj(m.tip_config);
  const promo = asObj(m.applied_promo);

  return {
    id: nullableString(pick(m, ['id', 'checkout_id'])),
    // Rule: payable = `amount` / `payable_amount` ONLY. A legit 0 (fully covered) is kept.
    amount: nullableMoney(pick(m, ['amount', 'payable_amount'])),
    breakdown: {
      itemTotalPrice: nullableMoney(
        pick(b, ['item_total_price', 'items_total_price']) ?? pick(m, ['items_total_price']),
      ),
      itemTotalMrp: nullableMoney(pick(b, ['item_total_mrp', 'total_mrp']) ?? pick(m, ['total_amount'])),
      totalDiscount: nullableMoney(pick(b, ['total_discount']) ?? pick(m, ['total_discount'])),
      minimumOrderFee: nullableMoney(
        pick(b, ['minimum_order_fee', 'small_order_fee']) ?? pick(m, ['minimum_order_fee']),
      ),
      serviceFee: nullableMoney(pick(b, ['service_fee']) ?? pick(m, ['service_fee'])),
      packetFee: nullableMoney(pick(b, ['packet_fee']) ?? pick(m, ['packet_fee'])),
      deliveryFee: nullableMoney(
        pick(b, ['delivery_fee']) ?? pick(m, ['delivery_fee', 'delivery_charge']),
      ),
      courierTip: nullableMoney(pick(b, ['courier_tip', 'tip', 'tip_amount'])),
      bonusPayment: nullableMoney(
        pick(b, ['bonus_payment']) ?? pick(m, ['bonus_payment', 'bonus_spent']),
      ),
    },
    delivery: {
      isFree: bool(pick(d, ['is_free']) ?? pick(m, ['is_delivery_free'])),
      outOfZone: bool(d.out_of_zone),
      distanceMeters: nullableNumber(d.distance_meters),
      isAccurate: bool(d.is_accurate, true),
    },
    tipConfig: {
      maxAllowedTip: nullableMoney(tip.max_allowed_tip),
      options: asList(tip.options)
        .map((option) => money(asObj(option).value))
        .filter((value) => Number.isFinite(value)),
    },
    isStoreClosed: bool(m.is_store_closed),
    purchasingDisabled: bool(m.purchasing_disabled),
    purchasingDisabledReasons: parseReasons(m.purchasing_disabled_reasons),
    earnedBonus: nullableMoney(pick(m, ['earned_bonus', 'total_bonus_earned'])),
    lastPaymentMethod: nullableString(m.last_payment_method),
    appliedPromoCode: nullableString(pick(promo, ['code', 'promo_code', 'name'])),
    appliedPromoDiscount: nullableMoney(pick(promo, ['discount', 'discount_value', 'amount'])),
    cartUpdated: bool(m.cart_updated),
    updatedItems: asList(m.updated_items).map(parseUpdatedItem),
    expiresAt: nullableNumber(m.expires_at),
  };
}

/** True when the CTA must stay disabled. The reason text always comes from the server. */
export const canConfirm = (calc: CheckoutCalc | undefined | null): boolean =>
  !!calc && calc.amount !== null && !calc.purchasingDisabled && !calc.isStoreClosed;

/** Lines the server could not keep (quantity 0 → out of stock). */
export const outOfStockItems = (calc: CheckoutCalc | undefined | null): CheckoutUpdatedItem[] =>
  (calc?.updatedItems ?? []).filter((item) => item.quantity === null || item.quantity <= 0);
