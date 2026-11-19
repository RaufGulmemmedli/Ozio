/**
 * `@/modules/restaurants` — the public surface. Other modules import ONLY from here.
 *
 * Demo data: the Ozio API has no restaurant endpoint (see `data/models/restaurant.ts`), so every
 * screen this module owns carries `<DemoBanner>` and nothing here reaches the network.
 *
 * Used by M-home for the "Mağaza və restoranlar" rail (`useFeaturedRestaurants`,
 * `<RestaurantTile>`) and by the two `/market/restaurants` routes.
 */
export { RestaurantsView } from './view/RestaurantsView';
export { RestaurantsSkeleton } from './view/RestaurantsSkeleton';
export { RestaurantView } from './view/RestaurantView';
export { RestaurantSkeleton } from './view/RestaurantSkeleton';

export { RestaurantCard } from './components/restaurant-card';
export { RestaurantTile } from './components/restaurant-tile';

export { useRestaurants, useFeaturedRestaurants, useRestaurant } from './hooks/use-restaurants';
export { useRestaurantFilters } from './hooks/use-restaurant-filters';
export type { RestaurantSort, RestaurantFilterState } from './hooks/use-restaurant-filters';

export { restaurantKeys } from './restaurants.query-keys';
export { restaurantRoutes, restaurantPath, RESTAURANTS_PATH } from './restaurants.routes';
export type { Restaurant, MenuItem, MenuSection, Cuisine } from './data/models/restaurant';
export { isOpenNow, menuItemCount, cheapestItem, CUISINES } from './data/models/restaurant';

export { useRestaurantBasket, useRestaurantBasketStore } from './hooks/use-restaurant-basket';
export type { BasketLine, RestaurantBasket } from './hooks/use-restaurant-basket';
