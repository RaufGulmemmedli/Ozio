/**
 * The only layer the hooks import. Maps envelopes → domain models, and owns the behaviour the
 * unverified API forces on us:
 *
 *  **An ambiguous placement is resolved, never assumed.** A 2xx without an order id proves nothing,
 *  and neither does a network/5xx failure — the order may exist. Both cases re-read `GET v2/orders`
 *  and diff against the pre-submit id snapshot (Flutter `_resolveUnknown`).
 *
 * `POST v2/orders/checkout` (the pricing call) is **not** here: the cart module owns it, along with
 * its debounce, its one-lane 429 queue and its `expires_at` refresh. This module only sends the
 * calc's `id` back with the order.
 *
 * Parsers never throw; this file turns every problem into a `Failure`.
 */
import {
  Failure,
  asObj,
  fail,
  int,
  mapResult,
  nullableStr,
  ok,
  str,
  type ApiEnvelope,
  type Page,
  type Result,
} from '@/core/network';
import { ordersRemote, paymentRemote, type OrdersPageQuery } from './orders.remote';
import {
  isRenderableOrder,
  parseOrderSummary,
  type OrderSummary,
} from './models/order';
import { parseOrderDetail, type OrderDetail } from './models/order-detail';
import { parseSavedCards, type SavedCard } from './models/payment-card';
import type { PlaceOrderInput, PlaceOrderResult } from './models/place-order';
import {
  isActiveStatus,
  isTerminalStatus,
  statusStep,
  type OrderStatus,
} from './models/order-status';

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Row keys the live API uses (`orders`) plus every legacy key the Flutter parser still merges.
 * Split active/past by **status**, never by which key a row arrived under.
 */
const ROW_KEYS = ['orders', 'active', 'past_delivered', 'past', 'history', 'data', 'items'] as const;

function readRows(data: unknown): { rows: unknown[]; holder: Record<string, unknown> } {
  if (Array.isArray(data)) return { rows: data, holder: {} };
  const o = asObj(data);
  const rows: unknown[] = [];
  for (const key of ROW_KEYS) {
    if (Array.isArray(o[key])) rows.push(...(o[key] as unknown[]));
  }
  if (rows.length === 0) {
    // One level of nesting (`data: { data: [...] }`).
    const nested = asObj(o.data);
    for (const key of ROW_KEYS) {
      if (Array.isArray(nested[key])) rows.push(...(nested[key] as unknown[]));
    }
    if (rows.length > 0) return { rows, holder: nested };
  }
  return { rows, holder: o };
}

