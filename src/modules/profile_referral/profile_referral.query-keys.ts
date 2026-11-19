/**
 * Query keys for the referral slice.
 *
 * `programme()` is the mock read (the invite list, the reward and the fallback code); the real
 * `ref_code` rides along on `queryKeys.profileMe`, which is the shared cross-module key, so this
 * screen does not add a second `GET /profile/me`.
 */
import { moduleKeys, queryKeys } from '@/core/query';

export const referralKeys = {
  ...moduleKeys('profile_referral'),
  /** REAL — `GET v1/profile/me`, for `ref_code` (null on the live test account). */
  profile: () => queryKeys.profileMe,
  /** MOCK — `GET /api/mock/profile_referral/programme?locale=`. */
  programme: (locale: string) => ['profile_referral', 'programme', locale] as const,
} as const;
