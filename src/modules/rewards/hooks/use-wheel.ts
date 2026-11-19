'use client';

/**
 * N1 — the wheel of fortune.
 *
 * `useWheel()` reads the board (segments, spins used, the 7-day strip). `useSpin()` posts a spin
 * and hands back the slice **the server chose**; the view animates to `result.index` afterwards and
 * never draws a prize itself.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { UseQueryResult } from '@tanstack/react-query';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';

import { rewardsRepository } from '../data/rewards.repository';
import type { WheelSpinResult, WheelState } from '../data/models/wheel';
import { rewardsKeys } from '../rewards.query-keys';
import { useMockState } from './use-rewards-preview';

const EMPTY_WHEEL: WheelState = {
  segments: [],
  spinsUsed: 0,
  maxSpins: 2,
  paidSpinCost: 0,
  streak: [],
};

export function useWheel(): UseQueryResult<WheelState, Failure> {
  const locale = useLocale();
  const state = useMockState();

  return useScreenQuery<WheelState>(
    {
      queryKey: scoped([...rewardsKeys.wheel, state ?? null], locale),
      queryFn: async ({ signal }) => unwrap(await rewardsRepository.wheel(locale, signal, state)),
      ...CACHE.profile,
    },
    { empty: EMPTY_WHEEL },
  );
}

export function useSpin(): UseMutationResult<WheelSpinResult, Failure, WheelState> {
  const locale = useLocale();
  const client = useQueryClient();

  return useMutation<WheelSpinResult, Failure, WheelState>({
    mutationFn: async (board) => unwrap(await rewardsRepository.spin(board, locale)),
    onSuccess: () => {
      // The board carries `spins_used`, so re-read it rather than patching a count locally.
      void client.invalidateQueries({ queryKey: rewardsKeys.wheel });
    },
  });
}
