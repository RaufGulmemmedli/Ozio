/** Routes this module owns. */
export interface SearchRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
}

export const searchRoutes: readonly SearchRoute[] = [
  { id: 'search', path: '/search', guard: 'guest', layout: 'app-shell' },
  { id: 'searchQuery', path: '/search?q=', guard: 'guest', layout: 'app-shell' },
  // ROUTES.md lists `/favorites` under the store module; the page itself (AX8) is built here
  // because the favourites list is composed the same way search is.
  { id: 'favorites', path: '/favorites', guard: 'auth', layout: 'app-shell' },
] as const;

/** The query key the search term lives in. */
export const SEARCH_QUERY_PARAM = 'q';
