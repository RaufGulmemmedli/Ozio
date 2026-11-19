/**
 * Query keys for the courier module.
 *
 * `courierKeys.me` carries the status, the shift, the summary tiles and the active delivery, so
 * accepting or advancing an order invalidates one key and every screen catches up.
 */
import { moduleKeys } from '@/core/query';

export const courierKeys = {
  ...moduleKeys('courier'),
  /** `GET couriers/me` — status + shift + earnings + active order. */
  me: () => ['courier', 'me'] as const,
  /** `GET couriers/offers`. */
  offers: () => ['courier', 'offers'] as const,
  /** `GET couriers/orders/{id}`. */
  order: (id: string) => ['courier', 'order', id] as const,
  /** `GET couriers/history`. */
  history: () => ['courier', 'history'] as const,
  /** `GET couriers/earnings`. */
  earnings: () => ['courier', 'earnings'] as const,
} as const;
