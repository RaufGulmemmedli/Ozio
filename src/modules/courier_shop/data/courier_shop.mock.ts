/**
 * MSW handlers for `courier_shop` — the whole "backend" of this module.
 *
 * There is no courier API: the gateway answers plain text `Backend service does not exist`, so
 * every path here lives under `/api/mock/courier_shop/…` via `mockPath()` and nothing ever leaves
 * for the real host. `src/core/mocks/modules.ts` already lists `courier_shop` and lazily imports
 * this file, so nothing in `src/core/mocks/` needs editing.
 *
 * All money is produced **here**, not in a component: `bag/quote` returns the lines, the saving and
 * the total, and a fit session carries a `charge_by_kept` table. Replacing this file with a real
 * service means changing `COURIER_SHOP_BASE` in `courier_shop.remote.ts` and deleting this handler
 * list — the repository above it does not change.
 *
 * Demo state is kept in `createMockDb`, i.e. `localStorage` under `ozio.mock.courier_shop`, so a
 * reload keeps the bag, the doorstep session and the bookings alive.
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockId,
  mockJson,
  mockPath,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

import {
  BAG_DELIVERY_FEE,
  BAG_ITEMS,
  EXPERT_NAME,
  EXPERT_PRODUCTS,
  EXPERT_REF_BASE,
  EXPERT_SERVICES,
  EXPERT_SLOTS,
  FIT_DURATION_SEC,
  FIT_PRODUCT,
  type BagItemWire,
} from './courier_shop.fixtures';

/** `MOCK_LATENCY_MS.courierShop` from `mock-contracts.ts` — long enough to see every skeleton. */
const LATENCY = 700;
const WRITE_LATENCY = 900;

const MODULE = 'courier_shop';

interface SessionState {
  id: string;
  sizes: string[];
  startedAt: string;
  durationSec: number;
}

interface ResultState {
  sessionId: string;
  keptSizes: string[];
  returnedSizes: string[];
  charged: number;
}

interface BookingState {
  ref: string;
  product: string;
  serviceKind: string;
  slotId: string;
}

interface ShopState {
  /** Stock left in the courier's bag; a confirmed purchase takes units out of it. */
  bag: BagItemWire[];
  session: SessionState | null;
  result: ResultState | null;
  bookings: BookingState[];
  /** `?preview=error` has its own path; this is the repository's `failNextCall()` debug hook. */
  failNext: boolean;
}

const db = createMockDb<ShopState>(MODULE, {
  bag: BAG_ITEMS.map((item) => ({ ...item })),
  session: null,
  result: null,
  bookings: [],
  failNext: false,
});

/** Consumes the one-shot failure flag, so `failNextCall()` affects exactly one request. */
function shouldFail(): boolean {
  if (!db.get().failNext) return false;
  db.patch({ failNext: false });
  return true;
}

const round = (n: number): number => Math.round(n * 100) / 100;

/* ----------------------------------------------------------------- bag */

function quoteFor(lines: ReadonlyArray<{ id: string; quantity: number }>) {
  const stock = db.get().bag;
  const resolved = lines
    .map((line) => {
      const item = stock.find((row) => row.id === line.id);
      if (!item) return null;
      const quantity = Math.max(0, Math.min(item.stock, Math.trunc(line.quantity)));
      if (quantity === 0) return null;
      return { item, quantity };
    })
    .filter((v): v is { item: BagItemWire; quantity: number } => v !== null);

  return {
    item_count: resolved.reduce((sum, r) => sum + r.quantity, 0),
    lines: resolved.map((r) => ({
      id: r.item.id,
      quantity: r.quantity,
      amount: round(r.item.price * r.quantity),
    })),
    delivery: BAG_DELIVERY_FEE,
    saving: round(
      resolved.reduce((sum, r) => sum + (r.item.old_price - r.item.price) * r.quantity, 0),
    ),
    total: round(resolved.reduce((sum, r) => sum + r.item.price * r.quantity, 0)),
  };
}

async function readLines(request: Request): Promise<Array<{ id: string; quantity: number }>> {
  try {
    const body = (await request.json()) as unknown;
    const raw = (body as { items?: unknown })?.items;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((row) => {
        const r = row as { id?: unknown; quantity?: unknown };
        return { id: String(r.id ?? ''), quantity: Number(r.quantity ?? 0) || 0 };
      })
      .filter((r) => r.id !== '');
  } catch {
    return [];
  }
}

/* ----------------------------------------------------------------- fit */

