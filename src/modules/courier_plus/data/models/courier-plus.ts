/**
 * Domain models for `courier_plus` + tolerant parsers.
 *
 * Shapes mirror `CpRoute` / `CpParcelOffer` / `CpDelivery` / `CpEarnings` / `CpOverview` /
 * `CpHubProfile` / `CpHubParcel` / `CpHubDashboard` / `CpNearbyHub` in
 * `src/core/api/contracts/mock-contracts.ts` (api/mock-modules.md §3), read through
 * `snake_case` JSON exactly as the PROPOSED REST would send it, so a real backend only means
 * changing the remote URL and deleting the MSW handler.
 *
 * **No parser throws.** Every field falls back to a safe value.
 */
import { asList, asObj, bool, int, money, num, pickTranslation, str } from '@/core/network';

/* ------------------------------------------------------------------ transport */

export const CP_TRANSPORTS = ['walk', 'metro', 'bus', 'car', 'bike'] as const;
export type CpTransport = (typeof CP_TRANSPORTS)[number];

const isTransport = (v: string): v is CpTransport =>
  (CP_TRANSPORTS as readonly string[]).includes(v);

export const parseTransport = (v: unknown, d: CpTransport = 'metro'): CpTransport => {
  const raw = str(v).toLowerCase();
  return isTransport(raw) ? raw : d;
};

/* ------------------------------------------------------------------ time of day */

/** Minutes after midnight, clamped to a real day. `1090` → `18:10`. */
export const clampMinutes = (v: number): number => Math.min(24 * 60 - 1, Math.max(0, Math.round(v)));

