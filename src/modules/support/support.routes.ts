/** The routes this module owns (docs/ROUTES.md "Profile / settings / help"). */
export interface SupportRoute {
  id: 'support';
  path: string;
  guard: 'auth';
  layout: 'app-shell';
  flag: 'supportChat';
}

export const supportRoutes: readonly SupportRoute[] = [
  { id: 'support', path: '/support', guard: 'auth', layout: 'app-shell', flag: 'supportChat' },
] as const;
