'use client';

/** "Kuryer-Ekspert" — the catalogue per product kind and the reservation. */
import { useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery } from '@/core/query';

import { courierShopKeys } from '../courier_shop.query-keys';
import { courierShopRepository } from '../data/courier_shop.repository';
import {
  EMPTY_EXPERT_CATALOG,
  type ExpertBooking,
  type ExpertCatalog,
  type ExpertProductKind,
  type ExpertServiceKind,
} from '../data/models';

/** `GET expert/catalog?product=` — services + slots for the selected product. */
export function useExpertCatalog(
  product: ExpertProductKind,
): UseQueryResult<ExpertCatalog, Failure> {
  return useScreenQuery<ExpertCatalog>(
    {
      queryKey: courierShopKeys.expertCatalog(product),
      queryFn: ({ signal }) => unwrap(courierShopRepository.expertCatalog(product, { signal })),
      ...CACHE.catalog,
    },
    { empty: { ...EMPTY_EXPERT_CATALOG, product } },
  );
}

/** `GET expert/bookings/latest` — what the confirmation screen renders. */
export function useLatestBooking(): UseQueryResult<ExpertBooking | null, Failure> {
  return useScreenQuery<ExpertBooking | null>(
    {
      queryKey: courierShopKeys.expertBooking(),
      queryFn: ({ signal }) => unwrap(courierShopRepository.latestBooking({ signal })),
      ...CACHE.orders,
    },
    { empty: null },
  );
}

export interface BookingVars {
  product: ExpertProductKind;
  service: ExpertServiceKind;
  slot: string;
}

/** `POST expert/bookings` — reserve a slot. Nobody is dispatched and nothing is charged. */
export function useBookExpert(): UseMutationResult<ExpertBooking | null, Failure, BookingVars> {
  const queryClient = useQueryClient();
  return useMutation<ExpertBooking | null, Failure, BookingVars>({
    mutationKey: ['courier_shop', 'expert', 'book'],
    mutationFn: async ({ product, service, slot }) => {
      const res = await courierShopRepository.book(product, service, slot);
      if (!res.ok) throw res.failure;
      return res.value;
    },
    retry: false,
    onSuccess: (booking) => {
      queryClient.setQueryData(courierShopKeys.expertBooking(), booking);
    },
  });
}
