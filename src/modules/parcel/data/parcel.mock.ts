/**
 * The parcel MSW slice — the whole "backend" of this module.
 *
 * Registered under `/api/mock/parcel/…` (`mockPath`), never the real host. Loaded lazily by
 * `core/mocks/modules.ts`; nothing in `src/core/mocks/**` needs editing.
 *
 * Demo state lives in `localStorage` key `ozio.mock.parcel`, so a reload keeps a shipment in
 * flight. Status progresses on read: a parcel created 6 s ago is `assigned`, +20 s `pickedUp`,
 * +30 s `delivered` — exactly the Flutter mock's timer chain, but derived from `createdAt` so it
 * also survives a reload instead of dying with the tab's timers.
 *
 * Money and the quote come from here (the "server"): no component computes a fee.
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

import type {
  Parcel,
  ParcelCourier,
  ParcelDraft,
  ParcelQuote,
  ParcelSpec,
  ParcelStatus,
} from './models/parcel';

/* ------------------------------------------------------------------ constants */

/** Flutter `MockParcelRepository`: 500 ms on every call. */
const LATENCY = 500;

const RULES = {
  maxWeightKg: 20,
  maxSideCm: 80,
  fromPrice: 3.5,
  fragileFee: 1,
  presets: [
    { id: 'envelope', code: 'S', lengthCm: 30, widthCm: 20, heightCm: 10, maxWeightKg: 2 },
    { id: 'small', code: 'M', lengthCm: 40, widthCm: 30, heightCm: 20, maxWeightKg: 5 },
    { id: 'medium', code: 'L', lengthCm: 60, widthCm: 40, heightCm: 30, maxWeightKg: 10 },
    { id: 'large', code: 'XL', lengthCm: 80, widthCm: 50, heightCm: 40, maxWeightKg: 20 },
  ],
  paymentMethods: ['cash', 'card', 'ozioBalance'],
  savedAddresses: [
    {
      id: 'addr-home',
      title: 'Ev',
      address: 'Nizami küç. 12',
      details: 'Giriş 2 · mərtəbə 3',
      contactName: 'Nurlan Qarayev',
      contactPhone: '+994 50 123 45 67',
    },
    {
      id: 'addr-work',
      title: 'İş',
      address: '28 May, Dilarə Əliyeva 251',
      details: 'Ofis 4',
      contactName: 'Nurlan Qarayev',
      contactPhone: '+994 50 123 45 67',
    },
    {
      id: 'addr-parents',
      title: 'Valideynlər',
      address: 'Nərimanov, Əhməd Rəcəbli 7',
      details: 'Blok 2 · mərtəbə 5 · mənzil 47',
      contactName: 'Aysel Məmmədova',
      contactPhone: '+994 55 321 45 67',
    },
  ],
  savedCards: [{ id: 'card-4417', mask: '•••• 4417' }],
  balance: 12.8,
} as const;

const COURIERS: readonly ParcelCourier[] = [
  { name: 'Elvin M.', phone: '+994 50 444 20 18', vehicle: 'scooter', rating: 4.9 },
  { name: 'Tural H.', phone: '+994 55 318 77 04', vehicle: 'bicycle', rating: 4.8 },
  { name: 'Kamran Ə.', phone: '+994 70 290 11 63', vehicle: 'car', rating: 5 },
];

/** Status timers of the Flutter mock, in ms after `createdAt`. */
const TIMERS = { assign: 6_000, pickup: 26_000, deliver: 56_000 } as const;

const r2 = (n: number): number => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ pricing */

/** Deterministic km from the two address strings (the Flutter hash), 1 dp. */
function distanceFor(draft: ParcelDraft): number {
  const { pickup, dropoff } = draft;
  if (
    pickup.lat !== undefined &&
    pickup.lng !== undefined &&
    dropoff.lat !== undefined &&
    dropoff.lng !== undefined
  ) {
    const dx = (pickup.lat - dropoff.lat) * 111;
    const dy = (pickup.lng - dropoff.lng) * 85;
    return Math.round(Math.max(0.5, Math.sqrt(dx * dx + dy * dy)) * 10) / 10;
  }
  const source = `${pickup.address}${dropoff.address}`;
  let h = 0;
  for (const ch of source) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  return Math.round((1.5 + (h % 110) / 10) * 10) / 10;
}

function priceFor(spec: ParcelSpec, km: number): ParcelQuote {
  const baseFee = 2.5;
  const distanceFee = r2(km * 0.6);
  const weightFee = r2(Math.max(0, spec.weightKg - 3) * 0.3);
  const fragileFee = spec.fragile ? RULES.fragileFee : 0;
  return {
    price: r2(baseFee + distanceFee + weightFee + fragileFee),
    baseFee,
    distanceFee,
    weightFee,
    fragileFee,
    distanceKm: km,
    etaMinutes: 15 + Math.round(km * 4),
  };
}

