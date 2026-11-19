'use client';

/** N2 — weekly missions and the reward claim. */
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';

import { rewardsRepository } from '../data/rewards.repository';
import type { MissionsBoard } from '../data/models/mission';
import { rewardsKeys } from '../rewards.query-keys';
import { useMockState } from './use-rewards-preview';

const EMPTY_BOARD: MissionsBoard = { missions: [], canEarn: 0, daysLeft: 0 };

export function useMissions(): UseQueryResult<MissionsBoard, Failure> {
  const locale = useLocale();
  const state = useMockState();

  return useScreenQuery<MissionsBoard>(
    {
      queryKey: scoped([...rewardsKeys.missions, state ?? null], locale),
      queryFn: async ({ signal }) => unwrap(await rewardsRepository.missions(locale, signal, state)),
      ...CACHE.profile,
    },
    { empty: EMPTY_BOARD },
  );
}

export function useClaimMission(): UseMutationResult<MissionsBoard, Failure, string> {
  const locale = useLocale();
  const client = useQueryClient();

  return useMutation<MissionsBoard, Failure, string>({
    mutationFn: async (id) => unwrap(await rewardsRepository.claimMission(id, locale)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: rewardsKeys.missions });
    },
  });
}
