/**
 * `GET v2/orders/{id}` — **success shape UNVERIFIED** (api/orders.md: item keys, status strings and
 * courier fields are all APK guesses; only the 404 `{message:"Order not found"}` is verified).
 *
 * The sub-blocks may sit at the top level, under `order`, or under their own keys, so everything is
 * read through `pick`-style fallbacks and nothing throws. A detail whose order id cannot be found is
 * a parse failure (the repository turns that into `Failure('parse')`), because an id-less detail
 * cannot be tracked, rated or linked.
 */
import { asList, asObj, bool, dateIso, int, money, nullableNum, nullableStr, str } from '@/core/network';
import { parseOrderStatus, type OrderStatus } from './order-status';
import { collectThumbnails } from './order';

export interface OrderItem {
  id: number | null;
  name: string;
  /** "1 kq · Qırmızı" — the variant line under the name. */
  variant: string | null;
  imageUrl: string | null;
  /**
   * Ordered quantity **in the product unit** — 1 = 1 kg for weight products, 1 = 1 piece otherwise
   * (api/README.md: cart/order quantity is already in the product unit, only the catalog is grams).
   */
  quantity: number | null;
  /** `true` when the unit is weight, so the UI renders "1,5 kq" instead of "2 ədəd". */
  isWeight: boolean;
  /** Line total as the server sent it. Never computed here. */
  lineTotal: number | null;
  /** The store swapped the product for an alternative. */
  replaced: boolean;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  /** ISO instant, or null when the server sent no timestamp for this step. */
  at: string | null;
  note: string | null;
}

export interface OrderTotals {
  itemsTotal: number | null;
  itemsMrp: number | null;
  discount: number | null;
  deliveryFee: number | null;
  serviceFee: number | null;
  packetFee: number | null;
  minimumOrderFee: number | null;
  tip: number | null;
  bonusPayment: number | null;
  /** What the customer pays. `null` when the server sent none — never fall back to a sum. */
  payable: number | null;
  bonusEarned: number | null;
}

export interface OrderCourier {
  name: string | null;
  phone: string | null;
  rating: number | null;
  /** Metres to the delivery point, when the server sends it. Drives the map text alternative. */
  distanceMeters: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface OrderPayment {
  method: string | null;
  status: string | null;
  maskedCardNumber: string | null;
  cardBrand: string | null;
  /** Server-supplied decline text, when any. */
  failureReason: string | null;
}

export interface OrderDelivery {
  address: string | null;
  personName: string | null;
  phone: string | null;
  /** ISO instant of the promised/actual delivery, when sent. */
  time: string | null;
  timeMinMinutes: number | null;
  timeMaxMinutes: number | null;
  isFree: boolean;
  outOfZone: boolean;
}

export interface OrderDetail {
  id: number;
  status: OrderStatus;
  statusRaw: string;
  storeId: number | null;
  storeName: string | null;
  createdAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelingReason: string | null;
  etaMinutes: number | null;
  items: OrderItem[];
  /** Item thumbnails for the compact strips (success page, tracking, rating recap). */
  thumbnails: string[];
  history: OrderStatusEvent[];
  totals: OrderTotals;
  payment: OrderPayment;
  delivery: OrderDelivery;
  courier: OrderCourier;
  /** 1..5 when already rated — used to pre-fill and to warn about re-rating. */
  rating: number | null;
  courierRating: number | null;
}

/* -------------------------------------------------------------------------- */

const pick = (
  sources: readonly Record<string, unknown>[],
  keys: readonly string[],
): unknown => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
  }
  return undefined;
};

const pickStr = (s: readonly Record<string, unknown>[], k: readonly string[]): string | null =>
  nullableStr(pick(s, k));

const pickMoney = (s: readonly Record<string, unknown>[], k: readonly string[]): number | null => {
  const value = nullableNum(pick(s, k));
  return value === null ? null : money(value);
};

const pickInt = (s: readonly Record<string, unknown>[], k: readonly string[]): number | null => {
  const value = nullableNum(pick(s, k));
  return value === null ? null : int(value);
};

const pickDate = (s: readonly Record<string, unknown>[], k: readonly string[]): string | null =>
  dateIso(pick(s, k));

