/**
 * Which feature flag gates this module (08-feature-flags-mocks.md).
 *
 * `NEXT_PUBLIC_FEATURE_SENIOR`, default **ON** (owner decision 2026-11-12: a flagged feature is
 * shown and labelled "Demo rejim" rather than hidden).
 *
 * Enforced in three places:
 *  1. the edge middleware, via `flagRoutePatterns` (`/^\/senior(\/|$)/ -> 'senior'`);
 *  2. every page in this module calls `assertSeniorEnabled()`, which `notFound()`s;
 *  3. `data/senior.mock.ts` wraps its handlers in `flagged(..., 'senior')`.
 *
 * The **prefs** half of this module (Sadə rejim: larger type, bigger targets, high contrast) is a
 * device preference rather than data, so it keeps working with the mock layer switched off — only
 * the pension basket and the neighbour board need the handlers.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';

/** The flag name, so no file in this module retypes the string. */
export const SENIOR_FLAG = 'senior' as const;

/** The MSW namespace: every mock call goes to `/api/mock/senior/…`. */
export const SENIOR_MOCK_MODULE = 'senior' as const;

export const seniorEnabled = (): boolean => FeatureFlags.senior;

/** Defence in depth, called by each of this module's pages before rendering. */
export function assertSeniorEnabled(): void {
  if (!FeatureFlags.senior) notFound();
}
