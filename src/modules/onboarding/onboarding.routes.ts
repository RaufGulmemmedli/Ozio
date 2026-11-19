import { paths } from '@/core/routes';

/** The routes this module owns. `paths.ts` / `guards.ts` remain the runtime source of truth. */
export const onboardingRoutes = [
  { id: 'splash', path: paths.splash, guard: 'public', layout: 'full' },
  { id: 'onboarding', path: paths.onboarding, guard: 'public', layout: 'full' },
  {
    id: 'permissionNotifications',
    path: paths.permissionNotifications,
    guard: 'auth',
    layout: 'modal',
  },
  { id: 'permissionLocation', path: paths.permissionLocation, guard: 'guest', layout: 'modal' },
] as const;

export type OnboardingRouteId = (typeof onboardingRoutes)[number]['id'];
