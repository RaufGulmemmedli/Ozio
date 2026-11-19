/**
 * The routes this module owns. `paths.ts` / `guards.ts` are the runtime source
 * of truth (both already carry these rows); this file is the module's own
 * declaration so the ownership is readable from inside the module.
 */
import { paths } from '@/core/routes';
import type { Guard } from '@/core/routes';
import type { FeatureName } from '@/core/config';

export type LoyaltyLayout = 'app-shell' | 'modal' | 'full';

export interface LoyaltyRoute {
  id: string;
  path: string;
  guard: Guard;
  layout: LoyaltyLayout;
  flag?: FeatureName;
}

export const loyaltyCardRoutes: readonly LoyaltyRoute[] = [
  { id: 'card', path: paths.card, guard: 'auth', layout: 'app-shell' },
  // ROUTES.md lists `full` for this one. `(app)/layout.tsx` wraps every child in
  // `<AppShell>` and belongs to another agent, so the page renders as a
  // full-bleed, chrome-free section inside the shell instead of replacing it.
  { id: 'cardOffline', path: paths.cardOffline, guard: 'auth', layout: 'full' },
  { id: 'cardTransactions', path: paths.cardTransactions, guard: 'auth', layout: 'app-shell' },
  { id: 'cardTransaction', path: paths.cardTransaction(':id'), guard: 'auth', layout: 'modal' },
  { id: 'cardLevels', path: paths.cardLevels, guard: 'auth', layout: 'app-shell', flag: 'loyaltyTiers' },
] as const;
