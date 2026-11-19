/**
 * The courier MSW slice — the whole "backend" of this module.
 *
 * Registered under `/api/mock/courier/…`, never the real host (the gateway has no courier service
 * at all). Demo state lives in `localStorage` key `ozio.mock.courier`, so a reload keeps the
 * approval, the shift and the active delivery.
 *
 * **The documented demo hook** (08-feature-flags-mocks.md, "apply stored in localStorage,
 * auto-approved ~4 s"): `POST applications` stores the application with `reviewUntil = now + 4 s`
 * and status `pending`; every later read flips it to `active` once that moment has passed. Deriving
 * it from a timestamp instead of a `setTimeout` means an interrupted review (a reload while
 * pending) still finishes — exactly what the Flutter mock does on the next `loadStatus`.
 *
 * FIN, VÖEN, IBAN and the birth date are **never persisted** (`stripIdentifiers`), matching
 * `stripCourierIdentifiers` in the contract.
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
  WEEKDAY_KEYS,
  type CourierApplicationWire,
  type CourierEarnings,
  type CourierOrder,
  type CourierStatus,
} from './models/courier';

/** Flutter `MockCourierRepository`: 450 ms on every call. */
const LATENCY = 450;

/** The documented review delay. */
const REVIEW_DELAY_MS = 4000;

const r2 = (n: number): number => Math.round(n * 100) / 100;
const minutesAgo = (m: number): string => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number): string => minutesAgo(h * 60);

/* ------------------------------------------------------------------ seeds */

/** The three offers of `kuryer-panel.html` / `mock-modules.md` §2. */
function seedOffers(): CourierOrder[] {
  return [
    {
      id: 'c-48213',
      number: '#A-7745',
      status: 'available',
      storeName: 'Grandmart',
      storeAddress: 'Babək pr. 76',
      customerName: 'Rəşad H.',
      customerAddress: 'Xətai pr. 38',
      customerAddressDetails: 'Giriş 1 · mərtəbə 9',
      customerPhone: '+994 55 221 08 14',
      customerNote: 'Resepşnə təhvil verin, zəng vurmayın.',
      items: [
        { name: 'Su 5 L', quantity: 2, unit: '5 L' },
        { name: 'Yumurta', quantity: 1, unit: '10 ədəd' },
        { name: 'Çörək', quantity: 3, unit: '' },
      ],
      itemsTotal: 8.9,
      fee: 3.5,
      tip: 0.4,
      distanceBonus: 0.6,
      payment: 'card',
      cashToCollect: 0,
      distanceToStoreKm: 2.1,
      distanceKm: 4.1,
      etaMinutes: 18,
      createdAt: minutesAgo(5),
    },
    {
      id: 'c-48217',
      number: '#A-7749',
      status: 'available',
      storeName: 'Megastore',
      storeAddress: 'Təbriz küç. 51',
      customerName: 'Leyla Q.',
      customerAddress: 'Nərimanov, F. Xoyski 118',
      customerAddressDetails: '',
      customerPhone: '+994 70 318 44 02',
      customerNote: 'Resepşnə təhvil verin.',
      items: [
        { name: 'Süd 3.2%', quantity: 3, unit: '1 L' },
        { name: 'Pendir', quantity: 1, unit: '400 q' },
        { name: 'Alma', quantity: 1, unit: '2 kq' },
        { name: 'Makaron', quantity: 2, unit: '500 q' },
      ],
      itemsTotal: 24.6,
      fee: 3.2,
      tip: 0.6,
      distanceBonus: 0.4,
      payment: 'cash',
      cashToCollect: 24.6,
      distanceToStoreKm: 1.4,
      distanceKm: 3.2,
      etaMinutes: 14,
      createdAt: minutesAgo(1),
    },
    {
      id: 'c-48221',
      number: '#A-7752',
      status: 'available',
      storeName: 'Bolmart Təzə bazar',
      storeAddress: 'Nizami küç. 203',
      customerName: 'Aysel M.',
      customerAddress: 'Gənclik, A. Nemətulla 9',
      customerAddressDetails: 'Blok 2 · mərtəbə 5 · mənzil 47',
      customerPhone: '+994 50 702 31 19',
      customerNote: 'Qapı kodu 47#. Zəng vurmayın, uşaq yatır.',
      items: [
        { name: 'Atena ayran nanəli', quantity: 2, unit: '1 L' },
        { name: 'Çörək', quantity: 1, unit: '500 q' },
        { name: 'Pomidor', quantity: 1, unit: '1.2 kq' },
      ],
      itemsTotal: 12.48,
      fee: 3.4,
      tip: 0,
      distanceBonus: 0.2,
      payment: 'card',
      cashToCollect: 0,
      distanceToStoreKm: 0.9,
      distanceKm: 2.4,
      etaMinutes: 11,
      createdAt: minutesAgo(2),
    },
  ];
}

