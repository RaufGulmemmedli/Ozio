import { moduleKeys } from '@/core/query';

/**
 * Query keys for the address module. The first element is always `'address'`, so a write can
 * invalidate the whole module with `queryClient.invalidateQueries({ queryKey: addressKeys.all })`.
 *
 * Exported from `index.ts` because M5 (cart/checkout) and M6 invalidate these after their own
 * writes.
 */
export const addressKeys = {
  ...moduleKeys('address'),
  /** `GET v1/profile/address`. The point (when given) changes `distanceMeters`, so it is in the key. */
  list: (point?: { lat: number; lng: number } | null) =>
    ['address', 'list', point ? `${point.lat},${point.lng}` : null] as const,
  /** `GET v1/profile/address/{id}`. */
  detail: (id: number) => ['address', 'detail', id] as const,
  /** `GET v1/location/cities?country_id=1`. */
  cities: () => ['address', 'cities'] as const,
  /** The geocoding stub (`/api/mock/address/geocode/search`). */
  geocode: (query: string) => ['address', 'geocode', query] as const,
  /** The geocoding stub (`/api/mock/address/geocode/reverse`). */
  reverse: (lat: number | null, lng: number | null) => ['address', 'reverse', lat, lng] as const,
} as const;
