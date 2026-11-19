'use client';

/**
 * Query / mutation wrappers for the senior module's two data screens.
 * `?preview=loading|empty|error` is handled by `useScreenQuery`.
 */
import { useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useLocaleKey, useScreenQuery } from '@/core/query';

import { seniorKeys } from '../senior.query-keys';
import { seniorRepository } from '../data/senior.repository';
import type { HelpBoard, HelpKind, HelpStatus } from '../data/models/help-request';
import type { PensionPlan } from '../data/models/pension-plan';

const EMPTY_BOARD: HelpBoard = { mine: [], nearby: [], earnedBonus: 0, earnedFrom: null };

const EMPTY_PLAN: PensionPlan = {
  payday: '',
  daysUntilPayday: 0,
  pension: 0,
  items: [],
  total: 0,
  autoRepeat: false,
  ordered: false,
  orderNumber: null,
  orderId: null,
};

/** "Pensiya günü": the payday countdown, the pension figure and the essentials basket. */
export function usePensionPlan(): UseQueryResult<PensionPlan, Failure> {
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: EMPTY_PLAN }), []);

  return useScreenQuery<PensionPlan>(
    {
      queryKey: scoped(seniorKeys.plan(), locale),
      queryFn: ({ signal }) => unwrap(seniorRepository.plan(locale, signal)),
      ...CACHE.profile,
    },
    seed,
  );
}

/** The "Hər ay təkrarla" switch. */
export function useSetAutoRepeat(): UseMutationResult<PensionPlan, Failure, boolean> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<PensionPlan, Failure, boolean>({
    mutationFn: (value) => unwrap(seniorRepository.setAutoRepeat(value, locale)),
    onSuccess: (plan) => {
      client.setQueryData(scoped(seniorKeys.plan(), locale), plan);
    },
  });
}

/**
 * "Pensiya günü səbətini sifariş et". **Nothing is ordered and nothing is charged** — the mock
 * marks the basket ordered and mints a demo order number, which is what the result banner shows.
 */
export function useOrderPensionBasket(): UseMutationResult<PensionPlan, Failure, void> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<PensionPlan, Failure, void>({
    mutationFn: () => unwrap(seniorRepository.orderBasket(locale)),
    onSuccess: (plan) => {
      client.setQueryData(scoped(seniorKeys.plan(), locale), plan);
    },
  });
}

/** "Qonşu nəvə": both sides of the board plus the earned-bonus block. */
export function useHelpBoard(): UseQueryResult<HelpBoard, Failure> {
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: EMPTY_BOARD }), []);

  return useScreenQuery<HelpBoard>(
    {
      queryKey: scoped(seniorKeys.help(), locale),
      queryFn: ({ signal }) => unwrap(seniorRepository.board(locale, signal)),
      ...CACHE.profile,
    },
    seed,
  );
}

export interface CreateHelpInput {
  kind: HelpKind;
  note: string;
}

/** The "Yeni sorğu" dialog's submit. Returns the whole board, as the contract specifies. */
export function useCreateHelpRequest(): UseMutationResult<HelpBoard, Failure, CreateHelpInput> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<HelpBoard, Failure, CreateHelpInput>({
    mutationFn: ({ kind, note }) => unwrap(seniorRepository.create(kind, note, locale)),
    onSuccess: (board) => {
      client.setQueryData(scoped(seniorKeys.help(), locale), board);
    },
  });
}

export interface SetHelpStatusInput {
  id: string;
  status: HelpStatus;
}

/** "Köməyə get" (`accepted`) and "Tamamlandı" (`completed`, which credits the bonus). */
export function useSetHelpStatus(): UseMutationResult<HelpBoard, Failure, SetHelpStatusInput> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<HelpBoard, Failure, SetHelpStatusInput>({
    mutationFn: ({ id, status }) => unwrap(seniorRepository.setStatus(id, status, locale)),
    onSuccess: (board) => {
      client.setQueryData(scoped(seniorKeys.help(), locale), board);
    },
  });
}
