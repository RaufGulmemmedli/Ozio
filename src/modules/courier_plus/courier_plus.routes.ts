/**
 * Routes owned by the `courier_plus` module (docs/ROUTES.md "Idea modules").
 *
 * The runtime source of truth stays `@/core/routes` (`paths.ts` + `guards.ts`); this list is the
 * module's own declaration of what it ships, so a route can never exist without an owner.
 *
 * All seven are `auth` + flag `courierPlus`, layout `app-shell`.
 */
import { paths } from '@/core/routes';

import { COURIER_PLUS_FLAG } from './courier_plus.flags';

export type RouteGuard = 'public' | 'guest' | 'auth' | 'flow';
export type RouteLayout = 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: RouteGuard;
  layout: RouteLayout;
  flag?: string;
}

export const courierPlusRoutes: readonly ModuleRoute[] = [
  { id: 'courierPlus', path: paths.courierPlus, guard: 'auth', layout: 'app-shell', flag: COURIER_PLUS_FLAG },
  {
    id: 'courierPlusRoute',
    path: paths.courierPlusRoute,
    guard: 'auth',
    layout: 'app-shell',
    flag: COURIER_PLUS_FLAG,
  },
  {
    id: 'courierPlusMatches',
    path: paths.courierPlusMatches,
    guard: 'auth',
    layout: 'app-shell',
    flag: COURIER_PLUS_FLAG,
  },
  {
    id: 'courierPlusTrack',
    path: paths.courierPlusTrack(':id'),
    guard: 'auth',
    layout: 'app-shell',
    flag: COURIER_PLUS_FLAG,
  },
  {
    id: 'courierPlusEarnings',
    path: paths.courierPlusEarnings,
    guard: 'auth',
    layout: 'app-shell',
    flag: COURIER_PLUS_FLAG,
  },
  {
    id: 'courierPlusHubRegister',
    path: paths.courierPlusHubRegister,
    guard: 'auth',
    layout: 'app-shell',
    flag: COURIER_PLUS_FLAG,
  },
  {
    id: 'courierPlusHub',
    path: paths.courierPlusHub,
    guard: 'auth',
    layout: 'app-shell',
    flag: COURIER_PLUS_FLAG,
  },
] as const;

/**
 * The neighbour-hub picker (`z57Lfl`) and the hand-over code sheet (`ooPsK`) are **states**, not
 * routes — they render as `<Modal>` over the screen that owns them.
 */
export const courierPlusModalStates = ['hubCode', 'neighborHubPicker'] as const;