/** `null` when the spec is legal, otherwise the gateway message the repository surfaces. */
function specBreach(spec: ParcelSpec): string | null {
  if (spec.weightKg > RULES.maxWeightKg) return 'parcel/too-heavy';
  const side = Math.max(spec.lengthCm, spec.widthCm, spec.heightCm);
  if (side > RULES.maxSideCm) return 'parcel/side-too-long';
  if (spec.weightKg <= 0 || side <= 0) return 'parcel/invalid-spec';
  return null;
}

/* ------------------------------------------------------------------ seed */

const minutesAgo = (m: number): string => new Date(Date.now() - m * 60_000).toISOString();

const point = (
  address: string,
  details: string,
  contactName: string,
  contactPhone: string,
) => ({ address, details, contactName, contactPhone });

const seedSpec = (
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  weightKg: number,
  fragile: boolean,
  contents: string,
): ParcelSpec => ({ lengthCm, widthCm, heightCm, weightKg, fragile, contents });

/** Five shipments, one per status in the export (`baglama-esas.html`). */
function seedParcels(): Parcel[] {
  const rows: Array<[string, string, string, ParcelStatus, number, ParcelSpec, number]> = [
    ['20481', 'Nizami küç. 12', 'Xətai pr. 48', 'assigned', 18, seedSpec(40, 30, 20, 3.2, true, 'Geyim və aksesuar'), 3.2],
    ['20466', '28 May, Dilarə Əliyeva 251', 'Nərimanov, F. Xoyski 118', 'searching', 93, seedSpec(60, 40, 30, 8, false, 'Kitablar'), 5.8],
    ['20398', 'Yasamal, Ş. Mehdiyev 22', 'Gənclik, A. Nemətulla 9', 'delivered', 2_780, seedSpec(30, 20, 10, 1.4, false, 'Sənədlər'), 1.7],
    ['20311', 'Nəsimi, S. Vurğun 43', 'Binəqədi, Xətai 7', 'delivered', 9_210, seedSpec(80, 50, 40, 16, true, 'Ev əşyaları'), 7.8],
    ['20290', 'Nizami küç. 12', 'Sumqayıt yolu 3', 'cancelled', 12_030, seedSpec(40, 30, 20, 4, false, 'Hədiyyə'), 6.1],
  ];

  return rows.map(([number, from, to, status, ago, spec, km], index) => {
    const createdAt = minutesAgo(ago);
    const quote = priceFor(spec, km);
    const draft: ParcelDraft = {
      pickup: point(from, 'Giriş 2 · mərtəbə 3', 'Nurlan Qarayev', '+994 50 123 45 67'),
      dropoff: point(to, 'Blok 2 · mərtəbə 5 · mənzil 47', 'Aysel Məmmədova', '+994 55 321 45 67'),
      spec,
      payer: 'sender',
      paymentMethod: index === 0 ? 'card' : 'cash',
      ...(index === 0 ? { cardId: 'card-4417' } : {}),
      courierNote: index === 0 ? 'Qapı kodu 47#, zəng vurmayın' : '',
    };
    const created = new Date(createdAt).getTime();
    return {
      id: `p-${number}`,
      number: `PR-${number}`,
      status,
      draft,
      quote,
      ...(status === 'searching' || status === 'cancelled'
        ? {}
        : { courier: COURIERS[index % COURIERS.length] }),
      pickupCode: String(4821 + index * 37),
      deliveryCode: String(7203 + index * 53),
      createdAt,
      ...(status === 'assigned' || status === 'pickedUp' || status === 'delivered'
        ? { assignedAt: new Date(created + 4 * 60_000).toISOString() }
        : {}),
      ...(status === 'pickedUp' || status === 'delivered'
        ? { pickedUpAt: new Date(created + 21 * 60_000).toISOString() }
        : {}),
      ...(status === 'delivered'
        ? { deliveredAt: new Date(created + 35 * 60_000).toISOString() }
        : {}),
    };
  });
}

interface ParcelDbShape {
  parcels: Parcel[];
  /** The number sequence: `PR-<next>`, first create = 73411 (api/mock-modules.md §1). */
  sequence: number;
}

const db = createMockDb<ParcelDbShape>('parcel', () => ({
  parcels: seedParcels(),
  sequence: 73_410,
}));

/* ------------------------------------------------------------------ progression */

/**
 * Advances a freshly created parcel along the demo timeline, derived from `createdAt` so a reload
 * does not restart it. Returns the row to serve and persists the change when the status moved.
 */
