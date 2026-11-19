/** The route this slice owns (docs/ROUTES.md "Profile / settings / help"). */
export interface ReferralRoute {
  id: 'invite';
  path: string;
  guard: 'auth';
  flag: 'referral';
  layout: 'app-shell';
}

export const referralRoutes: readonly ReferralRoute[] = [
  { id: 'invite', path: '/invite', guard: 'auth', flag: 'referral', layout: 'app-shell' },
] as const;
