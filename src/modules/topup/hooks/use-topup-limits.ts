'use client';

/**
 * The **MOCK** limits read. Everything the amount form validates against comes from here —
 * the zod schema is built from the response, never from a literal in a component.
 */
import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';

import { topupRepository } from '../data/topup.repository';
import { EMPTY_TOPUP_LIMITS, type TopupLimits } from '../data/models/topup-limits';
import { topupKeys } from '../topup.query-keys';

/**
 * `?preview=empty` → the documented "backend sends no range" case: the limits note disappears and
 * no min/max is enforced (api/mock-modules.md §5).
 */
const SEED: ScreenQuerySeed<TopupLimits> = {
  empty: { ...EMPTY_TOPUP_LIMITS, quickAmounts: [5, 10, 20, 50, 100] },
};

export function useTopupLimits(): UseQueryResult<TopupLimits, Failure> {
  return useScreenQuery<TopupLimits>(
    {
      queryKey: topupKeys.limits(),
      queryFn: ({ signal }) => unwrap(topupRepository.limits(signal)),
      ...CACHE.static,
    },
    SEED,
  );
}
