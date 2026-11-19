/**
 * Which feature flag gates this module (08-feature-flags-mocks.md).
 *
 * `NEXT_PUBLIC_FEATURE_ASK_TO_BUY`, default **ON** (owner decision 2026-11-12: a flagged feature
 * is shown and labelled "Demo rejim" rather than hidden).
 *
 * Enforced in three places:
 *  1. the edge middleware, via `flagRoutePatterns` (`/^\/ask-to-buy(\/|$)/ -> 'askToBuy'`) —
 *     the route redirects to `/home` when the flag is off;
 *  2. every page in this module calls `assertAskToBuyEnabled()`, which `notFound()`s;
 *  3. `data/ask_to_buy.mock.ts` wraps its handlers in `flagged(..., 'askToBuy')`, so with the flag
 *     off the mock traffic is unhandled and the screens render their error state instead of
 *     pretending the demo works.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';

/** The flag name, so no file in this module retypes the string. */
export const ASK_TO_BUY_FLAG = 'askToBuy' as const;

/** The MSW namespace: every mock call goes to `/api/mock/ask_to_buy/…`. */
export const ASK_TO_BUY_MOCK_MODULE = 'ask_to_buy' as const;

export const askToBuyEnabled = (): boolean => FeatureFlags.askToBuy;

/** Defence in depth, called by each of this module's pages before rendering. */
export function assertAskToBuyEnabled(): void {
  if (!FeatureFlags.askToBuy) notFound();
}
