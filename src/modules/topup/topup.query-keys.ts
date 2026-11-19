/**
 * Query keys for the top-up module.
 *
 * Two namespaces on purpose, because this module is a **hybrid**:
 *
 * - the REAL reads (bonus balance + card number from `GET v1/profile/me`, saved cards from
 *   `GET v1/profile/me/cards`) are keyed with the **cross-module** keys from `@/core/query`
 *   (`queryKeys.profileMe`, `savedCardsKey`), so when `loyalty_card` / `orders` / `profile` query
 *   the same endpoint the cache is shared and the gateway never sees two concurrent GETs on one
 *   path (api/README.md: that answers 429);
 * - the MOCK reads (limits, quote, cashier info, the stored receipt) live under `['topup', …]` so
 *   `invalidateQueries({ queryKey: topupKeys.all })` drops the demo state and nothing else.
 */
import { moduleKeys, queryKeys } from '@/core/query';

export const topupKeys = {
  ...moduleKeys('topup'),

  /* ---------------------------------------------------------------- REAL reads */
  /**
   * `GET v1/profile/me` — the bonus balance and the Ozio card number.
   * Deliberately the cross-module key: `loyalty_card` and `profile` read the same response.
   */
  account: () => queryKeys.profileMe,
  /** `GET v1/profile/me/cards` — the saved payment cards. Returned `[]` on live. */
  savedCards: () => ['payment', 'cards'] as const,

  /* ---------------------------------------------------------------- MOCK reads */
  /** `GET /api/mock/topup/limits` — min/max/fee/quick amounts. Never hardcoded in a component. */
  limits: () => ['topup', 'limits'] as const,
  /** `POST /api/mock/topup/quote` — amount -> fee + total, keyed by the amount in minor units. */
  quote: (amount: number) => ['topup', 'quote', Math.round(amount * 100)] as const,
  /** `GET /api/mock/topup/cashier` — the 4 till steps + nearby markets (localized fixture). */
  cashier: (locale: string) => ['topup', 'cashier', locale] as const,
  /** `GET /api/mock/topup/receipts/{reference}` — what `/topup/result` renders after a reload. */
  receipt: (reference: string) => ['topup', 'receipt', reference] as const,
} as const;
