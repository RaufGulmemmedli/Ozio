'use client';

/**
 * Geocoding hooks — the internal interface the search and picker screens are written against.
 *
 * Both are served by the MSW stub today (`data/address.mock.ts`); the swap point is the single
 * `GEOCODE_PROVIDER` const in `data/geocode.remote.ts`. Screens that use these must render
 * `<DemoBanner module="address"/>`, because the data behind them is not real.
 */
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import type { UseQueryResult } from '@tanstack/react-query';

import { useScreenQuery } from '@/core/query';
import { unwrap, type Failure } from '@/core/network';

import { addressKeys } from '../address.query-keys';
import { geocodeRepository } from '../data/geocode.repository';
import type { GeoPlace } from '../data/models/geo-place';

const EMPTY_PLACES: GeoPlace[] = [];

/** Shortest query the provider is asked about. */
export const GEOCODE_MIN_QUERY = 2;
/** Debounce for search-as-you-type (the screen spec asks for 400 ms). */
export const GEOCODE_DEBOUNCE_MS = 400;

/** `value` after it has stopped changing for `delay` ms. */
export function useDebounced<T>(value: T, delay = GEOCODE_DEBOUNCE_MS): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

/** Free-text address search. Disabled until the query is long enough. */
export function useGeocodeSearch(query: string): UseQueryResult<GeoPlace[], Failure> {
  const locale = useLocale();
  const trimmed = query.trim();
  return useScreenQuery<GeoPlace[]>(
    {
      queryKey: [...addressKeys.geocode(trimmed), locale],
      queryFn: ({ signal }) => unwrap(geocodeRepository.search(trimmed, locale, signal)),
      enabled: trimmed.length >= GEOCODE_MIN_QUERY,
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
    },
    { empty: EMPTY_PLACES },
  );
}

/** The address at a dropped pin. `null` data means "nothing is mapped there". */
export function useReverseGeocode(
  point: { lat: number; lng: number } | null,
): UseQueryResult<GeoPlace | null, Failure> {
  const locale = useLocale();
  return useScreenQuery<GeoPlace | null>({
    queryKey: [...addressKeys.reverse(point?.lat ?? null, point?.lng ?? null), locale],
    queryFn: ({ signal }) =>
      unwrap(geocodeRepository.reverse(point?.lat ?? 0, point?.lng ?? 0, locale, signal)),
    enabled: point !== null,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
