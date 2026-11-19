/**
 * Route guard table (architecture/02-routing.md "Guard" column, 03-auth-session.md "Guards").
 *
 * Consumed by three layers, all reading THIS table:
 *   1. `middleware.ts` — edge, cookie presence only, never calls upstream.
 *   2. `<AuthGate>` in `(app)/layout.tsx` — catches expired cookies the edge cannot see.
 *   3. `requireSession()` in server components that SSR user data.
 *
 * Guards:
 *   `public` — anyone, SSR/SSG (marketing, splash, onboarding).
 *   `guest`  — works as guest or user (Flutter `_public` set).
 *   `auth`   — logged in; guest => `/login?next=…`.
 *   `flow`   — login-flow page; an authenticated user there => `/home`.
 * A rule may also carry `flag`: when the flag is off the route redirects to `/home`.
 *
 * DEFAULT IS `auth`. Anything not listed here is protected, inherited from Flutter `RouteGuard`:
 * a new route is account-bound unless it is explicitly added to the `guest`/`public` sets.
 * First match wins, so the order of this array matters.
 */
import { FeatureFlags, flagRoutePatterns, type FeatureName } from '@/core/config/feature-flags';

export type Guard = 'public' | 'guest' | 'auth' | 'flow';

export interface RouteGuardRule {
  pattern: RegExp;
  guard: Guard;
  flag?: FeatureName;
}

export interface GuardMatch {
  guard: Guard;
  flag?: FeatureName;
}

/** Mock / flagged modules: every one of them is `auth` + its own flag (08-feature-flags-mocks.md). */
const flaggedRules: RouteGuardRule[] = flagRoutePatterns.map(({ pattern, flag }) => ({
  pattern,
  guard: 'auth' as const,
  flag,
}));

export const routeGuards: RouteGuardRule[] = [
  // ---- flagged screens first: they are the narrowest patterns --------------------------------
  ...flaggedRules,

  // ---- marketing (public) -------------------------------------------------------------------
  { pattern: /^\/$/, guard: 'public' },
  { pattern: /^\/(cashback|partners|delivery|ten|contact|terms|privacy)$/, guard: 'public' },
  { pattern: /^\/(sitemap\.xml|robots\.txt|manifest\.webmanifest)$/, guard: 'public' },

  // ---- onboarding (public: shown before any session exists) ---------------------------------
  { pattern: /^\/(splash|onboarding)$/, guard: 'public' },

  // ---- auth flow ----------------------------------------------------------------------------
  // An authenticated user on /login or /otp is bounced to /home.
  { pattern: /^\/(login|otp)$/, guard: 'flow' },
  // A3/RG5–6: "auth-partial" in the doc (token present, profile incomplete) — `auth` at the edge,
  // the page itself handles the incomplete-profile state.
  { pattern: /^\/register$/, guard: 'auth' },
  { pattern: /^\/city-select$/, guard: 'guest' },
  { pattern: /^\/welcome$/, guard: 'auth' },
  { pattern: /^\/permission\/location$/, guard: 'guest' },
  { pattern: /^\/permission\/notifications$/, guard: 'auth' },

  // ---- the guest set (Flutter `_public`) ----------------------------------------------------
  // Everything under /market: market, store, product, category, tens, partners, partners map.
  { pattern: /^\/market(\/|$)/, guard: 'guest' },
  { pattern: /^\/offers(\/|$)/, guard: 'guest' },
  { pattern: /^\/home$/, guard: 'guest' },
  { pattern: /^\/search$/, guard: 'guest' },
  { pattern: /^\/help$/, guard: 'guest' },
  { pattern: /^\/lottery\/(rules|results|prizes)$/, guard: 'guest' },
  { pattern: /^\/settings\/(language|appearance)$/, guard: 'guest' },

  // ---- explicitly listed `auth` routes -----------------------------------------------------
  // (The default is `auth` anyway; these are spelled out so the table reads like 02-routing.md
  // and so a typo in a path shows up as a missing row rather than as silent protection.)
  { pattern: /^\/notifications$/, guard: 'auth' },
  { pattern: /^\/favorites$/, guard: 'auth' },
  { pattern: /^\/cart$/, guard: 'auth' },
  { pattern: /^\/card(\/|$)/, guard: 'auth' },
  { pattern: /^\/coupons(\/|$)/, guard: 'auth' },
  { pattern: /^\/lottery(\/|$)/, guard: 'auth' },
  { pattern: /^\/checkout(\/|$)/, guard: 'auth' },
  { pattern: /^\/orders(\/|$)/, guard: 'auth' },
  { pattern: /^\/work\/partner$/, guard: 'auth' },
  { pattern: /^\/addresses(\/|$)/, guard: 'auth' },
  { pattern: /^\/profile(\/|$)/, guard: 'auth' },
  { pattern: /^\/settings(\/|$)/, guard: 'auth' },
  { pattern: /^\/account\/delete$/, guard: 'auth' },
  { pattern: /^\/history$/, guard: 'auth' },

  // DEFAULT: anything not listed above is `auth` — see `matchGuard`.
];

const DEFAULT_MATCH: GuardMatch = { guard: 'auth' };

/** Normalise before matching: drop query/hash and any trailing slash. */
export function normalizePath(path: string): string {
  const raw = (path.split('?')[0] ?? '').split('#')[0] ?? '';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const trimmed = withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
  return trimmed === '' ? '/' : trimmed;
}

/** The guard (and flag, when gated) for `path`. The locale prefix must already be stripped. */
export function matchGuard(path: string): GuardMatch {
  const p = normalizePath(path);
  for (const rule of routeGuards) {
    if (rule.pattern.test(p)) {
      return rule.flag ? { guard: rule.guard, flag: rule.flag } : { guard: rule.guard };
    }
  }
  return DEFAULT_MATCH;
}

/** `true` when a visitor with no account may open `path`. */
export function isGuestAllowed(path: string): boolean {
  const g = matchGuard(path).guard;
  return g === 'public' || g === 'guest' || g === 'flow';
}

/** `true` when `path` requires a token. */
export function requiresAuth(path: string): boolean {
  return matchGuard(path).guard === 'auth';
}

/** `true` when `path` is gated by a flag that is currently OFF (=> redirect `/home`). */
export function isFlagBlocked(path: string): boolean {
  const flag = matchGuard(path).flag;
  return flag !== undefined && !FeatureFlags[flag];
}
