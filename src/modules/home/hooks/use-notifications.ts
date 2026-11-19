'use client';

/**
 * `/notifications` — the inbox feed, the bell badge and the two state-changing calls.
 *
 * `GET …/notifications` is verified (`{data: {data: [...], total}}`, `limit` default 10 + `offset`).
 * `POST …/notifications/read` and `DELETE …/notifications` are **unverified**: they stay behind the
 * repository, nothing is marked read optimistically and a response that does not confirm is
 * reported as a failure.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { CACHE, useOffsetInfinite, useScreenQuery, type UseOffsetInfiniteResult } from '@/core/query';
import { unwrap, type Failure } from '@/core/network';
import type { UseQueryResult } from '@tanstack/react-query';

import { notificationKeys } from '../home.query-keys';
import { homeRepository } from '../data/home.repository';
import type { NotificationItem } from '../data/models';
import { useSectionAccess } from './use-section';

/** The inbox list, 10 rows per page (the server default). */
export function useNotificationFeed(): UseOffsetInfiniteResult<NotificationItem> {
  const { authenticated } = useSectionAccess();

  return useOffsetInfinite<NotificationItem>({
    key: notificationKeys.feed,
    limit: 10,
    enabled: authenticated,
    staleTime: CACHE.profile.staleTime,
    gcTime: CACHE.profile.gcTime,
    fetchPage: ({ offset, limit, signal }) =>
      unwrap(homeRepository.notifications({ offset, limit, signal })),
  });
}

/** The bell badge. `data` is a bare integer on live. */
export function useUnreadCount(): UseQueryResult<number, Failure> {
  const { authenticated } = useSectionAccess();

  return useScreenQuery<number>(
    {
      queryKey: notificationKeys.unread,
      queryFn: ({ signal }) => unwrap(homeRepository.unreadCount(signal)),
      enabled: authenticated,
      ...CACHE.profile,
    },
    { empty: 0 },
  );
}

/**
 * Mark rows read. UNVERIFIED endpoint — the UI must not claim success: the list and the badge are
 * only refetched after the server confirmed, and a failure surfaces as a toast from the caller.
 */
export function useMarkNotificationsRead(): UseMutationResult<number[], Failure, readonly number[]> {
  const queryClient = useQueryClient();

  return useMutation<number[], Failure, readonly number[]>({
    mutationFn: (ids) => unwrap(homeRepository.markRead(ids)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.feed });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

/** Clear the whole inbox. UNVERIFIED endpoint (body / query unknown) — same no-optimism rule. */
export function useClearNotifications(): UseMutationResult<true, Failure, void> {
  const queryClient = useQueryClient();

  return useMutation<true, Failure, void>({
    mutationFn: () => unwrap(homeRepository.clearAll()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.feed });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}
