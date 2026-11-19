'use client';

/**
 * `useUpdateProfile()` — `PUT v1/profile/me`.
 *
 * The endpoint is **unverified** and its response shape unknown, so nothing is read out of the
 * reply: on a 2xx the hook invalidates the verified `profile/me` read and the form shows whatever
 * the server actually stored. A 422 `fieldErrors` is handed back to the caller so it can be mapped
 * onto the form (see `mapFieldErrorPath` in `data/models/profile-update.ts`).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unwrap, type Failure } from '@/core/network';

import { profileRepository } from '../data/profile.repository';
import type { ProfileEditValues } from '../data/models/profile-update';
import { profileKeys } from '../profile.query-keys';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<void, Failure, ProfileEditValues>({
    mutationFn: (values) => unwrap(profileRepository.update(values)),
    // `profile/me` is the only entry this write touches; the counters on P1 belong to other
    // modules and are not invalidated from here.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}
