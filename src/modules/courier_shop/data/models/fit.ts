/**
 * "Geyin, seç, qaytar" + "Qapıda sınaq" — order two sizes, keep one at the door, return the rest.
 *
 * The countdown is **not** invented by the component: the session carries `expiresAt` from the
 * mock and the view only reads the clock against it. What the card would be charged for each
 * possible number of kept sizes arrives as `chargeByKept`, so no money is multiplied in a view.
 */
import { asList, asObj, dateIso, int, money, str } from '@/core/network';

import { parseLocalized, type LocalizedText } from './localized';

export interface FitProduct {
  id: string;
  brand: string;
  name: LocalizedText;
  /** The compact label the doorstep cards use ("Nike Revolution 6 · Ölçü 42"). */
  shortName: LocalizedText;
  /** Price of one pair. */
  price: number;
  /** What is taken from the card when the order is placed (0 in this flow). */
  chargeNow: number;
  sizes: string[];
  /** Exactly how many sizes must be picked (2 in the design). */
  requiredSizes: number;
  /** How long the courier waits at the door. */
  waitMinutes: number;
}

export interface FitSession {
  id: string;
  product: FitProduct;
  sizes: string[];
  startedAt: string;
  /** ISO instant the courier stops waiting — the single source of the timer. */
  expiresAt: string;
  durationSec: number;
  /** `{ "0": 0, "1": 129, "2": 258 }` — server-side price table, keyed by kept count. */
  chargeByKept: Record<string, number>;
}

export interface FitResult {
  sessionId: string;
  product: FitProduct;
  keptSizes: string[];
  returnedSizes: string[];
  charged: number;
  /** Nothing is really charged in the demo. */
  simulated: boolean;
}

const EMPTY_PRODUCT: FitProduct = {
  id: '',
  brand: '',
  name: { az: '', ru: '', en: '' },
  shortName: { az: '', ru: '', en: '' },
  price: 0,
  chargeNow: 0,
  sizes: [],
  requiredSizes: 2,
  waitMinutes: 10,
};

export function parseFitProduct(raw: unknown): FitProduct {
  const row = asObj(raw);
  if (Object.keys(row).length === 0) return EMPTY_PRODUCT;
  const sizes = asList(row.sizes)
    .map((s) => str(s))
    .filter(Boolean);
  const name = parseLocalized(row.name);
  const shortRaw = row.short_name ?? row.shortName;
  return {
    id: str(row.id),
    brand: str(row.brand),
    name,
    shortName: shortRaw === undefined ? name : parseLocalized(shortRaw),
    price: money(row.price),
    chargeNow: money(row.charge_now ?? row.chargeNow),
    sizes,
    requiredSizes: int(row.required_sizes ?? row.requiredSizes, 2) || 2,
    waitMinutes: int(row.wait_minutes ?? row.waitMinutes, 10) || 10,
  };
}

function parseChargeTable(raw: unknown): Record<string, number> {
  const row = asObj(raw);
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(row)) out[key] = money(value);
  return out;
}

/** `null` when the courier is not at the door — the no-session empty state. */
export function parseFitSession(raw: unknown): FitSession | null {
  if (raw === null || raw === undefined) return null;
  const row = asObj(raw);
  const id = str(row.id);
  if (!id) return null;
  const startedAt = dateIso(row.started_at ?? row.startedAt) ?? new Date().toISOString();
  const durationSec = int(row.duration_sec ?? row.durationSec, 600) || 600;
  const expiresAt =
    dateIso(row.expires_at ?? row.expiresAt) ??
    new Date(Date.parse(startedAt) + durationSec * 1000).toISOString();
  return {
    id,
    product: parseFitProduct(row.product),
    sizes: asList(row.sizes)
      .map((s) => str(s))
      .filter(Boolean),
    startedAt,
    expiresAt,
    durationSec,
    chargeByKept: parseChargeTable(row.charge_by_kept ?? row.chargeByKept),
  };
}

export function parseFitResult(raw: unknown): FitResult | null {
  if (raw === null || raw === undefined) return null;
  const row = asObj(raw);
  const sessionId = str(row.session_id ?? row.sessionId);
  if (!sessionId) return null;
  return {
    sessionId,
    product: parseFitProduct(row.product),
    keptSizes: asList(row.kept_sizes ?? row.keptSizes)
      .map((s) => str(s))
      .filter(Boolean),
    returnedSizes: asList(row.returned_sizes ?? row.returnedSizes)
      .map((s) => str(s))
      .filter(Boolean),
    charged: money(row.charged),
    simulated: row.simulated === undefined ? true : row.simulated === true,
  };
}

/** Seconds left on a session, floored at 0. `now` is injected so the view owns the ticking. */
export function secondsLeft(session: FitSession, now: number): number {
  const end = Date.parse(session.expiresAt);
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - now) / 1000));
}

/** `mm:ss`, zero-padded — the 80px hero clock. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(safe / 60);
  const ss = safe % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/** What the card would be charged for `keptCount` sizes — a lookup, never a multiplication. */
export function chargeFor(session: FitSession, keptCount: number): number {
  const exact = session.chargeByKept[String(keptCount)];
  return typeof exact === 'number' ? exact : 0;
}
