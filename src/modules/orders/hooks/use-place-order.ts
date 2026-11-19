'use client';

/**
 * `POST v2/orders` — **unverified body** (see models/place-order.ts, the one place it is guessed).
 *
 * The mutation never claims success on a 2xx without an order id. Before posting it takes a snapshot
 * of the newest order ids; if the outcome is ambiguous (2xx with no id, or a network / timeout /
 * 5xx / 429 failure) the repository re-reads `GET v2/orders` and diffs against that snapshot.
 *
 * On a confirmed order the cart, `profile/me`, the bonus transactions and the orders list are all
 * invalidated (the caching table says order success invalidates profile/bonus).
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { unwrap, type Failure } from '@/core/network';
import { queryKeys } from '@/core/query';
import { cartKeys } from '@/modules/cart';
import { orderKeys } from '../orders.query-keys';
import { ordersRepository } from '../data/orders.repository';
import type { PlaceOrderInput, PlaceOrderResult } from '../data/models/place-order';

export type UsePlaceOrderResult = UseMutationResult<PlaceOrderResult, Failure, PlaceOrderInput>;

export function usePlaceOrder(): UsePlaceOrderResult {
  const qc = useQueryClient();

  return useMutation<PlaceOrderResult, Failure, PlaceOrderInput>({
    mutationFn: async (input) => {
      // Taken immediately before the POST so an ambiguous outcome can be resolved afterwards.
      const snapshot = await ordersRepository.snapshotOrderIds();
      return unwrap(ordersRepository.place(input, snapshot));
    },
    // Placing twice would place two orders: one attempt at a time, no retries.
    retry: false,
    onSuccess: (result) => {
      if (result.kind === 'rejected') return;
      // The cart is gone once the order exists: drop every cart query (the list and each cached
      // checkout calculation). `cartKeys.all` IS `queryKeys.cart`, so this one call covers both.
      void qc.invalidateQueries({ queryKey: cartKeys.all });
      void qc.invalidateQueries({ queryKey: queryKeys.profileMe });
      void qc.invalidateQueries({ queryKey: queryKeys.bonusTx });
      void qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
