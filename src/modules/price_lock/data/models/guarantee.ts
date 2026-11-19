/**
 * Domain model for the "Sabit qiymət zəmanəti" (PL1), plus its tolerant parser.
 *
 * Nothing here throws and nothing here computes money or time: `daysLeft`, `elapsedDays`,
 * `progress`, each staple's `difference` and the `platformPays` total all arrive from the source,
 * which recomputes them against the clock on every request (BUILD-CONTRACT rule 7).
 */
import { asList, asObj, dateIso, int, money, num, pickTranslation, str } from '@/core/network';

/** `linking` is the UI-transient state while `POST guarantee/link` is in flight. */
export type GuaranteeStatus = 'notLinked' | 'linking' | 'active';

export interface StapleItem {
  id: string;
  name: string;
  lockedPrice: number;
  marketPrice: number;
  /** `max(0, market − locked)` — the per-unit amount the platform absorbs. Server-sent. */
  difference: number;
}

export interface Guarantee {
  status: GuaranteeStatus;
  /** `**** 4821` — the only part of the card that is ever stored. */
  maskedCard: string | null;
  startedAt: string | null;
  /** ISO instant the window closes. Every "gün qalıb" on PL1 derives from this. */
  endsAt: string | null;
  items: StapleItem[];
  /** Whole days to `endsAt`, floored at 0. */
  daysLeft: number;
  /** Whole days since `startedAt`. */
  elapsedDays: number;
  /** The window length in days, so the UI can say "müddət 6 ay" from data. */
  totalDays: number;
  /** Window length in months — "müddət 6 ay". */
  months: number;
  /** 0..1 of the window, for `<Progress>`. */
  progress: number;
  /** `sum(item.difference)` — "Platforma bu dövrdə ödəyib +1,10 ₼". */
  platformPays: number;
  /** The source says the window elapsed; the client never decides this. */
  expired: boolean;
}

function parseStatus(raw: unknown): GuaranteeStatus {
  const value = str(raw);
  return value === 'active' || value === 'linking' ? value : 'notLinked';
}

export function parseStapleItem(raw: unknown, locale = 'az'): StapleItem {
  const s = asObj(raw);
  const locked = money(s.locked_price);
  const market = money(s.market_price);
  return {
    id: str(s.id),
    name: pickTranslation(s.translations, locale, 'name') || str(s.name),
    lockedPrice: locked,
    marketPrice: market,
    difference: money(s.difference),
  };
}

export function parseGuarantee(raw: unknown, locale = 'az'): Guarantee {
  const g = asObj(raw);
  const progress = num(g.progress, 0);
  return {
    status: parseStatus(g.status),
    maskedCard: str(g.masked_card).trim() || null,
    startedAt: dateIso(g.started_at),
    endsAt: dateIso(g.ends_at),
    items: asList(g.items).map((row) => parseStapleItem(row, locale)),
    daysLeft: Math.max(0, int(g.days_left, 0)),
    elapsedDays: Math.max(0, int(g.elapsed_days, 0)),
    totalDays: Math.max(0, int(g.total_days, 0)),
    months: Math.max(0, int(g.months, 0)),
    progress: Math.min(1, Math.max(0, progress)),
    platformPays: money(g.platform_pays),
    expired: Boolean(g.expired),
  };
}

export const EMPTY_GUARANTEE: Guarantee = {
  status: 'notLinked',
  maskedCard: null,
  startedAt: null,
  endsAt: null,
  items: [],
  daysLeft: 0,
  elapsedDays: 0,
  totalDays: 0,
  months: 0,
  progress: 0,
  platformPays: 0,
  expired: false,
};
