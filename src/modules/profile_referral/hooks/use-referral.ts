'use client';

/**
 * `/invite`'s data: the real `ref_code` combined with the mock programme.
 *
 * Both reads are separate queries so the real one stays on the shared `queryKeys.profileMe` cache
 * entry, and they are combined here rather than in a view.
 *
 * `?preview=` drives the three drawn states:
 *   `?preview=loading`      → `referral-loading.html`
 *   `?preview=empty`        → `referral-unavailable.html` (no code at all)
 *   `?preview=error`        → the retry state, which the design also routes to "Yenilə"
 *   (default, mocks on)     → `referral.html`, with the sample code
 */
import { useLocale } from 'next-intl';
import { useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery, type ScreenQuerySeed } from '@/core/query';

import {
  buildReferral,
  EMPTY_PROGRAMME,
  type Referral,
  type ReferralProgramme,
} from '../data/models/referral';
import { referralRepository } from '../data/referral.repository';
import { referralKeys } from '../profile_referral.query-keys';

/** `?preview=empty` → neither a real code nor a sample one, i.e. the unavailable screen. */
const PROGRAMME_SEED: ScreenQuerySeed<ReferralProgramme> = { empty: EMPTY_PROGRAMME };

/** `?preview=empty` on the profile read means "the server sent no ref_code" — which is live. */
const CODE_SEED: ScreenQuerySeed<string> = { empty: '' };

export interface UseReferral {
  referral: Referral | null;
  isPending: boolean;
  isError: boolean;
  failure: Failure | null;
  isRefetching: boolean;
  refetch: () => void;
  /** True once loaded and there is no code to show → `referral-unavailable.html`. */
  unavailable: boolean;
}

export function useReferral(): UseReferral {
  const locale = useLocale();

  const codeQuery = useScreenQuery<string>(
    {
      queryKey: referralKeys.profile(),
      queryFn: ({ signal }) => unwrap(referralRepository.refCode(signal)),
      ...CACHE.profile,
    },
    CODE_SEED,
  );

  const programmeQuery = useScreenQuery<ReferralProgramme>(
    {
      queryKey: referralKeys.programme(locale),
      queryFn: ({ signal }) => unwrap(referralRepository.programme(locale, signal)),
      ...CACHE.static,
    },
    PROGRAMME_SEED,
  );

  const referral = useMemo(() => {
    if (programmeQuery.data === undefined) return null;
    return buildReferral(codeQuery.data ?? '', programmeQuery.data);
  }, [codeQuery.data, programmeQuery.data]);

  // The profile read failing must not blank the screen: the sample code still works, and the
  // design's unavailable state covers "no code". Only the programme read is load-bearing.
  const isError = programmeQuery.isError;

  return {
    referral,
    isPending: programmeQuery.isPending,
    isError,
    failure: programmeQuery.error ?? null,
    isRefetching: programmeQuery.isRefetching || codeQuery.isRefetching,
    refetch: () => {
      void codeQuery.refetch();
      void programmeQuery.refetch();
    },
    unavailable: referral !== null && referral.code.length === 0,
  };
}
