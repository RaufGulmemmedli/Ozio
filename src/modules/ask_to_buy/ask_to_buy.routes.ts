/**
 * The routes this module owns (docs/ROUTES.md "Idea modules").
 * Declarative only — the guards run in `src/middleware.ts` + `<AuthGate>`.
 *
 * `/ask-to-buy/send` is declared **before** `/ask-to-buy/[id]` so a literal `send` can never be
 * read as an id (screens/mock-family-senior.md "Implementation notes").
 */
import { paths } from '@/core/routes';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
  flag?: 'askToBuy';
}

export const askToBuyRoutes: readonly ModuleRoute[] = [
  { id: 'askToBuy', path: paths.askToBuy, guard: 'auth', layout: 'app-shell', flag: 'askToBuy' },
  { id: 'askToBuySend', path: paths.askToBuySend, guard: 'auth', layout: 'app-shell', flag: 'askToBuy' },
  { id: 'askToBuyRequest', path: '/ask-to-buy/[id]', guard: 'auth', layout: 'app-shell', flag: 'askToBuy' },
] as const;
