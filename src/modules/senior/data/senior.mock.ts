/**
 * MSW handlers for the senior module (`/api/mock/senior/…`) — **never the real host**.
 *
 * `src/core/mocks/modules.ts` already lists `senior` and imports this file lazily. Replies carry
 * the real API envelope; the PROPOSED REST shape mirrored here is `api/mock-modules.md` §13
 * (`GET/PUT /v1/senior/pension-plan`, `POST /pension-plan/order`, `GET/POST /help-requests`,
 * `PATCH /help-requests/{id}`). Moving to a backend means changing the URL in `senior.remote.ts`
 * and deleting this file.
 *
 * State lives in `localStorage` under `ozio.mock.senior`, so an ordered basket and an accepted
 * errand both survive a reload. **Nothing is ever ordered or paid**: `order` sets `ordered: true`
 * and mints a demo order number.
 *
 * "Sadə rejim" prefs are *not* here — they are a device preference (`use-senior-mode.ts`).
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockJson,
  mockPath,
  mockValidationError,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

import {
  DEFAULT_BONUS,
  HELP_NOTE_MAX_LENGTH,
  PAYDAY_DAY_OF_MONTH,
  SEED_BASKET,
  SEED_HELP_REQUESTS,
  SEED_ORDER_ID,
  SEED_ORDER_NUMBER,
  SEED_PENSION,
  SELF_NAME,
  pick,
  type Locale,
  type SeedHelpRequest,
} from './senior.fixtures';
import { HELP_KINDS, type HelpKind, type HelpStatus } from './models/help-request';
import { SENIOR_FLAG, SENIOR_MOCK_MODULE } from '../senior.flags';

/** `mock-contracts.ts` → `MOCK_LATENCY_MS`: read 650, toggle 250, order 900, create 700, status 500. */
const LATENCY = { read: 650, toggle: 250, order: 900, create: 700, status: 500 } as const;

interface SeniorDb {
  autoRepeat: boolean;
  ordered: boolean;
  orderNumber: string | null;
  orderId: string | null;
  requests: SeedHelpRequest[];
  nextRequest: number;
}

const db = createMockDb<SeniorDb>(SENIOR_MOCK_MODULE, () => ({
  autoRepeat: false,
  ordered: false,
  orderNumber: null,
  orderId: null,
  requests: SEED_HELP_REQUESTS.map((r) => ({ ...r })),
  nextRequest: 4,
}));

const LOCALES: readonly Locale[] = ['az', 'ru', 'en'];

