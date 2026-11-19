/**
 * `@/modules/school` — the module's **only** public surface.
 *
 * Other modules import from here and never reach into `view/`, `hooks/` or `data/`.
 *
 * What is exported, and why:
 *  - `<SchoolProfileEntry>` — the Profil → "Daha çox" row (08-feature-flags-mocks.md names
 *    Profile as this module's entry point). It hides itself when the flag is off.
 *  - the four route views, for the thin `page.tsx` files under `src/app/[locale]/(app)/school/`.
 *  - the hooks and domain types, so a screen elsewhere can read the points balance or the card
 *    state without a second repository.
 *  - the flag helpers and the route table, which the middleware/registry docs reference.
 *
 * The MSW handlers are deliberately **not** re-exported: `src/core/mocks/modules.ts` imports
 * `data/school.mock.ts` by path, so nothing else has to know it exists — and importing it from
 * here would pull `msw` into every bundle that touches this barrel.
 */

/* ----------------------------------------------------------------- entry points */
export { SchoolProfileEntry, type SchoolProfileEntryProps } from './components/school-profile-entry';

/* ----------------------------------------------------------------------- screens */
export { SchoolHubView } from './view/SchoolHubView';
export { GradesView } from './view/GradesView';
export { ClassListView } from './view/ClassListView';
export { StudentCardView } from './view/StudentCardView';

export { SchoolHubSkeleton } from './view/SchoolHubSkeleton';
export { GradesSkeleton } from './view/GradesSkeleton';
export { ClassListSkeleton } from './view/ClassListSkeleton';
export { StudentCardSkeleton } from './view/StudentCardSkeleton';

/* ------------------------------------------------------------------------- hooks */
export { useGrades, useRedeemReward, useUploadGradePhoto } from './hooks/use-grades';
export {
  useAddListToCart,
  useClassLists,
  useCreateClassList,
  useDeleteClassList,
} from './hooks/use-class-lists';
export {
  useLinkStudentCard,
  useNightDiscountBoundary,
  useStudentCard,
  useUnlinkStudentCard,
} from './hooks/use-student-card';
export { useDeadline, formatCountdown, type Deadline } from './hooks/use-deadline';

/* ------------------------------------------------------------------------ models */
export type {
  Grade,
  GradesData,
  RedeemResult,
  RewardCategory,
  SchoolReward,
  SchoolSubject,
} from './data/models/grade';
export type {
  AddListToCartResult,
  ClassList,
  ClassListItem,
} from './data/models/class-list';
export type {
  NightCategory,
  NightDiscount,
  StudentCard,
  StudentCardState,
} from './data/models/student-card';

/* -------------------------------------------------------------- flags and routes */
export {
  assertSchoolEnabled,
  schoolEnabled,
  SCHOOL_FLAG,
  SCHOOL_MOCK_MODULE,
} from './school.flags';
export { schoolRoutes, type SchoolRoute } from './school.routes';
export { schoolKeys } from './school.query-keys';
