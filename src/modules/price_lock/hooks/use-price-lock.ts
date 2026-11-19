'use client';

/**
 * Query / mutation wrappers for price_lock.
 *
 * Both reads go through `useScreenQuery`, so `?preview=loading|empty|error|offline|expired` works
 * on both screens, and both keys are locale-scoped because the source localizes staple and
 * product names.
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

import {
  PREVIEW_GUARANTEE_EXPIRED,
  PREVIEW_LOCKS_EXPIRED,
  PREVIEW_NOT_LINKED,
} from '../data/price_lock.preview';
import { priceLockRepository } from '../data/price_lock.repository';
import { EMPTY_GUARANTEE, type Guarantee } from '../data/models/guarantee';
import {
  EMPTY_LOCK_LIST,
  type PriceLockItem,
  type PriceLockList,
} from '../data/models/price-lock-item';
import { priceLockKeys } from '../price_lock.query-keys';

/**
 * Both payloads are time-sensitive (`days_left` changes at midnight, a window can elapse while
 * the tab sleeps), so neither is served from a stale cache and both refetch on window focus.
 */
const LIVE = { staleTime: 0, gcTime: CACHE.profile.gcTime, refetchOnWindowFocus: true } as const;

/** `GET guarantee` — PL1. `?preview=empty` → not-linked, `?preview=expired` → elapsed window. */
export function useGuarantee(): UseQueryResult<Guarantee, Failure> {
  const locale = useLocaleKey();
  const seed = useMemo(
    () => ({ empty: PREVIEW_NOT_LINKED, data: PREVIEW_GUARANTEE_EXPIRED }),
    [],
  );

  return useScreenQuery<Guarantee>(
    {
      queryKey: scoped(priceLockKeys.guarantee(), locale),
      queryFn: ({ signal }) => unwrap(priceLockRepository.guarantee(locale, signal)),
      ...LIVE,
    },
    seed,
  );
}

/** `GET locks` — PL2. `?preview=empty` → no locks at all, `?preview=expired` → history only. */
export function usePriceLocks(): UseQueryResult<PriceLockList, Failure> {
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: EMPTY_LOCK_LIST, data: PREVIEW_LOCKS_EXPIRED }), []);

  return useScreenQuery<PriceLockList>(
    {
      queryKey: scoped(priceLockKeys.locks(), locale),
      queryFn: ({ signal }) => unwrap(priceLockRepository.locks(locale, signal)),
      ...LIVE,
    },
    seed,
  );
}

/**
 * `POST guarantee/link`.
 *
 * `isPending` is the `State · Kart bağlanır…` panel; a 422 carrying the source's message is the
 * `State · Kart bağlanmadı` panel. The card number is sent once and never stored client-side —
 * only the masked value comes back.
 */
export function useLinkCard(): UseMutationResult<Guarantee, Failure, string> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<Guarantee, Failure, string>({
    mutationFn: (cardNumber) => unwrap(priceLockRepository.linkCard(cardNumber, locale)),
    onSuccess: (guarantee) => {
      client.setQueryData(scoped(priceLockKeys.guarantee(), locale), guarantee);
    },
  });
}

/** `DELETE guarantee/link` — "Kartı ayır". */
export function useUnlinkCard(): UseMutationResult<Guarantee, Failure, void> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<Guarantee, Failure, void>({
    mutationFn: () => unwrap(priceLockRepository.unlinkCard(locale)),
    onSuccess: (guarantee) => {
      client.setQueryData(scoped(priceLockKeys.guarantee(), locale), guarantee);
    },
  });
}

export interface CreateLockInput {
  productName: string;
  price: number;
}

/**
 * `POST locks` — the PL3 "Qiyməti dondur" dialog.
 *
 * **Mock state only**: the 1 ₼ deposit is recorded on the row and nothing is charged.
 */
export function useCreateLock(): UseMutationResult<PriceLockItem, Failure, CreateLockInput> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<PriceLockItem, Failure, CreateLockInput>({
    mutationFn: (input) => unwrap(priceLockRepository.createLock(input, locale)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: priceLockKeys.all });
    },
  });
}

/**
 * `POST locks/{id}/use` — "İstifadə et".
 *
 * In a real build this is where the locked price would enter the cart. Here the flow stops at the
 * mock: the row becomes `used` and no cart row is written. A 409 (`Kilidin vaxtı bitib`) is
 * returned as a failure and the refetch settles the screen.
 */
export function useUseLock(): UseMutationResult<void, Failure, string> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<void, Failure, string>({
    mutationFn: (id) => unwrap(priceLockRepository.useLock(id, locale)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: priceLockKeys.all });
    },
  });
}

export { EMPTY_GUARANTEE };
