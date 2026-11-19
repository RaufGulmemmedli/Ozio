/**
 * Public surface of `@/modules/senior` — other modules import **only** from here.
 *
 * `<SeniorModeToggle>` is the entry point another screen places (the profile "Tətbiq" card's
 * Sadə rejim row); it hides itself when the `senior` flag is off. `useSeniorMode()` is exported
 * alongside it so a module that wants the preference honoured app-wide can mount the effect
 * itself, and `<SeniorScreen>` is exported for any screen that should pick up the scoped
 * accessibility stylesheet.
 */
export { SENIOR_FLAG, SENIOR_MOCK_MODULE, assertSeniorEnabled, seniorEnabled } from './senior.flags';
export { seniorRoutes, type ModuleRoute } from './senior.routes';
export { seniorKeys } from './senior.query-keys';

export { SeniorModeToggle, type SeniorModeToggleProps } from './components/senior-mode-toggle';
export { SeniorScreen, type SeniorScreenProps } from './components/senior-screen';

export {
  SENIOR_SCALE,
  rehydrateSeniorPrefs,
  seniorEffectiveScale,
  useSeniorMode,
  useSeniorPrefs,
  type SeniorModeState,
  type SeniorPrefsState,
} from './hooks/use-senior-mode';

export {
  useCreateHelpRequest,
  useHelpBoard,
  useOrderPensionBasket,
  usePensionPlan,
  useSetAutoRepeat,
  useSetHelpStatus,
  type CreateHelpInput,
  type SetHelpStatusInput,
} from './hooks/use-senior';

export {
  HELP_KINDS,
  canAccept,
  canComplete,
  formatDistance,
  type HelpBoard,
  type HelpKind,
  type HelpRequest,
  type HelpStatus,
} from './data/models/help-request';
export type { BasketItem, PensionPlan } from './data/models/pension-plan';

export { SeniorModeView } from './view/SeniorModeView';
export { SeniorPensionView } from './view/SeniorPensionView';
export { SeniorPensionSkeleton } from './view/SeniorPensionSkeleton';
export { SeniorNeighborView, type SeniorNeighborViewProps } from './view/SeniorNeighborView';
export { SeniorNeighborSkeleton } from './view/SeniorNeighborSkeleton';
