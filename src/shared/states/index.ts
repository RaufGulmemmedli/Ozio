/**
 * `@/shared/states` — every empty / error / offline / guest / demo pattern
 * from `design-system/states-catalog.md`.
 *
 * **This package localizes nothing.** Every user-facing string arrives as a
 * prop, already resolved by the calling module through next-intl. The only
 * exceptions are `<SessionExpiredDialog>` and `<DemoBanner>`, which may read
 * `common.*` keys (and still accept prop overrides).
 */

export { EmptyState, type EmptyStateProps, type StateTone } from './empty-state';
export {
  ErrorState,
  failureIcon,
  FAILURE_ICON,
  type ErrorStateProps,
  type FailureKind,
  type FailureLike,
} from './error-state';
export { OfflineBanner, type OfflineBannerProps } from './offline-banner';
export {
  SessionExpiredDialog,
  type SessionExpiredDialogProps,
} from './session-expired-dialog';
export {
  GuestPrompt,
  GuestGate,
  type GuestPromptProps,
  type GuestGateProps,
} from './guest-prompt';
export { DemoBanner, type DemoBannerProps } from './demo-banner';
export {
  InlineNotice,
  StateButton,
  type InlineNoticeProps,
  type InlineNoticeTone,
  type StateButtonProps,
  type StateButtonVariant,
} from './inline-notice';
export {
  ClosedBanner,
  OutOfStockNotice,
  OutOfZoneNotice,
  WarningNotice,
} from './closed-banner';
