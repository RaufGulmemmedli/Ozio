/**
 * The MSW handler registry.
 *
 * Mock modules do **not** edit this file. Each one writes
 * `src/modules/<group>/data/<group>.mock.ts` and calls `registerMockHandlers` at module scope:
 *
 * ```ts
 * // src/modules/parcel/data/parcel.mock.ts
 * import { http } from 'msw';
 * import { delay, flagged, mockJson, mockPath, registerMockHandlers } from '@/core/mocks';
 * import { createMockDb } from '@/core/mocks/db';
 *
 * const db = createMockDb('parcel', { parcels: [] });
 *
 * export const parcelHandlers = [
 *   http.get(mockPath('parcel', 'rules'), async () => { await delay(300); return mockJson(PARCEL_RULES); }),
 * ];
 *
 * registerMockHandlers('parcel', flagged(parcelHandlers, 'parcel'));
 * ```
 *
 * `loadMockModules()` (called by `<MockProvider>`) imports those files by name from
 * `./modules.ts`, so adding a module needs no change here either. A module whose file does not
 * exist yet is skipped silently.
 *
 * All mock traffic lives under `/api/mock/<module>/…` (`mockPath()`), never the real host.
 */
import type { RequestHandler } from 'msw';
import { ALL_MOCK_MODULES } from './modules';

/**
 * Every registered handler, flattened. The array identity is stable (it is mutated in place), so
 * `setupWorker(...handlers)` can be called once.
 */
export const handlers: RequestHandler[] = [];

const registry = new Map<string, RequestHandler[]>();
const changeListeners = new Set<(added: RequestHandler[]) => void>();

function rebuild(): void {
  handlers.length = 0;
  for (const list of registry.values()) handlers.push(...list);
}

/**
 * Registers (or replaces) one module's handlers. Safe to call before or after the worker started:
 * handlers registered late are pushed into the running worker via `worker.use()`.
 */
export function registerMockHandlers(module: string, moduleHandlers: RequestHandler[]): void {
  registry.set(module, [...moduleHandlers]);
  rebuild();
  if (moduleHandlers.length > 0) {
    for (const fn of changeListeners) {
      try {
        fn([...moduleHandlers]);
      } catch {
        // a listener must not break registration
      }
    }
  }
}

export function unregisterMockHandlers(module: string): void {
  if (registry.delete(module)) rebuild();
}

export const registeredMockModules = (): string[] => [...registry.keys()];

