/**
 * Domain model for one personal price lock (PL2 / PL3), plus its tolerant parser.
 *
 * `status`, `daysLeft` and `savings` are the source's values. In particular a lock whose window
 * has elapsed comes back as `expired` **from the source**, so a tab that was open across the
 * deadline only has to refetch to be right.
 */
import { asList, asObj, dateIso, int, money, pickTranslation, str } from '@/core/network';

export type PriceLockStatus = 'active' | 'used' | 'expired';

export interface PriceLockItem {
  id: string;
  productName: string;
  lockedPrice: number;
  /** Today's shelf price, for the "Qənaət" tag. */
  currentPrice: number;
  deposit: number;
  /** ISO instant the lock lapses. Every "gün qalıb" derives from this. */
  expiresAt: string;
  status: PriceLockStatus;
  /** Whole days to `expiresAt`, floored at 0. Server-sent. */
  daysLeft: number;
  /** `max(0, current − locked)` — "Qənaət 0,45 ₼". Server-sent. */
  savings: number;
}

function parseStatus(raw: unknown): PriceLockStatus {
  const value = str(raw);
  return value === 'used' || value === 'expired' ? value : 'active';
}

export function parsePriceLockItem(raw: unknown, locale = 'az'): PriceLockItem {
  const l = asObj(raw);
  return {
    id: str(l.id),
    productName: pickTranslation(l.translations, locale, 'name') || str(l.product_name),
    lockedPrice: money(l.locked_price),
    currentPrice: money(l.current_price),
    deposit: money(l.deposit),
    expiresAt: dateIso(l.expires_at) ?? '',
    status: parseStatus(l.status),
    daysLeft: Math.max(0, int(l.days_left, 0)),
    savings: money(l.savings),
  };
}

/** What `/price-locks` renders: both tabs plus the terms the info strip states. */
export interface PriceLockList {
  active: PriceLockItem[];
  history: PriceLockItem[];
  /** `PriceLockRepository.lockDays` — the window the freeze dialog offers. */
  lockDays: number;
  /** `PriceLockRepository.lockDeposit` — the 1 ₼ the info strip explains. */
  deposit: number;
}

export function parsePriceLockList(raw: unknown, locale = 'az'): PriceLockList {
  const d = asObj(raw);
  const items = asList(d.items).map((row) => parsePriceLockItem(row, locale));
  return {
    active: items.filter((item) => item.status === 'active'),
    history: items.filter((item) => item.status !== 'active'),
    lockDays: int(d.lock_days, 0),
    deposit: money(d.deposit),
  };
}

export const EMPTY_LOCK_LIST: PriceLockList = {
  active: [],
  history: [],
  lockDays: 15,
  deposit: 1,
};
