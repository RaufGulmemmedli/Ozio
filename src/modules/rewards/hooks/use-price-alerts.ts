'use client';

/** N6 — tracked products plus the compact notification feed the screen previews. */
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
import type { PriceAlertsBoard } from '../data/models/price-alert';
import type { NewAlertBody } from '../data/rewards.remote';
import { rewardsKeys } from '../rewards.query-keys';
import { useMockState } from './use-rewards-preview';

const EMPTY_BOARD: PriceAlertsBoard = { alerts: [], feed: [] };

export function usePriceAlerts(): UseQueryResult<PriceAlertsBoard, Failure> {
  const locale = useLocale();
  const state = useMockState();

  return useScreenQuery<PriceAlertsBoard>(
    {
      queryKey: scoped([...rewardsKeys.priceAlerts, state ?? null], locale),
      queryFn: async ({ signal }) =>
        unwrap(await rewardsRepository.priceAlerts(locale, signal, state)),
      ...CACHE.profile,
    },
    { empty: EMPTY_BOARD },
  );
}

export type PriceAlertAction =
  | { kind: 'add'; alert: NewAlertBody }
  | { kind: 'toggle'; id: string; active: boolean }
  | { kind: 'target'; id: string; target: number }
  | { kind: 'remove'; id: string };

export function usePriceAlertAction(): UseMutationResult<
  PriceAlertsBoard,
  Failure,
  PriceAlertAction
> {
  const locale = useLocale();
  const client = useQueryClient();

  return useMutation<PriceAlertsBoard, Failure, PriceAlertAction>({
    mutationFn: async (action) => {
      switch (action.kind) {
        case 'add':
          return unwrap(await rewardsRepository.addPriceAlert(action.alert, locale));
        case 'toggle':
          return unwrap(await rewardsRepository.togglePriceAlert(action.id, action.active, locale));
        case 'target':
          return unwrap(await rewardsRepository.setAlertTarget(action.id, action.target, locale));
        case 'remove':
          return unwrap(await rewardsRepository.removePriceAlert(action.id, locale));
      }
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: rewardsKeys.priceAlerts });
    },
  });
}
