/**
 * MSW handlers + in-memory db for `courier_plus` (api/mock-modules.md §3).
 *
 * This file **is** the demo backend. It owns every decision the client must not make:
 * which parcels match the declared route, what the detour costs, what the fee is, whether a
 * hand-over code is right. The client only renders what comes back.
 *
 * Everything lives under `/api/mock/courier_plus/…` (`mockPath`) — the real host has no
 * courier-plus service at all (the gateway answers plain text `Backend service does not exist`),
 * so a request must never leave for it.
 *
 * Shapes are `snake_case` + `*_translations: [{ locale, name }]`, exactly like the real API, so
 * swapping in a backend means changing the URL in `courier_plus.remote.ts` and deleting this file.
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockJson,
  mockPage,
  mockPath,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

import {
  CP_EARNINGS_SEED,
  CP_HISTORY_SEEDS,
  CP_HUB_COMMISSION,
  CP_HUB_PARCEL_SEEDS,
  CP_HUB_PROFILE_SEED,
  CP_HUB_STATS_SEED,
  CP_NEARBY_HUB_SEEDS,
  CP_OFF_CORRIDOR_PENALTY_MINUTES,
  CP_PARCEL_SEEDS,
  CP_PRICING,
  CP_ROUTE_SEED,
  CP_TRANSPORT_RULES,
  type L10nText,
  type ParcelSeed,
} from './courier_plus.fixtures';

/* ------------------------------------------------------------------ latency */

/** api/mock-modules.md §3: 500 ms on every call. */
const LATENCY = 500;
const WRITE_LATENCY = 650;

/* ------------------------------------------------------------------ the db */

type Transport = keyof typeof CP_TRANSPORT_RULES;

interface StoredRoute {
  from: string;
  to: string;
  departMinutes: number;
  transport: Transport;
  active: boolean;
}

interface StoredHistory {
  id: string;
  title: L10nText;
  amount: number;
  at: string;
}

interface StoredHubParcel {
  id: string;
  recipient: string;
  code: string;
  waitingMinutes: number;
  commission: number;
}

interface StoredHub {
  address: string;
  openMinutes: number;
  closeMinutes: number;
  capacity: number;
}

interface CpDbShape {
  route: StoredRoute;
  /** Offer ids that are no longer on the board. */
  taken: string[];
  /** offerId → step. */
  deliveries: Record<string, number>;
  activeDeliveryId: string | null;
  balance: number;
  today: number;
  month: number;
  deliveryCount: number;
  history: StoredHistory[];
  hub: StoredHub | null;
  hubWaiting: StoredHubParcel[];
  commissionToday: number;
  commissionMonth: number;
  handedToday: number;
}

const daysAgoIso = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const seed = (): CpDbShape => ({
  route: { ...CP_ROUTE_SEED },
  taken: [],
  deliveries: {},
  activeDeliveryId: null,
  balance: CP_EARNINGS_SEED.balance,
  today: CP_EARNINGS_SEED.today,
  month: CP_EARNINGS_SEED.month,
  deliveryCount: CP_EARNINGS_SEED.deliveries,
  history: CP_HISTORY_SEEDS.map((h) => ({
    id: h.id,
    title: { ...h.title },
    amount: h.amount,
    at: daysAgoIso(h.dayOffset),
  })),
  // The hub starts unregistered, so `/courier-plus/hub` opens on its gate state.
  hub: null,
  hubWaiting: CP_HUB_PARCEL_SEEDS.map((p) => ({ ...p })),
  commissionToday: CP_HUB_STATS_SEED.commissionToday,
  commissionMonth: CP_HUB_STATS_SEED.commissionMonth,
  handedToday: CP_HUB_STATS_SEED.handedToday,
});

/** Persisted to `localStorage` under `ozio.mock.courier_plus`, so a reload keeps the demo going. */
const db = createMockDb<CpDbShape>('courier_plus', seed);

/* ------------------------------------------------------------------ money / matching */

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** The quoted fee. The client never computes this. */
const feeFor = (p: ParcelSeed): number =>
  round2(
    p.baseFee + p.distanceKm * CP_PRICING.perKm + Math.max(0, p.weightKg - 1) * CP_PRICING.perKgOverOne,
  );

const rulesFor = (transport: Transport) => CP_TRANSPORT_RULES[transport] ?? CP_TRANSPORT_RULES.metro;

