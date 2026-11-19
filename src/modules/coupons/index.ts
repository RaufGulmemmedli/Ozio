/**
 * `@/modules/coupons` — the module's only public surface.
 *
 * Endpoints behind it:
 *   `GET  v1/coupons/global`     live: **verified**   — the catalogue `/coupons` renders
 *   `GET  v1/promo-code`         live: **verified**   — empty on live, row shape unobserved
 *   `POST v1/promo-code/apply`   live: **unverified** — never claimed as success; the verified
 *                                                       path is `promo_code` on
 *                                                       `POST v2/orders/checkout` (cart module)
 *
 * Fields the design draws that the API does not send (and that this module therefore does
 * not render): partner / brand / store name, terms & conditions, minimum basket, usage
 * limit, max cashback, a redemption-token countdown, and any campaign-category tag
 * ("Təzə çörək", "Ad günü", …).
 *
 * Read `discount_type` before formatting `discount_value`: `percent` **and** `cashback`
 * are percentages; only `fixed` is money.
 */

/* data */
export {
  couponState,
  daysLeft,
  isLive,
  isRedeemableOnline,
  parseCoupon,
  wallMoment,
  type Coupon,
  type CouponChannel,
  type CouponDiscountKind,
  type CouponSource,
  type CouponState,
  type WallMoment,
} from './data/models/coupon';
export { couponsRepository, type PromoApplyResult } from './data/coupons.repository';
export { couponKeys } from './coupons.query-keys';
export { couponsRoutes, type ModuleRoute } from './coupons.routes';

/* hooks */
export { useApplyPromoCode, useCoupon, useCoupons, type UseCouponsOptions } from './hooks/use-coupons';

/* components */
export { CouponTicket, type CouponTicketProps } from './components/coupon-ticket';
export { useCouponValue, type CouponValueText } from './components/coupon-value';
export { PromoCodeModal, type PromoCodeModalProps } from './components/promo-code-modal';

/* views (route-level) */
export { CouponsView, normalizeScope, type CouponsViewProps } from './view/CouponsView';
export { CouponsSkeleton } from './view/CouponsSkeleton';
export { CouponDetailView, type CouponDetailViewProps } from './view/CouponDetailView';
export { CouponDetailSkeleton } from './view/CouponDetailSkeleton';
export { CouponModal } from './view/CouponModal';
