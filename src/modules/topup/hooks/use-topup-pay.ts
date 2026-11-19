'use client';

/**
 * The **simulated** payment. Nothing is charged: the mock writes a `simulated: true` row and
 * answers with it, and the request physically cannot leave for the real host
 * (`remote.mock('topup')` → `/api/mock/topup/pay`).
 *
 * On success *or* decline the user lands on `/topup/result?ref=<reference>`, which re-reads the
 * stored outcome — so the result page survives a reload and a shared link.
 *
 * The real balance is invalidated afterwards anyway (`queryKeys.profileMe`): the server balance is
 * the truth and it has not moved, which is exactly what the success screen must admit.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { useRouter } from '@/core/i18n/navigation';
import { unwrap, type Failure } from '@/core/network';
import { paths } from '@/core/routes';

import type { SavedCard } from '../data/models/saved-card';
import { savedCardLabel } from '../data/models/saved-card';
import type { TopupOutcome } from '../data/models/topup-outcome';
import { topupRepository } from '../data/topup.repository';
import { topupKeys } from '../topup.query-keys';

export interface TopupPayArgs {
  amount: number;
  card: SavedCard;
  /** The real bonus balance, so the mock can answer with a "new balance". */
  balance: number;
}

export type UseTopupPay = UseMutationResult<TopupOutcome, Failure, TopupPayArgs>;

export function topupResultHref(outcome: TopupOutcome): string {
  const reference =
    outcome.status === 'success' ? outcome.receipt.reference : outcome.failure.reference;
  return `${paths.topupResult}?ref=${encodeURIComponent(reference)}`;
}

export function useTopupPay(): UseTopupPay {
  const router = useRouter();
  const client = useQueryClient();

  return useMutation<TopupOutcome, Failure, TopupPayArgs>({
    mutationFn: ({ amount, card, balance }) =>
      unwrap(
        topupRepository.pay({
          amount,
          card_id: card.id,
          card_label: savedCardLabel(card),
          balance,
          card_expired: card.expired,
        }),
      ),
    onSuccess: (outcome) => {
      // The real balance did not change — but re-reading it is what keeps the result screen
      // honest, and it drops any stale profile cache from another screen.
      void client.invalidateQueries({ queryKey: topupKeys.account() });
      router.push(topupResultHref(outcome));
    },
  });
}
