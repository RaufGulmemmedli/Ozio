/**
 * Paths + params only. Nothing here parses or decides.
 *
 * | what               | endpoint                                  | live |
 * | ------------------ | ----------------------------------------- | ---- |
 * | card + balance     | `GET v1/profile/me`                       | verified |
 * | bonus transactions | `GET v2/bonus/transactions`               | verified (`source_type` REQUIRED) |
 * | Google Wallet link | `GET v1/wallet/google`                    | verified (bare `{url}`, no envelope) |
 * | tier ladder        | `GET mock:loyalty_card/tiers`             | **no endpoint exists** |
 * | expiring bonus     | `GET mock:loyalty_card/expiring-bonus`    | **no endpoint exists** |
 *
 * `POST v1/wallet/google` is unverified and not needed — the GET returns the
 * save link, so it is not wired at all.
 *
 * The two mock paths live under `/api/mock/loyalty_card/…`, never the real host.
 */
import type {
  LoyaltyBonusTransactionsData,
  PaymentWalletGoogleGetData,
  ProfileMeData,
} from '@/core/api/contracts/types';
import { remote, type RemoteResult } from '@/core/network';

import { LOYALTY_MOCK_MODULE } from '../loyalty_card.flags';
import type { BonusSourceType } from './models/bonus-transaction';

export interface BonusTransactionsQuery {
  /** REQUIRED by the server — a call without it answers 400. */
  source_type: BonusSourceType;
  /** Default 50 server-side; anything above 50 answers 422. */
  limit?: number;
  offset?: number;
}

/** The server's documented cap; a higher value is a 422, not a clamp. */
export const BONUS_TX_LIMIT_MAX = 50;

const mock = remote.mock(LOYALTY_MOCK_MODULE);

export const loyaltyCardRemote = {
  /** The card lives inside the profile; nothing else on this screen reads it. */
  profile: (signal?: AbortSignal): RemoteResult<ProfileMeData> =>
    remote.v1.get<ProfileMeData>('profile/me', undefined, { signal }),

  transactions: (
    query: BonusTransactionsQuery,
    signal?: AbortSignal,
  ): RemoteResult<LoyaltyBonusTransactionsData> =>
    remote.v2.get<LoyaltyBonusTransactionsData>(
      'bonus/transactions',
      {
        source_type: query.source_type,
        limit: Math.min(query.limit ?? BONUS_TX_LIMIT_MAX, BONUS_TX_LIMIT_MAX),
        offset: query.offset ?? 0,
      },
      { signal },
    ),

  /**
   * Answers a bare `{ url }` with **no envelope** — the only endpoint in the
   * API that does. The repository runs it through `parseBare`.
   */
  googleWallet: (signal?: AbortSignal): RemoteResult<PaymentWalletGoogleGetData> =>
    remote.v1.get<PaymentWalletGoogleGetData>('wallet/google', undefined, { signal }),

  /** MSW fixture: the API has no tier data at all. */
  tiers: (signal?: AbortSignal): RemoteResult<unknown> =>
    mock.get<unknown>('tiers', undefined, { signal }),

  /** MSW fixture: the API has no bonus-expiry data at all. */
  expiringBonus: (signal?: AbortSignal): RemoteResult<unknown> =>
    mock.get<unknown>('expiring-bonus', undefined, { signal }),
} as const;
