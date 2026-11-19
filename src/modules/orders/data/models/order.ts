/**
 * An order row in `GET v2/orders`.
 *
 * **The row shape has NEVER been observed** (api/orders.md: paging is verified, the rows are not —
 * the test account has no orders). So: every field is optional, every key has the alternates the
 * Flutter parser reads, and a row without an id is dropped by the repository rather than rendered
 * half-empty.
 */
import { asList, asObj, dateIso, int, money, nullableNum, nullableStr, str } from '@/core/network';
import { parseOrderStatus, type OrderStatus } from './order-status';

export interface OrderSummary {
  /** Never 0 — rows without an id are dropped before they reach the UI. */
  id: number;
  status: OrderStatus;
  /** The raw server status, kept for diagnostics only (never rendered). */
  statusRaw: string;
  storeId: number | null;
  storeName: string | null;
  imageUrl: string | null;
  /** Item thumbnails, when the row carries any. */
  thumbnails: string[];
  /** What the customer paid / will pay, as the server sent it. `null` when it sent nothing. */
  amount: number | null;
  itemCount: number | null;
  deliveryAddress: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  etaMinutes: number | null;
  /** ISO instant, or null. */
  createdAt: string | null;
  deliveredAt: string | null;
  cancelingReason: string | null;
  /** 1..5 when the order was already rated, else null. */
  rating: number | null;
  bonusEarned: number | null;
  courierName: string | null;
  courierPhone: string | null;
}

const firstString = (o: Record<string, unknown>, keys: readonly string[]): string | null => {
  for (const key of keys) {
    const value = nullableStr(o[key]);
    if (value) return value;
  }
  return null;
};

const firstNumber = (o: Record<string, unknown>, keys: readonly string[]): number | null => {
  for (const key of keys) {
    if (o[key] === undefined || o[key] === null || o[key] === '') continue;
    const value = nullableNum(o[key]);
    if (value !== null) return money(value);
  }
  return null;
};

const firstInt = (o: Record<string, unknown>, keys: readonly string[]): number | null => {
  for (const key of keys) {
    if (o[key] === undefined || o[key] === null || o[key] === '') continue;
    const value = nullableNum(o[key]);
    if (value !== null) return int(value);
  }
  return null;
};

const firstDate = (o: Record<string, unknown>, keys: readonly string[]): string | null => {
  for (const key of keys) {
    const value = dateIso(o[key]);
    if (value) return value;
  }
  return null;
};

/** Collect up to `max` image urls from `items|order_items|products` (any of the usual image keys). */
export function collectThumbnails(raw: unknown, max = 8): string[] {
  const out: string[] = [];
  for (const entry of asList(raw)) {
    const o = asObj(entry);
    const url =
      firstString(o, ['image_url', 'image', 'thumbnail', 'photo', 'picture']) ??
      firstString(asObj(o.product), ['image_url', 'image', 'thumbnail']);
    if (url) out.push(url);
    if (out.length >= max) break;
  }
  return out;
}

export function parseOrderSummary(raw: unknown): OrderSummary {
  const o = asObj(raw);
  const delivery = asObj(o.delivery_details);
  const payment = asObj(o.payment_details);
  const price = asObj(o.price_details);
  const courier = asObj(o.courier_tracking ?? o.courier);
  const items = o.items ?? o.order_items ?? o.products;

  const statusRaw = str(o.order_status ?? o.status);

  return {
    id: int(o.order_id ?? o.id),
    status: parseOrderStatus(statusRaw),
    statusRaw,
    storeId: firstInt(o, ['store_id']),
    storeName: firstString(o, ['store_name', 'name']) ?? firstString(asObj(o.store), ['name']),
    imageUrl: firstString(o, ['image_url', 'image', 'logo_url']),
    thumbnails: collectThumbnails(items),
    amount:
      firstNumber(o, ['payable_amount', 'total_amount', 'total_price']) ??
      firstNumber(price, ['payable_amount', 'total_amount', 'total_price']),
    itemCount: firstInt(o, ['items_count', 'item_count', 'products_count', 'total_items']),
    deliveryAddress:
      firstString(o, ['delivery_address']) ??
      firstString(delivery, ['delivery_address', 'actual_address', 'legal_address']),
    paymentMethod:
      firstString(o, ['payment_method']) ??
      firstString(payment, ['payment_method', 'last_payment_method']),
    paymentStatus: firstString(o, ['payment_status']) ?? firstString(payment, ['payment_status']),
    etaMinutes: firstInt(o, ['eta_minutes', 'total_eta']),
    createdAt: firstDate(o, ['created_at', 'createdAt', 'order_date']),
    deliveredAt: firstDate(o, ['delivered_at']),
    cancelingReason: firstString(o, ['canceling_reason', 'cancel_reason']),
    rating: firstInt(o, ['order_rating', 'rating']),
    bonusEarned: firstNumber(o, ['total_bonus_earned', 'earned_bonus', 'bonus_earned']),
    courierName: firstString(courier, ['courier_name', 'name', 'full_name']),
    courierPhone: firstString(courier, ['courier_phone', 'phone_number', 'phone']),
  };
}

/** A row we refuse to render: no id means no detail link and no dedupe key. */
export const isRenderableOrder = (o: OrderSummary): boolean => o.id > 0;
