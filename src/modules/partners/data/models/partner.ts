/**
 * Partner domain models (api/partners.md).
 *
 * The live API is not shaped like the screens:
 *  - `GET v1/ozio-partners` returns **categories** (Market, Aptek, …), not partners;
 *  - `GET v1/ozio-partners/modules/{categoryId}` returns the **brands** of one category;
 *  - `GET v1/ozio-partners/modules/branch/{brandId}` returns the **branches** of one brand.
 *
 * Every parser here is tolerant and **never throws** (BUILD-CONTRACT rule 6): a surprising row
 * degrades to empty strings / nulls instead of blowing up the screen.
 */
import { asList, asObj, bool, int, nullableStr, num, pickTranslation, str } from '@/core/network';

/* ------------------------------------------------------------------ shared readers */

const PICK_KEYS_NAME = ['name', 'title'] as const;

/** First non-empty value for one of `keys`. */
function pick(row: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

/**
 * A name from a direct key, else a `*_translations` row (az first), else `''`.
 * Mirrors `partners/data/models/partner_parse.dart`.
 */
function readName(row: Record<string, unknown>, locale = 'az'): string {
  const direct = str(pick(row, PICK_KEYS_NAME)).trim();
  if (direct) return direct;
  for (const key of Object.keys(row)) {
    if (!key.endsWith('_translations')) continue;
    const text = pickTranslation(row[key], locale).trim();
    if (text) return text;
  }
  return '';
}

/**
 * An image URL out of a string, an upload object (`object_key`), or a `{uploads:{…}}` wrapper —
 * plus the flat `*_uploads` rows. Live partner rows carry a full CDN url in `image.object_key`.
 */
function readImage(row: Record<string, unknown>, keys: readonly string[] = ['image', 'icon']): string | null {
  const fromValue = (value: unknown): string | null => {
    if (typeof value === 'string') return nullableStr(value);
    const obj = asObj(value);
    const direct = nullableStr(obj.object_key ?? obj.url ?? obj.path);
    if (direct) return direct;
    const nested = asObj(obj.uploads);
    return nullableStr(nested.object_key ?? nested.url);
  };

  for (const key of keys) {
    const found = fromValue(row[key]);
    if (found) return found;
  }
  for (const key of Object.keys(row)) {
    if (!key.endsWith('_uploads')) continue;
    for (const entry of asList(row[key])) {
      const found = fromValue(entry);
      if (found) return found;
    }
  }
  return null;
}

/** Status "enabled" when the key is missing or says `active|1|true` (api/partners.md). */
function readEnabled(row: Record<string, unknown>): boolean {
  const raw = row.status ?? row.is_active ?? row.active;
  if (raw === undefined || raw === null || raw === '') return true;
  const text = str(raw).trim().toLowerCase();
  if (text === 'active' || text === 'enabled') return true;
  return bool(raw, true);
}

/** `Zeytun Aptek` → `ZA`; the design draws 1–2 initials in the logo tile. */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/\s+/u)
    .filter((w) => w.length > 0);
  if (words.length === 0) return '';
  const letters = words.slice(0, 2).map((w) => [...w][0] ?? '');
  return letters.join('').toLocaleUpperCase('az-AZ');
}

/**
 * Rows may carry no usable id (`Modules`/`Brand` have none in swagger); Flutter falls back to a
 * slug of the name, and so do we, so a card is always routable.
 */
export function slugOf(name: string): string {
  return (
    name
      .trim()
      .toLocaleLowerCase('az-AZ')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'partner'
  );
}

function readId(row: Record<string, unknown>, name: string): string {
  const raw = pick(row, ['id', 'module_id', 'partner_id', 'brand_id', 'category_id', 'slug']);
  const text = str(raw).trim();
  return text || slugOf(name);
}

/* ------------------------------------------------------------------ social links */

export interface PartnerSocialLink {
  /** Absolute URL. Rendered with `rel="noopener noreferrer"`. */
  url: string;
  iconUrl: string | null;
  /** Host without `www.`, used as the visible label when nothing else is given. */
  label: string;
}

