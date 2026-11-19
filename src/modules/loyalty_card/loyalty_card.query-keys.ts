/**
 * Query keys for the loyalty card module.
 *
 * The first element is always the module name, so signing out can drop
 * everything user-bound with one per-module invalidation (04-data-layer.md).
 *
 * `cardKeys.card()` is deliberately **not** `queryKeys.profileMe`: this module
 * stores its own `OzioCard` domain model under that key, and the profile module
 * stores a different model. Both read `GET v1/profile/me`, and `api()`
 * de-duplicates identical in-flight GETs, so the request is still made once.
 */
import { moduleKeys } from '@/core/query';

/** Which `source_type` the list is showing. `all` loads the two sources sequentially. */
export type BonusSourceFilter = 'all' | 'offline' | 'online';

/** Client-side direction filter (the API has no such parameter). */
export type BonusKindFilter = 'all' | 'earned' | 'spent';

export interface BonusTransactionsFilter {
  source: BonusSourceFilter;
  limit: number;
  offset: number;
}

export const cardKeys = {
  ...moduleKeys('loyalty_card'),
  /** The card + balance, parsed from `GET v1/profile/me`. */
  card: () => ['loyalty_card', 'card'] as const,
  /** Everything under `bonus/transactions`, for a wholesale invalidation. */
  transactionsAll: () => ['loyalty_card', 'transactions'] as const,
  transactions: (f: BonusTransactionsFilter) =>
    ['loyalty_card', 'transactions', f.source, f.limit, f.offset] as const,
  transaction: (id: string) => ['loyalty_card', 'transaction', id] as const,
  /** `GET v1/wallet/google` — never cached across sessions (the url carries a signed JWT). */
  wallet: () => ['loyalty_card', 'wallet', 'google'] as const,
  /** MSW-backed: the API sends no tier data at all. */
  tiers: () => ['loyalty_card', 'tiers'] as const,
  expiring: () => ['loyalty_card', 'expiring'] as const,
} as const;

export type CardKey = ReturnType<typeof cardKeys.card>;
