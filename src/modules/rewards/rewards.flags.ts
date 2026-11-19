/**
 * The flag that gates this module (08-feature-flags-mocks.md).
 *
 * `rewards` covers N1–N4 and N6 (all mock) **and** the digital receipt route `/orders/{id}/receipt`
 * (which reads the real API). Every page in this module also calls
 * `if (!FeatureFlags.rewards) notFound()` as defence in depth, and the MSW handlers are wrapped in
 * `flagged(..., REWARDS_FLAG)` so a flag-off build serves no mock traffic at all.
 */
import { FeatureFlags, type FeatureName } from '@/core/config';

export const REWARDS_FLAG: FeatureName = 'rewards';

/** Non-hook read, usable from a server component or a route handler. */
export const rewardsEnabled = (): boolean => FeatureFlags[REWARDS_FLAG];

/** The MSW namespace: all mock traffic lives under `/api/mock/rewards/…`. */
export const REWARDS_MOCK_MODULE = 'rewards';
