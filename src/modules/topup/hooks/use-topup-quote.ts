'use client';

/**
 * The **MOCK** quote: fee + total + new balance for the amount in the field.
 *
 * Hard rule 7 — money is server data. The summary card never multiplies or adds; it prints what
 * this query returns. The amount is debounced (300 ms) so typing "100" does not fire three quotes,
 * and `api()` serialises anything that still overlaps on the same path.
 *
 * `balance` is the REAL balance from `GET v1/profile/me`; it is passed through so the server, not a
 * component, produces the "Yeni balans" figure.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useDebouncedValue } from '@/core/lib/debounce';
import { unwrap, type Failure } from '@/core/network';

import { topupRepository } from '../data/topup.repository';
import type { TopupQuote } from '../data/models/topup-quote';
import { topupKeys } from '../topup.query-keys';

export interface UseTopupQuoteArgs {
  /** The parsed amount, or `null` while the field is empty / invalid / out of range. */
  amount: number | null;
  /** The real bonus balance. */
  balance: number;
}

export function useTopupQuote({
  amount,
  balance,
}: UseTopupQuoteArgs): UseQueryResult<TopupQuote, Failure> {
  const debounced = useDebouncedValue(amount, 300);
  const enabled = debounced !== null && debounced > 0;

  return useQuery<TopupQuote, Failure>({
    queryKey: topupKeys.quote(debounced ?? 0),
    queryFn: ({ signal }) =>
      unwrap(topupRepository.quote({ amount: debounced ?? 0, balance }, signal)),
    enabled,
    // The quote belongs to one keystroke; there is nothing to keep warm.
    staleTime: 0,
    gcTime: 60_000,
    retry: 1,
    // Keeping the previous fee on screen while the next one loads avoids a flashing summary.
    placeholderData: (prev) => prev,
  });
}
