/**
 * The group_buy demo "server": MSW handlers under `/api/mock/group_buy/…`.
 *
 * This file is the only thing in the module that knows the demo is a demo. It plays the part a
 * real `/customer/api/v1/group-buy` would play, which means:
 *
 * - it answers with the real envelope and **snake_case** wire fields, and localized text as
 *   `translations: [{locale, title, pack}]` — the same shape the real catalog rows use, so
 *   `data/group_buy.repository.ts` is an ordinary parser and swapping in the real host is a URL
 *   change plus deleting this file;
 * - **every derived number is computed here**, not in a component: the tier ladder, the tier
 *   prices, the percentages, `joined` / `target` / `missing` / `progress`, `current_price`,
 *   `best_price`, the line total and the savings (BUILD-CONTRACT rule 7);
 * - `closes_at` is an absolute instant stored **once**, when the db is seeded, and persisted to
 *   `localStorage` under `ozio.mock.group_buy`. A reload does not restart any countdown, and
 *   `expired` is decided here against the current clock — so a screen that was open when the
 *   window elapsed only has to refetch to learn the truth;
 * - joining mutates demo state only. Nothing is charged and **no cart row is created**: the
 *   copy says the card is charged when the group fills, and in the demo that moment never comes.
 */
import { http } from 'msw';

import {
  createMockDb,
  delay,
  flagged,
  mockError,
  mockJson,
  mockPage,
  mockPath,
  registerMockHandlers,
} from '@/core/mocks';

import {
  GROUP_DEADLINE_HOURS,
  GROUP_DEALS,
  GROUP_DELIVERY_FEE,
  GROUP_MY_ADDRESS,
  GROUP_PRODUCTS,
  GROUP_TARGETS,
  GROUP_TIER_PEOPLE,
  ME_NAME,
  inviteLinkFor,
  type GroupProductFixture,
} from './group_buy.fixtures';
import { GROUP_BUY_FLAG, GROUP_BUY_MOCK_MODULE } from '../group_buy.flags';

/* ------------------------------------------------------------------ latency (mock-modules.md: 600 ms) */

const LIST_MS = 600;
const DETAIL_MS = 500;
const WRITE_MS = 700;

/* ------------------------------------------------------------------ the stored rows */

type Lang = 'az' | 'ru' | 'en';

interface ParticipantRow {
  /** Empty for the signed-in member, whose name is localized at serialization time. */
  name: string;
  isMe: boolean;
}

interface DealRow {
  id: string;
  productId: string;
  target: number;
  /** Absolute ISO instant, written once when the db is seeded. */
  closesAt: string;
  participants: ParticipantRow[];
  address: string;
  sameBuilding: boolean;
  mine: boolean;
  myQty: number;
}

interface GroupBuyState {
  deals: DealRow[];
}

const seed = (): GroupBuyState => {
  const now = Date.now();
  return {
    deals: GROUP_DEALS.map((d) => ({
      id: d.id,
      productId: d.productId,
      target: d.target,
      closesAt: new Date(now + d.closesInMs).toISOString(),
      participants: d.participants.map((name) => ({ name, isMe: false })),
      address: d.address ?? GROUP_MY_ADDRESS,
      sameBuilding: d.address === undefined,
      mine: false,
      myQty: 0,
    })),
  };
};

const db = createMockDb<GroupBuyState>(GROUP_BUY_MOCK_MODULE, seed);

/* ------------------------------------------------------------------ derivation (the "server" maths) */

const round1 = (v: number): number => Math.round(v * 10) / 10;
const round2 = (v: number): number => Math.round(v * 100) / 100;
const percentOff = (retail: number, price: number): number =>
  retail <= 0 ? 0 : Math.round((1 - price / retail) * 100);

const productOf = (id: string): GroupProductFixture | undefined =>
  GROUP_PRODUCTS.find((p) => p.id === id);

interface TierWire {
  people: number;
  price: number;
  percent_off: number;
  reached: boolean;
  current: boolean;
}

/** `tiersFor(product, target)`: the rungs up to and including the target, priced by factor. */
function tiersFor(product: GroupProductFixture, target: number): { people: number; price: number }[] {
  const out: { people: number; price: number }[] = [];
  for (let i = 0; i < GROUP_TIER_PEOPLE.length; i += 1) {
    const people = GROUP_TIER_PEOPLE[i];
    if (people > target) break;
    out.push({ people, price: round1(product.retailPrice * product.tierFactors[i]) });
  }
  return out;
}

