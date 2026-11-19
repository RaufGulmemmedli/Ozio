'use client';

/**
 * The restaurant filter + sort state.
 *
 * Everything is client-side, which here is not a compromise: the whole list is already in memory.
 * (In the store module the equivalent note exists because `stores/{id}/products` accepts neither a
 * price nor a discount parameter — see `filters.clientSideNote`.)
 *
 * The facets are the ones a delivery list is actually filtered by, and each is a FACT about the
 * fixture data rather than a label: cuisine, open now, free delivery, rating floor, and a maximum
 * delivery window.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  isOpenNow,
  type Cuisine,
  type Restaurant,
} from '../data/models/restaurant';

export type RestaurantSort = 'recommended' | 'rating' | 'deliveryTime' | 'minOrder';

export const RESTAURANT_SORTS: readonly RestaurantSort[] = [
  'recommended',
  'rating',
  'deliveryTime',
  'minOrder',
];

export interface RestaurantFilterState {
  /** Empty = every cuisine. Multi-select, unlike the store category filter (that one is single
   *  because the server takes one `category_id`; here there is no server to disagree with). */
  cuisines: Cuisine[];
  openOnly: boolean;
  freeDeliveryOnly: boolean;
  /** `null` = any; otherwise the minimum rating, e.g. 4.5. */
  minRating: number | null;
  /** `null` = any; otherwise the longest acceptable `deliveryTimeMax`, in minutes. */
  maxDeliveryMinutes: number | null;
}

const EMPTY: RestaurantFilterState = {
  cuisines: [],
  openOnly: false,
  freeDeliveryOnly: false,
  minRating: null,
  maxDeliveryMinutes: null,
};

export interface UseRestaurantFiltersResult {
  filters: RestaurantFilterState;
  sort: RestaurantSort;
  setSort: (sort: RestaurantSort) => void;
  toggleCuisine: (cuisine: Cuisine) => void;
  setOpenOnly: (value: boolean) => void;
  setFreeDeliveryOnly: (value: boolean) => void;
  setMinRating: (value: number | null) => void;
  setMaxDeliveryMinutes: (value: number | null) => void;
  clear: () => void;
  /** How many facets are set — drives the "Filtr (2)" pill on mobile. */
  activeCount: number;
  /** Filtered AND sorted, ready to render. */
  visible: Restaurant[];
  /** Cuisines that at least one restaurant in the source list actually has. */
  availableCuisines: Cuisine[];
}

export function useRestaurantFilters(source: readonly Restaurant[]): UseRestaurantFiltersResult {
  const [filters, setFilters] = useState<RestaurantFilterState>(EMPTY);
  const [sort, setSort] = useState<RestaurantSort>('recommended');

  const toggleCuisine = useCallback((cuisine: Cuisine) => {
    setFilters((prev) => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter((c) => c !== cuisine)
        : [...prev.cuisines, cuisine],
    }));
  }, []);

  const setOpenOnly = useCallback(
    (value: boolean) => setFilters((prev) => ({ ...prev, openOnly: value })),
    [],
  );
  const setFreeDeliveryOnly = useCallback(
    (value: boolean) => setFilters((prev) => ({ ...prev, freeDeliveryOnly: value })),
    [],
  );
  const setMinRating = useCallback(
    (value: number | null) => setFilters((prev) => ({ ...prev, minRating: value })),
    [],
  );
  const setMaxDeliveryMinutes = useCallback(
    (value: number | null) => setFilters((prev) => ({ ...prev, maxDeliveryMinutes: value })),
    [],
  );
  const clear = useCallback(() => setFilters(EMPTY), []);

  const availableCuisines = useMemo(() => {
    const seen = new Set<Cuisine>();
    for (const restaurant of source) for (const c of restaurant.cuisines) seen.add(c);
    return [...seen];
  }, [source]);

  const visible = useMemo(() => {
    // One `now` for the whole pass, so two restaurants cannot be judged against different minutes.
    const now = new Date();

    const matched = source.filter((restaurant) => {
      if (
        filters.cuisines.length > 0 &&
        !restaurant.cuisines.some((c) => filters.cuisines.includes(c))
      ) {
        return false;
      }
      if (filters.openOnly && !isOpenNow(restaurant, now)) return false;
      if (filters.freeDeliveryOnly && !restaurant.isDeliveryFree) return false;
      if (filters.minRating !== null && restaurant.rating < filters.minRating) return false;
      if (
        filters.maxDeliveryMinutes !== null &&
        restaurant.deliveryTimeMax > filters.maxDeliveryMinutes
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...matched];
    switch (sort) {
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'deliveryTime':
        sorted.sort((a, b) => a.deliveryTimeMax - b.deliveryTimeMax);
        break;
      case 'minOrder':
        sorted.sort((a, b) => a.minOrder - b.minOrder);
        break;
      case 'recommended':
        // Open kitchens first, then rating — a closed 4.8 is less useful than an open 4.5.
        sorted.sort((a, b) => {
          const openDelta = Number(isOpenNow(b, now)) - Number(isOpenNow(a, now));
          return openDelta !== 0 ? openDelta : b.rating - a.rating;
        });
        break;
    }
    return sorted;
  }, [source, filters, sort]);

  const activeCount =
    filters.cuisines.length +
    (filters.openOnly ? 1 : 0) +
    (filters.freeDeliveryOnly ? 1 : 0) +
    (filters.minRating !== null ? 1 : 0) +
    (filters.maxDeliveryMinutes !== null ? 1 : 0);

  return {
    filters,
    sort,
    setSort,
    toggleCuisine,
    setOpenOnly,
    setFreeDeliveryOnly,
    setMinRating,
    setMaxDeliveryMinutes,
    clear,
    activeCount,
    visible,
    availableCuisines,
  };
}
