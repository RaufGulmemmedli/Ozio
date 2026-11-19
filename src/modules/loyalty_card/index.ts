/**
 * Public surface of the loyalty-card module. Other modules import **only**
 * from here.
 *
 * The contract names: `useCard`, `useBonusTransactions`, `useWalletLink`,
 * `<OzioCard>`, `<BonusTransactionRow>` and `cardKeys`. `<OzioCard>` keeps that
 * exact name and takes the card model plus a `size` prop, because the home page
 * (agent M2) renders it.
 *
 * `monthlyBonusSummary` / `monthlyCashback` are exported so the monthly-cashback
 * figure on `/home` is derived in one place rather than twice.
 */

/* ---- hooks -------------------------------------------------------------- */
export { useCard, PREVIEW_CARD, type UseCardResult } from './hooks/use-card';
export {
  useBonusTransactions,
  type UseBonusTransactionsArgs,
  type UseBonusTransactionsResult,
} from './hooks/use-bonus-transactions';
export {
  useWalletLink,
  APP_DOWNLOAD_HREF,
  type UseWalletLinkResult,
  type WalletPlatform,
} from './hooks/use-wallet-link';
export {
  useTierLadder,
  useExpiringBonus,
  type UseTierLadderResult,
  type UseExpiringBonusResult,
} from './hooks/use-tier-ladder';
export { useTransaction, type UseTransactionResult } from './hooks/use-transaction';
export { useLevelUp, LAST_TIER_STORAGE_KEY, type UseLevelUpResult } from './hooks/use-level-up';

/* ---- components --------------------------------------------------------- */
export { OzioCard, type OzioCardProps, type OzioCardSize } from './components/ozio-card';
export {
  BonusTransactionRow,
  signedMoney,
  type BonusTransactionRowProps,
} from './components/bonus-transaction-row';
export { CardBarcodePanel, type CardBarcodePanelProps } from './components/card-barcode-panel';
export { WalletButtons, type WalletButtonsProps } from './components/wallet-buttons';
export { LevelProgressCard, type LevelProgressCardProps } from './components/level-progress-card';
export { TierCard, type TierCardProps } from './components/tier-card';
export { LevelUpDialog, type LevelUpDialogProps } from './components/level-up-dialog';
export {
  ExpiringBonusSection,
  type ExpiringBonusSectionProps,
} from './components/expiring-bonus-section';
export {
  TransactionFilters,
  applyClientFilters,
  PERIOD_MONTHS,
  type TransactionFiltersProps,
  type TransactionPeriod,
} from './components/transaction-filters';

/* ---- views (the route files are the only callers) ----------------------- */
export { CardView } from './view/CardView';
export { CardSkeleton } from './view/CardSkeleton';
export { CardOfflineView } from './view/CardOfflineView';
export { BonusActivityPanel } from './view/BonusActivityPanel';
export { TransactionsView } from './view/TransactionsView';
export { TransactionsSkeleton } from './view/TransactionsSkeleton';
export { TransactionDetailView } from './view/TransactionDetailView';
export { LevelsView } from './view/LevelsView';
export { LevelsSkeleton } from './view/LevelsSkeleton';

/* ---- data --------------------------------------------------------------- */
export {
  cardKeys,
  type BonusKindFilter,
  type BonusSourceFilter,
  type BonusTransactionsFilter,
} from './loyalty_card.query-keys';
export { loyaltyCardRoutes, type LoyaltyRoute } from './loyalty_card.routes';
export { LOYALTY_DEMO_MODULE, LOYALTY_MOCK_MODULE, tiersEnabled } from './loyalty_card.flags';
export { loyaltyCardRepository } from './data/loyalty_card.repository';
export {
  EMPTY_CARD,
  groupCardNumber,
  maskCardNumber,
  parseOzioCard,
  type OzioCardModel,
} from './data/models/card';
export {
  monthKeyOf,
  monthlyBonusSummary,
  monthlyCashback,
  parseBonusTransaction,
  sortByDateDesc,
  type BonusDirection,
  type BonusSourceType,
  type BonusTransaction,
} from './data/models/bonus-transaction';
export {
  hasExpiring,
  parseExpiringBonus,
  parseTierLadder,
  type ExpiringBatch,
  type ExpiringBonus,
  type LoyaltyTier,
  type TierAccent,
  type TierIconKey,
  type TierLadder,
} from './data/models/tier';
export { cardCacheKey, clearCardCache, readCardCache } from './data/card-cache';
