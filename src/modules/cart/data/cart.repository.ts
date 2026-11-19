/**
 * The cart repository — the only thing the hooks import. It maps envelopes to domain models and
 * always returns a `Result`; it never throws (`unwrap()` in the hook does that).
 *
 * Three module-wide rules live here, in one place each:
 *
 * 1. **`toCartQty()` — grams ↔ cart unit.** The catalog speaks grams for weight products
 *    (`stock`, `min_order_quantity`), while `POST v2/carts/action` speaks the product unit
 *    (1 = 1 kg). Nothing outside this file converts (04-data-layer.md §"Optimistic cart").
 * 2. **Writes are serialised.** Two concurrent requests to the same path answer 429 and writes are
 *    never auto-retried, so `carts/action` calls queue, and so do the `orders/checkout`
 *    recalculations (`checkoutQueue`).
 * 3. **The unverified calls stay behind this layer.** `POST v1/promo-code/apply` is reachable here
 *    and nowhere else; the UI drives promo codes through `orders/checkout`, which is verified.
 */
import type { CartActionBody } from '@/core/api/contracts/types';
import { Failure, fail, mapResult, type Result } from '@/core/network';

import { cartRemote, type CheckoutRequestBody } from './cart.remote';
import {
  emptyCartBundle,
  parseCartActionResult,
  parseCartBundle,
  type CartActionResult,
  type CartBundle,
} from './models/cart';
import { parseCheckoutCalc, type CheckoutCalc, type CheckoutSelection } from './models/checkout';
import { parseDeliveryEstimates, type StoreDeliveryEstimate } from './models/delivery';
import {
  parsePromoApplyResult,
  parsePromoCodeList,
  type PromoApplyResult,
  type PromoCodeList,
} from './models/promo';

/* -------------------------------------------------------------------------- */
/* Quantity: grams <-> cart unit  (the ONLY conversion site)                  */
/* -------------------------------------------------------------------------- */

/** What `toCartQty` needs to know about a product; both cart lines and catalog rows satisfy it. */
export interface CartQtyProduct {
  /** `measurements.sold_by_gram` — the cart quantity is kg and the catalog stock is grams. */
  soldByGram?: boolean | null;
  hasWeight?: boolean | null;
}

/** What unit the incoming number is in. `auto` = grams for a sold-by-gram product, else a count. */
export type CartQtyUnit = 'auto' | 'grams' | 'unit';

/**
 * Rounds to 3 decimals (gram precision in kg) and returns a whole number when it is whole, so the
 * wire value is `1` / `0.25`, never `0.30000000000000004` (`cart_action_api.dart:92`).
 */
export function normalizeCartQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.round(quantity * 1000) / 1000;
}

/**
 * Converts a UI quantity into the quantity `POST v2/carts/action` wants.
 *
 * ```ts
 * toCartQty(product, 500)        // sold_by_gram: 500 g  -> 0.5  (kg)
 * toCartQty(product, 2)          // count product: 2     -> 2
 * toCartQty(product, 1.5, 'unit')// already kg: 1.5      -> 1.5
 * ```
 *
 * `grams` forces the division (a catalog `stock` / `min_order_quantity`), `unit` forces a
 * pass-through (a cart line's own `quantity`), `auto` decides from `sold_by_gram`.
 */
export function toCartQty(
  product: CartQtyProduct | null | undefined,
  uiQty: number,
  unit: CartQtyUnit = 'auto',
): number {
  const inGrams = unit === 'grams' || (unit === 'auto' && !!product?.soldByGram);
  return normalizeCartQuantity(inGrams ? uiQty / 1000 : uiQty);
}

/** The inverse, for showing a weight line the way the catalog does (`0.75` kg → `750` g). */
export function fromCartQty(product: CartQtyProduct | null | undefined, cartQty: number): number {
  return product?.soldByGram ? Math.round(normalizeCartQuantity(cartQty) * 1000) : cartQty;
}

/** One stepper tap, in the cart unit: 0.1 kg for a weight product, 1 otherwise (screen spec §4). */
export const cartStep = (product: CartQtyProduct | null | undefined): number =>
  product?.soldByGram ? 0.1 : 1;

/**
 * The single request that moves a line from `current` to `target` (both in cart units), or `null`
 * when nothing has to be sent (`cart_action_api.dart:57`):
 * `target > current` → `add(target - current)`; `target <= 0` → `remove(current)`;
 * otherwise → `remove(current - target)` (**partial remove is unverified** — assumed to decrement).
 */
export function cartActionFor(args: {
  storeId: number;
  productId: number;
  current: number;
  target: number;
}): CartActionBody | null {
  const current = normalizeCartQuantity(args.current);
  const target = normalizeCartQuantity(args.target);
  const base = { store_id: args.storeId, product_id: args.productId } as const;

  if (target === current) return null;
  if (target > current) {
    return { ...base, quantity: normalizeCartQuantity(target - current), action: 'add' };
  }
  if (target <= 0) return { ...base, quantity: current, action: 'remove' };
  return { ...base, quantity: normalizeCartQuantity(current - target), action: 'remove' };
}

