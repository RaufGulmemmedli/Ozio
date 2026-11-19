import { moduleKeys } from '@/core/query';

/**
 * Query keys owned by the auth module. The first element is always `'auth'`, so a sign-out can
 * drop everything this module cached with one `invalidateQueries({ queryKey: authKeys.all })`.
 */
export const authKeys = {
  ...moduleKeys('auth'),
  /** `GET v1/location/cities?country_id=<id>` — the label depends on the locale, so scope it. */
  cities: (countryId: number) => ['auth', 'cities', countryId] as const,
};
