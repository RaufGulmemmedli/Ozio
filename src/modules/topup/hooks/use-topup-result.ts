'use client';

/**
 * `/topup/result?ref=<reference>` — re-reads the stored outcome so the receipt survives a reload.
 *
 * `?preview=` seeds the two drawn result states without any request:
 *   `?preview=success` → `topup-success.html`
 *   `?preview=failed`  → `topup-failed.html`
 *   `?preview=error`   → the transport-failure state
 */
import { unwrap, type Failure } from '@/core/network';
import { usePreview, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';

import type { TopupOutcome } from '../data/models/topup-outcome';
import { topupRepository } from '../data/topup.repository';
import { topupKeys } from '../topup.query-keys';

const SUCCESS_PREVIEW: TopupOutcome = {
  status: 'success',
  receipt: {
    reference: 'TP-20261118-04821',
    amount: 20,
    fee: 0,
    total: 20,
    newBalance: 44.6,
    createdAt: '2026-11-18T10:32:00.000Z',
    cardLabel: 'Visa •••• 0092',
    simulated: true,
  },
};

const FAILED_PREVIEW: TopupOutcome = {
  status: 'failed',
  failure: {
    reference: 'TP-20261118-04822',
    amount: 20,
    cardLabel: 'Visa •••• 0092',
    errorCode: 'CARD_DECLINED',
    message: '',
    simulated: true,
  },
};

export function useTopupResult(reference: string): UseQueryResult<TopupOutcome, Failure> {
  const preview = usePreview();
  const seed: ScreenQuerySeed<TopupOutcome> = {
    // There is no "empty receipt": an unknown reference is a 404, i.e. the error state.
    data: preview === 'failed' ? FAILED_PREVIEW : SUCCESS_PREVIEW,
  };

  return useScreenQuery<TopupOutcome>(
    {
      queryKey: topupKeys.receipt(reference),
      queryFn: ({ signal }) => unwrap(topupRepository.receipt(reference, signal)),
      enabled: reference.length > 0,
      staleTime: Infinity,
      gcTime: 10 * 60_000,
      retry: 0,
    },
    seed,
  );
}
