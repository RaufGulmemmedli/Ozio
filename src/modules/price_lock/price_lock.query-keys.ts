/**
 * Query keys for the price_lock module.
 *
 * Everything this module reads is mock-only (`/api/mock/price_lock/…`), so every key lives under
 * `['price_lock', …]` and `invalidateQueries({ queryKey: priceLockKeys.all })` drops the whole
 * demo without touching another module's cache.
 *
 * Staple and product names are localized by the source (`translations: [{locale, name}]`), so
 * every key is wrapped in `scoped(key, locale)` at the hook.
 */
import { moduleKeys } from '@/core/query';

export const priceLockKeys = {
  ...moduleKeys('price_lock'),

  /** `GET /api/mock/price_lock/guarantee` — what `/price-guarantee` renders. */
  guarantee: () => ['price_lock', 'guarantee'] as const,
  /** `GET /api/mock/price_lock/locks` — what `/price-locks` renders (both tabs). */
  locks: () => ['price_lock', 'locks'] as const,
} as const;
