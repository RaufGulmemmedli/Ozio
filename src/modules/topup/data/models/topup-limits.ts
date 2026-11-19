/**
 * `TopupLimits` — **MOCK**. There is no top-up endpoint on the real API (swagger has no
 * balance/wallet top-up operation), so the limits, the fee and the quick amounts come from
 * `GET /api/mock/topup/limits`.
 *
 * They are still *server* data as far as the UI is concerned (hard rule 7): the zod schema on the
 * amount form is **built from this response**, the limits note is printed from it, and no component
 * ever types `5` or `200`.
 *
 * `min` / `max` are nullable on purpose: api/mock-modules.md §5 says the UI must neither show nor
 * enforce a range when the backend sends none. The drawn screens
 * (`topup-method.html`, `topup-card.html`) do show one — "minimum 5,00 ₼, maksimum 200,00 ₼" — so
 * the fixture carries those two numbers, but the views stay correct if they ever go null.
 */
import { asList, asObj, money, nullableNum, num } from '@/core/network';

export interface TopupLimits {
  /** AZN, or `null` when the server enforces no minimum. */
  min: number | null;
  /** AZN, or `null` when the server enforces no maximum. */
  max: number | null;
  /** Percent of the amount, e.g. `0`. Used only by the server to build the quote. */
  feePercent: number;
  /** The chip row above the limits note. */
  quickAmounts: number[];
}

export const EMPTY_TOPUP_LIMITS: TopupLimits = {
  min: null,
  max: null,
  feePercent: 0,
  quickAmounts: [],
};

export function parseTopupLimits(data: unknown): TopupLimits {
  const root = asObj(data);
  const min = nullableNum(root.min ?? root.min_amount);
  const max = nullableNum(root.max ?? root.max_amount);
  return {
    min: min === null ? null : money(min),
    max: max === null ? null : money(max),
    feePercent: num(root.fee_percent ?? root.feePercent),
    quickAmounts: asList(root.quick_amounts ?? root.quickAmounts)
      .map((v) => money(v))
      .filter((v) => v > 0),
  };
}

/** Why an amount is not payable, or `null` when it is. Drives the message under the input. */
export type AmountProblem = 'required' | 'invalid' | 'belowMin' | 'aboveMax';

export function amountProblem(amount: number | null, limits: TopupLimits): AmountProblem | null {
  if (amount === null) return 'required';
  if (!Number.isFinite(amount) || amount <= 0) return 'invalid';
  if (limits.min !== null && amount < limits.min) return 'belowMin';
  if (limits.max !== null && amount > limits.max) return 'aboveMax';
  return null;
}

/**
 * `"20,00"` / `"20.00"` / `" 20 "` → `20`; anything else → `null`.
 * The amount field is free text with `inputmode="decimal"`, and az/ru both use a comma.
 */
export function parseAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  if (!cleaned || !/^\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}
