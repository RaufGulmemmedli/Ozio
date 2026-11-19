/**
 * `@/modules/price_lock` — the module's public surface. Nothing else may reach inside it.
 *
 * What other modules need from here:
 * - **`<FreezePriceEntry>`** — the product page's "Qiyməti dondur" text button
 *   (`api/mock-modules.md` §14 lists it as this module's entry point). It owns the PL3 dialog and
 *   fetches the lock terms itself, so the host passes only the product name and price; it renders
 *   `null` when the `priceLock` flag is off.
 * - **`<FreezePriceDialog>`** — for a host that already has its own trigger.
 * - the hooks, for a profile "Daha çox" row that wants to show the guarantee's state;
 * - the flag helpers, so a host can hide its entry point when `priceLock` is off.
 *
 * The route-level views are exported for the `/price-guarantee` and `/price-locks` pages.
 */

/* ---------------------------------------------------------------- entry points */
export { FreezePriceEntry, type FreezePriceEntryProps } from './components/freeze-price-entry';
export { FreezePriceDialog, type FreezePriceDialogProps } from './components/freeze-price-dialog';

/* ---------------------------------------------------------------- screens */
export { PriceGuaranteeView } from './view/PriceGuaranteeView';
export { PriceLocksView } from './view/PriceLocksView';

/* ---------------------------------------------------------------- hooks */
export {
  useCreateLock,
  useExpiryWatch,
  useGuarantee,
  useLinkCard,
  usePriceLocks,
  useUnlinkCard,
  useUseLock,
  type CreateLockInput,
} from './hooks';

/* ---------------------------------------------------------------- types */
export type { Guarantee, GuaranteeStatus, StapleItem } from './data/models/guarantee';
export type {
  PriceLockItem,
  PriceLockList,
  PriceLockStatus,
} from './data/models/price-lock-item';

/* ---------------------------------------------------------------- module metadata */
export {
  PRICE_LOCK_FLAG,
  PRICE_LOCK_MOCK_MODULE,
  assertPriceLockEnabled,
  priceLockEnabled,
} from './price_lock.flags';
export { priceLockRoutes, type PriceLockRoute } from './price_lock.routes';
export { priceLockKeys } from './price_lock.query-keys';
