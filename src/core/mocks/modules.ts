/**
 * The mock-module registry list.
 *
 * `loadMockModules()` imports `src/modules/<name>/data/<name>.mock.ts` for each name below and that
 * file registers its own handlers with `registerMockHandlers(<name>, [...])`. Nothing here needs to
 * change when a module is written, and a name whose file does not exist yet is simply skipped.
 *
 * **Mock-module agents: do not edit the other files in this folder.** Write
 * `src/modules/<group>/data/<group>.mock.ts`, call `registerMockHandlers` at module scope, and you
 * are wired up.
 */

/** The 14 mock-only modules (08-feature-flags-mocks.md + 01-project-structure.md). */
export const MOCK_MODULES = [
  'parcel',
  'courier',
  'courier_plus',
  'courier_shop',
  'topup',
  'image_search',
  'family_limits',
  'ask_to_buy',
  'senior',
  'price_lock',
  'group_buy',
  'savings_jar',
  'school',
  'viral',
] as const;

export type MockModuleName = (typeof MOCK_MODULES)[number];

/**
 * Real-API modules that also carry a mock slice: rewards (placeholder data), profile (support chat
 * + invite) and loyalty_card (the tier ladder the API sends no data for).
 */
export const MOCK_MODULES_PARTIAL = ['rewards', 'profile', 'loyalty_card'] as const;

export const ALL_MOCK_MODULES: readonly string[] = [...MOCK_MODULES, ...MOCK_MODULES_PARTIAL];
