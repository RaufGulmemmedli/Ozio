/**
 * Query keys for the group_buy module.
 *
 * Everything this module reads is mock-only (`/api/mock/group_buy/…`), so every key lives under
 * `['group_buy', …]` and `invalidateQueries({ queryKey: groupBuyKeys.all })` drops the whole demo
 * without touching another module's cache.
 *
 * Deal text is localized by the source (`translations: [{locale, …}]`, exactly like the real
 * catalog rows), so every key is wrapped in `scoped(key, locale)` at the hook.
 */
import { moduleKeys } from '@/core/query';

export const groupBuyKeys = {
  ...moduleKeys('group_buy'),

  /** `GET /api/mock/group_buy/deals` — `{ nearby, mine }`, what `/group-buy` renders. */
  overview: () => ['group_buy', 'overview'] as const,
  /** `GET /api/mock/group_buy/deals/{id}` — one deal, what `/group-buy/deal/[id]` renders. */
  deal: (id: string) => ['group_buy', 'deal', id] as const,
  /** `GET /api/mock/group_buy/products` — the catalog `/group-buy/create` picks from. */
  products: () => ['group_buy', 'products'] as const,
  /** `GET /api/mock/group_buy/deals/{id}/quote?qty=` — the GB4 confirm breakdown. */
  quote: (id: string, qty: number) => ['group_buy', 'deal', id, 'quote', qty] as const,
} as const;
