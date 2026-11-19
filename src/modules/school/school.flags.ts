/**
 * Which feature flag gates this module (08-feature-flags-mocks.md).
 *
 * `NEXT_PUBLIC_FEATURE_SCHOOL`, default **ON** (owner decision 2026-11-12: a flagged feature is
 * shown and labelled "Demo rejim" rather than hidden).
 *
 * The flag is enforced in three places:
 *  1. the edge middleware, via `flagRoutePatterns` in `core/config/feature-flags.ts`
 *     (`/^\/school(\/|$)/ -> 'school'`) — the route redirects to `/home` when the flag is off;
 *  2. every page in this module calls `assertSchoolEnabled()` below, which `notFound()`s;
 *  3. `data/school.mock.ts` wraps its handlers in `flagged(..., 'school')`, so with the flag off
 *     the mock traffic is unhandled and the screens render `<ErrorState>` instead of pretending
 *     the demo works.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';

/** The flag name, so no file in this module retypes the string. */
export const SCHOOL_FLAG = 'school' as const;

/** The MSW namespace: every mock call goes to `/api/mock/school/…`. */
export const SCHOOL_MOCK_MODULE = 'school' as const;

export const schoolEnabled = (): boolean => FeatureFlags.school;

/** Defence in depth, called by each of this module's pages before rendering. */
export function assertSchoolEnabled(): void {
  if (!FeatureFlags.school) notFound();
}
