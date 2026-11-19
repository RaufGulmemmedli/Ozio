/**
 * Query keys for the viral module.
 *
 * Everything is served by MSW under `/api/mock/viral/…`, so all keys live under `['viral', …]` and
 * `invalidateQueries({ queryKey: viralKeys.all })` drops the whole demo and nothing else.
 *
 * The auction keys are the interesting ones: an auction's price, stock and bid log move with the
 * server's clock, so `auction(id)` is read with `CACHE.tracking` (stale immediately, dropped on
 * unmount) and re-read when a countdown the mock supplied elapses.
 */
import { moduleKeys } from '@/core/query';

export const viralKeys = {
  ...moduleKeys('viral'),

  /** `GET /api/mock/viral/products?locale=` — the gift catalogue the create form picks from. */
  products: () => ['viral', 'products'] as const,
  /** `GET /api/mock/viral/wishlists?locale=` — the user's shareable gift wishlists. */
  wishlists: () => ['viral', 'wishlists'] as const,
  /** `GET /api/mock/viral/wishlists/{id}?locale=`. */
  wishlist: (id: string) => ['viral', 'wishlists', id] as const,
  /** `GET /api/mock/viral/auctions?locale=`. */
  auctions: () => ['viral', 'auctions'] as const,
  /** `GET /api/mock/viral/auctions/{id}?locale=` — price, stock, bid log, `ends_at`. */
  auction: (id: string) => ['viral', 'auctions', id] as const,
} as const;
