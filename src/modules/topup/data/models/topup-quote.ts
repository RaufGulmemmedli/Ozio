/**
 * `TopupQuote` — **MOCK** (`POST /api/mock/topup/quote`). The summary card's numbers.
 *
 * Hard rule 7: money is server data. The fee and the total are **never** computed in a component —
 * the view prints `quote.fee` / `quote.total` / `quote.newBalance` exactly as they arrive.
 *
 * `fee` is nullable because api/mock-modules.md §5 is explicit: when the fee is **absent** the UI
 * shows no fee line at all and never says "free"; only an explicit `fee <= 0` is "Pulsuz".
 */
import { asObj, money, nullableNum } from '@/core/network';

export interface TopupQuote {
  amount: number;
  /** `null` = the server said nothing about a fee → render no fee row. */
  fee: number | null;
  /** What leaves the card. */
  total: number;
  /** Balance after the top-up, when the server computed one. */
  newBalance: number | null;
}

export function parseTopupQuote(data: unknown): TopupQuote {
  const root = asObj(data);
  const amount = money(root.amount);
  const total = root.total === undefined || root.total === null ? amount : money(root.total);
  const fee = nullableNum(root.fee);
  const newBalance = nullableNum(root.new_balance ?? root.newBalance);
  return {
    amount,
    fee: fee === null ? null : money(fee),
    total,
    newBalance: newBalance === null ? null : money(newBalance),
  };
}

/** "Pulsuz" is shown only for an explicit zero/negative fee (api/mock-modules.md §5). */
export const quoteIsFree = (quote: TopupQuote): boolean => quote.fee !== null && quote.fee <= 0;

/** True when there is a fee row to draw at all. */
export const quoteHasFeeRow = (quote: TopupQuote): boolean => quote.fee !== null;
