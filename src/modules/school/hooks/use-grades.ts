'use client';

/**
 * Query / mutation wrappers for the grades → points screen.
 *
 * `?preview=loading|empty|error` works because the read goes through `useScreenQuery` with an
 * `empty` seed (and a `data` seed for any other preview value).
 */
import { useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { CACHE, scoped, useLocaleKey, useScreenQuery } from '@/core/query';
import { unwrap, type Failure } from '@/core/network';

import { schoolKeys } from '../school.query-keys';
import { schoolRepository } from '../data/school.repository';
import {
  EMPTY_GRADES_DATA,
  type GradesData,
  type RedeemResult,
} from '../data/models/grade';

/**
 * Balance + grade rows + rewards.
 *
 * `?preview=empty` renders the "Hələ qiymət yoxdur" board state; `?preview=error` the
 * "Yüklənmədi" one.
 */
export function useGrades(): UseQueryResult<GradesData, Failure> {
  const locale = useLocaleKey();
  // Only `empty` is seeded: any other `?preview=` value falls through to the mock, which is how a
  // preview URL can show the *loaded* screen without a session (the guard lets `?preview=` pass).
  const seed = useMemo(() => ({ empty: EMPTY_GRADES_DATA }), []);

  return useScreenQuery<GradesData>(
    {
      queryKey: scoped(schoolKeys.grades(), locale),
      queryFn: ({ signal }) => unwrap(schoolRepository.grades(locale, signal)),
      ...CACHE.profile,
    },
    seed,
  );
}

/**
 * The "Şəkil seç" upload. A real `File` from `<input type="file">` goes to the mock as multipart;
 * the handler ignores the bytes and prepends the two documented grades.
 */
export function useUploadGradePhoto(): UseMutationResult<GradesData, Failure, File> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<GradesData, Failure, File>({
    mutationFn: (file) => unwrap(schoolRepository.uploadGradePhoto(file, locale)),
    onSuccess: (data) => {
      // The response *is* the new state, so write it straight into the cache: no refetch, no
      // second request on the same path (api/README.md: concurrent GETs answer 429).
      client.setQueryData(scoped(schoolKeys.grades(), locale), data);
    },
  });
}

/** Exchanging points for a discount coupon. A short balance arrives as a 422 `Failure`. */
export function useRedeemReward(): UseMutationResult<RedeemResult, Failure, string> {
  const locale = useLocaleKey();
  const client = useQueryClient();

  return useMutation<RedeemResult, Failure, string>({
    mutationFn: (rewardId) => unwrap(schoolRepository.redeem(rewardId, locale)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: schoolKeys.grades() });
    },
  });
}
