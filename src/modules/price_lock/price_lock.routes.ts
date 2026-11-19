/** The routes this module owns (docs/ROUTES.md "Idea modules"). */
export interface PriceLockRoute {
  id: 'priceGuarantee' | 'priceLocks';
  path: string;
  guard: 'auth';
  flag: 'priceLock';
  layout: 'app-shell';
}

export const priceLockRoutes: readonly PriceLockRoute[] = [
  {
    id: 'priceGuarantee',
    path: '/price-guarantee',
    guard: 'auth',
    flag: 'priceLock',
    layout: 'app-shell',
  },
  { id: 'priceLocks', path: '/price-locks', guard: 'auth', flag: 'priceLock', layout: 'app-shell' },
] as const;
