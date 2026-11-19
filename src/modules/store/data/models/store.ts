/**
 * Store domain model — the one shape the UI knows, fed by **two** live sources with different
 * conventions (api/store.md "Module rules and semantics"):
 *
 * - `GET v1/stores/search?lat&lng` rows: flat store + `delivery_time_min/max`, `is_delivery_free`,
 *   `delivery_fee{price, distance(m)}|null`, and `open_time`/`close_time` written as **Baku
 *   wall-clock with a fake trailing `Z`** → read `HH:mm` literally (`bakuWallClock`).
 * - `GET v1/stores/{id}`: `{ store{…}, storeBonusPercentage[], storeHolidays[], brands[],
 *   is_user_favorite_store }`, `delivery_fee` is null, and the same two fields are **true UTC**
 *   → converted to Asia/Baku here.
 *
 * Nothing in this file throws.
 */
import {
  asList,
  asObj,
  bakuWallClock,
  bool,
  dateIso,
  int,
  money,
  nullableNum,
  nullableStr,
  num,
  pickTranslation,
  str,
} from '@/core/network';

export const BAKU_TIME_ZONE = 'Asia/Baku';

export interface StoreHours {
  /** `HH:mm`, Baku wall-clock. */
  open: string;
  /** `HH:mm`, Baku wall-clock. */
  close: string;
  openMinutes: number;
  closeMinutes: number;
  /** The store never closes (`00:00`–`23:59`, or both ends equal). */
  allDay: boolean;
}

export interface Store {
  id: number;
  name: string;
  address: string | null;
  logoUrl: string | null;
  /** `rating` arrives as a string ("0"); `null` when the server sent nothing usable. */
  rating: number | null;
  storeCategoryId: number | null;
  storeCategoryName: string | null;
  /** `modules.type` — "market" for grocery stores, also for travel / cinema partners. */
  moduleType: string | null;
  isWholesale: boolean;
  hasPacket: boolean;
  hours: StoreHours | null;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  preparationTime: number | null;
  /** `delivery_fee.price` — an estimate; the real fee comes from `orders/checkout`. */
  deliveryFee: number | null;
  isDeliveryFree: boolean;
  /** `delivery_fee.distance` is metres. */
  distanceKm: number | null;
  /** Current rate from `store_bonus_percentages` (newest entry whose `start_date` has passed). */
  bonusPercentage: number | null;
  currencyCode: string | null;
  /** `delivery_fee` is present → this store delivers to the requested point. */
  deliversHere: boolean;
  isFavorite: boolean;
}

export interface StoreDetail extends Store {
  /** `storeHolidays[]` — empty on live. ISO dates the store is closed. */
  holidays: string[];
  brandNames: string[];
}

export interface ParseStoreOptions {
  locale?: string;
  /**
   * `'search'` (default) reads `open_time`/`close_time` as Baku wall-clock with a fake `Z`;
   * `'detail'` reads them as true UTC instants and converts them to Asia/Baku.
   */
  source?: 'search' | 'detail';
}

/* ------------------------------------------------------------------ clocks */

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/** `HH:mm` of `date` in Asia/Baku. */
export function clockInBaku(date: Date): { hh: number; mm: number; text: string } {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: BAKU_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const hh = int(parts.find((p) => p.type === 'hour')?.value) % 24;
    const mm = int(parts.find((p) => p.type === 'minute')?.value);
    return { hh, mm, text: `${pad2(hh)}:${pad2(mm)}` };
  } catch {
    return { hh: 0, mm: 0, text: '' };
  }
}

/** Calendar date in Asia/Baku as `YYYY-MM-DD`. */
export function dateInBaku(date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: BAKU_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value ?? '';
    const m = parts.find((p) => p.type === 'month')?.value ?? '';
    const d = parts.find((p) => p.type === 'day')?.value ?? '';
    return y && m && d ? `${y}-${m}-${d}` : '';
  } catch {
    return '';
  }
}

/** Minutes since midnight, Baku. */
export const bakuNowMinutes = (now: Date = new Date()): number => {
  const { hh, mm } = clockInBaku(now);
  return hh * 60 + mm;
};

