/**
 * Paths + params for the profile package. Nothing here parses or decides — it only names
 * endpoints (via `endpoint()`, so no path literal is retyped) and returns `Result<ApiEnvelope>`.
 *
 * This module owns **only** the five profile operations below. Everything else the profile and
 * history screens show (orders, bonus transactions, lottery tickets, coupons, addresses,
 * notification counts) belongs to another module and is read through that module's hooks — it is
 * deliberately NOT duplicated here.
 *
 *   GET    v1/profile/me          verified
 *   PUT    v1/profile/me          UNVERIFIED  (body guessed — see models/profile-update.ts)
 *   DELETE v1/profile/me          UNVERIFIED  (method + path inferred)
 *   GET    v1/privacy-policies    verified, `auth: none` → guest-safe
 *
 * `POST v1/file/upload` is deliberately absent: it is unverified AND the profile has no image
 * field to attach an upload to, so this package never calls it (there is no avatar uploader).
 */
import { callEndpoint, type RemoteResult } from '@/core/network';
import type { ProfileMeData, ProfilePrivacyPoliciesData } from '@/core/api/contracts/types';

export const profileRemote = {
  me: (signal?: AbortSignal): RemoteResult<ProfileMeData> =>
    callEndpoint<ProfileMeData>('ProfileMe', { signal }),

  update: (body: Record<string, unknown>): RemoteResult<unknown> =>
    callEndpoint<unknown>('ProfileUpdateMe', { body }),

  /** No body: whether the server accepts a reason / confirmation payload is unknown. */
  deleteAccount: (): RemoteResult<unknown> => callEndpoint<unknown>('ProfileDeleteMe'),

  policies: (signal?: AbortSignal): RemoteResult<ProfilePrivacyPoliciesData> =>
    callEndpoint<ProfilePrivacyPoliciesData>('ProfilePrivacyPolicies', { signal }),
} as const;
