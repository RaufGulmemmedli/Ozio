'use client';

/**
 * The **REAL** read: the Ozio bonus balance and the card number, from `GET v1/profile/me`.
 *
 * TODO(topup): this is a temporary local read, kept as a pass-through so it is a one-line swap.
 * When the owning module ships, replace the body with one of:
 *
 *   import { useCard } from '@/modules/loyalty_card';   // agent M7
 *   import { useProfile } from '@/modules/profile';     // agent M10
 *
 * and map its model to `TopupAccount`. The query key below is already the shared
 * `queryKeys.profileMe`, so both hooks hit the same cache entry and the gateway never sees two
 * concurrent GETs on `/profile/me` (api/README.md: it answers 429).
 */
import { useFormat } from '@/core/i18n';
import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';

import { topupRepository } from '../data/topup.repository';
import { EMPTY_TOPUP_ACCOUNT, type TopupAccount } from '../data/models/topup-account';
import { topupKeys } from '../topup.query-keys';

/** `?preview=empty` → the "no Ozio card" state the cashier screen documents. */
const SEED: ScreenQuerySeed<TopupAccount> = {
  empty: EMPTY_TOPUP_ACCOUNT,
  // `?preview=card` seeds the drawn numbers so the screen can be screenshotted without the API.
  data: {
    balance: 24.6,
    cardNumber: '4821773011560092',
    holderName: 'Nurlan Q.',
    hasCard: true,
  },
};

export function useTopupAccount(): UseQueryResult<TopupAccount, Failure> {
  return useScreenQuery<TopupAccount>(
    {
      queryKey: topupKeys.account(),
      queryFn: ({ signal }) => unwrap(topupRepository.account(signal)),
      ...CACHE.profile,
    },
    SEED,
  );
}

/** The balance line, formatted — money is only ever rendered through `useFormat().money`. */
export function useBalanceLabel(balance: number | undefined): string {
  const { money } = useFormat();
  return money(balance ?? 0);
}
