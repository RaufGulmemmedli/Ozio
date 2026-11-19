'use client';

/**
 * The student card and its night-discount window.
 *
 * Two clocks, both the server's:
 *
 * - `state: 'pending'` carries no deadline into the client; the query simply polls every
 *   `PENDING_POLL_MS` while it is pending, and the handler flips to `linked` once its own stored
 *   deadline passes. The "Yoxlanılır" panel therefore ends because the server says so.
 * - the night-discount banner counts down to `starts_at` / `ends_at` (instants from the mock) and
 *   **refetches** when the countdown hits zero instead of flipping its own copy of `active`.
 */
import { useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useLocaleKey, useScreenQuery } from '@/core/query';

import { schoolKeys } from '../school.query-keys';
import { schoolRepository } from '../data/school.repository';
import {
  EMPTY_STUDENT_CARD,
  nightDiscountBoundary,
  type StudentCard,
} from '../data/models/student-card';
import { useDeadline } from './use-deadline';

/** While the card verifies, re-read it this often. The handler decides when it is linked. */
export const PENDING_POLL_MS = 400;

export function useStudentCard(): UseQueryResult<StudentCard, Failure> {
  const locale = useLocaleKey();

  // Only `empty` is seeded (an unlinked card); any other `?preview=` value falls through to the
  // mock, so a preview URL can show the linked screen without a session.
  const seed = useMemo(() => ({ empty: EMPTY_STUDENT_CARD }), []);

  return useScreenQuery<StudentCard>(
    {
      queryKey: scoped(schoolKeys.studentCard(), locale),
      queryFn: ({ signal }) => unwrap(schoolRepository.studentCard(locale, signal)),
      // Polling only while the server says "pending"; a settled card is not polled at all.
      refetchInterval: (query) =>
        query.state.data?.state === 'pending' ? PENDING_POLL_MS : false,
      ...CACHE.profile,
    },
    seed,
  );
}

/**
 * Keeps the night-discount banner honest: counts down to the next boundary the mock gave and
 * refetches the card when it arrives, so `active` is never a client-side guess.
 *
 * Returns the seconds left so the banner can render "N saat M dəq sonra başlayır".
 */
export function useNightDiscountBoundary(card: StudentCard | undefined): number | null {
  const locale = useLocaleKey();
  const client = useQueryClient();
  const boundary = card ? nightDiscountBoundary(card.nightDiscount) : null;

  const refetch = useCallback(() => {
    void client.invalidateQueries({ queryKey: scoped(schoolKeys.studentCard(), locale) });
  }, [client, locale]);

  const { secondsLeft } = useDeadline(boundary, { onElapsed: refetch });
  return secondsLeft;
}

export function useLinkStudentCard(): UseMutationResult<StudentCard, Failure, string> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<StudentCard, Failure, string>({
    mutationFn: (number) => unwrap(schoolRepository.linkCard(number, locale)),
    onSuccess: (card) => {
      // The `pending` answer is the new truth; writing it in starts the poll above immediately.
      client.setQueryData(scoped(schoolKeys.studentCard(), locale), card);
    },
  });
}

export function useUnlinkStudentCard(): UseMutationResult<StudentCard, Failure, void> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<StudentCard, Failure, void>({
    mutationFn: () => unwrap(schoolRepository.unlinkCard(locale)),
    onSuccess: (card) => {
      client.setQueryData(scoped(schoolKeys.studentCard(), locale), card);
    },
  });
}