/** The seven history rows of `kuryer-tarixce.html`. */
function seedHistory(): CourierOrder[] {
  const rows: Array<[string, string, string, number, number, number, number]> = [
    ['c-48109', 'Bolmart Təzə bazar', 'Ə. Şıxlinski küç. 14', 3.2, 1, 2.4, 2],
    ['c-48108', 'Grandmart', 'Xətai pr. 38', 4.5, 0, 4.1, 4],
    ['c-48107', 'Megastore', 'F. Xoyski 118', 3.8, 2, 3.2, 27],
    ['c-48106', 'Bolmart Təzə bazar', 'Gənclik, A. Nemətulla 9', 3.4, 0.5, 2.9, 30],
    ['c-48105', 'Grandmart', 'Yasamal, Ş. Mehdiyev 22', 5.1, 0, 5.6, 50],
    ['c-48104', 'Megastore', '28 May, Dilarə Əliyeva 251', 2.9, 1.5, 1.8, 77],
    ['c-48103', 'Bolmart Təzə bazar', 'Nəsimi, S. Vurğun 43', 3.6, 0, 3, 121],
  ];

  return rows.map(([id, store, address, fee, tip, km, ago], index) => ({
    id,
    number: `#A-${7700 - index}`,
    status: 'delivered' as const,
    storeName: store,
    storeAddress: 'Nizami küç. 203',
    customerName: 'Müştəri',
    customerAddress: address,
    customerAddressDetails: '',
    customerPhone: '',
    customerNote: '',
    items: [{ name: 'Məhsullar', quantity: 4, unit: '' }],
    itemsTotal: 18.2,
    fee,
    tip,
    distanceBonus: r2(km * 0.15),
    payment: 'card' as const,
    cashToCollect: 0,
    distanceToStoreKm: 1.2,
    distanceKm: km,
    etaMinutes: 20,
    createdAt: hoursAgo(ago + 1),
    acceptedAt: hoursAgo(ago + 0.7),
    deliveredAt: hoursAgo(ago),
  }));
}

/** The chart of `kuryer-qazanc.html`: 7 buckets, oldest first, today last. */
const SEED_DAYS: ReadonlyArray<[number, number]> = [
  [9.2, 3],
  [14.6, 5],
  [12.1, 4],
  [16.8, 6],
  [11.4, 4],
  [14.3, 5],
  [18.4, 6],
];

function seedEarnings(): CourierEarnings {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() + ((8 - (today.getDay() || 7)) % 7 || 7));
  const days = SEED_DAYS.map(([amount, deliveries], index) => ({
    day: WEEKDAY_KEYS[index],
    amount,
    deliveries,
  }));
  const week = r2(days.reduce((sum, d) => sum + d.amount, 0));
  return {
    today: 18.4,
    week,
    month: 412.3,
    balance: 64.2,
    deliveriesToday: 6,
    deliveriesTotal: 342,
    rating: 4.9,
    acceptanceRate: 0.92,
    nextPayout: monday.toISOString(),
    days,
  };
}

/* ------------------------------------------------------------------ db */

interface StoredApplication extends CourierApplicationWire {
  reference: string;
}

