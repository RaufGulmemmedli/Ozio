/**
 * The only thing this module's hooks import. Maps envelopes onto domain models, never throws, and
 * keeps every unverified guess on this side of the boundary so a wrong guess is a one-line fix.
 *
 * It covers the four profile operations and nothing else: the counters and the history tabs are
 * composed from `@/modules/orders`, `@/modules/loyalty_card`, `@/modules/lottery`,
 * `@/modules/coupons`, `@/modules/address` and `@/modules/home`.
 */
import { mapResult, type Result } from '@/core/network';

import { parsePolicies, type PrivacyPolicy } from './models/policy';
import { parseProfile, type Profile } from './models/profile';
import { buildProfileUpdateBody, type ProfileEditValues } from './models/profile-update';
import { profileRemote } from './profile.remote';

export const profileRepository = {
  /** `GET v1/profile/me` — verified, re-verified 2026-11-12. */
  async me(signal?: AbortSignal): Promise<Result<Profile>> {
    return mapResult(await profileRemote.me(signal), (env) => parseProfile(env.data));
  },

  /**
   * `PUT v1/profile/me` — UNVERIFIED. The response shape is unknown, so nothing is read out of
   * the reply: the caller re-fetches `profile/me` (which IS verified) and shows that.
   */
  async update(values: ProfileEditValues): Promise<Result<void>> {
    return mapResult(await profileRemote.update(buildProfileUpdateBody(values)), () => undefined);
  },

  /** `DELETE v1/profile/me` — UNVERIFIED (method and path inferred, body unknown). */
  async deleteAccount(): Promise<Result<void>> {
    return mapResult(await profileRemote.deleteAccount(), () => undefined);
  },

  /** `GET v1/privacy-policies` — verified, `auth: none`, so it works for a guest. */
  async policies(signal?: AbortSignal): Promise<Result<PrivacyPolicy[]>> {
    return mapResult(await profileRemote.policies(signal), (env) => parsePolicies(env.data));
  },
} as const;
