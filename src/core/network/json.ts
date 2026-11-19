/**
 * Tolerant JSON readers — the API is reverse-engineered, every field is optional and decimals
 * arrive as strings on some endpoints and numbers on others (api/README.md).
 *
 * **Nothing in this file ever throws.** Missing / wrong-typed fields get safe defaults, unknown
 * extra fields are ignored. `unwrap()` is the only thing in the data layer that throws.
 */

export const asObj = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

export const asList = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function str(v: unknown, d = ''): string {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return d;
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : d;
  if (typeof v === 'boolean') return String(v);
  return d;
}

/** Comma-tolerant number reader ("2,59" and "2.59" both parse). */
export function num(v: unknown, d = 0): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return d;
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : d;
  }
  if (typeof v === 'boolean') return v ? 1 : 0;
  return d;
}

export function bool(v: unknown, d = false): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
  }
  return d;
}

/** ₼ amount with 2 decimals. Never compute fees / bonuses / discounts — only round server values. */
export const money = (v: unknown): number => Math.round(num(v) * 100) / 100;

/** Integer (ids, counts, grams, steps). Truncates, never rounds up. */
export function int(v: unknown, d = 0): number {
  const n = num(v, Number.NaN);
  return Number.isFinite(n) ? Math.trunc(n) : d;
}

/** `''` -> null, so "no value" is distinguishable from an empty string. */
export function nullableStr(v: unknown): string | null {
  const s = str(v).trim();
  return s ? s : null;
}

export function nullableNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = num(v, Number.NaN);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalised ISO-8601 instant, or null. A timestamp **without** a zone suffix is read as UTC
 * (notification `createdAt`). For the Baku-wall-clock-with-a-fake-`Z` fields use `bakuWallClock`.
 */
export function dateIso(v: unknown): string | null {
  const s = str(v).trim();
  if (!s) return null;
  const hasZone = /([zZ]|[+-]\d\d:?\d\d)$/.test(s);
  const hasTime = /\d{2}:\d{2}/.test(s);
  const t = Date.parse(hasZone || !hasTime ? s : `${s}Z`);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export interface WallClock {
  hh: number;
  mm: number;
  /** `HH:mm`, or `''` when the input carried no time. */
  text: string;
}

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));
const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n);

/**
 * Store open/close on `stores/search`, product-embedded store, cart store and coupon start/end
 * dates are **Baku wall-clock written with a trailing `Z`**. Read `HH:mm` literally —
 * converting them shifts every store by 4 hours.
 */
export function bakuWallClock(v: unknown): WallClock {
  const s = str(v);
  const m = /[T ](\d{1,2}):(\d{2})/.exec(s) ?? /^\s*(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return { hh: 0, mm: 0, text: '' };
  const hh = clamp(int(m[1]), 0, 23);
  const mm = clamp(int(m[2]), 0, 59);
  return { hh, mm, text: `${pad2(hh)}:${pad2(mm)}` };
}

/**
 * `*_translations: [{ name, locale }]` -> text for `locale`, else `az`, else the first entry,
 * else `''`. Generic over the field name because the arrays also carry `description`, `title`, …
 */
export function pickTranslation(list: unknown, locale = 'az', key = 'name'): string {
  const rows = asList(list).map(asObj);
  if (rows.length === 0) return '';
  const byLocale = (want: string) => rows.find((r) => str(r.locale).toLowerCase() === want.toLowerCase());
  const candidates = [byLocale(locale), byLocale('az'), rows[0]];
  for (const row of candidates) {
    if (!row) continue;
    const value = str(row[key]).trim();
    if (value) return value;
  }
  return '';
}

export interface Page<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface ParsePageOptions {
  /** Force the rows key (e.g. `'lotteries'`) when auto-detection would pick the wrong array. */
  key?: string;
  /** Fallbacks for responses that do not echo the paging window back. */
  offset?: number;
  limit?: number;
}

const ROW_KEYS = ['rows', 'data', 'products', 'orders', 'stores', 'categories', 'items', 'results', 'list'];
const TOTAL_KEYS = ['total', 'count', 'total_count', 'totalCount'];

const isEnvelopeLike = (o: Record<string, unknown>): boolean =>
  'data' in o && ('success' in o || 'status' in o || 'statusCode' in o || 'status_code' in o || 'message' in o);

function rowsOf(o: Record<string, unknown>, key?: string): { rows: unknown[]; holder: Record<string, unknown> } {
  if (key && Array.isArray(o[key])) return { rows: o[key] as unknown[], holder: o };
  for (const k of ROW_KEYS) if (Array.isArray(o[k])) return { rows: o[k] as unknown[], holder: o };
  for (const k of Object.keys(o)) if (Array.isArray(o[k])) return { rows: o[k] as unknown[], holder: o };
  return { rows: [], holder: o };
}

/**
 * Every list shape this API actually uses, in one reader:
 * `{rows[],total}` · `{data[],total}` · `{products[],total}` · `{orders[],total,limit,offset}` ·
 * `{stores[],total}` · `{categories[],total}` · a bare array · `{data:{data[],total}}` (notifications).
 * Accepts the envelope or its `data`. Paging is **offset + limit** — `page` is ignored by the API.
 */
export function parsePage<T>(
  envelopeData: unknown,
  parseItem: (raw: unknown) => T,
  opts?: ParsePageOptions,
): Page<T> {
  const fallbackOffset = opts?.offset ?? 0;

  const finish = (rows: unknown[], holder: Record<string, unknown> | null): Page<T> => {
    const items: T[] = [];
    for (const raw of rows) {
      try {
        items.push(parseItem(raw));
      } catch {
        // A parser is not allowed to throw; if one does, drop the row rather than the whole page.
      }
    }
    let total = items.length;
    if (holder) {
      for (const k of TOTAL_KEYS) {
        if (holder[k] !== undefined && holder[k] !== null) {
          total = int(holder[k], items.length);
          break;
        }
      }
    }
    const offset = holder ? int(holder.offset, fallbackOffset) : fallbackOffset;
    const limit = holder ? int(holder.limit, opts?.limit ?? items.length) : (opts?.limit ?? items.length);
    return { items, total, offset, limit };
  };

  if (Array.isArray(envelopeData)) return finish(envelopeData, null);

  let o = asObj(envelopeData);
  if (isEnvelopeLike(o)) {
    const inner = o.data;
    if (Array.isArray(inner)) return finish(inner, o);
    o = asObj(inner);
  }

  let found = rowsOf(o, opts?.key);
  // `{ data: { data: [...], total } }` (notifications): one level of nesting.
  if (found.rows.length === 0 && !Array.isArray(o.data) && o.data !== null && typeof o.data === 'object') {
    const nested = asObj(o.data);
    const inner = rowsOf(nested, opts?.key);
    if (inner.rows.length > 0 || TOTAL_KEYS.some((k) => nested[k] !== undefined)) found = inner;
  }
  return finish(found.rows, found.holder);
}
