/**
 * The referral repository — the only thing the hooks import.
 *
 * Parsers never throw: a profile that answers without `ref_code` (which is live today) yields
 * `''`, and the hook combines that with the mock programme through `buildReferral`.
 */
import { mapResult, type Result } from '@/core/network';

import {
  EMPTY_PROGRAMME,
  parseRefCode,
  parseReferralProgramme,
  type ReferralProgramme,
} from './models/referral';
import { referralRemote } from './referral.remote';

export const referralRepository = {
  /** REAL — the profile's `ref_code`, or `''` when the server sends none. */
  refCode: async (signal?: AbortSignal): Promise<Result<string>> =>
    mapResult(await referralRemote.profile({ signal }), (env) => parseRefCode(env.data)),

  /** MOCK — the sample code, the reward and the invited-friends list. */
  programme: async (locale: string, signal?: AbortSignal): Promise<Result<ReferralProgramme>> =>
    mapResult(await referralRemote.programme(locale, { signal }), (env) =>
      env.data === null ? EMPTY_PROGRAMME : parseReferralProgramme(env.data),
    ),
};
