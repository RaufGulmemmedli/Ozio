'use client';

/**
 * Favourites (AX8).
 *
 * `GET v1/stores/favorites` is **404 on live** — the path is shadowed by `/stores/{id}`, and every
 * query variant answers the same. The repository therefore returns a `notFound` Failure **without
 * calling anything**, and `/favorites` renders the documented "not available" state.
 *
 * `?preview=empty` still shows the drawn empty screen, and `?preview=loading` the skeleton, so both
 * designed states are reachable while the endpoint is dead.
 */
import { useLocale } from 'next-intl';

import { unwrap, type Page } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';

import { searchRepository } from '../data/search.repository';
import type { ProductRow } from '../data/store-bridge';
import { searchKeys } from '../search.query-keys';

const EMPTY: Page<ProductRow> = { items: [], total: 0, offset: 0, limit: 0 };

export function useFavorites() {
  const locale = useLocale();

  return useScreenQuery<Page<ProductRow>>(
    {
      queryKey: scoped(searchKeys.favorites(), locale),
      // The call is dead on live: one attempt, no retries, no refetch storm.
      retry: false,
      queryFn: ({ signal }) => unwrap(searchRepository.favorites({ locale, signal })),
      ...CACHE.catalog,
    },
    { empty: EMPTY },
  );
}
