/**
 * Remote source for the referral slice.
 *
 * | call | destination |
 * | --- | --- |
 * | `profile()` | **REAL** `GET v1/profile/me` — for `ref_code` only (null on live) |
 * | `programme()` | **MOCK** `GET /api/mock/profile_referral/programme` |
 *
 * `PROPOSED` in api/mock-modules.md §8 is `GET v1/referrals` → `{ code, invited[], reward_per_invite }`.
 * When that ships, `programme()` becomes `remote.get('referrals')` and the handler is deleted; the
 * repository, the models and the views do not change.
 */
import { remote, type RemoteCallOptions, type RemoteResult } from '@/core/network';

import { REFERRAL_MOCK_MODULE } from '../profile_referral.flags';

const mock = remote.mock(REFERRAL_MOCK_MODULE);

export const referralRemote = {
  /**
   * `GET v1/profile/me` (`live: 'verified'`) — only `ref_code` is read from it.
   *
   * TODO(profile_referral): swap for `import { useProfile } from '@/modules/profile'` (agent M10)
   * when it exports one. Kept as a bare pass-through so that is a one-line change; the query key
   * is already the shared `queryKeys.profileMe`, so there is no second request to `/profile/me`.
   */
  profile: (opts?: RemoteCallOptions): RemoteResult<unknown> =>
    remote.get<unknown>('profile/me', undefined, opts),

  /** `GET /api/mock/profile_referral/programme?locale=`. */
  programme: (locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.get<unknown>('programme', { locale }, opts),
};
