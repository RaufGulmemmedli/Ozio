/**
 * Public surface of the `courier_plus` module (Yolüstü kuryer + Qonşu anbar).
 *
 * Nothing else in this folder is public. **W7 owns `/courier-services`** and links here through
 * `<CourierPlusEntry>`, which renders nothing when the `courierPlus` flag is off — so a caller
 * never has to know about the flag or about these routes.
 *
 * The data layer is mock-only today (`data/courier_plus.mock.ts` serves
 * `/api/mock/courier_plus/…`); the hooks and the repository shape are what a real backend would
 * satisfy, so swapping it in means changing the URL in `data/courier_plus.remote.ts` and deleting
 * the handler file.
 */

/* -------------------------------------------------------------- entry points */
export { CourierPlusEntry } from './components/CourierPlusEntry';
export type { CourierPlusEntryProps } from './components/CourierPlusEntry';

/** The consumer-side neighbour-hub picker (`z57Lfl`) — a modal, not a route. */
export { CpNeighborHubModal } from './components/CpNeighborHubModal';
export type { CpNeighborHubModalProps } from './components/CpNeighborHubModal';

/* -------------------------------------------------------------- route-level views */
export { CourierPlusHomeView } from './view/CourierPlusHomeView';
export { CourierPlusRouteView } from './view/CourierPlusRouteView';
export { CourierPlusMatchesView } from './view/CourierPlusMatchesView';
export { CourierPlusTrackView } from './view/CourierPlusTrackView';
export { CourierPlusEarningsView } from './view/CourierPlusEarningsView';
export { CourierPlusHubRegisterView } from './view/CourierPlusHubRegisterView';
export { CourierPlusHubView } from './view/CourierPlusHubView';

/* -------------------------------------------------------------- hooks */
export {
  useCourierPlusOverview,
  useCourierPlusRoute,
  useCourierPlusMatches,
  useCourierPlusDelivery,
  useCourierPlusEarnings,
  useCourierPlusHubProfile,
  useCourierPlusHubDashboard,
  useCourierPlusNearbyHubs,
  useSaveCourierPlusRoute,
  useAcceptCourierPlusOffer,
  useAdvanceCourierPlusDelivery,
  useRegisterCourierPlusHub,
  useCourierPlusHandOver,
} from './hooks/use-courier-plus';

/* -------------------------------------------------------------- flags, routes, keys */
export {
  COURIER_PLUS_FLAG,
  COURIER_PLUS_MODULE,
  courierPlusEnabled,
} from './courier_plus.flags';
export { courierPlusRoutes, courierPlusModalStates } from './courier_plus.routes';
export type { ModuleRoute } from './courier_plus.routes';
export { courierPlusKeys } from './courier_plus.query-keys';

/* -------------------------------------------------------------- domain types */
export type {
  CpTransport,
  CpRoute,
  CpParcelOffer,
  CpDelivery,
  CpStep,
  CpEarnings,
  CpEarningEntry,
  CpOverview,
  CpHubProfile,
  CpHubParcel,
  CpHubDashboard,
  CpNearbyHub,
} from './data/models/courier-plus';
export { minutesToClock, clockToMinutes, CP_LAST_STEP } from './data/models/courier-plus';