/** True-UTC instant → Baku `HH:mm` (the `GET stores/{id}` convention). */
function utcToBakuClock(value: unknown): { hh: number; mm: number; text: string } {
  const iso = dateIso(value);
  if (!iso) return { hh: 0, mm: 0, text: '' };
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { hh: 0, mm: 0, text: '' };
  return clockInBaku(parsed);
}

function parseHours(raw: Record<string, unknown>, source: 'search' | 'detail'): StoreHours | null {
  const read = source === 'detail' ? utcToBakuClock : bakuWallClock;
  const open = read(raw.open_time);
  const close = read(raw.close_time);
  if (!open.text || !close.text) return null;
  const openMinutes = open.hh * 60 + open.mm;
  const closeMinutes = close.hh * 60 + close.mm;
  return {
    open: open.text,
    close: close.text,
    openMinutes,
    closeMinutes,
    // store 1 is 00:00–23:59 Baku, i.e. always open.
    allDay: openMinutes === closeMinutes || (openMinutes === 0 && closeMinutes >= 23 * 60 + 59),
  };
}

/** Opening hours → open right now? Unknown hours count as open (the API is the only source). */
export function isOpenNow(
  hours: StoreHours | null,
  holidays: readonly string[] = [],
  now: Date = new Date(),
): boolean {
  if (holidays.includes(dateInBaku(now))) return false;
  if (!hours || hours.allDay) return true;
  const minutes = bakuNowMinutes(now);
  return hours.openMinutes <= hours.closeMinutes
    ? minutes >= hours.openMinutes && minutes <= hours.closeMinutes
    : // overnight window (e.g. 20:00 – 04:00)
      minutes >= hours.openMinutes || minutes <= hours.closeMinutes;
}

/** `HH:mm` + n minutes, wrapped at 24 h — the "İlk çatdırılma" line on the closed-store header. */
export function addMinutesToClock(clock: string, minutes: number): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(clock);
  if (!m) return clock;
  const total = (int(m[1]) * 60 + int(m[2]) + Math.max(0, minutes)) % (24 * 60);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/* ----------------------------------------------------------------- parsers */

/**
 * `store_bonus_percentages` is a history, newest first: the current rate is the newest entry whose
 * `start_date` has passed and that is not soft-deleted. Never take `[0]` blindly.
 */
export function currentBonusPercentage(list: unknown, now: Date = new Date()): number | null {
  const rows = asList(list).map(asObj);
  let best: { at: number; value: number } | null = null;
  for (const row of rows) {
    if (row.deleted_at !== undefined && row.deleted_at !== null) continue;
    const start = dateIso(row.start_date);
    const at = start ? Date.parse(start) : 0;
    if (Number.isFinite(at) && at > now.getTime()) continue;
    if (!best || at > best.at) best = { at, value: money(row.percentage) };
  }
  return best ? best.value : null;
}

function logoFrom(raw: Record<string, unknown>): string | null {
  // `object_key` is already an absolute CDN URL — use as-is (api/store.md §Images).
  const branches = asObj(raw.store_branches);
  for (const entry of asList(branches.store_branches_uploads).map(asObj)) {
    const url = nullableStr(asObj(entry.uploads).object_key);
    if (url) return url;
  }
  const direct = asList(raw.store_branches).map(asObj);
  for (const branch of direct) {
    for (const entry of asList(branch.store_branches_uploads).map(asObj)) {
      const url = nullableStr(asObj(entry.uploads).object_key);
      if (url) return url;
    }
  }
  return null;
}

function ratingOf(raw: Record<string, unknown>): number | null {
  const value = nullableNum(raw.rating);
  return value === null || value <= 0 ? null : value;
}

