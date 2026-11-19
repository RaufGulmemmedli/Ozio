/**
 * Public surface of `@/modules/family_limits` — other modules import **only** from here.
 *
 * `<FamilyLimitsEntry>` is the entry point another screen places: the "Üzv limitləri" row at the
 * bottom of the "Ailə kartı" settings card. It hides itself when the `familyLimits` flag is off.
 */
export {
  FAMILY_LIMITS_FLAG,
  FAMILY_LIMITS_MOCK_MODULE,
  assertFamilyLimitsEnabled,
  familyLimitsEnabled,
} from './family_limits.flags';
export { familyLimitsRoutes, type ModuleRoute } from './family_limits.routes';
export { familyLimitsKeys } from './family_limits.query-keys';

export { FamilyLimitsEntry, type FamilyLimitsEntryProps } from './components/family-limits-entry';

export {
  useFamilyLimitMember,
  useFamilyLimits,
  useSaveFamilyLimit,
  type SaveLimitInput,
} from './hooks/use-family-limits';

export {
  LIMIT_CATEGORIES,
  LIMIT_STEP_AZN,
  draftFrom,
  hasNoLimit,
  type LimitCategory,
  type LimitDraft,
  type LimitMember,
  type LimitMembers,
  type LimitPeriod,
  type LimitPurchase,
  type LimitSummary,
} from './data/models/limit-member';

export { FamilyLimitsView } from './view/FamilyLimitsView';
export { FamilyLimitsSkeleton } from './view/FamilyLimitsSkeleton';
export {
  FamilyLimitMemberView,
  type FamilyLimitMemberViewProps,
} from './view/FamilyLimitMemberView';
export { FamilyLimitMemberSkeleton } from './view/FamilyLimitMemberSkeleton';
