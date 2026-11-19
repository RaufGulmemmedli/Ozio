/**
 * The routes this module owns (02-routing.md / docs/ROUTES.md).
 * Declarative only — the guards themselves run in `src/middleware.ts` + `<AuthGate>`.
 */
import { paths } from '@/core/routes';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
}

export const couponsRoutes: readonly ModuleRoute[] = [
  { id: 'coupons', path: paths.coupons, guard: 'auth', layout: 'app-shell' },
  { id: 'coupon', path: '/coupons/[id]', guard: 'auth', layout: 'modal' },
] as const;
