'use client';

/**
 * The counters the P1 menu rows and stat tiles show.
 *
 * `GET v1/profile/me` carries **no** order count, coupon count or cashback percentage, so (exactly
 * as Flutter's `ProfileStats` does) the row is assembled client-side — but every read belongs to
 * another module, so this file only **composes their hooks**; it owns no repository of its own:
 *
 *   orders    → `useOrders()`        `@/modules/orders`        (`v2/orders` total)
 *   coupons   → `useCoupons()`       `@/modules/coupons`       (`coupons/global` + `promo-code`)
 *   addresses → `useAddresses()`     `@/modules/address`       (`v1/profile/address`)
 *   unread    → `useUnreadCount()`   `@/modules/home`          (notifications unread-count)
 *   cashback  → `profile.me.bonus_cards[0].total` (lifetime bonus earned, verified — already in
 *               this module's own `useProfile()`, so no extra call is made for it)
 *
 * A counter that has not answered — or whose query failed — stays `null`, and the UI renders a
 * dash rather than a made-up number (BUILD-CONTRACT rule 7).
 */
import { useAddresses } from '@/modules/address';
import { useCoupons } from '@/modules/coupons';
import { useUnreadCount as useNotificationUnreadCount } from '@/modules/home';
import { useOrders } from '@/modules/orders';

import { primaryCard, type Profile } from '../data/models/profile';
import type { ProfileStats } from '../data/models/profile-stats';

/** `GET v1/profile/address` — count only; the address module owns the list. */
export function useAddressCount(): number | null {
  const addresses = useAddresses();
  return addresses.data ? addresses.data.length : null;
}

/** The notifications bell count; agent M2 owns `/notifications` itself. */
export function useUnreadCount(): number | null {
  const unread = useNotificationUnreadCount();
  return typeof unread.data === 'number' ? unread.data : null;
}

/**
 * Orders / cashback / coupons for the three stat tiles. Each read degrades on its own: one
 * failing counter shows a dash, it never blanks the screen.
 */
export function useProfileStats(profile: Profile | null | undefined): ProfileStats {
  // No `limit` override: `orderKeys.list()` carries no page size, so a different limit here would
  // fight the orders screen over one cache entry. The default page is shared with it instead.
  const orders = useOrders();
  const coupons = useCoupons();
  const card = primaryCard(profile);

  return {
    // `total` is 0 until the first page lands, so "not answered yet" stays a dash.
    orders: orders.isPending || orders.isError ? null : orders.total,
    cashback: card ? card.total : null,
    coupons: coupons.data ? coupons.data.total : null,
  };
}
