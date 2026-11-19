'use client';

/**
 * Saved cards.
 *
 * - `GET v1/profile/me/cards` is **verified** but answered `[]` for the test account, so the row
 *   shape has never been seen → `parseSavedCards` is tolerant and id-less rows are dropped.
 * - `POST v1/payment/save-card` is **unverified**: the body is empty on purpose (the card is typed
 *   on the bank's own page) and the reply's `redirect_url` / `custom_url` is an APK guess. The flow
 *   is: call it, open the url, and re-read the cards list when the user comes back. **No PAN, expiry
 *   or CVV is ever sent to this API.**
 * - `DELETE v1/profile/me/cards/{id}` is unverified.
 */
import { useCallback, useEffect } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';
import { paymentKeys } from '../orders.query-keys';
import { ordersRepository } from '../data/orders.repository';
import type { SavedCard } from '../data/models/payment-card';

export function useSavedCards(
  seed?: ScreenQuerySeed<SavedCard[]>,
): UseQueryResult<SavedCard[], Failure> {
  return useScreenQuery<SavedCard[]>(
    {
      queryKey: paymentKeys.cards(),
      queryFn: ({ signal }) => unwrap(ordersRepository.cards(signal)),
      ...CACHE.profile,
    },
    seed ?? { empty: [] },
  );
}

/**
 * Starts the bank card-binding flow and hands the browser over to the returned url.
 *
 * The query flag the gateway sets on its success URL is **unknown** (api/payment.md: "confirm with
 * backend"), so the list is simply re-read when the user returns to the tab — see
 * `useRefetchCardsOnReturn`.
 */
export function useAddCard(): UseMutationResult<string, Failure, void> {
  return useMutation<string, Failure, void>({
    mutationFn: () => unwrap(ordersRepository.startSaveCard()),
    retry: false,
    onSuccess: (url) => {
      // Same tab, as api/payment.md prescribes for web.
      if (typeof window !== 'undefined') window.location.assign(url);
    },
  });
}

/** Re-reads the cards list whenever the tab regains focus (the gateway return flag is unknown). */
export function useRefetchCardsOnReturn(): void {
  const qc = useQueryClient();

  useEffect(() => {
    const refetch = () => {
      if (document.visibilityState === 'visible') {
        void qc.invalidateQueries({ queryKey: paymentKeys.cards() });
      }
    };
    document.addEventListener('visibilitychange', refetch);
    return () => document.removeEventListener('visibilitychange', refetch);
  }, [qc]);
}

export function useDeleteCard(): UseMutationResult<true, Failure, number> {
  const qc = useQueryClient();

  return useMutation<true, Failure, number>({
    mutationFn: (id) => unwrap(ordersRepository.deleteCard(id)),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.cards() });
    },
  });
}

/** Imperative refresh for the moment the add-card modal closes. */
export function useRefreshCards(): () => void {
  const qc = useQueryClient();
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: paymentKeys.cards() });
  }, [qc]);
}