function toOrdersPage(data: unknown, q: OrdersPageQuery): Page<OrderSummary> {
  const { rows, holder } = readRows(data);

  const seen = new Set<number>();
  const items: OrderSummary[] = [];
  for (const raw of rows) {
    const order = parseOrderSummary(raw);
    // Drop rows without an id, and dedupe (legacy keys can repeat the same order).
    if (!isRenderableOrder(order) || seen.has(order.id)) continue;
    seen.add(order.id);
    items.push(order);
  }

  const rawTotal = holder.total ?? holder.count ?? holder.total_count;
  const total =
    rawTotal === undefined || rawTotal === null ? q.offset + items.length : int(rawTotal, q.offset + items.length);

  return {
    items,
    total,
    offset: holder.offset === undefined ? q.offset : int(holder.offset, q.offset),
    limit: holder.limit === undefined ? q.limit : int(holder.limit, q.limit),
  };
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

const envelopeData = <T>(env: ApiEnvelope<T>): unknown => env.data;

export const ordersRepository = {
  /** `GET v2/orders?offset&limit` — verified paging, defensively parsed rows. */
  async list(q: OrdersPageQuery, signal?: AbortSignal): Promise<Result<Page<OrderSummary>>> {
    const res = await ordersRemote.list(q, { signal });
    return mapResult(res, (env) => toOrdersPage(envelopeData(env), q));
  },

  /**
   * `GET v2/orders/{id}`. A detail whose order id cannot be found is a parse failure: without an id
   * it can be neither tracked nor rated, and rendering half a page is worse than an error state.
   */
  async detail(id: number | string, signal?: AbortSignal): Promise<Result<OrderDetail>> {
    const res = await ordersRemote.detail(id, { signal });
    if (!res.ok) return res;
    const detail = parseOrderDetail(envelopeData(res.value));
    if (!detail) {
      return fail(new Failure('parse', 'Order detail carried no order id', res.value.statusCode));
    }
    return ok(detail);
  },

  /**
   * The id snapshot taken immediately before placing an order, so an ambiguous outcome can be
   * resolved. One page of the newest orders is enough (the list is newest-first).
   */
  async snapshotOrderIds(limit = 20): Promise<ReadonlySet<number>> {
    const res = await ordersRepository.list({ offset: 0, limit });
    if (!res.ok) return new Set<number>();
    return new Set(res.value.items.map((o) => o.id));
  },

  /**
   * `POST v2/orders` — **unverified**. Never claims success on a 2xx that carries no order id.
   *
   * Outcome:
   *  - `placed`   — an order id came back (from the response, or recovered from the list diff).
   *  - `unknown`  — the call neither proved success nor proved failure and the recovery read found
   *                 no new order: the UI must say so and send the user to `/orders`.
   *  - `rejected` — the server explicitly refused (envelope failure / 4xx) **and** the recovery read
   *                 found no new order.
   */
  async place(
    input: PlaceOrderInput,
    snapshot: ReadonlySet<number>,
  ): Promise<Result<PlaceOrderResult>> {
    const res = await ordersRemote.create(input);

    if (res.ok) {
      const data = asObj(envelopeData(res.value));
      const orderId = int(data.order_id ?? data.id ?? data.orderId);
      const redirectUrl = nullableStr(data.redirect_url ?? data.custom_url);
      const paymentStatus = nullableStr(data.payment_status);
      const orderStatus = nullableStr(data.order_status ?? data.status);

      if (orderId > 0) {
        return ok({
          kind: 'placed',
          orderId,
          redirectUrl,
          paymentStatus,
          orderStatus,
          recovered: false,
        });
      }

      // 2xx without an id: prove it one way or the other.
      const recovered = await resolveUnknown(snapshot);
      if (recovered !== null) {
        return ok({
          kind: 'placed',
          orderId: recovered,
          redirectUrl,
          paymentStatus,
          orderStatus,
          recovered: true,
        });
      }
      return ok({
        kind: 'unknown',
        orderId: null,
        redirectUrl,
        paymentStatus,
        orderStatus,
        recovered: false,
      });
    }

    // The POST failed. A rejection with a server message is a real refusal; a network/timeout/5xx
    // failure may still have created the order, so both are checked against the snapshot.
    const recovered = await resolveUnknown(snapshot);
    if (recovered !== null) {
      return ok({
        kind: 'placed',
        orderId: recovered,
        redirectUrl: null,
        paymentStatus: null,
        orderStatus: null,
        recovered: true,
      });
    }

    const kind = res.failure.kind;
    const ambiguous = kind === 'network' || kind === 'timeout' || kind === 'server' || kind === 'rateLimited';
    if (ambiguous) {
      return ok({
        kind: 'unknown',
        orderId: null,
        redirectUrl: null,
        paymentStatus: null,
        orderStatus: null,
        recovered: false,
      });
    }
    return res;
  },

  /** `POST v2/orders/{id}/rate` — unverified; only non-empty fields are sent. */
  async rate(args: {
    id: number | string;
    orderRating?: number | null;
    courierRating?: number | null;
    comment?: string | null;
  }): Promise<Result<true>> {
    const body: Record<string, unknown> = {};
    if (args.orderRating) body.order_rating = args.orderRating;
    if (args.courierRating) body.courier_rating = args.courierRating;
    const comment = args.comment?.trim();
    if (comment) body.comment = comment;

    if (Object.keys(body).length === 0) {
      return fail(new Failure('unknown', 'Nothing to send'));
    }
    const res = await ordersRemote.rate(args.id, body);
    return mapResult(res, () => true as const);
  },

  /** `GET v1/profile/me/cards` — verified endpoint, unobserved row shape. */
  async cards(signal?: AbortSignal): Promise<Result<SavedCard[]>> {
    const res = await paymentRemote.cards({ signal });
    return mapResult(res, (env) => parseSavedCards(envelopeData(env)));
  },

  /**
   * `POST v1/payment/save-card` → the bank's card-binding page. Returns the url to open.
   * A 2xx without a url is a failure: there is nothing to send the user to.
   */
  async startSaveCard(): Promise<Result<string>> {
    const res = await paymentRemote.saveCard();
    if (!res.ok) return res;
    const data = asObj(envelopeData(res.value));
    const url = str(data.redirect_url ?? data.custom_url).trim();
    if (!url) {
      return fail(new Failure('parse', 'save-card returned no redirect url', res.value.statusCode));
    }
    return ok(url);
  },

  /** `DELETE v1/profile/me/cards/{id}` — unverified. */
  async deleteCard(id: number): Promise<Result<true>> {
    const res = await paymentRemote.deleteCard(id);
    return mapResult(res, () => true as const);
  },
} as const;

/** Re-read the list and return the id of an order that was not there before placing. */
async function resolveUnknown(snapshot: ReadonlySet<number>): Promise<number | null> {
  const res = await ordersRepository.list({ offset: 0, limit: 20 });
  if (!res.ok) return null;
  for (const order of res.value.items) {
    if (!snapshot.has(order.id)) return order.id;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Status → view models (the status strings are unverified, so this is one place)  */
/* -------------------------------------------------------------------------- */

export interface OrderStepView {
  /** `accepted | preparing | onTheWay | delivered` — the i18n key suffix. */
  key: 'accepted' | 'preparing' | 'onTheWay' | 'delivered';
  state: 'done' | 'current' | 'todo';
  /** ISO instant from `status_history`, when the server sent one for this step. */
  at: string | null;
  /** `true` on the last reached step, for `aria-current="step"`. */
  current: boolean;
}

const STEP_KEYS: ReadonlyArray<OrderStepView['key']> = [
  'accepted',
  'preparing',
  'onTheWay',
  'delivered',
];

/** The status each step is reached by, used to pull its timestamp out of the history. */
const STEP_STATUS: Record<OrderStepView['key'], readonly OrderStatus[]> = {
  accepted: ['accepted', 'waiting'],
  preparing: ['preparing', 'ready'],
  onTheWay: ['pickedUp'],
  delivered: ['delivered'],
};

/**
 * The 4-step strip / vertical stepper. Unknown statuses fall back to "in progress" (step 1) through
 * `statusStep()`, so an unexpected server string never renders as "nothing happened yet".
 */
export function orderSteps(
  status: OrderStatus,
  history: ReadonlyArray<{ status: OrderStatus; at: string | null }> = [],
): OrderStepView[] {
  const reached = statusStep(status);
  const timeFor = (key: OrderStepView['key']): string | null => {
    const wanted = STEP_STATUS[key];
    for (const event of history) {
      if (wanted.includes(event.status) && event.at) return event.at;
    }
    return null;
  };

  // A delivered order has no "current" step — the strip is simply full.
  const finished = status === 'delivered';

  return STEP_KEYS.map((key, index) => {
    const position = index + 1;
    const state: OrderStepView['state'] =
      position < reached || (position === reached && finished)
        ? 'done'
        : position === reached
          ? 'current'
          : 'todo';
    return { key, state, at: timeFor(key), current: position === reached && !finished };
  });
}

/** Convenience re-exports so views never reach past the repository for status logic. */
export { isActiveStatus, isTerminalStatus, statusStep };
