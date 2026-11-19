/**
 * Query keys for the `courier_shop` module.
 *
 * First element is always the module name (04-data-layer.md) so signing out drops everything
 * user-bound at once, and `courierShopKeys.all` invalidates the whole demo after a mutation.
 */
import { moduleKeys } from '@/core/query';

import type { BagDraftLine } from './data/models';
import type { ExpertProductKind } from './data/models';

export const courierShopKeys = {
  ...moduleKeys('courier_shop'),

  /** `GET bag/items` — what the courier is carrying. */
  bagItems: () => ['courier_shop', 'bag', 'items'] as const,
  /** `POST bag/quote` — server-side totals for the current selection. */
  bagQuote: (lines: readonly BagDraftLine[]) => ['courier_shop', 'bag', 'quote', lines] as const,

  /** `GET fit/product` — the single demo product offered in two sizes. */
  fitProduct: () => ['courier_shop', 'fit', 'product'] as const,
  /** `GET fit/sessions/current` — the live doorstep try-on session, or `null`. */
  fitSession: () => ['courier_shop', 'fit', 'session'] as const,
  /** `GET fit/results/latest` — the settled session, for the result screen. */
  fitResult: () => ['courier_shop', 'fit', 'result'] as const,

  /** `GET expert/catalog?product=` — services + slots for one product kind. */
  expertCatalog: (product: ExpertProductKind) =>
    ['courier_shop', 'expert', 'catalog', product] as const,
  /** `GET expert/bookings/latest` — the reservation the confirmation screen shows. */
  expertBooking: () => ['courier_shop', 'expert', 'booking'] as const,
} as const;
