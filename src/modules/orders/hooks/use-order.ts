'use client';

/**
 * `GET v2/orders/{id}` — the order detail (OD8). Success shape is unverified; the only verified
 * behaviour is that an unknown id answers 404 `{message:"Order not found"}`, which the view turns
 * into a redirect to `/orders` with a toast.
 */
import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';
import { orderKeys } from '../orders.query-keys';
import { ordersRepository } from '../data/orders.repository';
import type { OrderDetail } from '../data/models/order-detail';

export function useOrder(
  id: number | string | null,
  seed?: ScreenQuerySeed<OrderDetail>,
): UseQueryResult<OrderDetail, Failure> {
  return useScreenQuery<OrderDetail>(
    {
      queryKey: orderKeys.detail(id ?? 0),
      queryFn: ({ signal }) => unwrap(ordersRepository.detail(id as number | string, signal)),
      enabled: id !== null && id !== '' && id !== 0,
      ...CACHE.orders,
    },
    seed,
  );
}

/** `true` when the failure is the verified "Order not found" 404. */
export const isOrderNotFound = (failure: Failure | null | undefined): boolean =>
  !!failure && (failure.kind === 'notFound' || failure.statusCode === 404);
