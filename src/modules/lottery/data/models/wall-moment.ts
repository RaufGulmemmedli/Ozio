/**
 * Baku wall-clock timestamps.
 *
 * `lotteries/active/details` sends `end_date` (and the coupon dates, and the ten-cart
 * dates) as **Baku wall-clock with a fake trailing `Z`**: `20:00:00.000Z` means 20:00 in
 * Baku, not 20:00 UTC. Reading the `Z` at face value shifts every draw by four hours.
 *
 * TODO(core): `bakuWallClock()` in `@/core/network` returns only `HH:mm`; a date-aware
 * variant like this one belongs next to it. Until then this file is duplicated in
 * `@/modules/coupons` (modules may not import each other's internals).
 */
import { bakuWallClock, int, str } from '@/core/network';

export interface WallMoment {
  /**
   * The real instant: the literal digits read as Asia/Baku. `useFormat().date()` renders
   * in Asia/Baku, so formatting this prints exactly the digits that arrived, and comparing
   * it with `Date.now()` is correct.
   */
  at: Date;
  /** The original string, for `<time dateTime>` and `title` attributes. */
  raw: string;
}

const DATE_PART = /(\d{4})-(\d{2})-(\d{2})/;

/** Azerbaijan is a fixed UTC+4 — DST was abolished in 2016. */
const BAKU_UTC_OFFSET_HOURS = 4;

export function wallMoment(v: unknown): WallMoment | null {
  const raw = str(v);
  const date = DATE_PART.exec(raw);
  if (!date) return null;
  const { hh, mm } = bakuWallClock(raw);
  const at = new Date(
    Date.UTC(int(date[1]), int(date[2]) - 1, int(date[3]), hh - BAKU_UTC_OFFSET_HOURS, mm, 0, 0),
  );
  return Number.isFinite(at.getTime()) ? { at, raw } : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `now` to `moment`; negative once it has passed. */
export function daysUntil(moment: WallMoment | null, now: Date = new Date()): number | null {
  if (!moment) return null;
  return Math.floor((moment.at.getTime() - now.getTime()) / DAY_MS);
}

export const hasPassed = (moment: WallMoment | null, now: Date = new Date()): boolean =>
  moment !== null && moment.at.getTime() <= now.getTime();
