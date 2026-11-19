/**
 * `@/modules/rewards` — the module's public surface. Other modules import **only** from here.
 *
 * What other agents are expected to use:
 *  - `useMissions` / `useWheel` / `usePriceAlerts` for a home tile ("1 pulsuz fırlatma var",
 *    "+9,00 ₼ qazana bilərsən"). They are `useScreenQuery`-based, so `?preview=` works wherever
 *    they are mounted.
 *  - `<MissionCard>` if a home section wants to show one mission in place.
 *  - the views + skeletons, for the route files in `src/app/[locale]/(app)/…`.
 *
 * Everything here is mock data behind `FeatureFlags.rewards`, except the digital receipt, which is
 * built from the real order detail `@/modules/orders` fetches (`useOrder` → `receiptFromOrder`).
 *
 * TODO(core): `toast()` needs `<Toaster/>` and `confirmDialog()` needs `<ConfirmDialogHost/>`
 * mounted once in the app shell / root layout. This module only uses `toast()` for confirmations
 * (every failure that matters is also rendered inline), and it uses the controlled
 * `<ConfirmDialog>` rather than the imperative helper, so nothing here breaks while those hosts are
 * missing.
 */

/* ------------------------------------------------------------------ routes & flags */
export { rewardsRoutes } from './rewards.routes';
export type { ModuleRoute as RewardsRoute } from './rewards.routes';
export { REWARDS_FLAG, REWARDS_MOCK_MODULE, rewardsEnabled } from './rewards.flags';
export { rewardsKeys } from './rewards.query-keys';

/* ----------------------------------------------------------------------- hooks */
export { useWheel, useSpin } from './hooks/use-wheel';
export { useMissions, useClaimMission } from './hooks/use-missions';
export { useFamilyCard, useFamilyAction, type FamilyAction } from './hooks/use-family-card';
export { useSmartList, useSmartListAction, type SmartListAction } from './hooks/use-smart-list';
export {
  usePriceAlerts,
  usePriceAlertAction,
  type PriceAlertAction,
} from './hooks/use-price-alerts';
export { useReceipt, type UseReceiptResult } from './hooks/use-receipt';

/* ---------------------------------------------------------------------- models */
export {
  wheelCanSpin,
  wheelNextCost,
  wheelNextIsPaid,
  wheelPrizeIsMoney,
  type WheelDay,
  type WheelPrizeType,
  type WheelSegment,
  type WheelSpinResult,
  type WheelState,
  type WheelTone,
} from './data/models/wheel';
export {
  missionClaimable,
  missionCompleted,
  missionRatio,
  missionsDoneCount,
  type Mission,
  type MissionsBoard,
} from './data/models/mission';
export {
  familyInitial,
  familyIsEmpty,
  type FamilyCard,
  type FamilyCardSettings,
  type FamilyMember,
  type FamilyRole,
} from './data/models/family';
export {
  discountedItems,
  itemDiscounted,
  itemSaving,
  itemTotal,
  listSaving,
  listTotal,
  otherItems,
  storeTotals,
  type SmartList,
  type SmartListItem,
  type SmartListStoreTotal,
} from './data/models/smart-list';
export {
  alertDropped,
  alertPercentChange,
  alertTargetHit,
  feedByPeriod,
  type FeedKind,
  type FeedNotification,
  type FeedPeriod,
  type PriceAlert,
  type PriceAlertsBoard,
} from './data/models/price-alert';
export {
  receiptFromOrder,
  receiptIsEmpty,
  type Receipt,
  type ReceiptLine,
} from './data/models/receipt';

/* ------------------------------------------------------------------ components */
export { MissionCard, type MissionCardProps } from './components/mission-card';
export { PrizeWheel, type PrizeWheelProps } from './components/prize-wheel';
export { FeedRow } from './components/feed-row';

/* ----------------------------------------------------------------------- views */
export { WheelView } from './view/WheelView';
export { WheelSkeleton } from './view/WheelSkeleton';
export { MissionsView } from './view/MissionsView';
export { MissionsSkeleton } from './view/MissionsSkeleton';
export { FamilyCardView } from './view/FamilyCardView';
export { FamilyCardSkeleton } from './view/FamilyCardSkeleton';
export { SmartListView } from './view/SmartListView';
export { SmartListSkeleton } from './view/SmartListSkeleton';
export { PriceAlertsView } from './view/PriceAlertsView';
export { PriceAlertsSkeleton } from './view/PriceAlertsSkeleton';
export { ReceiptView } from './view/ReceiptView';
export { ReceiptSkeleton } from './view/ReceiptSkeleton';
