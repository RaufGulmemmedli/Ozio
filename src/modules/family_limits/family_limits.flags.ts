/**
 * Which feature flag gates this module (08-feature-flags-mocks.md).
 *
 * `NEXT_PUBLIC_FEATURE_FAMILY_LIMITS`, default **ON** (owner decision 2026-11-12: a flagged
 * feature is shown and labelled "Demo rejim" rather than hidden).
 *
 * Enforced in three places:
 *  1. the edge middleware, via `flagRoutePatterns` (`/^\/family-limits(\/|$)/ -> 'familyLimits'`);
 *  2. every page in this module calls `assertFamilyLimitsEnabled()`, which `notFound()`s;
 *  3. `data/family_limits.mock.ts` wraps its handlers in `flagged(..., 'familyLimits')`, so with
 *     the flag off the screens render their error state rather than a fake success.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';

/** The flag name, so no file in this module retypes the string. */
export const FAMILY_LIMITS_FLAG = 'familyLimits' as const;

/** The MSW namespace: every mock call goes to `/api/mock/family_limits/…`. */
export const FAMILY_LIMITS_MOCK_MODULE = 'family_limits' as const;

export const familyLimitsEnabled = (): boolean => FeatureFlags.familyLimits;

/** Defence in depth, called by each of this module's pages before rendering. */
export function assertFamilyLimitsEnabled(): void {
  if (!FeatureFlags.familyLimits) notFound();
}
