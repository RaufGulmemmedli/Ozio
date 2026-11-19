'use client';

/**
 * Query / mutation wrappers for group_buy.
 *
 * Every read goes through `useScreenQuery`, so `?preview=loading|empty|error|offline` works on all
 * three screens, and every key is locale-scoped because the source localizes its text.
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useLocaleKey, useScreenQuery } from '@/core/query';

import { groupBuyKeys } from '../group_buy.query-keys';
import {
  groupBuyRepository,
  type CreateGroupDealInput,
} from '../data/group_buy.repository';
import {
  PREVIEW_EXPIRED_DEAL,
  PREVIEW_EXPIRED_OVERVIEW,
} from '../data/group_buy.preview';
import {
  EMPTY_OVERVIEW,
  type GroupBuyOverview,
  type GroupDeal,
} from '../data/models/group-deal';
import { EMPTY_CATALOG, type GroupBuyCatalog } from '../data/models/group-product';
import type { JoinQuote, JoinResult } from '../data/models/join-result';

/**
 * The deals are time-sensitive, so they are never served from a stale cache: `staleTime: 0` plus
 * a refetch on window focus, which is also what makes an elapsed window settle honestly when the
 * user comes back to the tab.
 */
const LIVE = { staleTime: 0, gcTime: CACHE.catalog.gcTime, refetchOnWindowFocus: true } as const;

/** `GET deals` — `{ nearby, mine }`, the two tabs of `/group-buy`. */
export function useGroupBuyOverview(): UseQueryResult<GroupBuyOverview, Failure> {
  const locale = useLocaleKey();
  // `?preview=empty` → both tabs empty; `?preview=expired` → the drawn expired card.
  const seed = useMemo(
    () => ({ empty: EMPTY_OVERVIEW, data: PREVIEW_EXPIRED_OVERVIEW }),
    [],
  );

  return useScreenQuery<GroupBuyOverview>(
    {
      queryKey: scoped(groupBuyKeys.overview(), locale),
      queryFn: ({ signal }) => unwrap(groupBuyRepository.overview(locale, signal)),
      ...LIVE,
    },
    seed,
  );
}

/** `GET deals/{id}` — one deal. `?preview=expired` seeds the drawn expired panel. */
export function useGroupDeal(id: string): UseQueryResult<GroupDeal, Failure> {
  const locale = useLocaleKey();
  const trimmed = id.trim();
  const seed = useMemo(() => ({ data: PREVIEW_EXPIRED_DEAL }), []);

  return useScreenQuery<GroupDeal>(
    {
      queryKey: scoped(groupBuyKeys.deal(trimmed), locale),
      queryFn: ({ signal }) => unwrap(groupBuyRepository.deal(trimmed, locale, signal)),
      enabled: trimmed.length > 0,
      ...LIVE,
    },
    seed,
  );
}

/**
 * `GET deals/{id}/quote?qty=` — the GB4 confirm breakdown.
 *
 * Only enabled while the confirm dialog is open, so the quantity stepper on the join card does
 * not fire a request per tap (and two concurrent calls never hit one path — api/README.md's 429).
 */
export function useJoinQuote(
  id: string,
  qty: number,
  enabled: boolean,
): UseQueryResult<JoinQuote, Failure> {
  const locale = useLocaleKey();

  return useScreenQuery<JoinQuote>({
    queryKey: scoped(groupBuyKeys.quote(id, qty), locale),
    queryFn: ({ signal }) => unwrap(groupBuyRepository.quote(id, qty, locale, signal)),
    enabled: enabled && id.trim().length > 0 && qty > 0,
    staleTime: 0,
    gcTime: 0,
  });
}

/** `GET products` — the create form's catalog, targets, deadlines and delivery address. */
export function useGroupBuyCatalog(): UseQueryResult<GroupBuyCatalog, Failure> {
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: EMPTY_CATALOG }), []);

  return useScreenQuery<GroupBuyCatalog>(
    {
      queryKey: scoped(groupBuyKeys.products(), locale),
      queryFn: ({ signal }) => unwrap(groupBuyRepository.catalog(locale, signal)),
      ...CACHE.static,
    },
    seed,
  );
}

/** `POST deals` — opens a group. The caller routes to the returned deal's detail page. */
export function useCreateGroupDeal(): UseMutationResult<GroupDeal, Failure, CreateGroupDealInput> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<GroupDeal, Failure, CreateGroupDealInput>({
    mutationFn: (input) => unwrap(groupBuyRepository.create(input, locale)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: groupBuyKeys.all });
    },
  });
}

/**
 * `POST deals/{id}/join` — **mock state only**: nothing is charged, and no cart row is written.
 * The copy is explicit about it ("Qrup dolanda kartından çıxılacaq"), and in the demo the group
 * filling is the end of the flow.
 */
export function useJoinGroupDeal(
  id: string,
): UseMutationResult<JoinResult, Failure, { qty: number }> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<JoinResult, Failure, { qty: number }>({
    mutationFn: ({ qty }) => unwrap(groupBuyRepository.join(id, qty, locale)),
    onSettled: () => {
      // Also on failure: a 409 means the window elapsed, and the screen must learn that.
      void client.invalidateQueries({ queryKey: groupBuyKeys.all });
    },
  });
}
