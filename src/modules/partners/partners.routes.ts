import { paths } from '@/core/routes';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
}

/**
 * The routes this module owns (docs/ROUTES.md § Partners).
 *
 * `/market/partners` is a **category** screen: `GET v1/ozio-partners` returns categories, so the
 * chip row is the category list and the grid shows either the categories ("Hamısı") or the brands
 * of the chosen category (`?category=<id>`, a URL state — not a route).
 *
 * `/work/partner` is listed in ROUTES.md under partners but is **not** part of this package.
 */
export const partnersRoutes: readonly ModuleRoute[] = [
  { id: 'marketPartners', path: paths.marketPartners, guard: 'guest', layout: 'app-shell' },
  { id: 'marketPartner', path: '/market/partners/[id]', guard: 'guest', layout: 'app-shell' },
  {
    id: 'marketPartnerBranches',
    path: '/market/partners/[id]/branches',
    guard: 'guest',
    layout: 'app-shell',
  },
  { id: 'marketPartnersMap', path: paths.marketPartnersMap, guard: 'guest', layout: 'app-shell' },
] as const;
