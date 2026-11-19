'use client';

/**
 * `useBonusTransactions()` — one page of `GET v2/bonus/transactions`.
 *
 * `source_type` is required by the server and `offline` / `online` are the
 * **same path**, so two concurrent calls would be a 429. Two things keep that
 * from happening:
 *
 *  - the filter is part of the query key, so switching a chip makes the old
 *    observer unsubscribe and `api()` aborts its request — cancel/replace,
 *    never both at once;
 *  - `source: 'all'` is handled inside the repository as two **sequential**
 *    calls (offline, then online), exactly like the Flutter app.
 *
 * `placeholderData` keeps the previous page on screen while the next one loads,
 * so the chips do not flash a skeleton.
 */
import { useMemo } from 'react';
import { keepPreviousData, type UseQueryResult } from '@tanstack/react-query';

import type { Failure, Page } from '@/core/network';
import { unwrap } from '@/core/network';
import { CACHE, useScreenQuery } from '@/core/query';
import { useAuthStatus } from '@/core/session';

import { loyaltyCardRepository } from '../data/loyalty_card.repository';
import type { BonusTransaction } from '../data/models/bonus-transaction';
import { cardKeys, type BonusSourceFilter } from '../loyalty_card.query-keys';

export interface UseBonusTransactionsArgs {
  source?: BonusSourceFilter;
  /** Page size. The server caps it at 50 (anything above answers 422). */
  limit?: number;
  offset?: number;
  enabled?: boolean;
  /** Keep the previous page visible while a new filter loads. Default `true`. */
  keepPrevious?: boolean;
}

export interface UseBonusTransactionsResult {
  rows: BonusTransaction[];
  total: number;
  limit: number;
  offset: number;
  isPending: boolean;
  isFetching: boolean;
  isPlaceholder: boolean;
  isError: boolean;
  isEmpty: boolean;
  error: Failure | null;
  refetch: () => void;
  query: UseQueryResult<Page<BonusTransaction>, Failure>;
}

const EMPTY_PAGE: Page<BonusTransaction> = { items: [], total: 0, limit: 0, offset: 0 };

/** The rows the `?preview=<anything else>` seed draws — realistic, az strings. */
const PREVIEW_ROWS: Page<BonusTransaction> = EMPTY_PAGE;

export function useBonusTransactions(
  args: UseBonusTransactionsArgs = {},
): UseBonusTransactionsResult {
  const { source = 'all', limit = 20, offset = 0, enabled = true, keepPrevious = true } = args;
  const status = useAuthStatus();

  const filter = useMemo(() => ({ source, limit, offset }), [source, limit, offset]);
  const seed = useMemo(() => ({ empty: EMPTY_PAGE, data: PREVIEW_ROWS }), []);

  const query = useScreenQuery<Page<BonusTransaction>>(
    {
      queryKey: cardKeys.transactions(filter),
      queryFn: ({ signal }) =>
        unwrap(loyaltyCardRepository.transactions({ source, limit, offset }, signal)),
      enabled: enabled && status === 'authenticated',
      placeholderData: keepPrevious ? keepPreviousData : undefined,
      ...CACHE.profile,
    },
    seed,
  );

  const page = query.data ?? EMPTY_PAGE;

  return {
    rows: page.items,
    total: page.total,
    limit: page.limit || limit,
    offset: page.offset ?? offset,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isPlaceholder: query.isPlaceholderData,
    isError: query.isError,
    isEmpty: query.isSuccess && page.items.length === 0,
    error: query.error ?? null,
    refetch: () => {
      void query.refetch();
    },
    query,
  };
}
