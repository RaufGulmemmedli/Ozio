'use client';

/**
 * Order tracking — **there is no tracking endpoint**. `/orders/{id}/tracking` and `/track` answer
 * "Cannot GET", and the socket is unverified, so live tracking is polling `GET v2/orders/{id}`
 * (04-data-layer.md):
 *
 * ```ts
 * refetchInterval: (q) => isTerminal(q.state.data?.status) ? false : document.hidden ? 30_000 : 5_000
 * ```
 *
 * - stops on a terminal status (delivered / cancelled / not found) and on unmount;
 * - slows to 30 s while the tab is hidden (the hidden flag is tracked in state so the interval is
 *   re-evaluated the moment visibility changes, not only on the next tick);
 * - shares `orderKeys.detail(id)` with the detail screen — same endpoint, one cache entry.
 *
 * An unknown status is NOT terminal: it falls back to "in progress" and polling continues, because
 * the status strings themselves are unverified.
 */
import { useEffect, useState } from 'react';
import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';
import { orderKeys } from '../orders.query-keys';
import { ordersRepository } from '../data/orders.repository';
import { isTerminalStatus } from '../data/models/order-status';
import type { OrderDetail } from '../data/models/order-detail';

export const POLL_ACTIVE_MS = 5_000;
export const POLL_HIDDEN_MS = 30_000;

/** `document.hidden` as React state, so option objects change when the tab is backgrounded. */
function useDocumentHidden(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const read = () => setHidden(document.visibilityState === 'hidden');
    read();
    document.addEventListener('visibilitychange', read);
    return () => document.removeEventListener('visibilitychange', read);
  }, []);

  return hidden;
}

export interface UseOrderTrackingResult {
  query: UseQueryResult<OrderDetail, Failure>;
  /** `true` while the poll timer is running (false on a terminal status). */
  polling: boolean;
  /** The interval currently in use, in ms — surfaced for the "paused" affordance. */
  intervalMs: number;
}

export function useOrderTracking(
  id: number | string | null,
  seed?: ScreenQuerySeed<OrderDetail>,
): UseOrderTrackingResult {
  const hidden = useDocumentHidden();
  const intervalMs = hidden ? POLL_HIDDEN_MS : POLL_ACTIVE_MS;

  const query = useScreenQuery<OrderDetail>(
    {
      queryKey: orderKeys.detail(id ?? 0),
      queryFn: ({ signal }) => unwrap(ordersRepository.detail(id as number | string, signal)),
      enabled: id !== null && id !== '' && id !== 0,
      refetchInterval: (q) => {
        const status = q.state.data?.status;
        if (status && isTerminalStatus(status)) return false;
        return intervalMs;
      },
      // Polling stops with the tab, and resumes (at 30 s) only while the page is still mounted.
      refetchIntervalInBackground: false,
      ...CACHE.tracking,
    },
    seed,
  );

  const status = query.data?.status;
  const polling = !!id && !(status && isTerminalStatus(status));

  return { query, polling, intervalMs };
}