/* -------------------------------------------------------------------------- */
/* Serialisation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A one-lane queue. Each call waits for the previous one to settle, so the gateway never sees two
 * requests to the same path at once (429, and writes are not retried).
 */
function lane() {
  let tail: Promise<unknown> = Promise.resolve();
  return function run<T>(task: () => Promise<T>): Promise<T> {
    const next = tail.then(task, task);
    // Keep the chain alive even when a task rejects — `task` itself never rejects (it returns a
    // Result), but a cancelled fetch can.
    tail = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };
}

const actionLane = lane();
const checkoutLane = lane();

const ABORTED = new Failure('unknown', 'aborted');

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export const cartRepository = {
  /** `GET v2/carts` → every per-store cart, grouped. Live status: **verified**. */
  async list(signal?: AbortSignal): Promise<Result<CartBundle>> {
    const r = await cartRemote.list(signal);
    return mapResult(r, (envelope) =>
      envelope.data === null ? emptyCartBundle() : parseCartBundle(envelope.data),
    );
  },

  /**
   * `POST v2/carts/action` → the action result. Live status: **verified**.
   * Queued behind any other cart write.
   */
  action(body: CartActionBody): Promise<Result<CartActionResult>> {
    return actionLane(async () => {
      const r = await cartRemote.action(body);
      return mapResult(r, (envelope) => parseCartActionResult(envelope.data));
    });
  },

  /**
   * `POST v2/orders/checkout` → the priced cart. Live status: **verified** (a CALCULATION call —
   * it does not place an order).
   *
   * Serialised through `checkoutLane`: a selection change that arrives while a calculation is in
   * flight waits for it, and if TanStack cancelled it meanwhile (`signal.aborted`) the stale call
   * is dropped instead of sent, so only the latest selection reaches the server.
   */
  checkout(selection: CheckoutSelection, signal?: AbortSignal): Promise<Result<CheckoutCalc>> {
    return checkoutLane(async () => {
      if (signal?.aborted) return fail(ABORTED);

      if (selection.cartId === null) {
        return fail(new Failure('parse', 'checkout called without a cart id'));
      }
      if (selection.latitude === null || selection.longitude === null) {
        // The server requires the point; without it the call is a guaranteed 422.
        return fail(new Failure('parse', 'checkout called without a delivery point'));
      }

      const body: CheckoutRequestBody = {
        cart_id: selection.cartId,
        delivery: {
          latitude: selection.latitude,
          longitude: selection.longitude,
          // Omitted when unknown: the server then answers 200 with `address_incomplete`.
          ...(selection.addressId !== null ? { address_id: selection.addressId } : {}),
        },
        payment_method: selection.paymentMethod,
        use_bonus: selection.useBonus,
        ...(selection.paymentMethod === 'card' && selection.paymentCardId !== null
          ? { payment_card_id: selection.paymentCardId }
          : {}),
        ...(selection.promoCode ? { promo_code: selection.promoCode } : {}),
        ...(selection.courierTip !== null && selection.courierTip > 0
          ? { courier_tip: selection.courierTip }
          : {}),
      };

      const r = await cartRemote.checkout(body, signal);
      return mapResult(r, (envelope) => parseCheckoutCalc(envelope.data));
    });
  },

  /**
   * `GET v1/stores/search?lat&lng` → the per-store delivery estimate. Live status: **verified**
   * (lat + lng required). A row without `delivery_fee` is out of zone.
   */
  async deliveryEstimates(
    point: { lat: number; lng: number },
    signal?: AbortSignal,
  ): Promise<Result<StoreDeliveryEstimate[]>> {
    const r = await cartRemote.deliveryEstimates(point, signal);
    return mapResult(r, (envelope) => parseDeliveryEstimates(envelope.data));
  },

  /** `GET v1/promo-code` → the customer's codes. Live status: **verified, empty on live**. */
  async promoCodes(signal?: AbortSignal): Promise<Result<PromoCodeList>> {
    const r = await cartRemote.promoCodes(signal);
    return mapResult(r, (envelope) => parsePromoCodeList(envelope.data));
  },

  /**
   * `POST v1/promo-code/apply` — **UNVERIFIED**: the body (`code`) is a guess, no cart context is
   * documented and removal is unknown.
   *
   * Nothing in the UI calls this. The sheet stores the code and hands it to `orders/checkout` as
   * `promo_code`, which is the verified path; this function exists so that, if the apply call is
   * ever confirmed, wiring it is a one-line change here. A 2xx that does not echo the code back is
   * **not** treated as success.
   */
  async applyPromoCode(code: string): Promise<Result<PromoApplyResult>> {
    const r = await cartRemote.applyPromoCode(code);
    return mapResult(r, (envelope) => parsePromoApplyResult(envelope.data, code));
  },

  /*
   * Addresses are deliberately absent: `GET v1/profile/address` and the "which address do we
   * deliver to" rule belong to `@/modules/address` (agent M9), and the cart consumes them through
   * `useSelectedAddress()` — see `hooks/use-delivery-address.ts`.
   */
} as const;
