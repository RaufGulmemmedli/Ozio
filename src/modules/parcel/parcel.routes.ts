/** The routes this module owns (docs/ROUTES.md "Mock modules"). */
export interface ParcelRoute {
  id: 'parcel' | 'parcelNew' | 'parcelDetail';
  path: string;
  guard: 'auth';
  flag: 'parcel';
  layout: 'app-shell';
}

export const parcelRoutes: readonly ParcelRoute[] = [
  { id: 'parcel', path: '/parcel', guard: 'auth', flag: 'parcel', layout: 'app-shell' },
  { id: 'parcelNew', path: '/parcel/new', guard: 'auth', flag: 'parcel', layout: 'app-shell' },
  { id: 'parcelDetail', path: '/parcel/[id]', guard: 'auth', flag: 'parcel', layout: 'app-shell' },
] as const;
