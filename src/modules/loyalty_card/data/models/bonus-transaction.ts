/**
 * One row of `GET v2/bonus/transactions` (api/loyalty.md, verified 2026-11-12).
 *
 * Live rows are `{ id, source_id, source_type, store_name, created_at,
 * total_amount, earned_bonus, spent_bonus, cardno }` and nothing else. The
 * legacy swagger keys (`amount`, `type`, `status`, `bonus_percentage`,
 * `total_bonus`, coupon / lottery / cash desk) are **not** sent live; they stay
 * here as tolerant fallbacks and the screens hide them when empty.
 *
 * `created_at` is **true UTC** on this endpoint, so it is normalised with
 * `dateIso` and rendered through `useFormat()`.
 *
 * Display rule (api/loyalty.md): a receipt that paid with bonus counts as a
 * **spend**; its earn is shown alongside. Only when both bonus fields are 0 do
 * the legacy keys decide.
 */
import { asObj, dateIso, money, num, str } from '@/core/network';

export type BonusSourceType = 'offline' | 'online';
export type BonusDirection = 'earn' | 'spend' | 'none';

export interface BonusTransaction {
  /** `id`, falling back to `source_id`. Stable enough for `/card/transactions/[id]`. */
  id: string;
  /** The till receipt / order id this row belongs to. */
  sourceId: string;
  /** `offline` = in-store till, `online` = delivery order. */
  sourceType: BonusSourceType;
  storeName: string;
  /** Masked card number the till used, when sent. */
  cardNo: string;
  /** Normalised ISO instant (the field is true UTC here), or `null`. */
  createdAt: string | null;
  /** Receipt total in AZN, exactly as sent. */
  totalAmount: number;
  earnedBonus: number;
  spentBonus: number;

  /** Which way the row reads in the list. */
  direction: BonusDirection;
  /** `+earnedBonus` or `-spentBonus` — for the signed amount column. */
  signedAmount: number;
  /** A receipt can both earn and spend; `true` when it did both. */
  isMixed: boolean;

  /* ---- not sent by the live API: tolerant fallbacks, hidden when empty ---- */
  /** `type` / `transaction_type`, lowercased. */
  legacyType: string;
  status: string;
  /** Cashback percentage, when a future payload adds one. `0` = absent. */
  bonusPercentage: number;
  /** Running balance after the movement. `null` = absent (live sends none). */
  balanceAfter: number | null;
  balanceBefore: number | null;
  cashDesk: string;
  couponCode: string;
  lotteryTicket: string;
  paymentMethod: string;
}

function pick(source: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

const nullableMoney = (value: unknown): number | null =>
  value === undefined || value === null || value === '' ? null : money(value);

const sourceTypeOf = (value: unknown): BonusSourceType =>
  str(value).trim().toLowerCase() === 'online' ? 'online' : 'offline';

/** The legacy `type` strings that mean "bonus left the balance". */
const SPEND_TYPES = new Set(['spend', 'spent', 'debit', 'payment', 'bonus_payment', 'used']);

export function parseBonusTransaction(raw: unknown): BonusTransaction {
  const json = asObj(raw);

  const earnedBonus = Math.abs(money(pick(json, ['earned_bonus', 'earnedBonus'])));
  const spentBonus = Math.abs(money(pick(json, ['spent_bonus', 'bonus_spent', 'spentBonus'])));
  const legacyType = str(pick(json, ['type', 'transaction_type'])).trim().toLowerCase();

  let direction: BonusDirection;
  if (spentBonus > 0) direction = 'spend';
  else if (earnedBonus > 0) direction = 'earn';
  else if (legacyType) direction = SPEND_TYPES.has(legacyType) ? 'spend' : 'earn';
  else direction = 'none';

  const id = str(pick(json, ['id', 'source_id'])).trim();
  const sourceId = str(pick(json, ['source_id', 'id'])).trim();

  return {
    id,
    sourceId,
    sourceType: sourceTypeOf(pick(json, ['source_type', 'sourceType'])),
    storeName: str(pick(json, ['store_name', 'storeName', 'merchant', 'shop_name'])).trim(),
    cardNo: str(pick(json, ['cardno', 'card_no', 'cardNumber'])).trim(),
    createdAt: dateIso(pick(json, ['created_at', 'createdAt', 'date'])),
    totalAmount: money(pick(json, ['total_amount', 'amount', 'payable_amount', 'value'])),
    earnedBonus,
    spentBonus,
    direction,
    signedAmount: direction === 'spend' ? -spentBonus : earnedBonus,
    isMixed: earnedBonus > 0 && spentBonus > 0,
    legacyType,
    status: str(pick(json, ['status'])).trim(),
    bonusPercentage: num(pick(json, ['bonus_percentage', 'bonusPercentage', 'cashback'])),
    balanceAfter: nullableMoney(
      pick(json, ['balance_after', 'balanceAfter', 'balance', 'running_balance']),
    ),
    balanceBefore: nullableMoney(pick(json, ['balance_before', 'balanceBefore'])),
    cashDesk: str(pick(json, ['cash_desk', 'cashbox', 'kassa', 'pos'])).trim(),
    couponCode: str(pick(json, ['coupon_code', 'coupon', 'promo_code'])).trim(),
    lotteryTicket: str(pick(json, ['lottery_ticket', 'ticket_number', 'ticket_code'])).trim(),
    paymentMethod: str(pick(json, ['payment_method', 'masked_card_number'])).trim(),
  };
}

/* ------------------------------------------------------------------ derived */

/**
 * Sum of `earned_bonus` over the rows inside one calendar month, in the given
 * time zone offset-free sense (the rows' `created_at` is UTC).
 *
 * This only ever **adds up values the server sent** — it never derives a
 * cashback amount from a price. Exported so the monthly-cashback figure on
 * `/home` (agent M2) and the summary tiles on `/card/transactions` read the
 * same helper instead of each writing their own.
 */
export function monthlyBonusSummary(
  rows: readonly BonusTransaction[],
  reference: Date = new Date(),
): { earned: number; spent: number; year: number; month: number } {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  let earned = 0;
  let spent = 0;
  for (const row of rows) {
    if (!row.createdAt) continue;
    const at = new Date(row.createdAt);
    if (Number.isNaN(at.getTime())) continue;
    if (at.getFullYear() !== year || at.getMonth() !== month) continue;
    earned += row.earnedBonus;
    spent += row.spentBonus;
  }
  return {
    earned: Math.round(earned * 100) / 100,
    spent: Math.round(spent * 100) / 100,
    year,
    // 1-based, which is what the `monthLocative` ICU select expects.
    month: month + 1,
  };
}

/** `monthlyBonusSummary(...).earned` — the figure the home hero shows. */
export const monthlyCashback = (
  rows: readonly BonusTransaction[],
  reference?: Date,
): number => monthlyBonusSummary(rows, reference).earned;

/** `2026-11` group key, for the month header rows in the table. */
export function monthKeyOf(row: BonusTransaction): string {
  if (!row.createdAt) return 'unknown';
  const at = new Date(row.createdAt);
  if (Number.isNaN(at.getTime())) return 'unknown';
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}`;
}

/** Newest first — what every screen shows. */
export function sortByDateDesc(rows: readonly BonusTransaction[]): BonusTransaction[] {
  return [...rows].sort((a, b) => {
    const left = a.createdAt ? Date.parse(a.createdAt) : 0;
    const right = b.createdAt ? Date.parse(b.createdAt) : 0;
    return right - left;
  });
}
