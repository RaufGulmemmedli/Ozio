'use client';

/**
 * The tier ladder and the bonus-expiry batches — **MSW fixtures**.
 *
 * The API sends no tier, level, cashback-percentage or expiry data at all
 * (see `../loyalty_card.flags.ts`), so both hooks are gated by
 * `FeatureFlags.loyaltyTiers` and every screen they feed renders
 * `<DemoBanner module="loyalty_card"/>`.
 */
import { useLocale } from 'next-intl';
import type { UseQueryResult } from '@tanstack/react-query';

import type { Failure } from '@/core/network';
import { unwrap } from '@/core/network';
import { CACHE, useScreenQuery } from '@/core/query';

import { loyaltyCardRepository } from '../data/loyalty_card.repository';
import {
  EMPTY_EXPIRING,
  EMPTY_LADDER,
  type ExpiringBonus,
  type TierLadder,
} from '../data/models/tier';
import { cardKeys } from '../loyalty_card.query-keys';
import { tiersEnabled } from '../loyalty_card.flags';

export interface UseTierLadderResult {
  ladder: TierLadder | null;
  /** The ladder is fixture data, so screens always say so. */
  isDemo: true;
  /** `false` when `loyaltyTiers` is off — render nothing at all. */
  enabled: boolean;
  isPending: boolean;
  isError: boolean;
  error: Failure | null;
  refetch: () => void;
  query: UseQueryResult<TierLadder, Failure>;
}

export function useTierLadder(): UseTierLadderResult {
  const locale = useLocale();
  // No auth gate: these are MSW fixtures, not account data, so the flag alone
  // decides. The route guard already keeps a guest off /card/levels.
  const enabled = tiersEnabled();

  const query = useScreenQuery<TierLadder>(
    {
      // The ladder's strings are localized by the parser, so the locale is part
      // of the key.
      queryKey: [...cardKeys.tiers(), locale],
      queryFn: ({ signal }) => unwrap(loyaltyCardRepository.tierLadder(locale, signal)),
      enabled,
      ...CACHE.static,
    },
    { empty: EMPTY_LADDER },
  );

  return {
    ladder: query.data && query.data.tiers.length > 0 ? query.data : null,
    isDemo: true,
    enabled,
    isPending: enabled && query.isPending,
    isError: query.isError,
    error: query.error ?? null,
    refetch: () => {
      void query.refetch();
    },
    query,
  };
}

export interface UseExpiringBonusResult {
  expiring: ExpiringBonus | null;
  isDemo: true;
  enabled: boolean;
  isPending: boolean;
  isError: boolean;
  error: Failure | null;
  refetch: () => void;
}

export function useExpiringBonus(): UseExpiringBonusResult {
  const enabled = tiersEnabled();

  const query = useScreenQuery<ExpiringBonus>(
    {
      queryKey: cardKeys.expiring(),
      queryFn: ({ signal }) => unwrap(loyaltyCardRepository.expiringBonus(signal)),
      enabled,
      ...CACHE.profile,
    },
    { empty: EMPTY_EXPIRING },
  );

  return {
    expiring: query.data ?? null,
    isDemo: true,
    enabled,
    isPending: enabled && query.isPending,
    isError: query.isError,
    error: query.error ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
