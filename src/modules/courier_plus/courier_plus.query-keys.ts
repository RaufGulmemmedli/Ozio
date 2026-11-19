/**
 * Query keys for the Yolüstü kuryer / Qonşu anbar screens.
 *
 * One key per repository read, so accepting an offer can invalidate exactly the lists that
 * changed (matches + overview + earnings) and nothing else.
 */
import { moduleKeys } from '@/core/query';

export const courierPlusKeys = {
  ...moduleKeys('courier_plus'),
  /** `GET mock/courier_plus/overview` — the landing hero + card states. */
  overview: ['courier_plus', 'overview'] as const,
  /** `GET mock/courier_plus/route` — the declared route. */
  route: ['courier_plus', 'route'] as const,
  /** `GET mock/courier_plus/matches` — parcels the mock matched against the route. */
  matches: ['courier_plus', 'matches'] as const,
  /** `GET mock/courier_plus/deliveries/{id}`. */
  delivery: (id: string) => ['courier_plus', 'delivery', id] as const,
  /** `GET mock/courier_plus/earnings`. */
  earnings: ['courier_plus', 'earnings'] as const,
  /** `GET mock/courier_plus/hub` — the hub profile, `null` until registered. */
  hubProfile: ['courier_plus', 'hub', 'profile'] as const,
  /** `GET mock/courier_plus/hub/dashboard`. */
  hubDashboard: ['courier_plus', 'hub', 'dashboard'] as const,
  /** `GET mock/courier_plus/hubs/nearby` — the consumer picker modal. */
  nearbyHubs: ['courier_plus', 'hubs', 'nearby'] as const,
} as const;
