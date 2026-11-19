/**
 * The P1 stat tiles ("48 Sifariş", "128,40 ₼ Keşbek", "5 Kupon").
 *
 * `GET v1/profile/me` carries **no** order count, cashback percentage or coupon count, so (exactly
 * as Flutter's `ProfileStats` does) the row is assembled client-side from separate reads and every
 * field is nullable: `null` means "that endpoint failed or answered an unknown shape", and the UI
 * then renders a dash rather than a made-up number (BUILD-CONTRACT rule 7).
 *
 * Each value is read through the owning module's hook (`useProfileStats` composes them) — this
 * package owns no repository for them:
 *
 * - `orders`   ← `useOrders()` from `@/modules/orders` → `GET v2/orders` `total` (verified)
 * - `cashback` ← `profile.me.bonus_cards[0].total`, lifetime bonus earned (verified, this module)
 * - `coupons`  ← `useCoupons()` from `@/modules/coupons` → `coupons/global` + `promo-code` total
 */
export interface ProfileStats {
  orders: number | null;
  cashback: number | null;
  coupons: number | null;
}

export const EMPTY_STATS: ProfileStats = { orders: null, cashback: null, coupons: null };
