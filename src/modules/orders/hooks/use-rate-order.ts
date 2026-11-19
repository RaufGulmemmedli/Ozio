'use client';

/**
 * `POST v2/orders/{id}/rate` — **unverified, and the path itself is inferred.** Body keys
 * (`order_rating`, `courier_rating`, `comment`) are guesses, and whether an order can be rated twice
 * is unknown, so the UI guards against a double submit and treats an already-rated order as done.
 *
 * The design's tag chips are NOT in the known body: they are appended to `comment` (clearly
 * separated) rather than sent as an invented field. There is no tip endpoint, so the design's tip
 * affordance is not built.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { unwrap, type Failure } from '@/core/network';
import { orderKeys } from '../orders.query-keys';
import { ordersRepository } from '../data/orders.repository';

export interface RateOrderInput {
  orderRating: number | null;
  courierRating: number | null;
  comment: string | null;
  /** Already-localized tag labels, appended to the comment (no field exists for them). */
  tags?: readonly string[];
}

export const RATE_COMMENT_MAX = 500;

/** `comment` + the selected tags, capped at the server-safe length. */
export function composeComment(input: RateOrderInput): string | null {
  const parts: string[] = [];
  const comment = input.comment?.trim();
  if (comment) parts.push(comment);
  if (input.tags && input.tags.length > 0) parts.push(input.tags.join(', '));
  const joined = parts.join('\n').trim();
  if (!joined) return null;
  return joined.length > RATE_COMMENT_MAX ? joined.slice(0, RATE_COMMENT_MAX) : joined;
}

export type UseRateOrderResult = UseMutationResult<true, Failure, RateOrderInput>;

export function useRateOrder(id: number | string): UseRateOrderResult {
  const qc = useQueryClient();

  return useMutation<true, Failure, RateOrderInput>({
    mutationFn: (input) =>
      unwrap(
        ordersRepository.rate({
          id,
          orderRating: input.orderRating,
          courierRating: input.courierRating,
          comment: composeComment(input),
        }),
      ),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: orderKeys.list() });
    },
  });
}
