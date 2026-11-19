/**
 * Routes owned by the `rewards` module (docs/ROUTES.md "Rewards" + "Checkout & orders").
 *
 * The runtime source of truth stays `@/core/routes` (`paths.ts` + `guards.ts`); this list is the
 * module's own declaration of what it ships. All six are `auth` + flag `rewards`.
 */
import { paths } from '@/core/routes';

import { REWARDS_FLAG } from './rewards.flags';

export type RouteGuard = 'public' | 'guest' | 'auth' | 'flow';
export type RouteLayout = 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: RouteGuard;
  layout: RouteLayout;
  flag?: string;
}

export const rewardsRoutes: readonly ModuleRoute[] = [
  { id: 'rewardsWheel', path: paths.rewardsWheel, guard: 'auth', layout: 'app-shell', flag: REWARDS_FLAG },
  { id: 'rewardsMissions', path: paths.rewardsMissions, guard: 'auth', layout: 'app-shell', flag: REWARDS_FLAG },
  { id: 'rewardsFamilyCard', path: paths.rewardsFamilyCard, guard: 'auth', layout: 'app-shell', flag: REWARDS_FLAG },
  { id: 'rewardsSmartList', path: paths.rewardsSmartList, guard: 'auth', layout: 'app-shell', flag: REWARDS_FLAG },
  { id: 'rewardsPriceAlerts', path: paths.rewardsPriceAlerts, guard: 'auth', layout: 'app-shell', flag: REWARDS_FLAG },
  // N5 — the only screen here that reads the real API; still flag-gated per docs/ROUTES.md.
  { id: 'orderReceipt', path: paths.orderReceipt(':id'), guard: 'auth', layout: 'app-shell', flag: REWARDS_FLAG },
] as const;