/** Used by `./browser` to forward late registrations to the running service worker. */
export function onMockHandlersChanged(fn: (added: RequestHandler[]) => void): () => void {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

/* ------------------------------------------------------------------ feature flags
 * `NEXT_PUBLIC_*` values are inlined at build time, so they cannot be read through a computed key.
 * This table is deliberately self-contained (it mirrors `core/config/feature-flags.ts`) so the mock
 * layer has no dependency that could be missing at build time. All flags default ON, per the owner
 * decision of 2026-11-12: a flagged feature is shown and labelled "Demo rejim", not hidden.
 */
const FLAG_ENV: Readonly<Record<string, string | undefined>> = {
  parcel: process.env.NEXT_PUBLIC_FEATURE_PARCEL,
  courier: process.env.NEXT_PUBLIC_FEATURE_COURIER,
  topup: process.env.NEXT_PUBLIC_FEATURE_TOPUP,
  imageSearch: process.env.NEXT_PUBLIC_FEATURE_IMAGE_SEARCH,
  rewards: process.env.NEXT_PUBLIC_FEATURE_REWARDS,
  referral: process.env.NEXT_PUBLIC_FEATURE_REFERRAL,
  supportChat: process.env.NEXT_PUBLIC_FEATURE_SUPPORT_CHAT,
  loyaltyTiers: process.env.NEXT_PUBLIC_FEATURE_LOYALTY_TIERS,
  familyLimits: process.env.NEXT_PUBLIC_FEATURE_FAMILY_LIMITS,
  askToBuy: process.env.NEXT_PUBLIC_FEATURE_ASK_TO_BUY,
  senior: process.env.NEXT_PUBLIC_FEATURE_SENIOR,
  priceLock: process.env.NEXT_PUBLIC_FEATURE_PRICE_LOCK,
  groupBuy: process.env.NEXT_PUBLIC_FEATURE_GROUP_BUY,
  savingsJar: process.env.NEXT_PUBLIC_FEATURE_SAVINGS_JAR,
  school: process.env.NEXT_PUBLIC_FEATURE_SCHOOL,
  courierPlus: process.env.NEXT_PUBLIC_FEATURE_COURIER_PLUS,
  courierShop: process.env.NEXT_PUBLIC_FEATURE_COURIER_SHOP,
  viral: process.env.NEXT_PUBLIC_FEATURE_VIRAL,
};

const normalizeFlag = (name: string) => name.replace(/[_\-\s]/g, '').toLowerCase();

const FLAGS = new Map<string, boolean>(
  Object.entries(FLAG_ENV).map(([name, value]) => [
    normalizeFlag(name),
    value === undefined ? true : value === '1' || value === 'true',
  ]),
);

/** `'parcel'`, `'image_search'`, `'imageSearch'` and `'IMAGE_SEARCH'` all resolve to the same flag. */
export const mockFlagOn = (flagName: string): boolean =>
  FLAGS.get(normalizeFlag(flagName)) ?? true;

/** Drops a module's handlers when its feature flag is off, so the module falls back to `<ErrorState>`. */
export const flagged = (
  moduleHandlers: RequestHandler[],
  flagName: string,
): RequestHandler[] => (mockFlagOn(flagName) ? moduleHandlers : []);

/* ------------------------------------------------------------------ module loading */

/**
 * Imports every mock module's `data/<name>.mock.ts`, which registers its own handlers. Missing
 * files are skipped, so this never fails while modules are still being written.
 *
 * Returns the names that actually loaded.
 */
/**
 * Explicit importers, one per module that owns a mock slice.
 *
 * This was a single dynamic import whose specifier was built from the module
 * name. A variable specifier needs the bundler to build a context over every
 * `src/modules/<group>/data/<group>.mock` path, and Turbopack could not: the
 * build warned "Module not found: Can't resolve '../../modules/' <dynamic>",
 * so every import rejected, the `catch` swallowed it and **no mock module ever
 * registered a handler** — all 18 feature-flagged modules would have rendered
 * their `<ErrorState>` forever, in a real browser as much as in CI.
 *
 * Static specifiers are safe now that every one of these files exists, and they
 * fail the build instead of failing silently if a path is ever wrong. Each stays
 * a separate `import()` so a module's fixtures are still a lazy chunk.
 *
 * Note the two deliberate absences: `profile` has no mock file (the registry
 * lists it for documentation), and `profile_referral` + `address` register
 * themselves — the former through a side-effect import inside `topup.mock.ts`,
 * the latter lazily from its own geocode remote.
 */
const MOCK_IMPORTERS: Record<string, () => Promise<unknown>> = {
  parcel: () => import('../../modules/parcel/data/parcel.mock'),
  courier: () => import('../../modules/courier/data/courier.mock'),
  courier_plus: () => import('../../modules/courier_plus/data/courier_plus.mock'),
  courier_shop: () => import('../../modules/courier_shop/data/courier_shop.mock'),
  topup: () => import('../../modules/topup/data/topup.mock'),
  image_search: () => import('../../modules/image_search/data/image_search.mock'),
  family_limits: () => import('../../modules/family_limits/data/family_limits.mock'),
  ask_to_buy: () => import('../../modules/ask_to_buy/data/ask_to_buy.mock'),
  senior: () => import('../../modules/senior/data/senior.mock'),
  price_lock: () => import('../../modules/price_lock/data/price_lock.mock'),
  group_buy: () => import('../../modules/group_buy/data/group_buy.mock'),
  savings_jar: () => import('../../modules/savings_jar/data/savings_jar.mock'),
  school: () => import('../../modules/school/data/school.mock'),
  viral: () => import('../../modules/viral/data/viral.mock'),
  rewards: () => import('../../modules/rewards/data/rewards.mock'),
  loyalty_card: () => import('../../modules/loyalty_card/data/loyalty_card.mock'),
};

export async function loadMockModules(
  names: readonly string[] = ALL_MOCK_MODULES,
): Promise<string[]> {
  const loaded: string[] = [];
  for (const name of names) {
    const load = MOCK_IMPORTERS[name];
    if (!load) continue; // no mock slice for this module (e.g. `profile`)
    try {
      await load();
      loaded.push(name);
    } catch (error) {
      // A real failure now: the file exists, so this is a broken module, not an
      // absent one. Say so instead of silently shipping a dead demo.
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[mocks] "${name}" failed to load; its demo screens will show an error.`, error);
      }
    }
  }
  return loaded;
}

export { ALL_MOCK_MODULES, MOCK_MODULES, MOCK_MODULES_PARTIAL, type MockModuleName } from './modules';
export {
  MOCK_BASE,
  delay,
  mockEnvelope,
  mockError,
  mockErrorEnvelope,
  mockId,
  mockJson,
  mockPage,
  mockPath,
  mockRateLimited,
  mockValidationError,
} from './envelope';
export {
  createMockCollection,
  createMockDb,
  resetAllMockDbs,
  type MockCollection,
  type MockDb,
} from './db';
