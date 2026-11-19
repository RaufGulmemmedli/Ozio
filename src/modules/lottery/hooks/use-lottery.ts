'use client';

/**
 * Lottery query hooks.
 *
 * `lottery_id` is never optional: `useLotteryDetails` / `useTickets` take `lotteryId:
 * number | null | undefined` and stay **disabled** until the id arrives from
 * `useActiveLottery()`, so the request that answers HTTP 500 without the param can never
 * be fired without it.
 */
import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import { unwrap, type Failure, type Page } from '@/core/network';
import { CACHE, scoped, useLocaleKey, useOffsetInfinite, useScreenQuery, type UseOffsetInfiniteResult } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';

import { lotteryKeys } from '../lottery.query-keys';
import { lotteryRepository } from '../data/lottery.repository';
import { TICKETS_DEFAULT_LIMIT } from '../data/lottery.remote';
import type {
  ActiveLotterySummary,
  LotteryDetails,
  LotteryPolicy,
  LotteryTicket,
} from '../data/models/lottery';

const NO_LOTTERY: ActiveLotterySummary = { myTickets: 0, lottery: null };

/**
 * `GET v1/lotteries/active` (verified) — `{ticketsCount, activeLottery}` and nothing more.
 * `data.lottery === null` means no draw is running.
 */
export function useActiveLottery(): UseQueryResult<ActiveLotterySummary, Failure> {
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();
  const seed = useMemo(() => ({ empty: NO_LOTTERY }), []);

  return useScreenQuery<ActiveLotterySummary>(
    {
      queryKey: scoped(lotteryKeys.active(), locale),
      queryFn: ({ signal }) => unwrap(lotteryRepository.active(signal)),
      enabled: authenticated,
      ...CACHE.profile,
    },
    seed,
  );
}

/**
 * `GET v1/lotteries/active/details?lottery_id=` (verified) — the only source of the draw
 * dates, the organiser block, `amount` (the receipt sum that earns one ticket) and the
 * prize list. Disabled until `lotteryId` is a real id.
 */
export function useLotteryDetails(
  lotteryId: number | null | undefined,
): UseQueryResult<LotteryDetails | null, Failure> {
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();
  const id = typeof lotteryId === 'number' && lotteryId > 0 ? lotteryId : null;
  const seed = useMemo(() => ({ empty: null }), []);

  return useScreenQuery<LotteryDetails | null>(
    {
      queryKey: scoped(lotteryKeys.details(id ?? 0), locale),
      queryFn: ({ signal }) => unwrap(lotteryRepository.details(id as number, signal)),
      enabled: id !== null && authenticated,
      ...CACHE.static,
    },
    seed,
  );
}

/**
 * `GET v1/lotteries/policy` (verified) — one HTML string, no locale parameter, so the
 * rules text is the same in all three languages (the page says so).
 *
 * Guest-visible page: the endpoint needs a bearer token, so for a guest the query stays
 * disabled and the view renders `<GuestGate>` instead.
 */
export function useLotteryPolicy(): UseQueryResult<LotteryPolicy, Failure> {
  const authenticated = useIsAuthenticated();
  const seed = useMemo(() => ({ empty: { html: '' } }), []);

  return useScreenQuery<LotteryPolicy>(
    {
      queryKey: lotteryKeys.policy(),
      queryFn: ({ signal }) => unwrap(lotteryRepository.policy(signal)),
      enabled: authenticated,
      ...CACHE.static,
    },
    seed,
  );
}

/**
 * `GET v1/lotteries/tickets?lottery_id=&limit=&offset=`.
 *
 * `live: unverified` — the test account holds no tickets, so the row shape inside
 * `lotteries[]` has never been observed. The list renders what parsed and nothing else.
 */
export function useTickets(
  lotteryId: number | null | undefined,
  limit = TICKETS_DEFAULT_LIMIT,
): UseOffsetInfiniteResult<LotteryTicket> {
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();
  const id = typeof lotteryId === 'number' && lotteryId > 0 ? lotteryId : null;

  return useOffsetInfinite<LotteryTicket>({
    key: scoped(lotteryKeys.tickets(id ?? 0), locale),
    limit,
    enabled: id !== null && authenticated,
    fetchPage: ({ offset, limit: pageLimit, signal }) =>
      unwrap(lotteryRepository.tickets(id as number, { offset, limit: pageLimit }, signal)),
    ...CACHE.profile,
  });
}

/** One ticket, resolved out of the paged list (there is no per-ticket endpoint). */
export function useTicket(
  lotteryId: number | null | undefined,
  ticketId: string,
): UseQueryResult<LotteryTicket | null, Failure> {
  const locale = useLocaleKey();
  const authenticated = useIsAuthenticated();
  const id = typeof lotteryId === 'number' && lotteryId > 0 ? lotteryId : null;
  const trimmed = ticketId.trim();
  const seed = useMemo(() => ({ empty: null }), []);

  return useScreenQuery<LotteryTicket | null>(
    {
      queryKey: scoped(lotteryKeys.ticket(id ?? 0, trimmed), locale),
      queryFn: ({ signal }) => unwrap(lotteryRepository.ticket(id as number, trimmed, signal)),
      enabled: id !== null && trimmed.length > 0 && authenticated,
      ...CACHE.profile,
    },
    seed,
  );
}

export type { Page };
