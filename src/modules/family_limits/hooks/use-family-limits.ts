'use client';

/**
 * Query / mutation wrappers for family_limits. `?preview=loading|empty|error` is handled by
 * `useScreenQuery`.
 */
import { useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useLocaleKey, useScreenQuery } from '@/core/query';

import { familyLimitsKeys } from '../family_limits.query-keys';
import { familyLimitsRepository } from '../data/family_limits.repository';
import type { LimitDraft, LimitMember, LimitMembers } from '../data/models/limit-member';

const EMPTY_MEMBERS: LimitMembers = {
  members: [],
  summary: { spend: 0, activeLimits: 0, exhausted: 0 },
};

/** The member cards plus the `block` summary strip. */
export function useFamilyLimits(): UseQueryResult<LimitMembers, Failure> {
  const locale = useLocaleKey();
  const seed = useMemo(() => ({ empty: EMPTY_MEMBERS }), []);

  return useScreenQuery<LimitMembers>(
    {
      queryKey: scoped(familyLimitsKeys.members(), locale),
      queryFn: ({ signal }) => unwrap(familyLimitsRepository.members(locale, signal)),
      ...CACHE.profile,
    },
    seed,
  );
}

/** One member — their spend card, allowed categories and recent purchases. */
export function useFamilyLimitMember(id: string): UseQueryResult<LimitMember, Failure> {
  const locale = useLocaleKey();
  const trimmed = id.trim();

  return useScreenQuery<LimitMember>({
    queryKey: scoped(familyLimitsKeys.member(trimmed), locale),
    queryFn: ({ signal }) => unwrap(familyLimitsRepository.member(trimmed, locale, signal)),
    enabled: trimmed.length > 0,
    ...CACHE.profile,
  });
}

export interface SaveLimitInput {
  id: string;
  draft: LimitDraft;
}

/** The editor drawer's "Yadda saxla". Mock state only — no real payment is ever capped. */
export function useSaveFamilyLimit(): UseMutationResult<LimitMember, Failure, SaveLimitInput> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<LimitMember, Failure, SaveLimitInput>({
    mutationFn: ({ id, draft }) => unwrap(familyLimitsRepository.save(id, draft, locale)),
    onSuccess: (member) => {
      client.setQueryData(scoped(familyLimitsKeys.member(member.id), locale), member);
      void client.invalidateQueries({ queryKey: familyLimitsKeys.all });
    },
  });
}
