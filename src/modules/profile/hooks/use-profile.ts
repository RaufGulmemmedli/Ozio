'use client';

/**
 * `useProfile()` — `GET v1/profile/me` (verified). **Other modules import this name**, so it must
 * not be renamed: home, the card screen and the register gate all read the same cache entry
 * (`queryKeys.profileMe`), which is what keeps two concurrent calls off that one path.
 */
import { useQueryClient } from '@tanstack/react-query';
import { CACHE, useScreenQuery, type ScreenQuerySeed } from '@/core/query';
import { unwrap, type Failure } from '@/core/network';
import { useSession } from '@/core/session';

import { profileRepository } from '../data/profile.repository';
import type { Profile } from '../data/models/profile';
import { profileKeys } from '../profile.query-keys';

/** A guest shape for `?preview=empty` — the screen is `auth`-guarded, so this is preview-only. */
export const EMPTY_PROFILE: Profile = {
  id: null,
  name: null,
  phone: null,
  birthDate: null,
  gender: 'unspecified',
  genderRaw: null,
  refCode: null,
  isRegistered: false,
  cards: [],
  activeOrdersCount: 0,
};

export function useProfile(seed?: ScreenQuerySeed<Profile>) {
  const status = useSession((s) => s.status);
  return useScreenQuery<Profile>(
    {
      queryKey: profileKeys.me(),
      queryFn: ({ signal }) => unwrap(profileRepository.me(signal)),
      // Never fire a bearer call for a visitor without a session (guest-reachable screens read
      // this hook too — /help and /settings/* must work with no session at all).
      enabled: status === 'authenticated',
      ...CACHE.profile,
    },
    seed ?? { empty: EMPTY_PROFILE },
  );
}

/** Drops the shared `profile/me` entry (after a save or a city change). */
export function useInvalidateProfile(): () => Promise<void> {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: profileKeys.me() });
  };
}

export type ProfileFailure = Failure;
