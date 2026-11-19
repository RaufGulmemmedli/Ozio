/**
 * The routes this module owns (BUILD-CONTRACT §Module anatomy, ROUTES.md
 * §Marketing). All `public` + layout `landing`; the prefetch column is
 * 02-routing.md's, and is what each page file's segment config implements.
 */
import { paths } from '@/core/routes';

export type MarketingPrefetch = 'SSG' | 'ISR3600' | 'ISR86400';

export interface MarketingRoute {
  id: string;
  path: string;
  guard: 'public';
  layout: 'landing';
  prefetch: MarketingPrefetch;
}

export const marketingRoutes: MarketingRoute[] = [
  { id: 'landing', path: paths.landing, guard: 'public', layout: 'landing', prefetch: 'SSG' },
  { id: 'cashback', path: paths.cashback, guard: 'public', layout: 'landing', prefetch: 'SSG' },
  { id: 'partners', path: paths.partners, guard: 'public', layout: 'landing', prefetch: 'ISR3600' },
  { id: 'delivery', path: paths.delivery, guard: 'public', layout: 'landing', prefetch: 'ISR3600' },
  { id: 'ten', path: paths.ten, guard: 'public', layout: 'landing', prefetch: 'SSG' },
  { id: 'contact', path: paths.contact, guard: 'public', layout: 'landing', prefetch: 'SSG' },
  { id: 'terms', path: paths.terms, guard: 'public', layout: 'landing', prefetch: 'ISR86400' },
  { id: 'privacy', path: paths.privacy, guard: 'public', layout: 'landing', prefetch: 'ISR86400' },
];
