/**
 * Query keys for the rewards screens.
 *
 * Every mock read returns localized fixture text, so each key is `scoped(..., locale)` by the hook
 * (04-data-layer.md): switching language must never show stale copy.
 */
import { moduleKeys } from '@/core/query';

export const rewardsKeys = {
  ...moduleKeys('rewards'),
  /** `GET /api/mock/rewards/wheel` — segments + spins used + the 7-day streak. */
  wheel: ['rewards', 'wheel'] as const,
  /** `GET /api/mock/rewards/missions`. */
  missions: ['rewards', 'missions'] as const,
  /** `GET /api/mock/rewards/family`. */
  family: ['rewards', 'family'] as const,
  /** `GET /api/mock/rewards/smart-list`. */
  smartList: ['rewards', 'smart-list'] as const,
  /** `GET /api/mock/rewards/price-alerts` — alerts + the feed preview. */
  priceAlerts: ['rewards', 'price-alerts'] as const,
  /** `GET /api/mock/rewards/feed`. */
  feed: ['rewards', 'feed'] as const,
  /*
   * N5 has no key of its own: the digital receipt is built from the order detail the orders module
   * already caches under `orderKeys.detail(id)` (see `hooks/use-receipt.ts`).
   */
} as const;
