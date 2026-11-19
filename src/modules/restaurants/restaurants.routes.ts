/** The routes this module owns (02-routing.md / docs/ROUTES.md). */
export interface RestaurantRoute {
  id: 'restaurants' | 'restaurant';
  path: string;
  guard: 'guest';
  layout: 'app-shell';
}

export const restaurantRoutes: readonly RestaurantRoute[] = [
  { id: 'restaurants', path: '/market/restaurants', guard: 'guest', layout: 'app-shell' },
  { id: 'restaurant', path: '/market/restaurants/[id]', guard: 'guest', layout: 'app-shell' },
] as const;

/**
 * Bare paths — `paths.ts` carries the canonical copies (`paths.restaurants`,
 * `paths.restaurant(id)`); these exist so the module's own components do not have to reach for the
 * global table, the same split `product.routes.ts` uses.
 */
export const RESTAURANTS_PATH = '/market/restaurants';

export function restaurantPath(id: number): string {
  return `${RESTAURANTS_PATH}/${id}`;
}
