/**
 * Public surface of the `home` module (M2: home + offers + notifications).
 *
 * Other modules import **only** from here. The shell takes `useUnreadCount` for the bell badge;
 * everything else is internal to the three screens.
 */
export { homeRoutes, type ModuleRoute } from './home.routes';
export { homeKeys, notificationKeys, offersKeys } from './home.query-keys';

export { HomeView, OffersView, NotificationsView } from './view';
export { HomeSkeleton, OffersSkeleton, NotificationsSkeleton } from './view';

/** The bell badge count — `GET /notification/api/v1/notifications/unread-count`. */
export { useUnreadCount, useNotificationFeed, useMarkNotificationsRead } from './hooks';

export type {
  Coupon,
  Highlight,
  HomeDeliveryPoint,
  HomeProduct,
  HomeSlide,
  NotificationItem,
  PlusCampaign,
  TenProgress,
} from './data/models';
