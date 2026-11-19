/**
 * Which feature flag gates this module (08-feature-flags-mocks.md).
 *
 * `NEXT_PUBLIC_FEATURE_PRICE_LOCK`, default **ON** (owner decision 2026-11-12: a flagged feature
 * is shown and labelled "Demo rejim" rather than hidden).
 *
 * The flag is enforced in three places:
 *  1. the edge middleware, via `flagRoutePatterns` in `core/config/feature-flags.ts`
 *     (`/^\/(price-guarantee|price-locks)$/ -> 'priceLock'`) — the route redirects to `/home`
 *     when the flag is off;
 *  2. both pages in this module call {@link assertPriceLockEnabled}, which `notFound()`s;
 *  3. `data/price_lock.mock.ts` wraps its handlers in `flagged(..., 'priceLock')`, so with the
 *     flag off the mock traffic is unhandled and the screens render their error state instead of
 *     pretending the demo works.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';

/** The flag name, so no file in this module retypes the string. */
export const PRICE_LOCK_FLAG = 'priceLock' as const;

/** The MSW namespace: every mock call goes to `/api/mock/price_lock/…`. */
export const PRICE_LOCK_MOCK_MODULE = 'price_lock' as const;

export const priceLockEnabled = (): boolean => FeatureFlags.priceLock;

/** Defence in depth, called by each of this module's pages before rendering. */
export function assertPriceLockEnabled(): void {
  if (!FeatureFlags.priceLock) notFound();
}
