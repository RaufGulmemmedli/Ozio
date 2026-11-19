'use client';

/**
 * One bonus transaction, for `/card/transactions/[id]`.
 *
 * `GET v2/bonus/transactions` has **no by-id operation**, so the row is first
 * looked for in the pages this session already loaded (the usual case: the user
 * clicked a row) and only then fetched by walking the list — offline pages
 * first, then online, one request at a time because the two sources share a
 * path.
 */
import { useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { Failure, Page } from '@/core/network';
import { unwrap } from '@/core/network';
import { CACHE, useScreenQuery } from '@/core/query';
import { useAuthStatus } from '@/core/session';

import { loyaltyCardRepository } from '../data/loyalty_card.repository';
import type { BonusTransaction } from '../data/models/bonus-transaction';
import { cardKeys } from '../loyalty_card.query-keys';

export interface UseTransactionResult {
  transaction: BonusTransaction | null;
  isPending: boolean;
  isError: boolean;
  /** Loaded fine, but there is no such row. */
  isMissing: boolean;
  error: Failure | null;
  refetch: () => void;
  query: UseQueryResult<BonusTransaction | null, Failure>;
}

export function useTransaction(id: string): UseTransactionResult {
  const client = useQueryClient();
  const status = useAuthStatus();
  const wanted = id.trim();

  const query = useScreenQuery<BonusTransaction | null>(
    {
      queryKey: cardKeys.transaction(wanted),
      queryFn: async ({ signal }) => {
        // Already on screen? Reuse it instead of re-reading the whole list.
        const pages = client.getQueriesData<Page<BonusTransaction>>({
          queryKey: cardKeys.transactionsAll(),
        });
        for (const [, page] of pages) {
          const hit = page?.items.find((row) => row.id === wanted || row.sourceId === wanted);
          if (hit) return hit;
        }
        return unwrap(loyaltyCardRepository.findTransaction(wanted, signal));
      },
      enabled: wanted.length > 0 && status === 'authenticated',
      ...CACHE.profile,
    },
    { empty: null },
  );

  return {
    transaction: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    isMissing: query.isSuccess && query.data === null,
    error: query.error ?? null,
    refetch: () => {
      void query.refetch();
    },
    query,
  };
}
