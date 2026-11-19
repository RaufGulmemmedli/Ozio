/**
 * Which feature flag gates the referral slice (08-feature-flags-mocks.md).
 *
 * `NEXT_PUBLIC_FEATURE_REFERRAL`, default **ON**. The edge rule is
 * `{ pattern: /^\/invite(\/|$)/, flag: 'referral' }` in `core/config/feature-flags.ts`, and
 * `/invite` also calls `assertReferralEnabled()`.
 *
 * ### Why this module is called `profile_referral`
 *
 * `02-routing.md` files `/invite` under the `profile` module, but `src/modules/profile/` belongs to
 * another agent, so the referral slice lives in its own folder.
 *
 * The consequence is in `data/referral.mock.ts`: `src/core/mocks/modules.ts` lazy-imports
 * `src/modules/<name>/data/<name>.mock` for a fixed list of names, and `profile_referral` is **not**
 * in that list (`profile` is, but it is not mine to write). So the handlers register themselves
 * under the namespace `profile_referral` and are loaded by a side-effect import from
 * `src/modules/topup/data/topup.mock.ts`, which *is* on the list. The registry key is free-form —
 * only the loader's list of folder names is fixed — so the MSW namespace stays
 * `/api/mock/profile_referral/…`.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';

import { REFERRAL_MOCK_MODULE } from './data/referral.fixtures';

export const REFERRAL_FLAG = 'referral' as const;

/**
 * The MSW namespace: every mock call goes to `/api/mock/profile_referral/…`.
 *
 * Defined in `data/referral.fixtures.ts` and re-exported here: the handler file must not import
 * this module, because `notFound()` above drags `next/navigation` into the handler graph and those
 * handlers also run under `msw/node`.
 */
export { REFERRAL_MOCK_MODULE };

export const referralEnabled = (): boolean => FeatureFlags.referral;

export function assertReferralEnabled(): void {
  if (!FeatureFlags.referral) notFound();
}
