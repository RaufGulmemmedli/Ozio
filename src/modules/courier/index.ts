/**
 * `@/modules/courier` — the module's public surface. Other modules import **only** from here.
 *
 * What a host screen needs:
 * - `<CourierProfileEntry />` — the profile row "Ozio ilə işlə". It hides itself when the
 *   `courier` flag is off and routes to apply / status / panel by the current status.
 * - `useCourierMe()`, if a screen wants to show the courier's state itself.
 *
 * The route-level views are imported by the seven `page.tsx` files only.
 */

export { courierRoutes, type CourierRoute } from './courier.routes';
export {
  COURIER_FLAG,
  COURIER_MOCK_MODULE,
  COURIER_REVIEW_DELAY_MS,
  courierEnabled,
} from './courier.flags';
export { courierKeys } from './courier.query-keys';

export {
  courierItemCount,
  courierNextStatus,
  courierOrderEarning,
  courierOrderIsActive,
  courierStep,
  emptyCourierApplication,
  formatFin,
  formatIban,
  formatPlate,
  formatVoen,
  toCourierApplicationWire,
  vehicleNeedsPlate,
  WEEKDAY_KEYS,
  type CourierApplication,
  type CourierApplicationWire,
  type CourierDayEarning,
  type CourierEarnings,
  type CourierMe,
  type CourierOrder,
  type CourierOrderItem,
  type CourierOrderStatus,
  type CourierPayment,
  type CourierShift,
  type CourierStatus,
  type CourierVehicle,
} from './data/models/courier';

export { courierRepository, type CourierRepository } from './data/courier.repository';

export {
  COURIER_OFFERS_POLL_MS,
  COURIER_REVIEW_POLL_MS,
  useAcceptCourierOrder,
  useAdvanceCourierOrder,
  useCancelCourierOrder,
  useCourierEarnings,
  useCourierHistory,
  useCourierMe,
  useCourierOffers,
  useCourierOrder,
  useCourierShiftToggle,
  useDeclineCourierOrder,
  useSubmitCourierApplication,
} from './hooks/use-courier';
export {
  useCourierApplyForm,
  validateCourierApplication,
  type CourierField,
  type CourierIssues,
} from './hooks/use-courier-apply-form';

/* ---------------------------------------------------- entry points + screens */

export {
  CourierProfileEntry,
  type CourierProfileEntryProps,
} from './components/courier-profile-entry';

export { CourierApplyView } from './view/CourierApplyView';
export { CourierApplyStatusView } from './view/CourierApplyStatusView';
export { CourierPanelView } from './view/CourierPanelView';
export { CourierOfferView } from './view/CourierOfferView';
export { CourierDeliveryView } from './view/CourierDeliveryView';
export { CourierEarningsView } from './view/CourierEarningsView';
export { CourierHistoryView } from './view/CourierHistoryView';