function progressed(row: Parcel): Parcel {
  if (row.status === 'delivered' || row.status === 'cancelled') return row;
  const age = Date.now() - new Date(row.createdAt).getTime();

  let next = row;
  if (age >= TIMERS.assign && next.status === 'searching') {
    const pick = COURIERS[Math.abs(hash(row.id)) % COURIERS.length];
    next = {
      ...next,
      status: 'assigned',
      courier: pick,
      assignedAt: new Date(new Date(row.createdAt).getTime() + TIMERS.assign).toISOString(),
    };
  }
  if (age >= TIMERS.pickup && next.status === 'assigned') {
    next = {
      ...next,
      status: 'pickedUp',
      pickedUpAt: new Date(new Date(row.createdAt).getTime() + TIMERS.pickup).toISOString(),
    };
  }
  if (age >= TIMERS.deliver && next.status === 'pickedUp') {
    next = {
      ...next,
      status: 'delivered',
      deliveredAt: new Date(new Date(row.createdAt).getTime() + TIMERS.deliver).toISOString(),
    };
  }

  if (next !== row) {
    db.set((state) => ({
      ...state,
      parcels: state.parcels.map((p) => (p.id === next.id ? next : p)),
    }));
  }
  return next;
}

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}

const allProgressed = (): Parcel[] => db.get().parcels.map(progressed);

const code4 = (seed: number): string => String(1000 + (Math.abs(seed) % 9000));

/* ------------------------------------------------------------------ handlers */

export const parcelHandlers = [
  http.get(mockPath('parcel', 'rules'), async () => {
    await delay(LATENCY);
    return mockJson(RULES);
  }),

  http.post(mockPath('parcel', 'quote'), async ({ request }) => {
    await delay(400);
    const draft = (await request.json()) as ParcelDraft;
    const breach = specBreach(draft.spec);
    if (breach) return mockError(422, breach);
    if (
      draft.pickup.address.trim() !== '' &&
      draft.pickup.address.trim() === draft.dropoff.address.trim()
    ) {
      return mockError(422, 'parcel/same-address');
    }
    return mockJson(priceFor(draft.spec, distanceFor(draft)));
  }),

  http.post(mockPath('parcel', 'parcels'), async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { draft: ParcelDraft };
    const draft = body.draft;

    const breach = specBreach(draft.spec);
    if (breach) return mockError(422, breach);
    if (!RULES.paymentMethods.includes(draft.paymentMethod)) {
      return mockError(422, 'parcel/payment-method-unavailable');
    }
    if (draft.payer === 'recipient' && draft.paymentMethod !== 'cash') {
      return mockError(422, 'parcel/recipient-cash-only');
    }
    if (draft.paymentMethod === 'card' && !draft.cardId) {
      return mockError(422, 'parcel/card-missing');
    }

    const createdAt = new Date().toISOString();
    const sequence = db.get().sequence + 1;
    const row: Parcel = {
      id: `p-${sequence}`,
      number: `PR-${sequence}`,
      status: 'searching',
      draft,
      // The quote is recomputed here: the client's copy is display-only.
      quote: priceFor(draft.spec, distanceFor(draft)),
      pickupCode: code4(sequence * 7),
      deliveryCode: code4(sequence * 13 + 5),
      createdAt,
    };
    db.set((state) => ({ sequence, parcels: [row, ...state.parcels] }));
    return mockJson(row);
  }),

  http.get(mockPath('parcel', 'parcels'), async ({ request }) => {
    await delay(LATENCY);
    return mockJson(mockPage(allProgressed(), request.url));
  }),

  http.get(mockPath('parcel', 'parcels/:id'), async ({ params }) => {
    await delay(LATENCY);
    const id = String(params.id);
    const row = db.get().parcels.find((p) => p.id === id || p.number === id);
    if (!row) return mockError(404, 'parcel/not-found');
    return mockJson(progressed(row));
  }),

  http.post(mockPath('parcel', 'parcels/:id/cancel'), async ({ params }) => {
    await delay(LATENCY);
    const id = String(params.id);
    const row = db.get().parcels.find((p) => p.id === id || p.number === id);
    if (!row) return mockError(404, 'parcel/not-found');
    const live = progressed(row);
    if (live.status !== 'searching' && live.status !== 'assigned') {
      return mockError(409, 'parcel/cancel-too-late');
    }
    const cancelled: Parcel = { ...live, status: 'cancelled' };
    db.set((state) => ({
      ...state,
      parcels: state.parcels.map((p) => (p.id === cancelled.id ? cancelled : p)),
    }));
    return mockJson(cancelled);
  }),
];

registerMockHandlers('parcel', flagged(parcelHandlers, 'parcel'));