/** `1090` → `"18:10"` (Baku wall clock, read literally — never converted). */
export function minutesToClock(minutes: number): string {
  const m = clampMinutes(minutes);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** `"18:10"` → `1090`; anything unparseable → `null`. */
export function clockToMinutes(value: string): number | null {
  const match = /^\s*(\d{1,2})\s*[:.]\s*(\d{2})\s*$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return null;
  if (hours > 23 || mins > 59) return null;
  return hours * 60 + mins;
}

/* ------------------------------------------------------------------ route */

export interface CpRoute {
  from: string;
  to: string;
  /** Minutes after midnight. */
  departMinutes: number;
  transport: CpTransport;
  active: boolean;
}

export function parseRoute(raw: unknown): CpRoute {
  const o = asObj(raw);
  return {
    from: str(o.from ?? o.from_address),
    to: str(o.to ?? o.to_address),
    departMinutes: clampMinutes(num(o.depart_minutes ?? o.departMinutes, 8 * 60 + 30)),
    transport: parseTransport(o.transport),
    active: bool(o.active),
  };
}

/** The route is usable for matching only once both ends are filled in. */
export const isRouteDeclared = (route: CpRoute | null | undefined): boolean =>
  Boolean(route && route.from.trim() && route.to.trim());

/* ------------------------------------------------------------------ offers */

export interface CpParcelOffer {
  id: string;
  /** Pick-up label, already localized by the repository. */
  pickup: string;
  /** Drop-off label, already localized by the repository. */
  dropoff: string;
  /** Server-computed fee in AZN. The client never derives it. */
  pay: number;
  /** Server-computed extra minutes this parcel adds to the declared route. */
  detourMinutes: number;
  /** Extra distance the detour adds, in km (server-computed). */
  detourKm: number;
  weightKg: number;
  distanceKm: number;
}

export interface ParseOptions {
  locale?: string;
}

export function parseOffer(raw: unknown, opts: ParseOptions = {}): CpParcelOffer {
  const o = asObj(raw);
  const locale = opts.locale ?? 'az';
  return {
    id: str(o.id),
    pickup: localized(o, 'pickup', locale),
    dropoff: localized(o, 'dropoff', locale),
    pay: money(o.pay),
    detourMinutes: int(o.detour_minutes ?? o.detourMinutes),
    detourKm: Math.round(num(o.detour_km ?? o.detourKm) * 10) / 10,
    weightKg: Math.round(num(o.weight_kg ?? o.weightKg) * 10) / 10,
    distanceKm: Math.round(num(o.distance_km ?? o.distanceKm) * 10) / 10,
  };
}

/**
 * `pickup` + `pickup_translations: [{ locale, name }]`, exactly like the catalog rows on the real
 * API: the translated label wins, the plain field is the az fallback.
 */
function localized(o: Record<string, unknown>, field: string, locale: string): string {
  const translated = pickTranslation(o[`${field}_translations`], locale);
  return translated || str(o[field]);
}

/* ------------------------------------------------------------------ delivery */

/** `0` accepted · `1` picked up · `2` on the way · `3` delivered. */
export type CpStep = 0 | 1 | 2 | 3;

export const CP_LAST_STEP: CpStep = 3;

export interface CpDelivery {
  offer: CpParcelOffer;
  step: CpStep;
}

export const parseStep = (v: unknown): CpStep => {
  const n = int(v);
  return (n < 0 ? 0 : n > CP_LAST_STEP ? CP_LAST_STEP : n) as CpStep;
};

export function parseDelivery(raw: unknown, opts: ParseOptions = {}): CpDelivery {
  const o = asObj(raw);
  return { offer: parseOffer(o.offer, opts), step: parseStep(o.step) };
}

export const isDeliveryDone = (d: CpDelivery): boolean => d.step >= CP_LAST_STEP;

/* ------------------------------------------------------------------ earnings */

export interface CpEarningEntry {
  id: string;
  title: string;
  amount: number;
  /** ISO timestamp — the view formats it with `useFormat()`, never the fixture. */
  at: string;
  /**
   * Whole days between the entry and "now", **as the server counted them**. The view uses it to
   * choose between "dünən" and a date, so it never has to read the clock during a render.
   */
  daysAgo: number;
}

export interface CpEarnings {
  balance: number;
  today: number;
  month: number;
  deliveries: number;
  history: CpEarningEntry[];
}

export function parseEarningEntry(
  raw: unknown,
  index = 0,
  opts: ParseOptions = {},
): CpEarningEntry {
  const o = asObj(raw);
  return {
    id: str(o.id) || `e-${index}`,
    title: localized(o, 'title', opts.locale ?? 'az'),
    amount: money(o.amount),
    at: str(o.at ?? o.when_at ?? o.created_at),
    daysAgo: Math.max(0, int(o.days_ago ?? o.daysAgo)),
  };
}

export function parseEarnings(raw: unknown, opts: ParseOptions = {}): CpEarnings {
  const o = asObj(raw);
  return {
    balance: money(o.balance),
    today: money(o.today),
    month: money(o.month),
    deliveries: int(o.deliveries),
    history: asList(o.history).map((row, i) => parseEarningEntry(row, i, opts)),
  };
}

/* ------------------------------------------------------------------ overview */

export interface CpOverview {
  balance: number;
  today: number;
  month: number;
  deliveries: number;
  routeActive: boolean;
  hubRegistered: boolean;
  activeDeliveryId: string | null;
  /** How many neighbour hubs the mock found nearby — the landing's hub card line. */
  nearbyHubCount: number;
  /** Commission per hand-over, in AZN. Server data: the card copy interpolates it. */
  hubCommission: number;
}

export function parseOverview(raw: unknown): CpOverview {
  const o = asObj(raw);
  const activeId = str(o.active_delivery_id ?? o.activeDeliveryId);
  return {
    balance: money(o.balance),
    today: money(o.today),
    month: money(o.month),
    deliveries: int(o.deliveries),
    routeActive: bool(o.route_active ?? o.routeActive),
    hubRegistered: bool(o.hub_registered ?? o.hubRegistered),
    activeDeliveryId: activeId ? activeId : null,
    nearbyHubCount: int(o.nearby_hub_count ?? o.nearbyHubCount),
    hubCommission: money(o.hub_commission ?? o.hubCommission),
  };
}

/* ------------------------------------------------------------------ hub */

export interface CpHubProfile {
  address: string;
  openMinutes: number;
  closeMinutes: number;
  capacity: number;
}

export function parseHubProfile(raw: unknown): CpHubProfile {
  const o = asObj(raw);
  return {
    address: str(o.address),
    openMinutes: clampMinutes(num(o.open_minutes ?? o.openMinutes, 9 * 60)),
    closeMinutes: clampMinutes(num(o.close_minutes ?? o.closeMinutes, 21 * 60)),
    capacity: Math.max(1, int(o.capacity, 10)),
  };
}

export interface CpHubParcel {
  id: string;
  recipient: string;
  /** How long it has been waiting, in minutes — the row renders it through a plural message. */
  waitingMinutes: number;
  commission: number;
}

export function parseHubParcel(raw: unknown): CpHubParcel {
  const o = asObj(raw);
  return {
    id: str(o.id),
    recipient: str(o.recipient),
    waitingMinutes: Math.max(0, int(o.waiting_minutes ?? o.waitingMinutes)),
    commission: money(o.commission),
  };
}

export interface CpHubDashboard {
  profile: CpHubProfile;
  waiting: CpHubParcel[];
  commissionToday: number;
  commissionMonth: number;
  handedToday: number;
}

export function parseHubDashboard(raw: unknown): CpHubDashboard {
  const o = asObj(raw);
  return {
    profile: parseHubProfile(o.profile),
    waiting: asList(o.waiting).map(parseHubParcel),
    commissionToday: money(o.commission_today ?? o.commissionToday),
    commissionMonth: money(o.commission_month ?? o.commissionMonth),
    handedToday: int(o.handed_today ?? o.handedToday),
  };
}

export interface CpNearbyHub {
  id: string;
  name: string;
  address: string;
  distanceMeters: number;
  openMinutes: number;
  closeMinutes: number;
}

export function parseNearbyHub(raw: unknown, opts: ParseOptions = {}): CpNearbyHub {
  const o = asObj(raw);
  const locale = opts.locale ?? 'az';
  return {
    id: str(o.id),
    name: localized(o, 'name', locale),
    address: localized(o, 'address', locale),
    distanceMeters: Math.max(0, int(o.distance_meters ?? o.distanceMeters)),
    openMinutes: clampMinutes(num(o.open_minutes ?? o.openMinutes, 9 * 60)),
    closeMinutes: clampMinutes(num(o.close_minutes ?? o.closeMinutes, 21 * 60)),
  };
}

/** `true` while `now` (minutes after midnight) falls inside the hub's opening hours. */
export function isHubOpenAt(profile: CpHubProfile, nowMinutes: number): boolean {
  const open = profile.openMinutes;
  const close = profile.closeMinutes;
  return close >= open
    ? nowMinutes >= open && nowMinutes < close
    : nowMinutes >= open || nowMinutes < close;
}
