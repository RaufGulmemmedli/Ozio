/**
 * `@/modules/topup` — the module's public surface. Other modules import **only** from here.
 *
 * What this module is: the balance top-up flow (`/topup`, `/topup/card`, `/topup/cashier`,
 * `/topup/result`), gated by `NEXT_PUBLIC_FEATURE_TOPUP` and labelled "Demo rejim" on every screen.
 *
 * The real/mock split, in one place:
 *
 * | part | source |
 * | --- | --- |
 * | bonus balance, Ozio card number, holder name | **REAL** `GET v1/profile/me` |
 * | saved payment cards | **REAL** `GET v1/profile/me/cards` (returns `[]` on live) |
 * | limits, fee, quote, the payment, cashier copy | **MOCK** `/api/mock/topup/…` (MSW) |
 *
 * **Nothing can be charged.** There is no payment endpoint in the API, the "pay" call goes to
 * `/api/mock/topup/pay`, and the receipt is marked `simulated` and says so on screen. This module
 * never collects a card number, an expiry or a CVV — "Yeni kart əlavə et" links to
 * `/checkout/add-card`, which hands off to the bank's own page.
 */

/* ------------------------------------------------------------------ entry points
 * The only components another module should place. Both hide themselves when the flag is off.
 */
export { TopupEntryTile, type TopupEntryTileProps } from './components/topup-entry-tile';

/* ------------------------------------------------------------------ route views
 * Rendered by `src/app/[locale]/(app)/topup/**`.
 */
export { TopupMethodView } from './view/topup-method-view';
export { TopupCardView } from './view/topup-card-view';
export { TopupCashierView } from './view/topup-cashier-view';
export { TopupResultView } from './view/topup-result-view';

export { TopupMethodSkeleton } from './view/topup-method-skeleton';
export { TopupCardSkeleton } from './view/topup-card-skeleton';
export { TopupCashierSkeleton } from './view/topup-cashier-skeleton';

/* ------------------------------------------------------------------ flags + routes */
export {
  TOPUP_FLAG,
  TOPUP_MOCK_MODULE,
  assertTopupEnabled,
  topupEnabled,
} from './topup.flags';
export { topupRoutes, type TopupRoute } from './topup.routes';
export { topupKeys } from './topup.query-keys';

/* ------------------------------------------------------------------ domain types
 * Exported for the card page's balance block, not so another module can re-fetch any of it.
 */
export {
  topupDisplayNumber,
  type TopupAccount,
} from './data/models/topup-account';
export { savedCardLabel, type SavedCard } from './data/models/saved-card';
export { type TopupLimits } from './data/models/topup-limits';
export { quoteIsFree, type TopupQuote } from './data/models/topup-quote';
export { type TopupOutcome, type TopupReceipt, type TopupFailure } from './data/models/topup-outcome';

/** The documented demo hook, so a QA page can link to the failure state. */
export { MAGIC_FAILURE_AMOUNT } from './data/topup.fixtures';
