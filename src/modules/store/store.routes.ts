/** The routes this module owns (02-routing.md / docs/ROUTES.md). */
export interface StoreRoute {
  id: 'market' | 'store' | 'category';
  path: string;
  guard: 'guest';
  layout: 'app-shell';
}

export const storeRoutes: readonly StoreRoute[] = [
  { id: 'market', path: '/market', guard: 'guest', layout: 'app-shell' },
  { id: 'store', path: '/market/store/[id]', guard: 'guest', layout: 'app-shell' },
  { id: 'category', path: '/market/category/[id]', guard: 'guest', layout: 'app-shell' },
] as const;
