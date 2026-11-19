'use client';

/**
 * The **MOCK** cashier copy: the four till steps and the nearby markets, by locale.
 *
 * Keyed on the locale because the fixture is localized server-side (the same rule as every
 * `Accept-Language`-dependent real read).
 */
import { useLocale } from 'next-intl';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';

import { EMPTY_CASHIER_INFO, type CashierInfo } from '../data/models/cashier';
import { topupRepository } from '../data/topup.repository';
import { topupKeys } from '../topup.query-keys';

/** `?preview=empty` → no markets nearby; the steps are still shown. */
const SEED: ScreenQuerySeed<CashierInfo> = { empty: EMPTY_CASHIER_INFO };

export function useCashierInfo(): UseQueryResult<CashierInfo, Failure> {
  const locale = useLocale();
  return useScreenQuery<CashierInfo>(
    {
      queryKey: topupKeys.cashier(locale),
      queryFn: ({ signal }) => unwrap(topupRepository.cashier(locale, signal)),
      ...CACHE.static,
    },
    SEED,
  );
}
