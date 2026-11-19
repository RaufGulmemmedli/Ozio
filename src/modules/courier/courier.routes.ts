/** The routes this module owns (docs/ROUTES.md "Mock modules"). */
export interface CourierRoute {
  id:
    | 'courierApply'
    | 'courierApplyStatus'
    | 'courier'
    | 'courierOrder'
    | 'courierDelivery'
    | 'courierEarnings'
    | 'courierHistory';
  path: string;
  guard: 'auth';
  flag: 'courier';
  layout: 'app-shell';
}

const base = { guard: 'auth', flag: 'courier', layout: 'app-shell' } as const;

export const courierRoutes: readonly CourierRoute[] = [
  { id: 'courierApply', path: '/courier/apply', ...base },
  { id: 'courierApplyStatus', path: '/courier/apply/status', ...base },
  { id: 'courier', path: '/courier', ...base },
  { id: 'courierOrder', path: '/courier/orders/[id]', ...base },
  { id: 'courierDelivery', path: '/courier/delivery/[id]', ...base },
  { id: 'courierEarnings', path: '/courier/earnings', ...base },
  { id: 'courierHistory', path: '/courier/history', ...base },
] as const;
