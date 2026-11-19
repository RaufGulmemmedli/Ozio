/**
 * Routes this module owns (docs/ROUTES.md "Profile / settings / help").
 *
 * `/support` (flag `supportChat`) and `/invite` (flag `referral`) are listed in ROUTES.md under
 * this module but are built by another agent — they are deliberately absent here and only linked
 * to behind `useFlag(...)`. `/notifications` is agent M2's screen for the same reason.
 */
import { paths } from '@/core/routes';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'app-shell' | 'modal' | 'drawer' | 'full';
}

export const profileRoutes: ModuleRoute[] = [
  { id: 'profile', path: paths.profile, guard: 'auth', layout: 'app-shell' },
  { id: 'profileEdit', path: paths.profileEdit, guard: 'auth', layout: 'app-shell' },
  // Intercepted at `(app)/@modal/(.)settings` (a sheet below 768), full page on a direct hit.
  { id: 'settings', path: paths.settings, guard: 'auth', layout: 'modal' },
  { id: 'settingsLanguage', path: paths.settingsLanguage, guard: 'guest', layout: 'app-shell' },
  { id: 'settingsAppearance', path: paths.settingsAppearance, guard: 'guest', layout: 'app-shell' },
  { id: 'settingsNotifications', path: paths.settingsNotifications, guard: 'auth', layout: 'app-shell' },
  { id: 'help', path: paths.help, guard: 'guest', layout: 'app-shell' },
  { id: 'accountDelete', path: paths.accountDelete, guard: 'auth', layout: 'app-shell' },
  { id: 'history', path: paths.history, guard: 'auth', layout: 'app-shell' },
];
