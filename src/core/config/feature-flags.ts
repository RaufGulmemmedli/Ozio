/**
 * Feature flags (architecture/08-feature-flags-mocks.md).
 *
 * Build-time public env, all ON by owner decision 2026-11-12: a flagged feature is SHOWN and
 * labelled "Demo rejim" rather than hidden. Flag off => entry points hidden (`<FlagGate>` / nav
 * filtering) and routes redirect to `/home` (middleware, via `routeGuards[].flag`); each mock page
 * also calls `if (!FeatureFlags.x) notFound()` as defence in depth.
 *
 * `process.env.NEXT_PUBLIC_*` must be referenced literally so Next can inline it at build time.
 */

const on = (v: string | undefined, d = true) => (v === undefined ? d : v === '1' || v === 'true');

export const FeatureFlags = {
  // ---- the 8 real flags (mirror of lib/core/config/feature_flags.dart) -------------------
  parcel: on(process.env.NEXT_PUBLIC_FEATURE_PARCEL),
  courier: on(process.env.NEXT_PUBLIC_FEATURE_COURIER),
  topup: on(process.env.NEXT_PUBLIC_FEATURE_TOPUP),
  imageSearch: on(process.env.NEXT_PUBLIC_FEATURE_IMAGE_SEARCH),
  rewards: on(process.env.NEXT_PUBLIC_FEATURE_REWARDS),
  referral: on(process.env.NEXT_PUBLIC_FEATURE_REFERRAL),
  supportChat: on(process.env.NEXT_PUBLIC_FEATURE_SUPPORT_CHAT),
  loyaltyTiers: on(process.env.NEXT_PUBLIC_FEATURE_LOYALTY_TIERS),

  // ---- the 10 idea modules (no Flutter flag; design/ideas/*.md) -------------------------
  familyLimits: on(process.env.NEXT_PUBLIC_FEATURE_FAMILY_LIMITS),
  askToBuy: on(process.env.NEXT_PUBLIC_FEATURE_ASK_TO_BUY),
  senior: on(process.env.NEXT_PUBLIC_FEATURE_SENIOR),
  priceLock: on(process.env.NEXT_PUBLIC_FEATURE_PRICE_LOCK),
  groupBuy: on(process.env.NEXT_PUBLIC_FEATURE_GROUP_BUY),
  savingsJar: on(process.env.NEXT_PUBLIC_FEATURE_SAVINGS_JAR),
  school: on(process.env.NEXT_PUBLIC_FEATURE_SCHOOL),
  courierPlus: on(process.env.NEXT_PUBLIC_FEATURE_COURIER_PLUS),
  courierShop: on(process.env.NEXT_PUBLIC_FEATURE_COURIER_SHOP),
  viral: on(process.env.NEXT_PUBLIC_FEATURE_VIRAL),
} as const;

export type FeatureName = keyof typeof FeatureFlags;

/** All flag names, handy for debug panels and tests. */
export const featureNames = Object.keys(FeatureFlags) as FeatureName[];

/** Flags are static release switches, so this is a plain read (no hook state needed). */
export const useFlag = (n: FeatureName): boolean => FeatureFlags[n];

/** Non-hook read, for route handlers / middleware / server components. */
export const flagOn = (n: FeatureName): boolean => FeatureFlags[n];

/**
 * Which flag gates which path space. Ordered: the first match wins, so narrow patterns
 * (`/search/image`, `/orders/{id}/receipt`) come before the wide ones.
 * `core/routes/guards.ts` builds its flag rules from this list, which keeps the two in sync and
 * keeps the dependency pointing one way (routes -> config, never back).
 */
export const flagRoutePatterns: ReadonlyArray<{ pattern: RegExp; flag: FeatureName }> = [
  // real-API modules with flagged screens
  { pattern: /^\/card\/levels$/, flag: 'loyaltyTiers' },
  { pattern: /^\/orders\/[^/]+\/receipt$/, flag: 'rewards' },
  { pattern: /^\/rewards(\/|$)/, flag: 'rewards' },
  { pattern: /^\/support(\/|$)/, flag: 'supportChat' },
  { pattern: /^\/invite(\/|$)/, flag: 'referral' },
  { pattern: /^\/search\/image$/, flag: 'imageSearch' },
  // mock modules
  { pattern: /^\/topup(\/|$)/, flag: 'topup' },
  { pattern: /^\/courier(\/|$)/, flag: 'courier' },
  { pattern: /^\/parcel(\/|$)/, flag: 'parcel' },
  // idea modules
  { pattern: /^\/courier-plus(\/|$)/, flag: 'courierPlus' },
  { pattern: /^\/(courier-services|courier-bag)$/, flag: 'courierShop' },
  { pattern: /^\/courier-fit(\/|$)/, flag: 'courierShop' },
  { pattern: /^\/courier-expert(\/|$)/, flag: 'courierShop' },
  { pattern: /^\/family-limits(\/|$)/, flag: 'familyLimits' },
  { pattern: /^\/ask-to-buy(\/|$)/, flag: 'askToBuy' },
  { pattern: /^\/senior(\/|$)/, flag: 'senior' },
  { pattern: /^\/(price-guarantee|price-locks)$/, flag: 'priceLock' },
  { pattern: /^\/group-buy(\/|$)/, flag: 'groupBuy' },
  { pattern: /^\/savings-jar(\/|$)/, flag: 'savingsJar' },
  { pattern: /^\/school(\/|$)/, flag: 'school' },
  { pattern: /^\/viral(\/|$)/, flag: 'viral' },
];

/** The flag that gates `path` (locale already stripped), or `undefined` when it is ungated. */
export function flagForPath(path: string): FeatureName | undefined {
  const p = normalizeFlagPath(path);
  for (const rule of flagRoutePatterns) if (rule.pattern.test(p)) return rule.flag;
  return undefined;
}

/** `true` when `path` is reachable with the current flags (ungated paths are always reachable). */
export function pathEnabled(path: string): boolean {
  const flag = flagForPath(path);
  return flag === undefined || FeatureFlags[flag];
}

function normalizeFlagPath(path: string): string {
  const withoutQuery = path.split('?')[0]!.split('#')[0]!;
  const p = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery;
  return p === '' ? '/' : p;
}
