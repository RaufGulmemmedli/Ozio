/**
 * Remote source for the top-up module — the one file where the real/mock split is visible.
 *
 * | call | destination | why |
 * | --- | --- | --- |
 * | `account()` | **REAL** `GET v1/profile/me` (`live: 'verified'`) | the bonus balance + card number |
 * | `savedCards()` | **REAL** `GET v1/profile/me/cards` (`live: 'verified'`, returns `[]`) | the payment cards |
 * | `limits()` `quote()` `pay()` `receipt()` `cashier()` | **MOCK** `/api/mock/topup/…` | no endpoint exists |
 *
 * The mock calls go through `remote.mock('topup')`, which builds `/api/mock/topup/<path>` and
 * therefore **can never reach the real host** (`core/network/api-client.ts` → `buildUrl`). The two
 * real calls go through the BFF like every other read in the app.
 *
 * `POST v1/payment/save-card` is deliberately **absent**: adding a card is a hand-off to the
 * bank's own page, owned by the cart module at `/checkout/add-card`. This module links there. It
 * never collects a card number, an expiry or a CVV.
 */
import { remote, type RemoteCallOptions, type RemoteResult } from '@/core/network';

import { TOPUP_MOCK_MODULE } from '../topup.flags';

const mock = remote.mock(TOPUP_MOCK_MODULE);

/** What the quote / pay handlers are told about the state the UI already holds. */
export interface TopupPayBody {
  amount: number;
  card_id: number;
  /** For the receipt line "Visa •••• 0092 kartından çıxılacaq". */
  card_label: string;
  /**
   * The REAL balance the screen already has, so the mock can answer with a "new balance" instead
   * of a component doing the arithmetic (hard rule 7).
   */
  balance: number;
  /** Lets the mock decline an expired card deterministically. */
  card_expired: boolean;
}

export const topupRemote = {
  /* -------------------------------------------------------------------- REAL */

  /**
   * `GET v1/profile/me` — `data.bonus_cards[0]` carries the spendable balance and the card number.
   *
   * TODO(topup): when `@/modules/loyalty_card` (agent M7) or `@/modules/profile` (agent M10) ships
   * its repository, delete this call and read the card through
   * `import { useCard } from '@/modules/loyalty_card'` / `import { useProfile } from '@/modules/profile'`
   * in `hooks/use-topup-account.ts`. This stays a plain pass-through on purpose: no caching, no
   * extra shaping, so the swap is a one-line change and there is no second profile repository to
   * keep in sync. The query key is already the shared `queryKeys.profileMe`.
   */
  account: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    remote.get<unknown>('profile/me', undefined, opts),

  /**
   * `GET v1/profile/me/cards`. Returned `[]` on live (2026-11-12), so the row shape is unobserved
   * and `parseSavedCards` is deliberately tolerant.
   *
   * TODO(topup): replace with `import { useSavedCards } from '@/modules/orders'` (agent M6) once
   * that module exports it.
   */
  savedCards: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    remote.get<unknown>('profile/me/cards', undefined, opts),

  /* -------------------------------------------------------------------- MOCK */

  /** `GET /api/mock/topup/limits`. */
  limits: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.get<unknown>('limits', undefined, opts),

  /** `POST /api/mock/topup/quote`. */
  quote: (body: { amount: number; balance: number }, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.post<unknown>('quote', body, opts),

  /** `POST /api/mock/topup/pay`. Simulated end to end — nothing is charged. */
  pay: (body: TopupPayBody, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.post<unknown>('pay', body, opts),

  /** `GET /api/mock/topup/receipts/{reference}` — survives a reload of `/topup/result`. */
  receipt: (reference: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.get<unknown>(`receipts/${encodeURIComponent(reference)}`, undefined, opts),

  /** `GET /api/mock/topup/cashier?locale=` — the till steps + nearby markets. */
  cashier: (locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.get<unknown>('cashier', { locale }, opts),
};
