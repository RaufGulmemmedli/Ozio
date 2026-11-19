'use client';

/** N4 — the predicted shopping list: add by text, tick off, change quantity, remove. */
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
import type { SmartList } from '../data/models/smart-list';
import { rewardsKeys } from '../rewards.query-keys';
import { useMockState } from './use-rewards-preview';

const EMPTY_LIST: SmartList = { items: [], sharedWith: '' };

export function useSmartList(): UseQueryResult<SmartList, Failure> {
  const locale = useLocale();
  const state = useMockState();

  return useScreenQuery<SmartList>(
    {
      queryKey: scoped([...rewardsKeys.smartList, state ?? null], locale),
      queryFn: async ({ signal }) =>
        unwrap(await rewardsRepository.smartList(locale, signal, state)),
      ...CACHE.profile,
    },
    { empty: EMPTY_LIST },
  );
}

export type SmartListAction =
  | { kind: 'add'; title: string }
  | { kind: 'check'; id: string; checked: boolean }
  | { kind: 'quantity'; id: string; quantity: number }
  | { kind: 'remove'; id: string };

export function useSmartListAction(): UseMutationResult<SmartList, Failure, SmartListAction> {
  const locale = useLocale();
  const client = useQueryClient();

  return useMutation<SmartList, Failure, SmartListAction>({
    mutationFn: async (action) => {
      switch (action.kind) {
        case 'add':
          return unwrap(await rewardsRepository.addSmartListItem(action.title, locale));
        case 'check':
          return unwrap(
            await rewardsRepository.updateSmartListItem(
              action.id,
              { checked: action.checked },
              locale,
            ),
          );
        case 'quantity':
          return unwrap(
            await rewardsRepository.updateSmartListItem(
              action.id,
              { quantity: action.quantity },
              locale,
            ),
          );
        case 'remove':
          return unwrap(await rewardsRepository.removeSmartListItem(action.id, locale));
      }
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: rewardsKeys.smartList });
    },
  });
}