const sessionWire = (session: SessionState) => {
  const started = Date.parse(session.startedAt);
  const chargeByKept: Record<string, number> = {};
  for (let kept = 0; kept <= session.sizes.length; kept++) {
    chargeByKept[String(kept)] = round(FIT_PRODUCT.price * kept);
  }
  return {
    id: session.id,
    product: FIT_PRODUCT,
    sizes: session.sizes,
    started_at: session.startedAt,
    expires_at: new Date(started + session.durationSec * 1000).toISOString(),
    duration_sec: session.durationSec,
    charge_by_kept: chargeByKept,
  };
};

/* ----------------------------------------------------------------- expert */

const slotById = (id: string) => EXPERT_SLOTS.find((s) => s.id === id) ?? EXPERT_SLOTS[0];
const productByKind = (kind: string) =>
  EXPERT_PRODUCTS.find((p) => p.kind === kind) ?? EXPERT_PRODUCTS[0];

function bookingWire(booking: BookingState) {
  const services = EXPERT_SERVICES[booking.product] ?? EXPERT_SERVICES.bike!;
  const service = services.find((s) => s.kind === booking.serviceKind) ?? services[0]!;
  return {
    ref: booking.ref,
    product: productByKind(booking.product),
    service,
    slot: slotById(booking.slotId),
    expert_name: EXPERT_NAME,
    certified: true,
    simulated: true,
  };
}

/* ----------------------------------------------------------------- handlers */

