/** The routes this module owns (docs/ROUTES.md "Idea modules"). */
export interface GroupBuyRoute {
  id: 'groupBuy' | 'groupBuyCreate' | 'groupBuyDeal';
  path: string;
  guard: 'auth';
  flag: 'groupBuy';
  layout: 'app-shell';
}

export const groupBuyRoutes: readonly GroupBuyRoute[] = [
  { id: 'groupBuy', path: '/group-buy', guard: 'auth', flag: 'groupBuy', layout: 'app-shell' },
  {
    id: 'groupBuyCreate',
    path: '/group-buy/create',
    guard: 'auth',
    flag: 'groupBuy',
    layout: 'app-shell',
  },
  {
    id: 'groupBuyDeal',
    path: '/group-buy/deal/[id]',
    guard: 'auth',
    flag: 'groupBuy',
    layout: 'app-shell',
  },
] as const;
