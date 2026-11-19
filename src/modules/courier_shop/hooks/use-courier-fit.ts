'use client';

/**
 * "Geyin, seç, qaytar" + "Qapıda sınaq".
 *
 * `useDoorstepClock` is the only ticking thing in the module, and it ticks against the session's
 * `expiresAt` **from the mock** — there is no client-side countdown that could drift or keep
 * running after a reload. When the instant passes, the clock settles on `00:00` and reports
 * `expired`, and the view says so instead of pretending time is left.
 */
import { useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery } from '@/core/query';

import { courierShopKeys } from '../courier_shop.query-keys';
import { courierShopRepository } from '../data/courier_shop.repository';
import {
  formatClock,
  secondsLeft,
  type FitProduct,
  type FitResult,
  type FitSession,
} from '../data/models';

/** `GET fit/product` — the product offered in two sizes. */
export function useFitProduct(): UseQueryResult<FitProduct, Failure> {
  return useScreenQuery<FitProduct>({
    queryKey: courierShopKeys.fitProduct(),
    queryFn: ({ signal }) => unwrap(courierShopRepository.fitProduct({ signal })),
    ...CACHE.catalog,
  });
}

/** `GET fit/sessions/current` — `null` renders the no-session empty state. */
export function useFitSession(): UseQueryResult<FitSession | null, Failure> {
  return useScreenQuery<FitSession | null>(
    {
      queryKey: courierShopKeys.fitSession(),
      queryFn: ({ signal }) => unwrap(courierShopRepository.currentFit({ signal })),
      ...CACHE.tracking,
    },
    { empty: null },
  );
}

/** `GET fit/results/latest` — so a reload after confirming still shows the result screen. */
export function useFitResult(): UseQueryResult<FitResult | null, Failure> {
  return useScreenQuery<FitResult | null>(
    {
      queryKey: courierShopKeys.fitResult(),
      queryFn: ({ signal }) => unwrap(courierShopRepository.latestFitResult({ signal })),
      ...CACHE.tracking,
    },
    { empty: null },
  );
}

/** `POST fit/sessions` — ordering the two sizes starts the doorstep session. */
export function useStartFit(): UseMutationResult<FitSession | null, Failure, readonly string[]> {
  const queryClient = useQueryClient();
  return useMutation<FitSession | null, Failure, readonly string[]>({
    mutationKey: ['courier_shop', 'fit', 'start'],
    mutationFn: async (sizes) => {
      const res = await courierShopRepository.startFit(sizes);
      if (!res.ok) throw res.failure;
      return res.value;
    },
    retry: false,
    onSuccess: (session) => {
      queryClient.setQueryData(courierShopKeys.fitSession(), session);
      void queryClient.invalidateQueries({ queryKey: courierShopKeys.fitResult() });
    },
  });
}

/** `POST fit/sessions/confirm` — keep / return. Nothing is charged. */
export function useConfirmFit(): UseMutationResult<FitResult | null, Failure, readonly string[]> {
  const queryClient = useQueryClient();
  return useMutation<FitResult | null, Failure, readonly string[]>({
    mutationKey: ['courier_shop', 'fit', 'confirm'],
    mutationFn: async (kept) => {
      const res = await courierShopRepository.confirmFit(kept);
      if (!res.ok) throw res.failure;
      return res.value;
    },
    retry: false,
    onSuccess: (result) => {
      queryClient.setQueryData(courierShopKeys.fitSession(), null);
      queryClient.setQueryData(courierShopKeys.fitResult(), result);
    },
  });
}

export interface DoorstepClock {
  /** Whole seconds left, floored at 0. */
  secondsLeft: number;
  /** `mm:ss` for the 80px hero clock. */
  label: string;
  /** 0 → 1, for the progress bar. */
  ratio: number;
  expired: boolean;
  /**
   * `mm:ss` rounded to the minute — what the polite live region announces, so a screen reader
   * hears "9 minutes left", not sixty updates a minute.
   */
  announceMinutes: number;
}

/**
 * Reads the clock against `session.expiresAt`. One interval, cleared on unmount; it stops as soon
 * as the session has expired so an idle tab does not keep re-rendering.
 */
export function useDoorstepClock(session: FitSession | null | undefined): DoorstepClock {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!session) return;
    const end = Date.parse(session.expiresAt);
    if (Number.isFinite(end) && end <= Date.now()) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [session]);

  return useMemo(() => {
    if (!session) {
      return { secondsLeft: 0, label: formatClock(0), ratio: 0, expired: true, announceMinutes: 0 };
    }
    const left = secondsLeft(session, now);
    const total = session.durationSec > 0 ? session.durationSec : 1;
    return {
      secondsLeft: left,
      label: formatClock(left),
      ratio: Math.max(0, Math.min(1, left / total)),
      expired: left === 0,
      announceMinutes: Math.ceil(left / 60),
    };
  }, [session, now]);
}
