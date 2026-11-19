/**
 * The routes this module owns (docs/ROUTES.md).
 *
 * `/lottery/rules|results|prizes`, `/market/tens` and `/offers/discounts` are **guest**
 * visible; everything account-bound inside them is wrapped in `<GuestGate>` / `requireAuth`.
 */
import { paths } from '@/core/routes';

export interface ModuleRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
}

export const lotteryRoutes: readonly ModuleRoute[] = [
  { id: 'lottery', path: paths.lottery, guard: 'auth', layout: 'app-shell' },
  { id: 'lotteryTickets', path: paths.lotteryTickets, guard: 'auth', layout: 'app-shell' },
  { id: 'lotteryTicket', path: '/lottery/tickets/[id]', guard: 'auth', layout: 'app-shell' },
  { id: 'lotteryRules', path: paths.lotteryRules, guard: 'guest', layout: 'app-shell' },
  { id: 'lotteryResults', path: paths.lotteryResults, guard: 'guest', layout: 'app-shell' },
  { id: 'lotteryPrizes', path: paths.lotteryPrizes, guard: 'guest', layout: 'app-shell' },
  { id: 'tens', path: paths.tens, guard: 'guest', layout: 'app-shell' },
  { id: 'discounts', path: paths.discounts, guard: 'guest', layout: 'app-shell' },
] as const;
