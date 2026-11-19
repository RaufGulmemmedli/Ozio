/**
 * The routes this module owns (docs/ROUTES.md "Idea modules").
 * Declarative only — the guards run in `src/middleware.ts` + `<AuthGate>`.
 *
 * `/family-limits/[id]/edit` is drawn as a **right drawer over the member page**
 * (`limits-editor-drawer.html`), so the route exists only as the direct-hit fallback: landing on
 * it renders the member page with the drawer already open.
 */
import { paths } from '@/core/routes';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
  flag?: 'familyLimits';
}

export const familyLimitsRoutes: readonly ModuleRoute[] = [
  { id: 'familyLimits', path: paths.familyLimits, guard: 'auth', layout: 'app-shell', flag: 'familyLimits' },
  { id: 'familyLimit', path: '/family-limits/[id]', guard: 'auth', layout: 'app-shell', flag: 'familyLimits' },
  { id: 'familyLimitEdit', path: '/family-limits/[id]/edit', guard: 'auth', layout: 'drawer', flag: 'familyLimits' },
] as const;