function hostOf(url: string): string {
  const match = /^[a-z]+:\/\/([^/?#]+)/i.exec(url) ?? /^([^/?#]+)/.exec(url);
  return (match?.[1] ?? url).replace(/^www\./i, '');
}

function parseSocialLinks(raw: unknown): PartnerSocialLink[] {
  const out: PartnerSocialLink[] = [];
  for (const entry of asList(raw)) {
    const row = asObj(entry);
    const url = nullableStr(pick(row, ['link', 'url']));
    if (!url) continue;
    out.push({ url, iconUrl: readImage(row, ['icon', 'image']), label: hostOf(url) });
  }
  return out;
}

/* ------------------------------------------------------------------ category */

/** A partner category — a live `GET v1/ozio-partners` row (Market, Aptek, Kafe …). */
export interface PartnerCategory {
  id: string;
  name: string;
  imageUrl: string | null;
  enabled: boolean;
}

export function parsePartnerCategory(raw: unknown, locale = 'az'): PartnerCategory {
  const row = asObj(raw);
  const name = readName(row, locale);
  return { id: readId(row, name), name, imageUrl: readImage(row), enabled: readEnabled(row) };
}

export function parsePartnerCategories(raw: unknown, locale = 'az'): PartnerCategory[] {
  return asList(raw)
    .map((row) => parsePartnerCategory(row, locale))
    .filter((c) => c.enabled && (c.name.length > 0 || c.imageUrl !== null));
}

/* ------------------------------------------------------------------ brand */

/** A partner brand inside a category — a live `modules/{categoryId}` row. */
export interface PartnerBrand {
  id: string;
  name: string;
  imageUrl: string | null;
  /** `branch_count` (0 when the row does not say). */
  branchCount: number;
  /** The brand's own cashback rate when the row carries one; `null` on live rows. */
  cashbackPercent: number | null;
  links: PartnerSocialLink[];
  /** The category this brand was listed under — the route needs it to resolve the brand again. */
  categoryId: string;
  categoryName: string;
  enabled: boolean;
}

export function parsePartnerBrand(
  raw: unknown,
  category: { id: string; name: string },
  locale = 'az',
): PartnerBrand {
  const row = asObj(raw);
  const name = readName(row, locale);
  const rate = pick(row, ['bonus_percentage', 'bonusPercentage', 'cashback']);
  return {
    id: readId(row, name),
    name,
    imageUrl: readImage(row),
    branchCount: int(pick(row, ['branch_count', 'branches_count', 'branchCount']), 0),
    cashbackPercent: rate === undefined ? null : num(rate, 0),
    links: parseSocialLinks(row.social_media_data ?? row.social_links),
    categoryId: category.id,
    categoryName: category.name,
    enabled: readEnabled(row),
  };
}

export function parsePartnerBrands(
  raw: unknown,
  category: { id: string; name: string },
  locale = 'az',
): PartnerBrand[] {
  return asList(raw)
    .map((row) => parsePartnerBrand(row, category, locale))
    .filter((b) => b.enabled && b.name.length > 0);
}

/* ------------------------------------------------------------------ branch */

/**
 * `HH:mm` → minutes from midnight. The live `open_time` / `close_time` are null on 190 of 197
 * rows and the time-zone convention is unverified, so they are read **literally** (Baku
 * wall-clock) and never converted.
 */
function readMinutes(raw: unknown): number | null {
  const text = str(raw).trim();
  if (!text) return null;
  const match = /(\d{1,2}):(\d{2})/.exec(text);
  if (!match) return null;
  const hh = int(match[1], -1);
  const mm = int(match[2], -1);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

export const minutesToClock = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * Azerbaijan's bounding box. Live branch coordinates are 191/197 null and 3 carry the junk value
 * `"1"`, so a point is only trusted when it actually falls inside the country.
 */
const AZ_BOUNDS = { minLat: 38.3, maxLat: 42.0, minLng: 44.7, maxLng: 50.6 } as const;

/** A usable point, or `null`. Rejects null, `"1"`, 0/0 and anything outside Azerbaijan. */
export function usablePoint(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') {
    return null;
  }
  const la = num(lat, Number.NaN);
  const ln = num(lng, Number.NaN);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < AZ_BOUNDS.minLat || la > AZ_BOUNDS.maxLat) return null;
  if (ln < AZ_BOUNDS.minLng || ln > AZ_BOUNDS.maxLng) return null;
  return { lat: la, lng: ln };
}

/** One branch of a partner brand — a live `modules/branch/{brandId}` row. */
export interface Branch {
  id: string;
  name: string;
  /** `address` / `location`; null on all but a handful of live rows. */
  address: string | null;
  phone: string | null;
  /** Per-branch rate (rates differ between branches of one brand); null when unknown. */
  cashbackPercent: number | null;
  /** Only set when the row carried a point inside Azerbaijan — see `usablePoint`. */
  point: { lat: number; lng: number } | null;
  /** Minutes from midnight, Baku wall-clock, read literally. Null when unknown. */
  openMinutes: number | null;
  closeMinutes: number | null;
  imageUrl: string | null;
  links: PartnerSocialLink[];
}

export function parseBranch(raw: unknown, locale = 'az'): Branch {
  const row = asObj(raw);
  const name = readName(row, locale);
  const rate = pick(row, ['bonus_percentage', 'bonusPercentage', 'cashback']);
  const open = readMinutes(pick(row, ['open_time', 'openTime', 'opens_at']));
  const close = readMinutes(pick(row, ['close_time', 'closeTime', 'closes_at']));
  return {
    id: readId(row, name),
    name,
    address: nullableStr(pick(row, ['address', 'location'])),
    phone: nullableStr(pick(row, ['phone', 'phone_number'])),
    cashbackPercent: rate === undefined ? null : num(rate, 0),
    point: usablePoint(pick(row, ['lat', 'latitude']), pick(row, ['lng', 'lon', 'longitude'])),
    // A row with open == close is junk (seen on live), so both are dropped together.
    openMinutes: open !== null && open === close ? null : open,
    closeMinutes: close !== null && open === close ? null : close,
    imageUrl: readImage(row),
    links: parseSocialLinks(row.social_media_data ?? row.social_links),
  };
}

export function parseBranches(raw: unknown, locale = 'az'): Branch[] {
  return asList(raw)
    .map((row) => parseBranch(row, locale))
    .filter((b) => b.name.length > 0 || b.address !== null);
}

/** "Open now" from the branch hours + the client clock. `null` when the hours are unknown. */
export function isOpenAt(branch: Branch, nowMinutes: number): boolean | null {
  const { openMinutes: open, closeMinutes: close } = branch;
  if (open === null || close === null) return null;
  // Past-midnight closing (e.g. 10:00 → 02:00) wraps around.
  return close > open ? nowMinutes >= open && nowMinutes < close : nowMinutes >= open || nowMinutes < close;
}

/** Highest per-branch rate across a brand's branches; `null` when no branch gives cashback. */
export function maxCashback(branches: readonly Branch[]): number | null {
  let best: number | null = null;
  for (const branch of branches) {
    if (branch.cashbackPercent === null || branch.cashbackPercent <= 0) continue;
    if (best === null || branch.cashbackPercent > best) best = branch.cashbackPercent;
  }
  return best;
}

/* ------------------------------------------------------------------ Ozio Plus campaigns */

/**
 * An Ozio Plus campaign — a live `ozio-plus/campaigns` row. The campaign `name` IS the period
 * ("2-16 noyabr"); there is no title, no description and **no max-discount field**.
 */
export interface Campaign {
  id: number;
  /** The owning store chain (`ozio-plus/categories` id). */
  categoryId: number;
  /** The chain's name, filled in from `ozio-plus/categories` when it is known. */
  categoryName: string | null;
  /** The period label the server sends as `name`, e.g. "2-16 noyabr". */
  periodLabel: string;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
}

export function parseCampaign(raw: unknown): Campaign {
  const row = asObj(raw);
  return {
    id: int(pick(row, ['id', 'campaign_id']), 0),
    categoryId: int(pick(row, ['category_id', 'categoryId']), 0),
    categoryName: null,
    periodLabel: str(pick(row, ['name', 'title'])).trim(),
    startDate: nullableStr(pick(row, ['start_date', 'start_at', 'startAt'])),
    endDate: nullableStr(pick(row, ['end_date', 'end_at', 'endAt'])),
    imageUrl: readImage(row),
  };
}

/** A store chain from `ozio-plus/categories` (the doc calls them "categories"). */
export interface PlusChain {
  id: number;
  name: string;
  imageUrl: string | null;
  /** `active_campaigns` — `{id, name}` only; `name` is again the period. */
  activeCampaigns: { id: number; periodLabel: string }[];
}

export function parsePlusChain(raw: unknown, locale = 'az'): PlusChain {
  const row = asObj(raw);
  return {
    id: int(pick(row, ['id', 'category_id', 'categoryId']), 0),
    name: readName(row, locale),
    imageUrl: readImage(row),
    activeCampaigns: asList(pick(row, ['active_campaigns', 'campaigns']) ?? []).map((entry) => {
      const campaign = asObj(entry);
      return { id: int(campaign.id, 0), periodLabel: str(pick(campaign, ['name', 'title'])).trim() };
    }),
  };
}

/** Whole calendar days until `endDate`; `null` without a usable end date. */
export function daysLeft(endDate: string | null, now: Date = new Date()): number | null {
  if (!endDate) return null;
  const end = Date.parse(endDate);
  if (!Number.isFinite(end)) return null;
  const day = 86_400_000;
  const diff = Math.ceil((end - now.getTime()) / day);
  return diff < 0 ? 0 : diff;
}
