/**
 * Public surface of the orders + checkout + payment module. Other modules import ONLY from here.
 *
 * Agent M2's home page uses `<OrderTrackerCard>`; the profile/history screens can use `useOrders`
 * and `formatOrderNo`; everything else is internal.
 */

/* hooks */
export { useOrders, ORDERS_PAGE_SIZE, type UseOrdersResult } from './hooks/use-orders';
export { useOrder, isOrderNotFound } from './hooks/use-order';
export {
  useOrderTracking,
  POLL_ACTIVE_MS,
  POLL_HIDDEN_MS,
  type UseOrderTrackingResult,
} from './hooks/use-order-tracking';
export { usePlaceOrder, type UsePlaceOrderResult } from './hooks/use-place-order';
export {
  useRateOrder,
  composeComment,
  RATE_COMMENT_MAX,
  type RateOrderInput,
} from './hooks/use-rate-order';
export {
  useSavedCards,
  useAddCard,
  useDeleteCard,
  useRefreshCards,
  useRefetchCardsOnReturn,
} from './hooks/use-saved-cards';
/*
 * The checkout **pricing** hooks are not here: `POST v2/orders/checkout` belongs to the cart module
 * (`useCheckoutCalc`, `useCheckoutSelection`, `useCartSelection`, `useDeliveryAddress`), and this
 * module only sends the calc's `id` back with the order.
 */

/* keys + formatting */
export { orderKeys, paymentKeys, type OrdersListFilter } from './orders.query-keys';
export { formatOrderNo, orderNoPlain } from './orders.format';
export { ordersRoutes, type ModuleRoute } from './orders.routes';

/* components */
export { OrderStatusBadge, type OrderStatusBadgeProps } from './components/order-status-badge';
export { OrderTrackerCard, type OrderTrackerCardProps } from './components/order-tracker-card';
export { OrderRow, type OrderRowProps } from './components/order-row';
export { OrderProgressStrip } from './components/order-progress-strip';
export { OrderRatingModal, type OrderRatingModalProps } from './components/order-rating-modal';
export { AddCardModal } from './components/add-card-modal';

/* views (the route files are the only expected callers) */
export { PaymentMethodView } from './view/PaymentMethodView';
export { AddCardView, type AddCardViewProps } from './view/AddCardView';
export { OrdersView } from './view/OrdersView';
export { OrderDetailView, type OrderDetailViewProps } from './view/OrderDetailView';
export { OrderTrackingView, type OrderTrackingViewProps } from './view/OrderTrackingView';
export { OrderSuccessView, type OrderSuccessViewProps } from './view/OrderSuccessView';
export { OrderFailedView, type OrderFailedViewProps } from './view/OrderFailedView';

/* models + status helpers other modules legitimately need */
export type { OrderSummary } from './data/models/order';
export type { OrderDetail, OrderItem, OrderCourier } from './data/models/order-detail';
export type { SavedCard } from './data/models/payment-card';
export type { PlaceOrderInput, PlaceOrderResult, DeliveryPoint } from './data/models/place-order';
export type { PaymentMethodChoice } from './data/models/payment-method';
export {
  isActiveStatus,
  isTerminalStatus,
  statusStep,
  statusTone,
  parseOrderStatus,
  moneyState,
  ORDER_STEP_COUNT,
  type OrderStatus,
  type MoneyState,
} from './data/models/order-status';
export { orderSteps, type OrderStepView } from './data/orders.repository';
