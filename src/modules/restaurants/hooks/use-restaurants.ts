'use client';

/**
 * Reading the demo restaurants.
 *
 * `useScreenQuery` rather than a plain `useQuery` so these screens get the same `?preview=` states
 * (loading / error / empty) every other screen has — the data is local, but the states a real
 * endpoint will produce are not, and the views are built against them now.
 */

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery } from '@/core/query';

import { restaurantsRepository } from '../data/restaurants.repository';
import type { Restaurant } from '../data/models/restaurant';
import { restaurantKeys } from '../restaurants.query-keys';

/** Fixtures never go stale; `catalog` keeps them out of the way of real traffic all the same. */
const CACHE_POLICY = CACHE.catalog;

export function useRestaurants() {
  return useScreenQuery<Restaurant[]>(
    {
      queryKey: restaurantKeys.list(),
      queryFn: ({ signal }) => unwrap(restaurantsRepository.list(signal)),
      ...CACHE_POLICY,
    },
    { empty: [] },
  );
}

export function useFeaturedRestaurants(limit = 4) {
  return useScreenQuery<Restaurant[]>(
    {
      queryKey: restaurantKeys.featured(limit),
      queryFn: ({ signal }) => unwrap(restaurantsRepository.featured(limit, signal)),
      ...CACHE_POLICY,
    },
    { empty: [] },
  );
}

export function useRestaurant(id: number | null) {
  return useScreenQuery<Restaurant>({
    queryKey: restaurantKeys.detail(id ?? 0),
    queryFn: ({ signal }) => unwrap(restaurantsRepository.detail(id as number, signal)),
    enabled: id !== null && id > 0,
    ...CACHE_POLICY,
  });
}

export type { Failure };