const WEIGHT_UNITS = ['kg', 'kq', 'gram', 'qram', 'g', 'weight', 'çəki'];

function parseItem(raw: unknown): OrderItem {
  const o = asObj(raw);
  const product = asObj(o.product ?? o.variant ?? o.product_variant);
  const sources = [o, product];
  const unit = str(pick(sources, ['unit', 'unit_type', 'measure', 'sale_unit'])).toLowerCase();
  const isWeight =
    WEIGHT_UNITS.some((u) => unit === u || unit.includes(u)) ||
    bool(pick(sources, ['is_weight', 'is_weighted', 'by_weight']), false);

  return {
    id: pickInt(sources, ['id', 'item_id', 'order_item_id', 'product_id', 'variant_id']),
    name: pickStr(sources, ['name', 'product_name', 'title']) ?? '',
    variant: pickStr(sources, ['variant_name', 'description', 'sub_title', 'weight_text', 'size']),
    imageUrl: pickStr(sources, ['image_url', 'image', 'thumbnail', 'photo', 'picture']),
    quantity: (() => {
      const value = nullableNum(pick(sources, ['quantity', 'qty', 'count', 'amount_quantity']));
      return value === null ? null : Math.round(value * 1000) / 1000;
    })(),
    isWeight,
    lineTotal: pickMoney(sources, ['total_price', 'line_total', 'new_price', 'price', 'amount']),
    replaced: bool(pick(sources, ['is_replaced', 'replaced', 'is_substituted']), false),
  };
}

function parseHistory(raw: unknown, order: Record<string, unknown>): OrderStatusEvent[] {
  const rows = asList(raw).map(asObj);
  if (rows.length > 0) {
    return rows
      .map((row) => {
        const statusRaw = str(row.order_status ?? row.status);
        return {
          status: parseOrderStatus(statusRaw),
          at:
            dateIso(
              row.created_at ??
                row.accepted_at ??
                row.picked_up_at ??
                row.delivered_at ??
                row.cancelled_at ??
                row.updated_at,
            ) ?? null,
          note: nullableStr(row.note ?? row.comment ?? row.canceling_reason),
        };
      })
      .filter((event) => event.status !== 'unknown' || event.at !== null);
  }

  // No history array: rebuild the timeline from the per-step timestamps on the order itself.
  const steps: ReadonlyArray<[OrderStatus, string]> = [
    ['accepted', 'accepted_at'],
    ['preparing', 'preparing_at'],
    ['ready', 'ready_at'],
    ['pickedUp', 'picked_up_at'],
    ['delivered', 'delivered_at'],
    ['cancelled', 'cancelled_at'],
  ];
  const out: OrderStatusEvent[] = [];
  const created = dateIso(order.created_at);
  if (created) out.push({ status: 'waiting', at: created, note: null });
  for (const [status, key] of steps) {
    const at = dateIso(order[key]);
    if (at) out.push({ status, at, note: null });
  }
  return out;
}