/** One `stores/search` row (or the `store` object of `stores/{id}`) → `Store`. */
export function parseStore(raw: unknown, opts: ParseStoreOptions = {}): Store {
  const o = asObj(raw);
  const locale = opts.locale ?? 'az';
  const source = opts.source ?? 'search';
  const fee = o.delivery_fee === null || o.delivery_fee === undefined ? null : asObj(o.delivery_fee);
  const storeCategory = asObj(o.store_categories);
  const distanceMetres = fee ? nullableNum(fee.distance) : null;

  return {
    id: int(o.id),
    name: pickTranslation(o.store_translations, locale) || str(o.store_code) || '—',
    address: nullableStr(o.address),
    logoUrl: logoFrom(o),
    rating: ratingOf(o),
    storeCategoryId: nullableNum(storeCategory.id),
    storeCategoryName: pickTranslation(storeCategory.store_category_translations, locale) || null,
    moduleType: nullableStr(asObj(o.modules).type),
    isWholesale: bool(o.is_wholesale),
    hasPacket: bool(o.has_packet),
    hours: parseHours(o, source),
    deliveryTimeMin: nullableNum(o.delivery_time_min),
    deliveryTimeMax: nullableNum(o.delivery_time_max),
    preparationTime: nullableNum(o.preparation_time),
    deliveryFee: fee ? money(fee.price) : null,
    isDeliveryFree: bool(o.is_delivery_free),
    distanceKm: distanceMetres === null ? null : Math.round((distanceMetres / 1000) * 10) / 10,
    bonusPercentage: currentBonusPercentage(o.store_bonus_percentages),
    currencyCode: nullableStr(asObj(o.currencies).code),
    deliversHere: fee !== null,
    isFavorite: bool(o.is_user_favorite_store ?? o.is_favorite),
  };
}

/** The whole `data` object of `GET v1/stores/{id}` → `StoreDetail`. */
export function parseStoreDetail(raw: unknown, opts: ParseStoreOptions = {}): StoreDetail {
  const data = asObj(raw);
  const locale = opts.locale ?? 'az';
  const base = parseStore(data.store, { locale, source: 'detail' });

  // `storeBonusPercentage[0]` is the server's own pick of the current rate.
  const serverPick = asList(data.storeBonusPercentage).map(asObj)[0];
  const bonus =
    serverPick === undefined ? base.bonusPercentage : money(serverPick.percentage);

  const holidays: string[] = [];
  for (const entry of asList(data.storeHolidays).map(asObj)) {
    const iso = dateIso(entry.date ?? entry.holiday_date ?? entry.start_date);
    if (iso) holidays.push(iso.slice(0, 10));
  }

  const brandNames: string[] = [];
  for (const entry of asList(data.brands).map(asObj)) {
    const brand = asObj(entry.brands);
    const name = pickTranslation(brand.brand_translations, locale);
    if (name) brandNames.push(name);
  }

  const categoryName =
    base.storeCategoryName ?? nullableStr(asObj(data.category).name) ?? null;

  return {
    ...base,
    storeCategoryName: categoryName,
    bonusPercentage: bonus,
    isFavorite: bool(data.is_user_favorite_store),
    holidays,
    brandNames,
  };
}

/* ------------------------------------------------------- store categories */

/** A row of `GET v1/categories/stores` — a store CATEGORY, not a store. */
export interface StoreCategory {
  id: number;
  name: string;
  imageUrl: string | null;
  searchCount: number | null;
  moduleType: string | null;
}

export function parseStoreCategory(raw: unknown, opts: { locale?: string } = {}): StoreCategory {
  const o = asObj(raw);
  let imageUrl: string | null = null;
  for (const entry of asList(o.store_categories_uploads).map(asObj)) {
    const url = nullableStr(asObj(entry.uploads).object_key);
    if (url) {
      imageUrl = url;
      break;
    }
  }
  return {
    id: int(o.id),
    name: pickTranslation(o.store_category_translations, opts.locale ?? 'az') || '—',
    imageUrl,
    searchCount: nullableNum(o.search_count),
    moduleType: nullableStr(asObj(o.modules).type),
  };
}

/** Delivering stores first, nearest first; everything else keeps the server order. */
export function sortStoresByDistance(stores: readonly Store[]): Store[] {
  return [...stores].sort((a, b) => {
    if (a.deliversHere !== b.deliversHere) return a.deliversHere ? -1 : 1;
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return num(a.id) - num(b.id);
  });
}
