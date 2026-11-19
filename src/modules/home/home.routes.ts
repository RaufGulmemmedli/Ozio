/**
 * Routes owned by the `home` module (docs/ROUTES.md "App core").
 *
 * The runtime source of truth stays `@/core/routes` (`paths.ts` + `guards.ts`); this list is the
 * module's own declaration of what it ships, so a route can never exist without an owner.
 */
import { paths } from '@/core/routes';

export type RouteGuard = 'public' | 'guest' | 'auth' | 'flow';
export type RouteLayout = 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: RouteGuard;
  layout: RouteLayout;
}

export const homeRoutes: readonly ModuleRoute[] = [
  { id: 'home', path: paths.home, guard: 'guest', layout: 'app-shell' },
  { id: 'offers', path: paths.offers, guard: 'guest', layout: 'app-shell' },
  // `drawer` at >=768 (the page renders itself inside <Drawer>), full page below.
  { id: 'notifications', path: paths.notifications, guard: 'auth', layout: 'drawer' },
] as const;
