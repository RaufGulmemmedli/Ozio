'use client';

/**
 * `GET v2/orders?offset&limit` — one infinite list, split into the Aktiv / Keçmiş tabs client-side.
 *
 * Paging is verified (`offset` + `limit`; `page` is ignored). It is **unknown** whether `orders`
 * mixes active and past rows, so both tabs read the same cache entry and the split is by status —
 * never by which key a row arrived under. Tab counts are therefore client counts over what is
 * loaded, plus the server `total`.
 *
 * While the list holds an active order it refreshes every 30 s (screens/app-orders.md), paused while
 * the tab is hidden.
 */
import { useEffect, useMemo } from 'react';
import { unwrap } from '@/core/network';
import { CACHE, useOffsetInfinite, type UseOffsetInfiniteResult } from '@/core/query';
import { orderKeys } from '../orders.query-keys';
import { ordersRepository } from '../data/orders.repository';
import { isActiveStatus } from '../data/models/order-status';
import type { OrderSummary } from '../data/models/order';

export const ORDERS_PAGE_SIZE = 20;
const LIST_REFRESH_MS = 30_000;

export interface UseOrdersResult extends UseOffsetInfiniteResult<OrderSummary> {
  /** In-flight orders, newest first as the server sent them. */
  active: OrderSummary[];
  /** Delivered, cancelled, not-found and unrecognised statuses. */
  past: OrderSummary[];
}

export function useOrders(args?: { limit?: number; enabled?: boolean }): UseOrdersResult {
  const limit = args?.limit ?? ORDERS_PAGE_SIZE;

  const list = useOffsetInfinite<OrderSummary>({
    // The key carries no tab: one fetch feeds both tabs.
    key: orderKeys.list(),
    limit,
    enabled: args?.enabled ?? true,
    fetchPage: ({ offset, limit: pageLimit, signal }) =>
      unwrap(ordersRepository.list({ offset, limit: pageLimit }, signal)),
    ...CACHE.orders,
  });

  const { active, past } = useMemo(() => {
    const a: OrderSummary[] = [];
    const p: OrderSummary[] = [];
    for (const order of list.items) (isActiveStatus(order.status) ? a : p).push(order);
    return { active: a, past: p };
  }, [list.items]);

  // `refetch` is a stable callback from `useOffsetInfinite`, so the timer is installed once per
  // "has active orders" state rather than on every render.
  const { refetch } = list;
  const hasActive = active.length > 0;

  useEffect(() => {
    if (!hasActive) return;
    const tick = () => {
      // Paused while the tab is hidden — a backgrounded list does not need 30 s polling.
      if (document.hidden) return;
      refetch();
    };
    const timer = setInterval(tick, LIST_REFRESH_MS);
    return () => clearInterval(timer);
  }, [hasActive, refetch]);

  return { ...list, active, past };
}
