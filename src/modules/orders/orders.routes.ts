/**
 * The routes this module owns (ROUTES.md "Checkout & orders").
 *
 * `/orders/[id]/receipt` is NOT here: it is flag-gated (`rewards`) and owned by the rewards module.
 * The rating UI is a modal on `/orders/[id]`, not a route (ROUTES.md "Not routes (states)").
 */
import { paths } from '@/core/routes';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
}

export const ordersRoutes: readonly ModuleRoute[] = [
  { id: 'checkoutPayment', path: paths.checkoutPayment, guard: 'auth', layout: 'app-shell' },
  { id: 'checkoutAddCard', path: paths.checkoutAddCard, guard: 'auth', layout: 'modal' },
  { id: 'orders', path: paths.orders, guard: 'auth', layout: 'app-shell' },
  { id: 'order', path: '/orders/[id]', guard: 'auth', layout: 'app-shell' },
  { id: 'orderTrack', path: '/orders/[id]/track', guard: 'auth', layout: 'app-shell' },
  { id: 'orderSuccess', path: '/orders/success', guard: 'auth', layout: 'app-shell' },
  { id: 'orderFailed', path: '/orders/failed', guard: 'auth', layout: 'app-shell' },
] as const;
