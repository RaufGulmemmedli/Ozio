/**
 * Order status — `order_status` / `status` on every orders payload.
 *
 * **The status strings are UNVERIFIED** (api/orders.md: the test account has no orders, so no real
 * value has ever been observed; the list below comes from the APK). Everything unrecognised becomes
 * `unknown`, which the tracking screen renders as "in progress" — that fallback is load-bearing, so
 * never widen the matcher into guessing.
 */
import { str } from '@/core/network';
import type { BadgeTone } from '@/shared/ui';

export type OrderStatus =
  | 'waiting'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'pickedUp'
  | 'delivered'
  | 'cancelled'
  | 'notFound'
  | 'unknown';

const BY_WIRE: Record<string, OrderStatus> = {
  order_waiting: 'waiting',
  order_accepted: 'accepted',
  order_preparing: 'preparing',
  order_ready: 'ready',
  order_picked_up: 'pickedUp',
  order_delivered: 'delivered',
  order_cancelled: 'cancelled',
  order_not_found: 'notFound',
};

/** Tolerant reader: exact wire value first, then the bare word (`"delivered"`, `"PICKED_UP"`). */
export function parseOrderStatus(raw: unknown): OrderStatus {
  const value = str(raw).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!value) return 'unknown';
  const direct = BY_WIRE[value];
  if (direct) return direct;
  const bare = BY_WIRE[`order_${value}`];
  if (bare) return bare;
  return 'unknown';
}

/** In-flight. Everything else (delivered, cancelled, not found, unknown) is "past". */
export const ACTIVE_STATUSES: readonly OrderStatus[] = [
  'waiting',
  'accepted',
  'preparing',
  'ready',
  'pickedUp',
];

export const isActiveStatus = (s: OrderStatus): boolean => ACTIVE_STATUSES.includes(s);

/** Delivered, cancelled or gone — nothing left to poll for. */
export const isTerminalStatus = (s: OrderStatus): boolean =>
  s === 'delivered' || s === 'cancelled' || s === 'notFound';

/**
 * Lit segments (0..4) of the 4-step strip Qəbul / Hazırlanır / Yoldadır / Çatdırıldı.
 * `unknown` → 1, i.e. "in progress": the order exists, so at least the first step is done.
 */
export function statusStep(s: OrderStatus): number {
  switch (s) {
    case 'waiting':
      return 0;
    case 'accepted':
      return 1;
    case 'preparing':
    case 'ready':
      return 2;
    case 'pickedUp':
      return 3;
    case 'delivered':
      return 4;
    case 'cancelled':
    case 'notFound':
      return 0;
    case 'unknown':
      return 1;
  }
}

/** Total steps in the strip / stepper. */
export const ORDER_STEP_COUNT = 4;

/** `orders.statusBadge.<key>` in `messages/parts/orders.json`. */
export const statusLabelKey = (s: OrderStatus): string => `status.${s}`;

/** Badge tone per the build brief: active → success, on the way → sky, cancelled → neutral. */
export function statusTone(s: OrderStatus): BadgeTone {
  switch (s) {
    case 'waiting':
      return 'yellow';
    case 'accepted':
    case 'delivered':
      return 'success';
    case 'preparing':
    case 'ready':
    case 'pickedUp':
      return 'sky';
    default:
      return 'neutral';
  }
}

/**
 * What a server `payment_status` string says about the money. The real values were never captured,
 * so the match is by substring and anything unrecognised stays `pending` — never assume paid.
 */
export type MoneyState = 'paid' | 'failed' | 'pending';

const PAID = ['paid', 'success', 'succeed', 'complete', 'approved', 'captured'];
const FAILED = ['fail', 'declin', 'reject', 'cancel', 'error', 'expire', 'refus', 'denied'];

export function moneyState(raw: unknown): MoneyState {
  const value = str(raw).trim().toLowerCase();
  if (!value) return 'pending';
  // "unpaid" contains "paid", so failure and the explicit negatives are checked first.
  if (FAILED.some((needle) => value.includes(needle))) return 'failed';
  if (value.includes('unpaid') || value.includes('not_paid')) return 'pending';
  if (PAID.some((needle) => value.includes(needle))) return 'paid';
  return 'pending';
}
