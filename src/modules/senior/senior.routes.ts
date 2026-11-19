/**
 * The routes this module owns (docs/ROUTES.md "Idea modules").
 * Declarative only — the guards run in `src/middleware.ts` + `<AuthGate>`.
 *
 * `/senior/neighbor/new` is drawn as a **600-wide dialog over the board**
 * (`senior-neighbor-new-dialog.html`), so the route is the direct-hit fallback: it renders the
 * board with the dialog already open.
 */
import { paths } from '@/core/routes';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
  flag?: 'senior';
}

export const seniorRoutes: readonly ModuleRoute[] = [
  { id: 'seniorMode', path: paths.seniorMode, guard: 'auth', layout: 'app-shell', flag: 'senior' },
  { id: 'seniorPension', path: paths.seniorPension, guard: 'auth', layout: 'app-shell', flag: 'senior' },
  { id: 'seniorNeighbor', path: paths.seniorNeighbor, guard: 'auth', layout: 'app-shell', flag: 'senior' },
  { id: 'seniorNeighborNew', path: paths.seniorNeighborNew, guard: 'auth', layout: 'modal', flag: 'senior' },
] as const;
