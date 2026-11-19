/**
 * Routes owned by the `courier_shop` module (docs/ROUTES.md "Idea modules").
 *
 * The runtime source of truth stays `@/core/routes` (`paths.ts` + `guards.ts`); this list is the
 * module's own declaration of what it ships. Every route is `auth` + flag `courierShop`.
 */
import { paths } from '@/core/routes';

import { COURIER_SHOP_FLAG } from './courier_shop.flags';

export type RouteGuard = 'public' | 'guest' | 'auth' | 'flow';
export type RouteLayout = 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: RouteGuard;
  layout: RouteLayout;
  flag: typeof COURIER_SHOP_FLAG;
}

export const courierShopRoutes: readonly ModuleRoute[] = [
  { id: 'courierServices', path: paths.courierServices, guard: 'auth', layout: 'app-shell', flag: COURIER_SHOP_FLAG },
  { id: 'courierBag', path: paths.courierBag, guard: 'auth', layout: 'app-shell', flag: COURIER_SHOP_FLAG },
  { id: 'courierFit', path: paths.courierFit, guard: 'auth', layout: 'app-shell', flag: COURIER_SHOP_FLAG },
  { id: 'courierFitDoorstep', path: paths.courierFitDoorstep, guard: 'auth', layout: 'app-shell', flag: COURIER_SHOP_FLAG },
  { id: 'courierExpert', path: paths.courierExpert, guard: 'auth', layout: 'app-shell', flag: COURIER_SHOP_FLAG },
  { id: 'courierExpertBooking', path: paths.courierExpertBooking, guard: 'auth', layout: 'app-shell', flag: COURIER_SHOP_FLAG },
] as const;