/** Lower-cased route text the corridor test runs against. */
const corridorText = (route: StoredRoute): string => `${route.from} ${route.to}`.toLowerCase();

/** Extra minutes this parcel adds to the declared route, scaled by the transport. */
function detourFor(p: ParcelSeed, route: StoredRoute): number {
  const onCorridor = p.areas.some((area) => corridorText(route).includes(area));
  const base = p.baseDetourMinutes + (onCorridor ? 0 : CP_OFF_CORRIDOR_PENALTY_MINUTES);
  return Math.round(base * rulesFor(route.transport).detourFactor);
}

/** Extra kilometres, scaled the same way (the map's text alternative quotes it). */
const detourKmFor = (p: ParcelSeed, route: StoredRoute): number =>
  Math.round(p.detourKm * rulesFor(route.transport).detourFactor * 10) / 10;

/**
 * The matching itself: a declared, active route with both ends filled in, a detour the transport
 * tolerates, and a parcel that transport can actually carry.
 */
function matchesFor(state: CpDbShape): Array<{ seed: ParcelSeed; detour: number; detourKm: number }> {
  const route = state.route;
  if (!route.active || !route.from.trim() || !route.to.trim()) return [];
  const rules = rulesFor(route.transport);

  return CP_PARCEL_SEEDS.filter((p) => !state.taken.includes(p.id))
    .map((p) => ({ seed: p, detour: detourFor(p, route), detourKm: detourKmFor(p, route) }))
    .filter((m) => m.detour <= rules.maxDetourMinutes && m.seed.weightKg <= rules.maxWeightKg)
    .sort((a, b) => a.detour - b.detour || feeFor(b.seed) - feeFor(a.seed));
}

/* ------------------------------------------------------------------ wire shapes */

const translations = (text: L10nText) => [
  { locale: 'az', name: text.az },
  { locale: 'ru', name: text.ru },
  { locale: 'en', name: text.en },
];

const offerJson = (m: { seed: ParcelSeed; detour: number; detourKm: number }) => ({
  id: m.seed.id,
  pickup: m.seed.pickup.az,
  pickup_translations: translations(m.seed.pickup),
  dropoff: m.seed.dropoff.az,
  dropoff_translations: translations(m.seed.dropoff),
  pay: feeFor(m.seed),
  detour_minutes: m.detour,
  detour_km: m.detourKm,
  weight_kg: m.seed.weightKg,
  distance_km: m.seed.distanceKm,
});

/** An accepted parcel keeps its quoted detour even after the route changes under it. */
function acceptedOfferJson(state: CpDbShape, offerId: string) {
  const found = CP_PARCEL_SEEDS.find((p) => p.id === offerId);
  if (!found) return null;
  return offerJson({
    seed: found,
    detour: detourFor(found, state.route),
    detourKm: detourKmFor(found, state.route),
  });
}

const routeJson = (r: StoredRoute) => ({
  from: r.from,
  to: r.to,
  depart_minutes: r.departMinutes,
  transport: r.transport,
  active: r.active,
});

const hubJson = (h: StoredHub) => ({
  address: h.address,
  open_minutes: h.openMinutes,
  close_minutes: h.closeMinutes,
  capacity: h.capacity,
});

const hubParcelJson = (p: StoredHubParcel) => ({
  id: p.id,
  recipient: p.recipient,
  waiting_minutes: p.waitingMinutes,
  commission: p.commission,
  // `code` is deliberately NOT sent: only the handler compares it.
});

/** Whole days between `at` and now — the client decides wording from this, not from its own clock. */
function daysAgo(at: string): number {
  const time = Date.parse(at);
  if (Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / (24 * 60 * 60 * 1000)));
}

const earningsJson = (state: CpDbShape) => ({
  balance: round2(state.balance),
  today: round2(state.today),
  month: round2(state.month),
  deliveries: state.deliveryCount,
  history: state.history.map((h) => ({
    id: h.id,
    title: h.title.az,
    title_translations: translations(h.title),
    amount: h.amount,
    at: h.at,
    days_ago: daysAgo(h.at),
  })),
});

/* ------------------------------------------------------------------ body reading */

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const json: unknown = await request.json();
    return json !== null && typeof json === 'object' && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

