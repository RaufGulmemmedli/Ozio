import { paths } from '@/core/routes';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
}

/**
 * The routes this module owns (docs/ROUTES.md § Addresses).
 *
 * Two screens from the export are **URL states**, not routes, exactly as ROUTES.md's
 * "Not routes (states)" section prescribes:
 *  - `app-catdirilma-zonasi.html` (Çatdırılma zonası) → `/addresses?view=zones`;
 *  - `app-unvan-zona-xaricinde.html` (Zona xaricində) → a state of the picker/form, not a route.
 */
export const addressRoutes: readonly ModuleRoute[] = [
  { id: 'addresses', path: paths.addresses, guard: 'auth', layout: 'app-shell' },
  { id: 'addressNew', path: paths.addressNew, guard: 'auth', layout: 'modal' },
  { id: 'addressPick', path: paths.addressPick, guard: 'auth', layout: 'full' },
  { id: 'addressSearch', path: paths.addressSearch, guard: 'auth', layout: 'modal' },
] as const;

/** `/addresses?view=zones` — the delivery-zone screen as a state of the list route. */
export const ADDRESS_ZONES_VIEW = 'zones';
export const addressZonesHref = `${paths.addresses}?view=${ADDRESS_ZONES_VIEW}`;
