/**
 * Digital receipt (N5) — the **only** real-API screen in this module.
 *
 * It is built from the order detail the orders module already fetches and parsed
 * (`GET /customer/api/v2/orders/{id}`, `useOrder` → `OrderDetail`), so there is exactly one request
 * and one tolerant parser for that endpoint in the app. `api/rewards.md` lists the receipt's own
 * alias table; every one of those keys is already covered by `orders/data/models/order-detail.ts`,
 * which is why this file maps instead of re-parsing.
 *
 * The order-detail success shape is `live: 'unverified'` — an APK guess — so every field here is
 * optional at the source and defaults to 0 / '' rather than being trusted. Nothing throws, and a
 * detail with no lines and no payable renders the view's "no receipt" state.
 */
import type { OrderDetail } from '@/modules/orders';

export interface ReceiptLine {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Receipt {
  orderId: string;
  storeName: string;
  deliveryAddress: string;
  paymentMethod: string;
  createdAt: string | null;
  lines: ReceiptLine[];
  itemsTotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  payable: number;
  bonusEarned: number;
}

/** 0 for a missing number, so a half-filled detail still prints. */
const amount = (v: number | null | undefined): number => (typeof v === 'number' ? v : 0);

/**
 * `OrderDetail` → `Receipt`.
 *
 * `payable` falls back to the items total when the server sent none (`OrderTotals.payable` is
 * deliberately `null` rather than a client-side sum), and the payment method is the server's own
 * wording plus the masked card when it sent one ("Kart •••• 4417").
 */
export function receiptFromOrder(detail: OrderDetail): Receipt {
  const lines: ReceiptLine[] = detail.items.map((item) => {
    const quantity = item.quantity !== null && item.quantity > 0 ? item.quantity : 1;
    const total = amount(item.lineTotal);
    return {
      name: item.name,
      quantity,
      // Display only — the server sends the line total, so this is the per-unit view of it.
      unitPrice: Math.round((total / quantity) * 100) / 100,
      total,
    };
  });

  const method = [detail.payment.method, detail.payment.maskedCardNumber]
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    .join(' ');

  const itemsTotal = amount(detail.totals.itemsTotal);

  return {
    orderId: detail.id > 0 ? String(detail.id) : '',
    storeName: detail.storeName ?? '',
    deliveryAddress: detail.delivery.address ?? '',
    paymentMethod: method,
    createdAt: detail.createdAt,
    lines,
    itemsTotal,
    deliveryFee: amount(detail.totals.deliveryFee),
    serviceFee: amount(detail.totals.serviceFee),
    discount: amount(detail.totals.discount),
    payable: detail.totals.payable ?? itemsTotal,
    bonusEarned: amount(detail.totals.bonusEarned),
  };
}

/** With no lines **and** no breakdown there is nothing to print — the view shows its empty state. */
export const receiptIsEmpty = (r: Receipt): boolean =>
  r.lines.length === 0 && r.payable === 0 && r.itemsTotal === 0;