function localeOf(url: string): Locale {
  const raw = (new URL(url).searchParams.get('locale') ?? 'az').toLowerCase();
  return (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'az';
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** The next 25th, so the banner's countdown stays alive however long the demo runs. */
function nextPayday(now = new Date()): Date {
  const candidate = new Date(now.getFullYear(), now.getMonth(), PAYDAY_DAY_OF_MONTH);
  if (candidate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    return new Date(now.getFullYear(), now.getMonth() + 1, PAYDAY_DAY_OF_MONTH);
  }
  return candidate;
}

function wirePlan(locale: Locale) {
  const state = db.get();
  const now = new Date();
  const payday = nextPayday(now);
  const days = Math.round(
    (payday.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000,
  );

  const items = SEED_BASKET.map((item) => ({
    id: item.id,
    name: pick(item.name, locale),
    qty: item.qty,
    unit: pick(item.unit, locale),
    unit_price: item.unitPrice,
    line_total: round2(item.qty * item.unitPrice),
  }));

  return {
    payday: payday.toISOString(),
    days_until_payday: Math.max(0, days),
    pension: SEED_PENSION,
    items,
    total: round2(items.reduce((sum, i) => sum + i.line_total, 0)),
    auto_repeat: state.autoRepeat,
    ordered: state.ordered,
    order_number: state.orderNumber ?? '',
    order_id: state.orderId ?? '',
  };
}

function wireRequest(r: SeedHelpRequest, locale: Locale) {
  return {
    id: r.id,
    kind: r.kind,
    requester: pick(r.requester, locale),
    note: pick(r.note, locale),
    helper: r.helper ? pick(r.helper, locale) : '',
    distance_km: r.distanceKm,
    bonus: r.bonus,
    status: r.status,
    mine: r.mine,
  };
}

function wireBoard(locale: Locale) {
  const rows = db.get().requests;
  // Bonus is credited only for errands this person took on and finished.
  const earned = rows.filter((r) => !r.mine && r.status === 'completed');
  const last = earned[earned.length - 1];
  return {
    mine: rows.filter((r) => r.mine).map((r) => wireRequest(r, locale)),
    nearby: rows.filter((r) => !r.mine).map((r) => wireRequest(r, locale)),
    earned_bonus: round2(earned.reduce((sum, r) => sum + r.bonus, 0)),
    earned_from: last ? pick(last.requester, locale) : '',
  };
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    return parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const seniorHandlers = [
  /** `GET pension-plan`. */
  http.get(mockPath(SENIOR_MOCK_MODULE, 'pension-plan'), async ({ request }) => {
    await delay(LATENCY.read);
    return mockJson(wirePlan(localeOf(request.url)));
  }),

  /** `PUT pension-plan` → `{ auto_repeat }`. */
  http.put(mockPath(SENIOR_MOCK_MODULE, 'pension-plan'), async ({ request }) => {
    await delay(LATENCY.toggle);
    const payload = await body(request);
    if (typeof payload.auto_repeat !== 'boolean') {
      return mockValidationError([{ path: 'auto_repeat', message: 'auto_repeat must be a boolean' }]);
    }
    db.patch({ autoRepeat: payload.auto_repeat });
    return mockJson(wirePlan(localeOf(request.url)));
  }),

  /** `POST pension-plan/order` — demo only: nothing is really ordered and nothing is charged. */
  http.post(mockPath(SENIOR_MOCK_MODULE, 'pension-plan/order'), async ({ request }) => {
    await delay(LATENCY.order);
    if (db.get().ordered) return mockError(409, 'basket is already ordered');
    db.patch({ ordered: true, orderNumber: SEED_ORDER_NUMBER, orderId: SEED_ORDER_ID });
    return mockJson(wirePlan(localeOf(request.url)));
  }),

  /** `GET help-requests` → both sides of the board plus the earned-bonus block. */
  http.get(mockPath(SENIOR_MOCK_MODULE, 'help-requests'), async ({ request }) => {
    await delay(LATENCY.read);
    return mockJson(wireBoard(localeOf(request.url)));
  }),

  /** `POST help-requests` → `{ kind, note }`; the new row goes to the top of "Kömək istə". */
  http.post(mockPath(SENIOR_MOCK_MODULE, 'help-requests'), async ({ request }) => {
    await delay(LATENCY.create);
    const payload = await body(request);
    const kind = String(payload.kind ?? '').toLowerCase();
    const note = typeof payload.note === 'string' ? payload.note.trim() : '';

    if (!(HELP_KINDS as readonly string[]).includes(kind)) {
      return mockValidationError([{ path: 'kind', message: 'choose what you need help with' }]);
    }
    if (note.length > HELP_NOTE_MAX_LENGTH) {
      return mockValidationError([{ path: 'note', message: 'note is too long' }]);
    }

    const state = db.get();
    const row: SeedHelpRequest = {
      id: `m${state.nextRequest}`,
      kind: kind as HelpKind,
      requester: SELF_NAME,
      // Typed by the person, so it is shown as entered rather than translated.
      note: { az: note, ru: note, en: note },
      distanceKm: 0,
      bonus: DEFAULT_BONUS,
      status: 'open',
      mine: true,
    };
    db.set({ ...state, requests: [row, ...state.requests], nextRequest: state.nextRequest + 1 });
    return mockJson(wireBoard(localeOf(request.url)));
  }),

  /**
   * `PATCH help-requests/{id}` → `{ status }`. "Köməyə get" sets `accepted` and names the helper;
   * completing it credits the bonus in the earned-bonus block.
   */
  http.patch(mockPath(SENIOR_MOCK_MODULE, 'help-requests/:id'), async ({ params, request }) => {
    await delay(LATENCY.status);
    const id = String(params.id);
    const current = db.get().requests.find((r) => r.id === id);
    if (!current) return mockError(404, 'request not found');

    const payload = await body(request);
    const status = String(payload.status ?? '').toLowerCase();
    if (!['open', 'accepted', 'completed'].includes(status)) {
      return mockValidationError([{ path: 'status', message: 'unknown status' }]);
    }

    const next: SeedHelpRequest = {
      ...current,
      status: status as HelpStatus,
      helper: status === 'open' ? undefined : (current.helper ?? SELF_NAME),
    };
    db.set((state) => ({ ...state, requests: state.requests.map((r) => (r.id === id ? next : r)) }));
    return mockJson(wireBoard(localeOf(request.url)));
  }),
];

registerMockHandlers(SENIOR_MOCK_MODULE, flagged(seniorHandlers, SENIOR_FLAG));
