'use client';

/** N3 — the shared family card: members, per-member limits and the three local toggles. */
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
import type { FamilyCard, FamilyCardSettings } from '../data/models/family';
import type { NewMemberBody } from '../data/rewards.remote';
import { rewardsKeys } from '../rewards.query-keys';
import { useMockState } from './use-rewards-preview';

const EMPTY_CARD: FamilyCard = {
  cardNumber: '',
  pool: 0,
  members: [],
  settings: { spendAlerts: false, childLimit: false, sharedBonus: false },
};

export function useFamilyCard(): UseQueryResult<FamilyCard, Failure> {
  const locale = useLocale();
  const state = useMockState();

  return useScreenQuery<FamilyCard>(
    {
      queryKey: scoped([...rewardsKeys.family, state ?? null], locale),
      queryFn: async ({ signal }) => unwrap(await rewardsRepository.family(locale, signal, state)),
      ...CACHE.profile,
    },
    { empty: EMPTY_CARD },
  );
}

export type FamilyAction =
  | { kind: 'settings'; settings: FamilyCardSettings }
  | { kind: 'addMember'; member: NewMemberBody }
  | { kind: 'setLimit'; id: string; limit: number | null }
  | { kind: 'removeMember'; id: string };

/** One mutation for every family-card write, so the view has a single busy flag to drive. */
export function useFamilyAction(): UseMutationResult<FamilyCard, Failure, FamilyAction> {
  const locale = useLocale();
  const client = useQueryClient();

  return useMutation<FamilyCard, Failure, FamilyAction>({
    mutationFn: async (action) => {
      switch (action.kind) {
        case 'settings':
          return unwrap(await rewardsRepository.saveFamilySettings(action.settings, locale));
        case 'addMember':
          return unwrap(await rewardsRepository.addFamilyMember(action.member, locale));
        case 'setLimit':
          return unwrap(await rewardsRepository.setMemberLimit(action.id, action.limit, locale));
        case 'removeMember':
          return unwrap(await rewardsRepository.removeFamilyMember(action.id, locale));
      }
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: rewardsKeys.family });
    },
  });
}
