/**
 * `@/modules/courier_shop` — the public surface. Other modules import **only** from here.
 *
 * What other modules place:
 *  - `<CourierBagBanner minutesAway={…} />` — the dark card on the order-tracking screen while the
 *    order is picked up. **`@/modules/orders` (agent M6) places it**; this module never edits that
 *    screen. It hides itself when the flag is off or there is no ETA.
 *  - `<CourierServicesEntry />` — the tile that links to `/courier-services`, for the profile menu
 *    or the courier home. Also hides itself when the flag is off.
 *
 * Everything else below is the module's own data layer, exported so a neighbouring module can read
 * (never reach into) it.
 */

/* ---------------------------------------------------------------- flags & routes */
export {
  COURIER_SHOP_FLAG,
  courierShopEnabled,
  useCourierShopEnabled,
} from './courier_shop.flags';
export { courierShopRoutes, type ModuleRoute } from './courier_shop.routes';
export { courierShopKeys } from './courier_shop.query-keys';

/* ---------------------------------------------------------------- components for other modules */
export { CourierBagBanner, type CourierBagBannerProps } from './components/courier-bag-banner';
export { CourierServicesEntry } from './components/service-tiles';

/* ---------------------------------------------------------------- views (route pages) */
export { CourierServicesView } from './view/CourierServicesView';
export { CourierBagView } from './view/CourierBagView';
export { CourierFitView } from './view/CourierFitView';
export { DoorstepView } from './view/DoorstepView';
export { CourierExpertView } from './view/CourierExpertView';
export { ExpertBookingView } from './view/ExpertBookingView';
export {
  CourierBagSkeleton,
  CourierExpertSkeleton,
  CourierFitSkeleton,
  DoorstepSkeleton,
  ExpertBookingSkeleton,
} from './view/CourierShopSkeletons';

/* ---------------------------------------------------------------- hooks */
export {
  useBagConfirm,
  useBagDraft,
  useBagItems,
  useBagQuote,
  type BagDraft,
} from './hooks/use-courier-bag';
export {
  useConfirmFit,
  useDoorstepClock,
  useFitProduct,
  useFitResult,
  useFitSession,
  useStartFit,
  type DoorstepClock,
} from './hooks/use-courier-fit';
export {
  useBookExpert,
  useExpertCatalog,
  useLatestBooking,
  type BookingVars,
} from './hooks/use-courier-expert';

/* ---------------------------------------------------------------- data layer */
export {
  courierShopRepository,
  type CourierShopRepository,
} from './data/courier_shop.repository';
export {
  chargeFor,
  formatClock,
  pick,
  secondsLeft,
  type BagDraftLine,
  type BagItem,
  type BagItemKind,
  type BagQuote,
  type BagQuoteLine,
  type BagReceipt,
  type ExpertBooking,
  type ExpertCatalog,
  type ExpertProduct,
  type ExpertProductKind,
  type ExpertService,
  type ExpertServiceKind,
  type ExpertSlot,
  type FitProduct,
  type FitResult,
  type FitSession,
  type LocalizedText,
} from './data/models';
