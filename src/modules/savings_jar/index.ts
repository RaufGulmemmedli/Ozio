/**
 * `@/modules/savings_jar` — the module's public surface. Other modules import **only** from here.
 *
 * What other agents are expected to use:
 *  - **`<RoundUpTile total={payable} />`** — the cart-summary row from `cart-round-up-tile.html`.
 *    `@/modules/cart` places it inside its summary card; this module never touches the cart.
 *    It reads the jar settings itself, runs the documented integer-qəpik round-up on the payable the
 *    cart already has, and renders nothing when the jar is unavailable (flag off / mocks off).
 *  - `useSavingsJar()` for a card-page link row or a home tile ("31,40 ₼ · +3,14 ₼ bonus").
 *  - the views + skeletons, for the two route files.
 *
 * All data is mock, behind `FeatureFlags.savingsJar`.
 */

/* ------------------------------------------------------------------ routes & flags */
export { savingsJarRoutes } from './savings_jar.routes';
export type { ModuleRoute as SavingsJarRoute } from './savings_jar.routes';
export {
  SAVINGS_JAR_FLAG,
  SAVINGS_JAR_MOCK_MODULE,
  savingsJarEnabled,
} from './savings_jar.flags';
export { savingsJarKeys } from './savings_jar.query-keys';

/* ----------------------------------------------------------------------- hooks */
export {
  useSavingsJar,
  useSaveJarSettings,
  useClaimJar,
  useJarMockState,
  useForceSaveError,
} from './hooks/use-savings-jar';
export type { JarClaimResult } from './data/savings_jar.repository';

/* ---------------------------------------------------------------------- models */
export {
  CAP_CHOICES,
  DEFAULT_JAR_SETTINGS,
  JAR_BONUS_RATE,
  ROUND_STEPS,
  jarCapFull,
  jarCapProgress,
  jarClaimable,
  jarIsEmpty,
  roundUp,
  stepAmount,
  type JarContribution,
  type JarMember,
  type JarSettings,
  type RoundStepCents,
  type RoundUpResult,
  type SavingsJar,
} from './data/models/savings-jar';

/* ------------------------------------------------------------------ components */
/** For `@/modules/cart`: the checkout round-up row. */
export { RoundUpTile, type RoundUpTileProps } from './components/round-up-tile';
export { JarToggle, type JarToggleProps } from './components/jar-toggle';
export {
  ClaimBanner,
  ClaimConfirmModal,
  ClaimSuccessModal,
  type ClaimBannerProps,
  type ClaimConfirmModalProps,
  type ClaimSuccessModalProps,
} from './components/claim-flow';

/* ----------------------------------------------------------------------- views */
export { SavingsJarView } from './view/SavingsJarView';
export { SavingsJarSkeleton } from './view/SavingsJarSkeleton';
export { SavingsJarSettingsView } from './view/SavingsJarSettingsView';
export { SavingsJarSettingsSkeleton } from './view/SavingsJarSettingsSkeleton';