const asTransport = (v: unknown): Transport => {
  const raw = typeof v === 'string' ? v : '';
  return raw in CP_TRANSPORT_RULES ? (raw as Transport) : 'metro';
};

const asMinutes = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(24 * 60 - 1, Math.max(0, Math.round(n)));
};

const asText = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/* ------------------------------------------------------------------ handlers */

export const courierPlusHandlers = [
  /** The landing's hero + the three card states. */
  http.get(mockPath('courier_plus', 'overview'), async () => {
    await delay(LATENCY);
    const state = db.get();
    return mockJson({
      balance: round2(state.balance),
      today: round2(state.today),
      month: round2(state.month),
      deliveries: state.deliveryCount,
      route_active: state.route.active && Boolean(state.route.from.trim() && state.route.to.trim()),
      hub_registered: state.hub !== null,
      active_delivery_id: state.activeDeliveryId,
      nearby_hub_count: CP_NEARBY_HUB_SEEDS.length,
      hub_commission: CP_HUB_COMMISSION,
    });
  }),

  http.get(mockPath('courier_plus', 'route'), async () => {
    await delay(LATENCY);
    return mockJson(routeJson(db.get().route));
  }),

  /** `saveRoute` always turns courier mode on, as the Flutter mock does. */
  http.put(mockPath('courier_plus', 'route'), async ({ request }) => {
    await delay(WRITE_LATENCY);
    const body = await readBody(request);
    const from = asText(body.from);
    const to = asText(body.to);
    if (!from || !to) return mockError(422, 'Marşrutun hər iki ucunu doldur');
    if (from.toLowerCase() === to.toLowerCase()) {
      return mockError(422, 'Başlanğıc və son ünvan eyni ola bilməz');
    }
    const next = db.set((prev) => ({
      ...prev,
      route: {
        from,
        to,
        departMinutes: asMinutes(body.depart_minutes ?? body.departMinutes, prev.route.departMinutes),
        transport: asTransport(body.transport),
        active: true,
      },
    }));
    return mockJson(routeJson(next.route));
  }),

  /** The matching lives here: the route in, the fee + detour out. */
  http.get(mockPath('courier_plus', 'matches'), async ({ request }) => {
    await delay(400);
    const rows = matchesFor(db.get()).map(offerJson);
    return mockJson(mockPage(rows, request.url));
  }),

  http.post(mockPath('courier_plus', 'offers/:id/accept'), async ({ params }) => {
    await delay(WRITE_LATENCY);
    const id = String(params.id ?? '');
    const state = db.get();
    const available = matchesFor(state).some((m) => m.seed.id === id);
    if (!available) return mockError(404, 'Sifariş artıq götürülüb');

    const next = db.set((prev) => ({
      ...prev,
      taken: [...prev.taken, id],
      deliveries: { ...prev.deliveries, [id]: 0 },
      activeDeliveryId: id,
    }));
    return mockJson({ offer: acceptedOfferJson(next, id), step: 0 });
  }),

  http.get(mockPath('courier_plus', 'deliveries/:id'), async ({ params }) => {
    await delay(LATENCY);
    const id = String(params.id ?? '');
    const state = db.get();
    const step = state.deliveries[id];
    const offer = acceptedOfferJson(state, id);
    if (step === undefined || offer === null) return mockError(404, 'Çatdırılma tapılmadı');
    return mockJson({ offer, step });
  }),

  /**
   * One step forward. Reaching the last step credits the fee to the balance, counts the delivery,
   * prepends a history row and clears the active delivery.
   */
  http.post(mockPath('courier_plus', 'deliveries/:id/advance'), async ({ params }) => {
    await delay(WRITE_LATENCY);
    const id = String(params.id ?? '');
    const current = db.get();
    const step = current.deliveries[id];
    const parcel = CP_PARCEL_SEEDS.find((p) => p.id === id);
    if (step === undefined || !parcel) return mockError(404, 'Çatdırılma tapılmadı');

    const nextStep = Math.min(3, step + 1);
    const credited = nextStep === 3 && step < 3;
    const pay = feeFor(parcel);

    const next = db.set((prev) => {
      const base = { ...prev, deliveries: { ...prev.deliveries, [id]: nextStep } };
      if (!credited) return base;
      const title: L10nText = {
        az: `${parcel.pickup.az} → ${parcel.dropoff.az}`,
        ru: `${parcel.pickup.ru} → ${parcel.dropoff.ru}`,
        en: `${parcel.pickup.en} → ${parcel.dropoff.en}`,
      };
      return {
        ...base,
        balance: round2(prev.balance + pay),
        today: round2(prev.today + pay),
        month: round2(prev.month + pay),
        deliveryCount: prev.deliveryCount + 1,
        history: [
          { id: `e-${id}-${Date.now().toString(36)}`, title, amount: pay, at: new Date().toISOString() },
          ...prev.history,
        ],
        activeDeliveryId: null,
      };
    });

    const offer = acceptedOfferJson(next, id);
    if (offer === null) return mockError(404, 'Çatdırılma tapılmadı');
    return mockJson({ offer, step: nextStep });
  }),

  http.get(mockPath('courier_plus', 'earnings'), async () => {
    await delay(LATENCY);
    return mockJson(earningsJson(db.get()));
  }),

  /** 404 until the hub is registered — the repository turns that into `null`, not an error. */
  http.get(mockPath('courier_plus', 'hub'), async () => {
    await delay(LATENCY);
    const hub = db.get().hub;
    if (hub === null) return mockError(404, 'Məntəqə qeydiyyatdan keçməyib');
    return mockJson(hubJson(hub));
  }),

  http.put(mockPath('courier_plus', 'hub'), async ({ request }) => {
    await delay(WRITE_LATENCY);
    const body = await readBody(request);
    const address = asText(body.address);
    if (!address) return mockError(422, 'Ünvanı doldur');
    const open = asMinutes(body.open_minutes ?? body.openMinutes, CP_HUB_PROFILE_SEED.openMinutes);
    const close = asMinutes(body.close_minutes ?? body.closeMinutes, CP_HUB_PROFILE_SEED.closeMinutes);
    if (close <= open) return mockError(422, 'Bağlanış saatı açılışdan sonra olmalıdır');
    const capacityRaw = Number(body.capacity);
    const capacity = Number.isFinite(capacityRaw) && capacityRaw > 0 ? Math.round(capacityRaw) : 10;

    const hub: StoredHub = { address, openMinutes: open, closeMinutes: close, capacity };
    db.set((prev) => ({ ...prev, hub }));
    return mockJson(hubJson(hub));
  }),

  http.get(mockPath('courier_plus', 'hub/dashboard'), async () => {
    await delay(LATENCY);
    const state = db.get();
    if (state.hub === null) return mockError(404, 'Məntəqə qeydiyyatdan keçməyib');
    return mockJson({
      profile: hubJson(state.hub),
      waiting: state.hubWaiting.map(hubParcelJson),
      commission_today: round2(state.commissionToday),
      commission_month: round2(state.commissionMonth),
      handed_today: state.handedToday,
    });
  }),

  /** The code check. A wrong code is a 404 with the drawn message; the code is never echoed back. */
  http.post(mockPath('courier_plus', 'hub/handover'), async ({ request }) => {
    await delay(WRITE_LATENCY);
    const body = await readBody(request);
    const code = asText(body.code);
    const state = db.get();
    if (state.hub === null) return mockError(404, 'Məntəqə qeydiyyatdan keçməyib');
    const parcel = state.hubWaiting.find((p) => p.code === code);
    if (!code || !parcel) return mockError(404, 'Kod yanlışdır');

    db.set((prev) => ({
      ...prev,
      hubWaiting: prev.hubWaiting.filter((p) => p.id !== parcel.id),
      commissionToday: round2(prev.commissionToday + parcel.commission),
      commissionMonth: round2(prev.commissionMonth + parcel.commission),
      handedToday: prev.handedToday + 1,
    }));
    return mockJson(hubParcelJson(parcel));
  }),

  http.get(mockPath('courier_plus', 'hubs/nearby'), async ({ request }) => {
    await delay(LATENCY);
    const rows = CP_NEARBY_HUB_SEEDS.map((h) => ({
      id: h.id,
      name: h.name.az,
      name_translations: translations(h.name),
      address: h.address.az,
      address_translations: translations(h.address),
      distance_meters: h.distanceMeters,
      open_minutes: h.openMinutes,
      close_minutes: h.closeMinutes,
    }));
    return mockJson(mockPage(rows, request.url, 'hubs'));
  }),
];

registerMockHandlers('courier_plus', flagged(courierPlusHandlers, 'courierPlus'));
