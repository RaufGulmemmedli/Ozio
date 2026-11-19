'use client';

/**
 * `useDeliveryEstimates()` — `GET v1/stores/search?lat=&lng=` (**verified**; `lat` + `lng` are
 * REQUIRED, the server answers 400 without them).
 *
 * This is the only pre-checkout signal about delivery: a row **without** `delivery_fee` means the
 * store does not serve the selected point (out of zone). The fee it quotes is an **estimate** for
 * the selected address — the payable delivery fee comes from `orders/checkout`.
 *
 * It is asked **only for a real saved address**: `cart_repository.dart:38` — "the delivery estimate
 * is quoted only for the customer's selected address, never for a guessed location" — so when the
 * address module is falling back to a city centre (`isFallback`) nothing is quoted.
 */
import { useQuery } from '@tanstack/react-query';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, usePreview } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';

import { cartKeys } from '../cart.query-keys';
import { previewEstimates } from '../data/cart.preview';
import { cartRepository } from '../data/cart.repository';
import { estimateFor, type StoreDeliveryEstimate } from '../data/models/delivery';
import { useDeliveryAddress } from './use-delivery-address';

export function useDeliveryEstimates(): {
  estimates: StoreDeliveryEstimate[];
  isPending: boolean;
  /** `null` when the point is unknown or the store was not in the answer. */
  forStore: (storeId: number) => StoreDeliveryEstimate | null;
} {
  const authenticated = useIsAuthenticated();
  const preview = usePreview();
  const { point, isFallback } = useDeliveryAddress();

  const lat = isFallback ? null : (point?.lat ?? null);
  const lng = isFallback ? null : (point?.lng ?? null);
  const ready = authenticated && lat !== null && lng !== null && preview === null;

  const query = useQuery<StoreDeliveryEstimate[], Failure>({
    queryKey: cartKeys.deliveryEstimate(lat, lng),
    queryFn: ({ signal }) =>
      unwrap(cartRepository.deliveryEstimates({ lat: lat as number, lng: lng as number }, signal)),
    enabled: ready,
    ...CACHE.catalog,
  });

  const estimates = preview !== null && preview !== 'empty' ? previewEstimates() : query.data ?? [];

  return {
    estimates,
    isPending: ready && query.isPending,
    forStore: (storeId) => estimateFor(estimates, storeId),
  };
}
