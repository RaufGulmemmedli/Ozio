/**
 * The routes this module owns (ROUTES.md "App core").
 *
 * `/cart` is the only page: the promo and delivery-time sheets are **URL states** of it
 * (`?sheet=promo` / `?sheet=time`), and the mini-cart drawer is not a route at all — the shell
 * opens it through `useCartDrawer()`.
 *
 * `/checkout/payment` and `/checkout/add-card` are listed under this module in ROUTES.md but are
 * not part of this package; the summary CTA links to them.
 */
import { paths } from '@/core/routes';

export interface CartRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'app-shell' | 'modal' | 'drawer' | 'full';
}

export const cartRoutes: readonly CartRoute[] = [
  { id: 'cart', path: paths.cart, guard: 'auth', layout: 'app-shell' },
  { id: 'cartPromo', path: paths.cartPromo, guard: 'auth', layout: 'modal' },
  { id: 'cartDeliveryTime', path: paths.cartDeliveryTime, guard: 'auth', layout: 'modal' },
] as const;
