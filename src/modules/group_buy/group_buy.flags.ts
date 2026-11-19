/**
 * Which feature flag gates this module (08-feature-flags-mocks.md).
 *
 * `NEXT_PUBLIC_FEATURE_GROUP_BUY`, default **ON** (owner decision 2026-11-12: a flagged feature is
 * shown and labelled "Demo rejim" rather than hidden).
 *
 * The flag is enforced in three places:
 *  1. the edge middleware, via `flagRoutePatterns` in `core/config/feature-flags.ts`
 *     (`/^\/group-buy(\/|$)/ -> 'groupBuy'`) — the route redirects to `/home` when the flag is off;
 *  2. every page in this module calls {@link assertGroupBuyEnabled}, which `notFound()`s;
 *  3. `data/group_buy.mock.ts` wraps its handlers in `flagged(..., 'groupBuy')`, so with the flag
 *     off the mock traffic is simply unhandled and the screens render their error state instead of
 *     pretending the demo works.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';

/** The flag name, so no file in this module retypes the string. */
export const GROUP_BUY_FLAG = 'groupBuy' as const;

/** The MSW namespace: every mock call goes to `/api/mock/group_buy/…`. */
export const GROUP_BUY_MOCK_MODULE = 'group_buy' as const;

export const groupBuyEnabled = (): boolean => FeatureFlags.groupBuy;

/** Defence in depth, called by each of this module's pages before rendering. */
export function assertGroupBuyEnabled(): void {
  if (!FeatureFlags.groupBuy) notFound();
}
