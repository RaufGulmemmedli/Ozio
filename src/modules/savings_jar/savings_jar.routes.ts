/**
 * Routes owned by the `savings_jar` module (docs/ROUTES.md "Idea modules").
 * The runtime source of truth stays `@/core/routes`.
 */
import { paths } from '@/core/routes';

import { SAVINGS_JAR_FLAG } from './savings_jar.flags';

export type RouteGuard = 'public' | 'guest' | 'auth' | 'flow';
export type RouteLayout = 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: RouteGuard;
  layout: RouteLayout;
  flag?: string;
}

export const savingsJarRoutes: readonly ModuleRoute[] = [
  { id: 'savingsJar', path: paths.savingsJar, guard: 'auth', layout: 'app-shell', flag: SAVINGS_JAR_FLAG },
  {
    id: 'savingsJarSettings',
    path: paths.savingsJarSettings,
    guard: 'auth',
    layout: 'app-shell',
    flag: SAVINGS_JAR_FLAG,
  },
] as const;
