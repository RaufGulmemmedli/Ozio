/**
 * /offers (L3 "Kampaniyalar") models.
 *
 * - `GET v1/highlights` (verified, **empty on live**; the response key is misspelled
 *   `hightlights` (sic)) → named product groups.
 * - `GET v1/ozio-plus/campaigns` (verified) → the campaign window, i.e. the end date the hero card
 *   counts down to.
 */
import { asList, asObj, dateIso, int, nullableStr, str } from '@/core/network';

export interface Highlight {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
}

/** Reads both the correct key and the live misspelling, plus a bare array. */
export function highlightRows(envelopeData: unknown): unknown[] {
  if (Array.isArray(envelopeData)) return envelopeData;
  const o = asObj(envelopeData);
  for (const key of ['hightlights', 'highlights', 'data', 'items']) {
    if (Array.isArray(o[key])) return o[key] as unknown[];
  }
  return [];
}

export function parseHighlight(raw: unknown): Highlight {
  const o = asObj(raw);
  const title = str(o.title) || str(o.display_name) || str(o.short_text) || str(o.name);
  return {
    id: int(o.id),
    title,
    subtitle: nullableStr(o.description ?? o.subtitle),
    imageUrl:
      nullableStr(asObj(o.image).object_key) ??
      nullableStr(asObj(asObj(asList(o.uploads)[0]).uploads).object_key),
  };
}

export const isRenderableHighlight = (h: Highlight): boolean => h.id > 0 && h.title !== '';

export interface PlusCampaign {
  id: number;
  categoryId: number | null;
  /** On live the name is the period itself, e.g. "2-16 noyabr". */
  name: string;
  startDate: string | null;
  endDate: string | null;
  /** Whole days left until `endDate`, or null when the server sends no end date. */
  daysLeft: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function parsePlusCampaign(raw: unknown, now = Date.now()): PlusCampaign {
  const o = asObj(raw);
  const endIso = dateIso(o.end_date);
  const end = endIso ? Date.parse(endIso) : Number.NaN;
  return {
    id: int(o.id),
    categoryId: o.category_id === undefined || o.category_id === null ? null : int(o.category_id),
    name: str(o.name),
    startDate: dateIso(o.start_date),
    endDate: endIso,
    daysLeft: Number.isFinite(end) ? Math.max(0, Math.ceil((end - now) / DAY_MS)) : null,
  };
}

export const isRenderableCampaign = (c: PlusCampaign): boolean => c.id > 0;

/** The hero card takes the campaign that ends soonest but has not ended yet. */
export function soonestCampaign(campaigns: readonly PlusCampaign[]): PlusCampaign | null {
  const live = campaigns.filter((c) => c.daysLeft === null || c.daysLeft > 0);
  const pool = live.length > 0 ? live : campaigns;
  if (pool.length === 0) return null;
  return pool.reduce((best, c) => {
    if (best.daysLeft === null) return c.daysLeft === null ? best : c;
    if (c.daysLeft === null) return best;
    return c.daysLeft < best.daysLeft ? c : best;
  }, pool[0]);
}

/** Month filter for the design's Oktyabr/Noyabr/Dekabr tabs — client-side, no server param. */
export function campaignInMonth(campaign: PlusCampaign, year: number, month: number): boolean {
  const from = campaign.startDate ? Date.parse(campaign.startDate) : Number.NaN;
  const to = campaign.endDate ? Date.parse(campaign.endDate) : Number.NaN;
  const monthStart = Date.UTC(year, month, 1);
  const monthEnd = Date.UTC(year, month + 1, 1) - 1;
  if (!Number.isFinite(from) && !Number.isFinite(to)) return true;
  const start = Number.isFinite(from) ? from : monthStart;
  const end = Number.isFinite(to) ? to : monthEnd;
  return start <= monthEnd && end >= monthStart;
}