interface CourierDbShape {
  status: CourierStatus;
  application: StoredApplication | null;
  /** Epoch ms after which a `pending` application becomes `active` (the ~4 s demo hook). */
  reviewUntil: number | null;
  online: boolean;
  shiftOpenedAt: number | null;
  offers: CourierOrder[];
  activeOrderId: string | null;
  orders: CourierOrder[];
  history: CourierOrder[];
  earnings: CourierEarnings;
}

/**
 * A fresh demo account is **not** a courier yet, so `/courier` opens on the drawn gate state
 * (`tR9sg`) and the apply → status → panel flow can be walked end to end.
 */
const db = createMockDb<CourierDbShape>('courier', () => ({
  status: 'none',
  application: null,
  reviewUntil: null,
  online: true,
  shiftOpenedAt: Date.now() - 192 * 60_000,
  offers: seedOffers(),
  activeOrderId: null,
  orders: [],
  history: seedHistory(),
  earnings: seedEarnings(),
}));

/** FIN, VÖEN, IBAN and the birth date never touch storage. */
const stripIdentifiers = (a: CourierApplicationWire): CourierApplicationWire => ({
  ...a,
  id_number: '',
  voen: '',
  bank_account: '',
  birth_date: null,
});

/** Flips a finished review to `active`. Called on every read, so a reload resumes it. */
function reviewed(): CourierDbShape {
  const state = db.get();
  if (state.status === 'pending' && state.reviewUntil !== null && Date.now() >= state.reviewUntil) {
    return db.set({ ...state, status: 'active', reviewUntil: null });
  }
  return state;
}

const activeOrder = (state: CourierDbShape): CourierOrder | null =>
  state.activeOrderId === null
    ? null
    : (state.orders.find((o) => o.id === state.activeOrderId) ?? null);

function mePayload() {
  const state = reviewed();
  return {
    status: state.status,
    application: state.application,
    shift: {
      online: state.online,
      openMinutes:
        state.online && state.shiftOpenedAt !== null
          ? Math.floor((Date.now() - state.shiftOpenedAt) / 60_000)
          : 0,
    },
    earnings: state.earnings,
    activeOrder: activeOrder(state),
  };
}

/** The earning of a finished delivery, added to today / week / balance by the "server". */
function bankEarning(order: CourierOrder): void {
  const amount = r2(order.fee + order.tip);
  db.set((state) => {
    const days = state.earnings.days.map((d, i) =>
      i === state.earnings.days.length - 1
        ? { ...d, amount: r2(d.amount + amount), deliveries: d.deliveries + 1 }
        : d,
    );
    return {
      ...state,
      earnings: {
        ...state.earnings,
        today: r2(state.earnings.today + amount),
        week: r2(state.earnings.week + amount),
        month: r2(state.earnings.month + amount),
        balance: r2(state.earnings.balance + amount),
        deliveriesToday: state.earnings.deliveriesToday + 1,
        deliveriesTotal: state.earnings.deliveriesTotal + 1,
        days,
      },
    };
  });
}

/* ------------------------------------------------------------------ handlers */

