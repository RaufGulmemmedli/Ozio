'use client';

/**
 * `usePrivacyPolicies()` — `GET v1/privacy-policies` (verified, `auth: none`).
 *
 * This is the only network read `/help` performs, and it needs no bearer token, which is what
 * makes that screen genuinely guest-reachable. The key is locale-scoped, so switching language is
 * a cache miss and the localized row is re-fetched.
 */
import { CACHE, scoped, useLocaleKey, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import { unwrap } from '@/core/network';

import { profileRepository } from '../data/profile.repository';
import type { PrivacyPolicy } from '../data/models/policy';
import { profileKeys } from '../profile.query-keys';

export function usePrivacyPolicies(seed?: ScreenQuerySeed<PrivacyPolicy[]>) {
  const locale = useLocaleKey();
  return useScreenQuery<PrivacyPolicy[]>(
    {
      queryKey: scoped(profileKeys.policies(), locale),
      queryFn: ({ signal }) => unwrap(profileRepository.policies(signal)),
      ...CACHE.static,
    },
    seed ?? { empty: [] },
  );
}
