'use client';

/**
 * `useDeleteAccount()` — `DELETE v1/profile/me` (**unverified**: method and path inferred, and
 * whether a reason / confirmation body is accepted is unknown, so none is sent).
 *
 * On success the local session is always cleared (`signOut()`), the query cache is dropped by the
 * sign-out listener in `@/core/query/providers`, and the caller lands on `/login`.
 */
import { useMutation } from '@tanstack/react-query';
import { unwrap, type Failure } from '@/core/network';
import { useSession } from '@/core/session';

import { profileRepository } from '../data/profile.repository';

export function useDeleteAccount() {
  const signOut = useSession((s) => s.signOut);
  return useMutation<void, Failure, void>({
    mutationFn: async () => {
      await unwrap(profileRepository.deleteAccount());
    },
    onSuccess: async () => {
      await signOut();
    },
  });
}
