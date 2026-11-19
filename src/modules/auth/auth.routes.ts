import { paths } from '@/core/routes';

/**
 * The routes this module owns. `paths.ts` / `guards.ts` stay the runtime source of truth
 * (append-only registries); this table is the module's own declaration of what it renders.
 */
export const authRoutes = [
  { id: 'login', path: paths.login, guard: 'flow', layout: 'auth-split' },
  { id: 'otp', path: paths.otp, guard: 'flow', layout: 'auth-split' },
  // 02-routing.md calls this `auth-partial` (token present, profile incomplete). The edge can
  // only see "token present", so the registry rule is `auth` and the page handles the rest.
  { id: 'register', path: paths.register, guard: 'auth', layout: 'auth-split' },
  { id: 'citySelect', path: paths.citySelect, guard: 'guest', layout: 'auth-split' },
  { id: 'welcome', path: paths.welcome, guard: 'auth', layout: 'auth-split' },
] as const;

export type AuthRouteId = (typeof authRoutes)[number]['id'];
