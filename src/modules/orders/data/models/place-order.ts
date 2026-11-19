/**
 * ============================================================================
 *  THE ONE PLACE THE `POST v2/orders` REQUEST BODY IS GUESSED
 * ============================================================================
 *
 * `POST v2/orders` is **UNVERIFIED — the body is completely unknown** (api/orders.md: "Never
 * called. Body schema is empty because nothing is known: how the cart/store is identified, address
 * id, payment method and card id keys, promo, tip, note, bonus use, delivery time, any checkout_id
 * from orders/checkout, idempotency").
 *
 * The body below is therefore DERIVED FROM THE VERIFIED `POST v2/orders/checkout` BODY — the best
 * available evidence — plus `checkout_id` (the calc's `id`), which is what the Flutter client sends:
 *
 *   {
 *     cart_id: <v2/carts row id>,                 // verified key on orders/checkout
 *     checkout_id: "<calc id (uuid string)>",     // GUESS: Flutter sends the calc id
 *     delivery: { latitude, longitude, address_id },  // verified key + required numbers
 *     payment_method: "cash" | "card",            // verified values on orders/checkout
 *     payment_card_id?: <saved card id>,          // card only; acceptance unverified
 *     promo_code?: "ABC",                         // only when set; acceptance unverified
 *     use_bonus: boolean,                         // verified key on orders/checkout
 *     courier_tip?: number,                       // GUESS, from breakdown.courier_tip/tip_config
 *     note?: "…",                                 // GUESS; omitted when empty
 *   }
 *
 * Only non-empty fields are sent, so a wrong optional guess cannot break a request that would
 * otherwise succeed. When the backend confirms the real shape, THIS FUNCTION is the only change.
 *
 * Nothing else in the module builds an order body; `orders.remote.ts` takes the object this
 * function returns and posts it unmodified.
 */
import type { PaymentMethodChoice } from './payment-method';
import { wirePaymentMethod } from './payment-method';

export interface DeliveryPoint {
  latitude: number;
  longitude: number;
  /** `profile/address` id. Without it the server answers `purchasing_disabled: address_incomplete`. */
  addressId: number | null;
}

export interface PlaceOrderInput {
  /** `GET v2/carts` row id — the cart being ordered (one cart per store). */
  cartId: number;
  /** The `id` of the checkout calculation this price came from. */
  checkoutId: string | null;
  delivery: DeliveryPoint;
  method: PaymentMethodChoice;
  /** Saved card id, when `method` is a card method. */
  cardId: number | null;
  promoCode: string | null;
  useBonus: boolean;
  /** Courier tip from `tip_config`, in ₼. */
  tip: number | null;
  note: string | null;
}

/** The verified `POST v2/orders/checkout` body. Both calls are built from the same input. */
export function buildCheckoutBody(input: PlaceOrderInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    cart_id: input.cartId,
    delivery: {
      latitude: input.delivery.latitude,
      longitude: input.delivery.longitude,
      ...(input.delivery.addressId ? { address_id: input.delivery.addressId } : {}),
    },
    payment_method: wirePaymentMethod(input.method),
    use_bonus: input.useBonus,
  };
  if (input.cardId !== null && wirePaymentMethod(input.method) === 'card') {
    body.payment_card_id = input.cardId;
  }
  if (input.promoCode) body.promo_code = input.promoCode;
  return body;
}

/**
 * The guessed `POST v2/orders` body. Checkout's verified body + `checkout_id` + the optional extras.
 * **Do not call this from anywhere but `ordersRemote.create`.**
 */
export function buildOrdersCreateBody(input: PlaceOrderInput): Record<string, unknown> {
  const body = buildCheckoutBody(input);
  if (input.checkoutId) body.checkout_id = input.checkoutId;
  if (input.tip !== null && input.tip > 0) body.courier_tip = input.tip;
  const note = input.note?.trim();
  if (note) body.note = note;
  return body;
}

/* -------------------------------------------------------------------------- */
/* What came back                                                             */
/* -------------------------------------------------------------------------- */

/**
 * How a placement ended.
 *
 * `unknown` is the important one: a 2xx **without** an order id proves nothing, and neither does a
 * network/5xx failure of the POST — the order may well have been created. The repository resolves
 * those by re-reading `GET v2/orders` and diffing against a pre-submit id snapshot.
 */
export type PlaceOrderStatusKind = 'placed' | 'unknown' | 'rejected';

export interface PlaceOrderResult {
  kind: PlaceOrderStatusKind;
  /** Present for `placed`; null for `unknown`/`rejected`. */
  orderId: number | null;
  /** Gateway hand-off: open this to finish a card payment, then re-read the order. */
  redirectUrl: string | null;
  /** Raw `payment_status`, mapped through `moneyState()` for the UI. */
  paymentStatus: string | null;
  /** Raw `order_status`. */
  orderStatus: string | null;
  /** True when the id came from the recovery read rather than the POST response. */
  recovered: boolean;
}