export const courierShopHandlers = [
  /** The courier's bag, with the stock still on board. */
  http.get(mockPath(MODULE, 'bag/items'), async () => {
    await delay(LATENCY);
    if (shouldFail()) return mockError(503, 'courier bag unavailable');
    return mockJson(db.get().bag);
  }),

  /** Server-side totals for the current selection — the mini cart never multiplies anything. */
  http.post(mockPath(MODULE, 'bag/quote'), async ({ request }) => {
    const lines = await readLines(request);
    await delay(300);
    if (shouldFail()) return mockError(503, 'courier bag unavailable');
    return mockJson(quoteFor(lines));
  }),

  /** Buy from the bag: stock is taken down and a receipt comes back. Nothing is charged. */
  http.post(mockPath(MODULE, 'bag/confirm'), async ({ request }) => {
    const lines = await readLines(request);
    await delay(WRITE_LATENCY);
    if (shouldFail()) return mockError(503, 'courier bag unavailable');
    const quote = quoteFor(lines);
    if (quote.item_count === 0) return mockError(422, 'bag selection is empty');
    db.set((state) => ({
      ...state,
      bag: state.bag.map((item) => {
        const line = quote.lines.find((l) => l.id === item.id);
        return line ? { ...item, stock: Math.max(0, item.stock - line.quantity) } : item;
      }),
    }));
    return mockJson({
      reference: mockId('BAG'),
      item_count: quote.item_count,
      total: quote.total,
      simulated: true,
    });
  }),

  /** The single demo product offered in two sizes. */
  http.get(mockPath(MODULE, 'fit/product'), async () => {
    await delay(LATENCY);
    if (shouldFail()) return mockError(503, 'fit catalogue unavailable');
    return mockJson(FIT_PRODUCT);
  }),

  /** `null` when the courier is not at the door — the no-session empty state. */
  http.get(mockPath(MODULE, 'fit/sessions/current'), async () => {
    await delay(LATENCY);
    if (shouldFail()) return mockError(503, 'fit session unavailable');
    const { session } = db.get();
    return mockJson(session ? sessionWire(session) : null);
  }),

  /** Ordering the sizes starts the 10-minute doorstep session. */
  http.post(mockPath(MODULE, 'fit/sessions'), async ({ request }) => {
    let sizes: string[] = [];
    try {
      const body = (await request.json()) as { sizes?: unknown };
      if (Array.isArray(body?.sizes)) sizes = body.sizes.map((s) => String(s));
    } catch {
      sizes = [];
    }
    await delay(WRITE_LATENCY);
    if (shouldFail()) return mockError(503, 'fit session unavailable');
    // An empty list is the debug "Sınağa başla (demo)" action: the demo picks its own two sizes.
    const valid =
      sizes.length === 0
        ? FIT_PRODUCT.sizes.slice(2, 2 + FIT_PRODUCT.required_sizes)
        : sizes.filter((s) => (FIT_PRODUCT.sizes as readonly string[]).includes(s));
    if (valid.length !== FIT_PRODUCT.required_sizes) {
      return mockError(422, 'exactly two sizes are required');
    }
    const session: SessionState = {
      id: mockId('fit'),
      sizes: valid,
      startedAt: new Date().toISOString(),
      durationSec: FIT_DURATION_SEC,
    };
    db.patch({ session, result: null });
    return mockJson(sessionWire(session));
  }),

  /** Keep / return decision. Clears the session and stores the settled result. */
  http.post(mockPath(MODULE, 'fit/sessions/confirm'), async ({ request }) => {
    let kept: string[] = [];
    try {
      const body = (await request.json()) as { kept?: unknown };
      if (Array.isArray(body?.kept)) kept = body.kept.map((s) => String(s));
    } catch {
      kept = [];
    }
    await delay(WRITE_LATENCY);
    if (shouldFail()) return mockError(503, 'fit session unavailable');
    const { session } = db.get();
    if (!session) return mockError(404, 'no doorstep session');
    const keptSizes = session.sizes.filter((s) => kept.includes(s));
    const result: ResultState = {
      sessionId: session.id,
      keptSizes,
      returnedSizes: session.sizes.filter((s) => !kept.includes(s)),
      charged: round(FIT_PRODUCT.price * keptSizes.length),
    };
    db.patch({ session: null, result });
    return mockJson({
      session_id: result.sessionId,
      product: FIT_PRODUCT,
      kept_sizes: result.keptSizes,
      returned_sizes: result.returnedSizes,
      charged: result.charged,
      simulated: true,
    });
  }),

  /** The settled session, so a reload still shows the result screen. */
  http.get(mockPath(MODULE, 'fit/results/latest'), async () => {
    await delay(300);
    const { result } = db.get();
    if (!result) return mockJson(null);
    return mockJson({
      session_id: result.sessionId,
      product: FIT_PRODUCT,
      kept_sizes: result.keptSizes,
      returned_sizes: result.returnedSizes,
      charged: result.charged,
      simulated: true,
    });
  }),

  /** Services + slots for one product kind. */
  http.get(mockPath(MODULE, 'expert/catalog'), async ({ request }) => {
    const product = new URL(request.url).searchParams.get('product') ?? 'bike';
    await delay(LATENCY);
    if (shouldFail()) return mockError(503, 'expert catalogue unavailable');
    const services = EXPERT_SERVICES[product];
    if (!services) return mockError(404, 'unknown product kind');
    return mockJson({
      product,
      products: EXPERT_PRODUCTS,
      services,
      slots: EXPERT_SLOTS,
    });
  }),

  /** Reserve a slot. Returns `EX-<n>`; nothing is charged and nobody is dispatched. */
  http.post(mockPath(MODULE, 'expert/bookings'), async ({ request }) => {
    let payload: { product?: unknown; service?: unknown; slot?: unknown } = {};
    try {
      payload = (await request.json()) as typeof payload;
    } catch {
      payload = {};
    }
    await delay(WRITE_LATENCY);
    if (shouldFail()) return mockError(503, 'expert booking unavailable');
    const product = String(payload.product ?? '');
    const serviceKind = String(payload.service ?? '');
    const slotId = String(payload.slot ?? '');
    const services = EXPERT_SERVICES[product];
    if (!services || !services.some((s) => s.kind === serviceKind)) {
      return mockError(422, 'unknown product or service');
    }
    if (!EXPERT_SLOTS.some((s) => s.id === slotId)) return mockError(422, 'unknown slot');

    const booking: BookingState = {
      ref: `EX-${EXPERT_REF_BASE + db.get().bookings.length}`,
      product,
      serviceKind,
      slotId,
    };
    db.set((state) => ({ ...state, bookings: [...state.bookings, booking] }));
    return mockJson(bookingWire(booking));
  }),

  /** The reservation the confirmation screen renders (`null` on a direct load with none). */
  http.get(mockPath(MODULE, 'expert/bookings/latest'), async () => {
    await delay(400);
    if (shouldFail()) return mockError(503, 'expert booking unavailable');
    const { bookings } = db.get();
    const last = bookings[bookings.length - 1];
    return mockJson(last ? bookingWire(last) : null);
  }),

  /** `failNextCall()` — arms one failure so the error state is reachable without `?preview=`. */
  http.post(mockPath(MODULE, 'debug/fail-next'), async () => {
    db.patch({ failNext: true });
    return mockJson({ armed: true });
  }),

  /** Back to the seeded demo (fresh stock, no session, no bookings). */
  http.post(mockPath(MODULE, 'debug/reset'), async () => {
    db.reset();
    return mockJson({ reset: true });
  }),
];

registerMockHandlers(MODULE, flagged(courierShopHandlers, 'courierShop'));