export const courierHandlers = [
  http.get(mockPath('courier', 'me'), async () => {
    await delay(LATENCY);
    return mockJson(mePayload());
  }),

  http.post(mockPath('courier', 'applications'), async ({ request }) => {
    await delay(650);
    const body = (await request.json()) as CourierApplicationWire;

    if (!body.full_name?.trim() || !body.phone?.trim()) {
      return mockError(422, 'courier/application-incomplete');
    }

    const reference = `KR-${1040 + (db.get().history.length % 60)}`;
    db.set((state) => ({
      ...state,
      status: 'pending',
      // The documented demo hook: approved ~4 s after submission.
      reviewUntil: Date.now() + REVIEW_DELAY_MS,
      application: {
        ...stripIdentifiers(body),
        submitted_at: new Date().toISOString(),
        reference,
      },
    }));
    return mockJson({ status: 'pending' });
  }),

  http.put(mockPath('courier', 'me/online'), async ({ request }) => {
    await delay(250);
    const body = (await request.json()) as { online?: boolean };
    const online = body.online === true;
    db.set((state) => ({
      ...state,
      online,
      shiftOpenedAt: online ? (state.shiftOpenedAt ?? Date.now()) : null,
    }));
    return mockJson(mePayload());
  }),

  http.get(mockPath('courier', 'offers'), async () => {
    await delay(LATENCY);
    const state = reviewed();
    // Offline, not yet approved, or already carrying an order → nothing to show.
    if (!state.online || state.status !== 'active' || state.activeOrderId !== null) {
      return mockJson([]);
    }
    return mockJson(state.offers);
  }),

  http.get(mockPath('courier', 'orders/:id'), async ({ params }) => {
    await delay(LATENCY);
    const id = String(params.id);
    const state = reviewed();
    const row =
      state.orders.find((o) => o.id === id) ??
      state.offers.find((o) => o.id === id) ??
      state.history.find((o) => o.id === id);
    if (!row) return mockError(404, 'courier/offer-not-found');
    return mockJson(row);
  }),

  http.post(mockPath('courier', 'orders/:id/accept'), async ({ params }) => {
    await delay(LATENCY);
    const id = String(params.id);
    const state = reviewed();
    if (state.activeOrderId !== null) return mockError(409, 'courier/order-active');
    const offer = state.offers.find((o) => o.id === id);
    if (!offer) return mockError(404, 'courier/offer-not-found');

    const accepted: CourierOrder = {
      ...offer,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    };
    db.set((prev) => ({
      ...prev,
      offers: prev.offers.filter((o) => o.id !== id),
      orders: [...prev.orders.filter((o) => o.id !== id), accepted],
      activeOrderId: accepted.id,
    }));
    return mockJson(accepted);
  }),

  http.post(mockPath('courier', 'orders/:id/decline'), async ({ params }) => {
    await delay(300);
    const id = String(params.id);
    if (!db.get().offers.some((o) => o.id === id)) {
      return mockError(404, 'courier/offer-not-found');
    }
    db.set((state) => ({ ...state, offers: state.offers.filter((o) => o.id !== id) }));
    return mockJson(null);
  }),

  http.post(mockPath('courier', 'orders/:id/advance'), async ({ params }) => {
    await delay(LATENCY);
    const id = String(params.id);
    const state = reviewed();
    const row = state.orders.find((o) => o.id === id);
    if (!row) return mockError(404, 'courier/offer-not-found');

    const next =
      row.status === 'accepted'
        ? 'atStore'
        : row.status === 'atStore'
          ? 'pickedUp'
          : row.status === 'pickedUp'
            ? 'delivered'
            : null;
    if (next === null) return mockError(409, 'courier/order-finished');

    const moved: CourierOrder = {
      ...row,
      status: next,
      ...(next === 'delivered' ? { deliveredAt: new Date().toISOString() } : {}),
    };

    if (next === 'delivered') {
      bankEarning(moved);
      db.set((prev) => ({
        ...prev,
        orders: prev.orders.filter((o) => o.id !== id),
        history: [moved, ...prev.history],
        activeOrderId: null,
        // Offers are re-seeded once the board has run dry, as in the Flutter mock.
        offers: prev.offers.length === 0 ? seedOffers() : prev.offers,
      }));
    } else {
      db.set((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === id ? moved : o)),
      }));
    }
    return mockJson(moved);
  }),

  http.post(mockPath('courier', 'orders/:id/cancel'), async ({ params }) => {
    await delay(LATENCY);
    const id = String(params.id);
    const row = db.get().orders.find((o) => o.id === id);
    if (!row) return mockError(404, 'courier/offer-not-found');
    if (row.status === 'pickedUp') return mockError(409, 'courier/cancel-after-pickup');
    db.set((state) => ({
      ...state,
      orders: state.orders.filter((o) => o.id !== id),
      activeOrderId: null,
      offers: [{ ...row, status: 'available' }, ...state.offers],
    }));
    return mockJson(null);
  }),

  http.get(mockPath('courier', 'history'), async ({ request }) => {
    await delay(LATENCY);
    return mockJson(mockPage(reviewed().history, request.url));
  }),

  http.get(mockPath('courier', 'earnings'), async () => {
    await delay(LATENCY);
    return mockJson(reviewed().earnings);
  }),
];

registerMockHandlers('courier', flagged(courierHandlers, 'courier'));
