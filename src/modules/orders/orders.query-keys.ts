/**
 * Query keys for the orders + checkout + payment module.
 *
 * First element is always the module name (04-data-layer.md), so signing out can drop everything
 * user-bound at once. The tracking screen deliberately shares `detail(id)` with the detail screen:
 * the polled response IS the detail response (there is no tracking endpoint), so both screens read
 * one cache entry and only the polling observer carries `refetchInterval`.
 */
import { moduleKeys } from '@/core/query';

export interface OrdersListFilter {
  /** Which tab the list is rendering. The API cannot filter, so this only scopes the cache. */
  tab?: 'active' | 'past' | 'all';
}

export const orderKeys = {
  ...moduleKeys('orders'),
  /** `GET v2/orders?offset&limit` — one page of the list. */
  list: (filter?: OrdersListFilter) => ['orders', 'list', filter ?? {}] as const,
  /** `GET v2/orders/{id}` — detail AND tracking (same endpoint). */
  detail: (id: string | number) => ['orders', 'detail', id] as const,
  /** The pre-submit id snapshot used to resolve an ambiguous `POST v2/orders`. */
  snapshot: () => ['orders', 'snapshot'] as const,
} as const;

export const paymentKeys = {
  all: ['payment'] as const,
  /** `GET v1/profile/me/cards`. */
  cards: () => ['payment', 'cards'] as const,
  /** `POST v2/orders/checkout` — a calculation, keyed by the whole selection. */
  checkout: (selection: unknown) => ['payment', 'checkout', selection] as const,
} as const;