const localeOf = (url: URL): Lang => {
  const raw = (url.searchParams.get('lang') ?? 'az').toLowerCase();
  return raw === 'ru' || raw === 'en' ? raw : 'az';
};

function serializeDeal(row: DealRow, lang: Lang) {
  const product = productOf(row.productId);
  const retail = product?.retailPrice ?? 0;
  const ladder = product ? tiersFor(product, row.target) : [];

  const joined = row.participants.length;
  const target = ladder.length > 0 ? ladder[ladder.length - 1].people : row.target;
  const complete = joined >= target;

  // The highest rung the group has already reached; before the first rung everyone pays rung 1.
  const reachedIndex = ladder.reduce(
    (acc, tier, index) => (joined >= tier.people ? index : acc),
    -1,
  );
  const currentIndex = reachedIndex >= 0 ? reachedIndex : 0;
  const currentPrice = ladder.length > 0 ? ladder[currentIndex].price : 0;
  const bestPrice = ladder.length > 0 ? ladder[ladder.length - 1].price : 0;

  const tiers: TierWire[] = ladder.map((tier, index) => ({
    people: tier.people,
    price: tier.price,
    percent_off: percentOff(retail, tier.price),
    reached: joined >= tier.people,
    current: index === currentIndex,
  }));

  // The honest expiry: decided here, against the clock, every time the row is served.
  const expired = Date.parse(row.closesAt) <= Date.now() && !complete;

  return {
    id: row.id,
    translations: product?.translations ?? [],
    icon_key: product?.iconKey ?? '',
    retail_price: retail.toFixed(2),
    tiers,
    participants: row.participants.map((p) => {
      const name = p.isMe ? ME_NAME[lang] : p.name;
      return { name, initial: name.slice(0, 1).toLocaleUpperCase(lang), is_me: p.isMe };
    }),
    closes_at: row.closesAt,
    address: row.address,
    same_building: row.sameBuilding,
    mine: row.mine,
    my_qty: row.myQty,
    joined,
    target,
    complete,
    missing: Math.max(0, target - joined),
    progress: target > 0 ? Math.min(1, joined / target) : 0,
    current_price: currentPrice,
    best_price: bestPrice,
    discount_percent: percentOff(retail, currentPrice),
    best_discount_percent: percentOff(retail, bestPrice),
    expired,
    invite_link: inviteLinkFor(row.id),
  };
}

function serializeProduct(product: GroupProductFixture, lang: Lang) {
  void lang; // the whole translations array is sent, exactly like the real catalog rows
  return {
    id: product.id,
    translations: product.translations,
    icon_key: product.iconKey,
    retail_price: product.retailPrice.toFixed(2),
    tiers: tiersFor(product, GROUP_TIER_PEOPLE[GROUP_TIER_PEOPLE.length - 1]).map((tier) => ({
      people: tier.people,
      price: tier.price,
      percent_off: percentOff(product.retailPrice, tier.price),
    })),
  };
}

/* ------------------------------------------------------------------ handlers */

