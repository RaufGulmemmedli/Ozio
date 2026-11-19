/**
 * The student card — a scannable card for the school canteen / entry, plus the night-discount
 * window it unlocks.
 *
 * **The clock is the mock's, not the browser's.** `startsAt` / `endsAt` are ISO instants the
 * handler computed from its own "now" in Asia/Baku, and `active` is its decision. The view only
 * counts down toward `startsAt` / `endsAt` and refetches when the countdown reaches zero — it
 * never starts a timer at mount and never decides whether the discount is on.
 */
import { asList, asObj, bool, dateIso, int, pickTranslation, str } from '@/core/network';

export const STUDENT_CARD_STATES = ['none', 'pending', 'linked'] as const;
export type StudentCardState = (typeof STUDENT_CARD_STATES)[number];

export interface NightCategory {
  id: string;
  /** Localized, e.g. "Qəlyanaltılar". */
  name: string;
}

export interface NightDiscount {
  percent: number;
  /** The mock's verdict for the instant it answered. */
  active: boolean;
  /** Baku wall-clock `HH:mm` strings, read literally (api/README.md). */
  windowStart: string;
  windowEnd: string;
  /** When the next window opens — `null` while one is already open. */
  startsAt: string | null;
  /** When the open window closes — `null` while none is open. */
  endsAt: string | null;
  categories: NightCategory[];
}

export interface StudentCard {
  state: StudentCardState;
  /** `''` while the card is not linked. */
  number: string;
  /** Localized "verified by …" line, `''` when there is nothing to say. */
  verifiedNote: string;
  nightDiscount: NightDiscount;
}

const asState = (v: unknown): StudentCardState => {
  const s = str(v).toLowerCase();
  return (STUDENT_CARD_STATES as readonly string[]).includes(s) ? (s as StudentCardState) : 'none';
};

export const EMPTY_NIGHT_DISCOUNT: NightDiscount = {
  percent: 0,
  active: false,
  windowStart: '22:00',
  windowEnd: '06:00',
  startsAt: null,
  endsAt: null,
  categories: [],
};

export const EMPTY_STUDENT_CARD: StudentCard = {
  state: 'none',
  number: '',
  verifiedNote: '',
  nightDiscount: EMPTY_NIGHT_DISCOUNT,
};

export function parseNightDiscount(raw: unknown, locale = 'az'): NightDiscount {
  const row = asObj(raw);
  return {
    percent: int(row.percent),
    active: bool(row.active),
    windowStart: str(row.window_start, '22:00'),
    windowEnd: str(row.window_end, '06:00'),
    startsAt: dateIso(row.starts_at),
    endsAt: dateIso(row.ends_at),
    categories: asList(row.categories).map((c) => {
      const item = asObj(c);
      return { id: str(item.id), name: pickTranslation(item.name_translations, locale) };
    }),
  };
}

export function parseStudentCard(raw: unknown, locale = 'az'): StudentCard {
  const row = asObj(raw);
  return {
    state: asState(row.state),
    number: str(row.number),
    verifiedNote: pickTranslation(row.verified_note_translations, locale),
    nightDiscount: parseNightDiscount(row.night_discount, locale),
  };
}

/**
 * The instant the view should refetch at, so the banner flips from "starts in N" to "active now"
 * without a component guessing. `null` means nothing is scheduled.
 */
export const nightDiscountBoundary = (d: NightDiscount): string | null =>
  d.active ? d.endsAt : d.startsAt;
