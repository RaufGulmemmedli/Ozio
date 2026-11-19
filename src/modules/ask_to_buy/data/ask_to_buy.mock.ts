/**
 * MSW handlers for "Al deyim" (`/api/mock/ask_to_buy/…`) — **never the real host**.
 *
 * `src/core/mocks/modules.ts` already lists `ask_to_buy` and imports this file lazily, so nothing
 * in `src/core/mocks/` needs editing. The handlers answer with the real API envelope so the
 * repository above them cannot tell a mock from a backend: switching to a real service means
 * changing the URL in `ask_to_buy.remote.ts` and deleting this file.
 *
 * State lives in `localStorage` under `ozio.mock.ask_to_buy`, so the demo survives a reload.
 * **Nothing is ever charged** — "approve" only moves a row's `status` and stamps a card label.
 *
 * The parent / child role is mock state too (there is no family API): `POST role` flips it and the
 * UI exposes that as a switch; `?preview=parent|child` overrides it per screen.
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockJson,
  mockPage,
  mockPath,
  mockValidationError,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

import {
  ASK_EXPIRY_HOURS,
  DEMO_DELIVERY_FEE,
  FIRST_NEW_REFERENCE,
  NOTE_MAX_LENGTH,
  RELATION_LABEL,
  SEED_CARDS,
  SEED_DRAFT_ITEMS,
  SEED_PARENTS,
  SEED_REQUESTS,
  SELF_NAME,
  cardLabel,
  pick,
  type Locale,
  type SeedItem,
  type SeedRequest,
} from './ask_to_buy.fixtures';
import { ASK_TO_BUY_FLAG, ASK_TO_BUY_MOCK_MODULE } from '../ask_to_buy.flags';

/* ------------------------------------------------------------------ latency (mock-contracts) */

const LATENCY = { read: 600, write: 700, role: 200 } as const;

/* ------------------------------------------------------------------ the store */

interface Row extends SeedRequest {
  /** Set once a person creates or decides a row; seed rows age from `minutesAgo` instead. */
  createdAtIso?: string;
}

interface AskDb {
  role: 'parent' | 'child';
  rows: Row[];
  nextReference: number;
  nextOrderId: number;
}

const db = createMockDb<AskDb>(ASK_TO_BUY_MOCK_MODULE, () => ({
  role: 'parent',
  rows: SEED_REQUESTS.map((r) => ({ ...r })),
  nextReference: FIRST_NEW_REFERENCE,
  nextOrderId: 48_300,
}));

/* ------------------------------------------------------------------ helpers */

const LOCALES: readonly Locale[] = ['az', 'ru', 'en'];

