/**
 * Geocoding repository. The one place the UI asks "what is at this point / what matches this
 * text" — the provider behind it is a stub today (see `geocode.remote.ts`).
 */
import { mapResult, type Result } from '@/core/network';

import { geocodeRemote } from './geocode.remote';
import { parseGeoPlace, parseGeoPlaces, type GeoPlace } from './models/geo-place';

export const geocodeRepository = {
  /** Free-text search. An empty query never reaches the provider. */
  search: async (query: string, locale: string, signal?: AbortSignal): Promise<Result<GeoPlace[]>> => {
    const res = await geocodeRemote.search(query.trim(), locale, signal);
    return mapResult(res, (env) => parseGeoPlaces(env.data));
  },

  /** The address at a point, or `null` when nothing is mapped there. */
  reverse: async (
    lat: number,
    lng: number,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<GeoPlace | null>> => {
    const res = await geocodeRemote.reverse(lat, lng, locale, signal);
    return mapResult(res, (env) => parseGeoPlace(env.data));
  },
} as const;
