/** The routes this module owns (docs/ROUTES.md "Mock modules"). */
export interface TopupRoute {
  id: 'topup' | 'topupCard' | 'topupCashier' | 'topupResult';
  path: string;
  guard: 'auth';
  flag: 'topup';
  layout: 'app-shell';
}

export const topupRoutes: readonly TopupRoute[] = [
  { id: 'topup', path: '/topup', guard: 'auth', flag: 'topup', layout: 'app-shell' },
  { id: 'topupCard', path: '/topup/card', guard: 'auth', flag: 'topup', layout: 'app-shell' },
  { id: 'topupCashier', path: '/topup/cashier', guard: 'auth', flag: 'topup', layout: 'app-shell' },
  { id: 'topupResult', path: '/topup/result', guard: 'auth', flag: 'topup', layout: 'app-shell' },
] as const;
