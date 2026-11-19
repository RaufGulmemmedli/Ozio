/** The routes this module owns (docs/ROUTES.md "Mock modules"). */
export interface ImageSearchRoute {
  id: 'searchImage';
  path: string;
  guard: 'auth';
  layout: 'app-shell';
  flag: 'imageSearch';
}

export const imageSearchRoutes: readonly ImageSearchRoute[] = [
  { id: 'searchImage', path: '/search/image', guard: 'auth', layout: 'app-shell', flag: 'imageSearch' },
] as const;