export const groupBuyHandlers = [
  /** `GET deals?lang=` — the overview, split into the two tabs by the source. */
  http.get(mockPath(GROUP_BUY_MOCK_MODULE, 'deals'), async ({ request }) => {
    await delay(LIST_MS);
    const url = new URL(request.url);
    const lang = localeOf(url);
    const rows = db.get().deals;
    return mockJson({
      nearby: rows.filter((r) => !r.mine).map((r) => serializeDeal(r, lang)),
      mine: rows.filter((r) => r.mine).map((r) => serializeDeal(r, lang)),
      total: rows.length,
    });
  }),

  /** `GET products?lang=` — the create-form catalog plus the target / deadline options. */
  http.get(mockPath(GROUP_BUY_MOCK_MODULE, 'products'), async ({ request }) => {
    await delay(LIST_MS);
    const url = new URL(request.url);
    const lang = localeOf(url);
    const page = mockPage(
      GROUP_PRODUCTS.map((p) => serializeProduct(p, lang)),
      url,
    );
    return mockJson({
      ...page,
      targets: GROUP_TARGETS,
      deadlines: GROUP_DEADLINE_HOURS,
      address: GROUP_MY_ADDRESS,
      delivery_fee: GROUP_DELIVERY_FEE,
    });
  }),

  /**
   * `GET deals/{id}/quote?qty=` — the GB4 confirm breakdown.
   *
   * It exists so the dialog renders numbers instead of computing a discount: unit price, line
   * total, the 0 ₼ shared delivery, the savings against retail and the payable total.
   */
  http.get(mockPath(GROUP_BUY_MOCK_MODULE, 'deals/:id/quote'), async ({ request, params }) => {
    await delay(DETAIL_MS);
    const url = new URL(request.url);
    const lang = localeOf(url);
    const id = String(params.id);
    const row = db.get().deals.find((r) => r.id === id);
    if (!row) return mockError(404, 'Qrup tapılmadı');

    const wire = serializeDeal(row, lang);
    const qty = Math.max(1, Math.trunc(Number(url.searchParams.get('qty') ?? 1)) || 1);
    const lineTotal = round2(wire.current_price * qty);
    return mockJson({
      qty,
      unit_price: wire.current_price,
      line_total: lineTotal,
      delivery_fee: GROUP_DELIVERY_FEE,
      savings: round2((Number(wire.retail_price) - wire.current_price) * qty),
      total: round2(lineTotal + GROUP_DELIVERY_FEE),
    });
  }),

  /** `GET deals/{id}?lang=` — one deal. 404 when the id is unknown, like the real gateway. */
  http.get(mockPath(GROUP_BUY_MOCK_MODULE, 'deals/:id'), async ({ request, params }) => {
    await delay(DETAIL_MS);
    const lang = localeOf(new URL(request.url));
    const id = String(params.id);
    const row = db.get().deals.find((r) => r.id === id);
    if (!row) return mockError(404, 'Qrup tapılmadı');
    return mockJson(serializeDeal(row, lang));
  }),

  /** `POST deals` — opens a group. `closes_at` is stamped here, from `hours`. */
  http.post(mockPath(GROUP_BUY_MOCK_MODULE, 'deals'), async ({ request }) => {
    await delay(WRITE_MS);
    const url = new URL(request.url);
    const lang = localeOf(url);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    const productId = String(body?.product_id ?? '');
    const product = productOf(productId);
    if (!product) {
      return mockError(422, 'Məhsul seçilməyib');
    }

    const target = Number(body?.target ?? 0);
    const hours = Number(body?.hours ?? 0);
    const qty = Math.max(1, Math.trunc(Number(body?.qty ?? 1)) || 1);
    if (!GROUP_TARGETS.includes(target) || !GROUP_DEADLINE_HOURS.includes(hours)) {
      return mockError(422, 'Hədəf və ya müddət yanlışdır');
    }

    const row: DealRow = {
      id: `d${Date.now().toString(36)}`,
      productId,
      target,
      closesAt: new Date(Date.now() + hours * 3_600_000).toISOString(),
      participants: [{ name: '', isMe: true }],
      address: GROUP_MY_ADDRESS,
      sameBuilding: true,
      mine: true,
      myQty: qty,
    };
    db.set((state) => ({ deals: [row, ...state.deals] }));
    return mockJson(serializeDeal(row, lang));
  }),

  /**
   * `POST deals/{id}/join` — demo state only.
   *
   * An elapsed window is refused with 409 so a stale screen cannot "join" a dead group: the view
   * refetches and settles into the expired state.
   */
  http.post(mockPath(GROUP_BUY_MOCK_MODULE, 'deals/:id/join'), async ({ request, params }) => {
    await delay(WRITE_MS);
    const url = new URL(request.url);
    const lang = localeOf(url);
    const id = String(params.id);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const qty = Math.max(1, Math.trunc(Number(body?.qty ?? 1)) || 1);

    const existing = db.get().deals.find((r) => r.id === id);
    if (!existing) return mockError(404, 'Qrup tapılmadı');

    const beforeWire = serializeDeal(existing, lang);
    if (beforeWire.expired) return mockError(409, 'Qrupun vaxtı bitdi');
    if (beforeWire.complete && !existing.mine) return mockError(409, 'Qrup artıq tamamlandı');

    let updated = existing;
    if (!existing.mine) {
      updated = {
        ...existing,
        participants: [...existing.participants, { name: '', isMe: true }],
        mine: true,
        myQty: qty,
      };
      db.set((state) => ({ deals: state.deals.map((r) => (r.id === id ? updated : r)) }));
    }

    const wire = serializeDeal(updated, lang);
    const lineQty = updated.myQty || qty;
    return mockJson({
      deal: wire,
      qty: lineQty,
      total: round2(wire.current_price * lineQty),
      delivery_fee: GROUP_DELIVERY_FEE,
      savings: round2((Number(wire.retail_price) - wire.current_price) * lineQty),
      completed: wire.complete,
    });
  }),
];

registerMockHandlers(GROUP_BUY_MOCK_MODULE, flagged(groupBuyHandlers, GROUP_BUY_FLAG));