/** Parses the envelope's `data`. Returns `null` when no order id can be found (= parse failure). */
export function parseOrderDetail(raw: unknown): OrderDetail | null {
  const root = asObj(raw);
  const order = asObj(root.order ?? root);
  const price = asObj(root.price_details ?? order.price_details);
  const payment = asObj(root.payment_details ?? order.payment_details);
  const delivery = asObj(root.delivery_details ?? order.delivery_details);
  const courier = asObj(root.courier_tracking ?? order.courier_tracking ?? root.courier ?? order.courier);
  const breakdown = asObj(root.breakdown ?? order.breakdown);

  const id = int(pick([order, root], ['order_id', 'id']));
  if (id <= 0) return null;

  const statusRaw = str(pick([order, root], ['order_status', 'status']));
  const itemsRaw = pick([root, order], ['items', 'order_items', 'products']);
  const items = asList(itemsRaw).map(parseItem);

  return {
    id,
    status: parseOrderStatus(statusRaw),
    statusRaw,
    storeId: pickInt([order, root], ['store_id']),
    storeName:
      pickStr([order, root], ['store_name', 'name']) ?? pickStr([asObj(order.store)], ['name']),
    createdAt: pickDate([order, root], ['created_at', 'createdAt']),
    deliveredAt: pickDate([order, root], ['delivered_at']),
    cancelledAt: pickDate([order, root], ['cancelled_at', 'canceled_at']),
    cancelingReason: pickStr([order, root], ['canceling_reason', 'cancel_reason']),
    etaMinutes: pickInt([order, root, delivery], ['eta_minutes', 'total_eta']),
    items,
    thumbnails: collectThumbnails(itemsRaw),
    history: parseHistory(pick([root, order], ['status_history', 'history']), order),
    totals: {
      itemsTotal: pickMoney([breakdown, price, order], ['item_total_price', 'items_total_price']),
      itemsMrp: pickMoney([breakdown, price], ['item_total_mrp', 'total_mrp']),
      discount: pickMoney([breakdown, price, order], ['total_discount', 'discount_value']),
      deliveryFee: pickMoney(
        [breakdown, price, delivery, order],
        ['delivery_fee', 'delivery_charge'],
      ),
      serviceFee: pickMoney([breakdown, price, order], ['service_fee']),
      packetFee: pickMoney([breakdown, price, order], ['packet_fee']),
      minimumOrderFee: pickMoney([breakdown, price], ['minimum_order_fee', 'small_order_fee']),
      tip: pickMoney([breakdown, price, order], ['courier_tip', 'tip_amount', 'tip']),
      bonusPayment: pickMoney([breakdown, price, payment, order], ['bonus_payment', 'bonus_spent']),
      payable: pickMoney([price, order, root], ['payable_amount', 'amount', 'total_amount', 'total_price']),
      bonusEarned: pickMoney(
        [order, root, price],
        ['total_bonus_earned', 'earned_bonus', 'bonus_earned'],
      ),
    },
    payment: {
      method: pickStr([payment, order], ['payment_method', 'last_payment_method']),
      status: pickStr([payment, order], ['payment_status']),
      maskedCardNumber: pickStr([payment], ['masked_card_number', 'card_number', 'pan']),
      cardBrand: pickStr([payment], ['card_brand', 'brand', 'card_type']),
      failureReason: pickStr(
        [payment, order],
        ['failure_reason', 'error_message', 'payment_message', 'bank_message'],
      ),
    },
    delivery: {
      address: pickStr(
        [delivery, order],
        ['delivery_address', 'actual_address', 'legal_address', 'address'],
      ),
      personName: pickStr([delivery], ['person_name', 'receiver_name']),
      phone: pickStr([delivery], ['phone_number', 'phone']),
      time: pickDate([delivery, order], ['delivery_time', 'delivered_at']),
      timeMinMinutes: pickInt([delivery, order], ['delivery_time_min']),
      timeMaxMinutes: pickInt([delivery, order], ['delivery_time_max']),
      isFree: bool(pick([delivery], ['is_delivery_free', 'is_free']), false),
      outOfZone: bool(pick([delivery], ['out_of_zone']), false),
    },
    courier: {
      name: pickStr([courier], ['courier_name', 'name', 'full_name']),
      phone: pickStr([courier], ['courier_phone', 'phone_number', 'phone']),
      rating: (() => {
        const value = nullableNum(pick([courier], ['rating', 'courier_rating', 'score']));
        return value === null ? null : Math.round(value * 10) / 10;
      })(),
      distanceMeters: pickInt([courier, delivery], ['distance_meters', 'distance', 'remaining_distance']),
      latitude: nullableNum(pick([courier], ['latitude', 'lat'])),
      longitude: nullableNum(pick([courier], ['longitude', 'lng', 'long'])),
    },
    rating: pickInt([order, root], ['order_rating', 'rating']),
    courierRating: pickInt([order, root, courier], ['courier_rating']),
  };
}

/** Distinct item kinds × total pieces, for "5 çeşid · 7 ədəd". Display-only arithmetic. */
export function itemCounts(items: readonly OrderItem[]): { kinds: number; pieces: number } {
  let pieces = 0;
  for (const item of items) {
    // Weight lines are not countable pieces; count them as one line each.
    pieces += item.isWeight ? 1 : Math.max(1, Math.round(item.quantity ?? 1));
  }
  return { kinds: items.length, pieces };
}
