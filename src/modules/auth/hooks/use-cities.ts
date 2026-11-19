'use client';

/**
 * `GET v1/location/cities?country_id=1` (live-verified, 16 rows for Azerbaijan, unpaginated).
 *
 * `useScreenQuery` gives the screen `?preview=loading|empty|error|offline` for free, and the
 * labels are resolved per locale, so the key is locale-scoped.
 */
import { CACHE, scoped, useLocaleKey, useScreenQuery } from '@/core/query';
import { unwrap } from '@/core/network';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Failure } from '@/core/network';

import { AZ_COUNTRY_ID } from '../auth.constants';
import { authKeys } from '../auth.query-keys';
import { authRepository } from '../data/auth.repository';
import type { City } from '../data/models/city';

export function useCities(countryId: number = AZ_COUNTRY_ID): UseQueryResult<City[], Failure> {
  const locale = useLocaleKey();

  return useScreenQuery<City[]>(
    {
      queryKey: scoped(authKeys.cities(countryId), locale),
      queryFn: ({ signal }) => unwrap(authRepository.cities(locale, signal, countryId)),
      // The city list barely changes; `static` is the right bucket (04-data-layer.md).
      ...CACHE.static,
    },
    { empty: [] },
  );
}
