'use client';

/**
 * The second **REAL** read: `GET v1/profile/me/cards`.
 *
 * TODO(topup): replace with the orders module's version when it ships —
 *
 *   import { useSavedCards } from '@/modules/orders';   // agent M6
 *
 * — and delete this file plus `topupRemote.savedCards`. The key `['payment','cards']` is chosen so
 * the two hooks share one cache entry.
 *
 * The endpoint answered `[]` on live, so **an empty list is the normal state**: `/topup/card`
 * renders `topup-card-no-cards.html` and offers the add-card hand-off.
 */
import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';

import { topupRepository } from '../data/topup.repository';
import type { SavedCard } from '../data/models/saved-card';
import { topupKeys } from '../topup.query-keys';

/**
 * `?preview=empty` → the no-cards state (which is also what live returns).
 * `?preview=cards` → the three rows drawn in `topup-card.html`, including the expired one.
 */
const SEED: ScreenQuerySeed<SavedCard[]> = {
  empty: [],
  data: [
    { id: 1, brand: 'Visa', last4: '0092', expiry: '09/28', expired: false, preselected: true },
    { id: 2, brand: 'Visa', last4: '4417', expiry: '03/27', expired: false, preselected: false },
    { id: 3, brand: 'Visa', last4: '2210', expiry: '01/25', expired: true, preselected: false },
  ],
};

export function useSavedCards(): UseQueryResult<SavedCard[], Failure> {
  return useScreenQuery<SavedCard[]>(
    {
      queryKey: topupKeys.savedCards(),
      queryFn: ({ signal }) => unwrap(topupRepository.savedCards(signal)),
      ...CACHE.profile,
    },
    SEED,
  );
}