function localeOf(url: string): Locale {
  const raw = (new URL(url).searchParams.get('locale') ?? 'az').toLowerCase();
  return (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'az';
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

function createdAt(row: Row): string {
  if (row.createdAtIso) return row.createdAtIso;
  return new Date(Date.now() - row.minutesAgo * 60_000).toISOString();
}

/** A pending row older than 24 h is expired — the rule a real backend would own. */
function effectiveStatus(row: Row): SeedRequest['status'] {
  if (row.status !== 'pending') return row.status;
  const ageHours = (Date.now() - new Date(createdAt(row)).getTime()) / 3_600_000;
  return ageHours >= ASK_EXPIRY_HOURS ? 'expired' : 'pending';
}

function wireItem(item: SeedItem, locale: Locale) {
  return {
    id: item.id,
    name: pick(item.name, locale),
    unit: item.unit ? pick(item.unit, locale) : '',
    qty: item.qty,
    unit_price: item.unitPrice,
    line_total: round2(item.qty * item.unitPrice),
  };
}

const itemsTotal = (items: readonly SeedItem[]): number =>
  round2(items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0));

const itemUnits = (items: readonly SeedItem[]): number =>
  items.reduce((sum, i) => sum + i.qty, 0);

function wireRequest(row: Row, locale: Locale) {
  const parent = SEED_PARENTS.find((p) => p.id === row.parentId) ?? SEED_PARENTS[0]!;
  const card = SEED_CARDS.find((c) => c.id === row.paidCardId);
  const total = itemsTotal(row.items);
  return {
    id: row.id,
    reference: row.reference,
    direction: row.direction,
    child_name: pick(row.childName, locale),
    parent_name: row.direction === 'incoming' ? pick(SELF_NAME, locale) : pick(parent.name, locale),
    parent_relation_label: pick(RELATION_LABEL[parent.relation], locale),
    items: row.items.map((i) => wireItem(i, locale)),
    item_count: itemUnits(row.items),
    note: pick(row.note, locale),
    created_at: createdAt(row),
    status: effectiveStatus(row),
    paid_with: card ? cardLabel(card.brand, card.last4) : '',
    items_total: total,
    delivery_fee: DEMO_DELIVERY_FEE,
    delivery_free: DEMO_DELIVERY_FEE === 0,
    total: round2(total + DEMO_DELIVERY_FEE),
    order_id: row.orderId ?? '',
  };
}

/** Newest first, like the real list would be. */
function sortedRows(direction: string | null): Row[] {
  const rows = db.get().rows.filter((r) => (direction ? r.direction === direction : true));
  return [...rows].sort(
    (a, b) => new Date(createdAt(b)).getTime() - new Date(createdAt(a)).getTime(),
  );
}

const pendingIncoming = (): number =>
  db.get().rows.filter((r) => r.direction === 'incoming' && effectiveStatus(r) === 'pending').length;

function findRow(id: string): Row | undefined {
  return db.get().rows.find((r) => r.id === id);
}

function patchRow(id: string, part: Partial<Row>): Row | undefined {
  let updated: Row | undefined;
  db.set((state) => ({
    ...state,
    rows: state.rows.map((r) => {
      if (r.id !== id) return r;
      updated = { ...r, ...part };
      return updated;
    }),
  }));
  return updated;
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    return parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ handlers */

export const askToBuyHandlers = [
  /** Who the demo is acting as, plus the parent / card / basket pickers. */
  http.get(mockPath(ASK_TO_BUY_MOCK_MODULE, 'context'), async ({ request }) => {
    await delay(LATENCY.read);
    const locale = localeOf(request.url);
    return mockJson({
      role: db.get().role,
      parents: SEED_PARENTS.map((p) => ({
        id: p.id,
        name: pick(p.name, locale),
        relation: p.relation,
        relation_label: pick(RELATION_LABEL[p.relation], locale),
      })),
      cards: SEED_CARDS.map((c) => ({
        id: c.id,
        brand: c.brand,
        last4: c.last4,
        label: cardLabel(c.brand, c.last4),
      })),
      draft_items: SEED_DRAFT_ITEMS.map((i) => wireItem(i, locale)),
      draft_item_count: itemUnits(SEED_DRAFT_ITEMS),
      draft_total: itemsTotal(SEED_DRAFT_ITEMS),
      pending_incoming: pendingIncoming(),
    });
  }),

  /** Flip the demo between the parent and the child side. */
  http.post(mockPath(ASK_TO_BUY_MOCK_MODULE, 'role'), async ({ request }) => {
    await delay(LATENCY.role);
    const payload = await body(request);
    const role = payload.role === 'parent' ? 'parent' : payload.role === 'child' ? 'child' : null;
    if (role === null) {
      return mockValidationError([{ path: 'role', message: 'role must be parent or child' }]);
    }
    db.patch({ role });
    return mockJson({ role });
  }),

  /** One inbox side, `offset`/`limit` paged like the real lists. */
  http.get(mockPath(ASK_TO_BUY_MOCK_MODULE, 'requests'), async ({ request }) => {
    await delay(LATENCY.read);
    const url = new URL(request.url);
    const locale = localeOf(request.url);
    const rows = sortedRows(url.searchParams.get('direction'));
    return mockJson({
      ...mockPage(
        rows.map((r) => wireRequest(r, locale)),
        url,
      ),
      pending_incoming: pendingIncoming(),
    });
  }),

  http.get(mockPath(ASK_TO_BUY_MOCK_MODULE, 'requests/:id'), async ({ params, request }) => {
    await delay(LATENCY.read);
    const row = findRow(String(params.id));
    if (!row) return mockError(404, 'request not found');
    return mockJson(wireRequest(row, localeOf(request.url)));
  }),

  /** The child sends the current basket to a chosen family member. */
  http.post(mockPath(ASK_TO_BUY_MOCK_MODULE, 'requests'), async ({ request }) => {
    await delay(LATENCY.write);
    const payload = await body(request);
    const parentId = typeof payload.parent_id === 'string' ? payload.parent_id : '';
    const note = typeof payload.note === 'string' ? payload.note : '';

    if (!SEED_PARENTS.some((p) => p.id === parentId)) {
      return mockValidationError([{ path: 'parent_id', message: 'choose a family member' }]);
    }
    if (note.length > NOTE_MAX_LENGTH) {
      return mockValidationError([{ path: 'note', message: 'note is too long' }]);
    }

    const state = db.get();
    const reference = `A-${state.nextReference}`;
    const row: Row = {
      id: reference.toLowerCase().replace('-', ''),
      reference,
      direction: 'outgoing',
      childName: SELF_NAME,
      parentId,
      items: SEED_DRAFT_ITEMS.map((i) => ({ ...i })),
      // The person typed this, so it is not translated — it is shown as entered.
      note: { az: note, ru: note, en: note },
      minutesAgo: 0,
      status: 'pending',
      createdAtIso: new Date().toISOString(),
    };
    db.set({ ...state, rows: [row, ...state.rows], nextReference: state.nextReference + 1 });
    return mockJson(wireRequest(row, localeOf(request.url)));
  }),

  /** Approve + "pay". Mock state only: no money moves anywhere. */
  http.post(mockPath(ASK_TO_BUY_MOCK_MODULE, 'requests/:id/approve'), async ({ params, request }) => {
    await delay(LATENCY.write);
    const row = findRow(String(params.id));
    if (!row) return mockError(404, 'request not found');
    if (effectiveStatus(row) !== 'pending') return mockError(409, 'request is already decided');

    const payload = await body(request);
    const cardId = typeof payload.card_id === 'string' ? payload.card_id : '';
    if (!SEED_CARDS.some((c) => c.id === cardId)) {
      return mockValidationError([{ path: 'card_id', message: 'choose a card' }]);
    }

    const orderId = String(db.get().nextOrderId);
    db.patch({ nextOrderId: db.get().nextOrderId + 1 });
    const updated = patchRow(row.id, { status: 'approved', paidCardId: cardId, orderId });
    return mockJson(wireRequest(updated ?? row, localeOf(request.url)));
  }),

  http.post(mockPath(ASK_TO_BUY_MOCK_MODULE, 'requests/:id/decline'), async ({ params, request }) => {
    await delay(LATENCY.write);
    const row = findRow(String(params.id));
    if (!row) return mockError(404, 'request not found');
    if (effectiveStatus(row) !== 'pending') return mockError(409, 'request is already decided');
    const updated = patchRow(row.id, { status: 'declined' });
    return mockJson(wireRequest(updated ?? row, localeOf(request.url)));
  }),

  /** "Yenidən göndər" on an expired request: a fresh clock, back to pending. */
  http.post(mockPath(ASK_TO_BUY_MOCK_MODULE, 'requests/:id/resend'), async ({ params, request }) => {
    await delay(LATENCY.write);
    const row = findRow(String(params.id));
    if (!row) return mockError(404, 'request not found');
    const updated = patchRow(row.id, {
      status: 'pending',
      minutesAgo: 0,
      createdAtIso: new Date().toISOString(),
      paidCardId: undefined,
      orderId: undefined,
    });
    return mockJson(wireRequest(updated ?? row, localeOf(request.url)));
  }),
];

registerMockHandlers(ASK_TO_BUY_MOCK_MODULE, flagged(askToBuyHandlers, ASK_TO_BUY_FLAG));
