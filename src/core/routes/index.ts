/** Public surface of `@/core/routes`. */
export { paths, staticPaths, marketingPaths, isSamePathTarget, safeNext } from './paths';
export type { PathKey } from './paths';
export {
  routeGuards,
  matchGuard,
  normalizePath,
  isGuestAllowed,
  requiresAuth,
  isFlagBlocked,
} from './guards';
export type { Guard, GuardMatch, RouteGuardRule } from './guards';
export { sidebarNav, railNav, bottomNav, utilityNav, isNavItemActive, activeNavId } from './nav';
export type { NavItem, NavBadge } from './nav';
