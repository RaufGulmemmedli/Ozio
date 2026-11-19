'use client';

/**
 * `GET v1/stores/search?lat&lng` [verified] — the only working store list.
 *
 * The server IGNORES `search=` (the same 4 stores for any keyword), so a name filter is applied
 * **client-side** here, after the response.
 */
import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';

import { storeRepository, type DeliveryPoint } from '../data/store.repository';
import type { Store } from '../data/models/store';
import { storeKeys } from '../store.query-keys';

const EMPTY: Store[] = [];

export interface UseStoresArgs {
  point: DeliveryPoint | null;
  /** Client-side name filter — the API ignores its own `search` parameter. */
  keyword?: string;
  /** Keep only the rows that deliver to the point (those with a `delivery_fee`). */
  deliveringOnly?: boolean;
  enabled?: boolean;
}

export interface UseStoresResult {
  stores: Store[];
  /** Every row, before the client-side keyword / delivery filter. */
  all: Store[];
  query: UseQueryResult<Store[], Failure>;
}

export function useStores(args: UseStoresArgs): UseStoresResult {
  const locale = useLocale();
  const { point, keyword = '', deliveringOnly = false, enabled = true } = args;

  const query = useScreenQuery<Store[]>(
    {
      queryKey: scoped(storeKeys.list(point), locale),
      queryFn: ({ signal }) =>
        unwrap(storeRepository.list(point as DeliveryPoint, { locale, signal })),
      enabled: enabled && point !== null,
      ...CACHE.catalog,
    },
    { empty: EMPTY },
  );

  const all = query.data ?? EMPTY;
  const needle = keyword.trim().toLocaleLowerCase(locale);

  const stores = useMemo(() => {
    let list = all;
    if (deliveringOnly) list = list.filter((s) => s.deliversHere);
    if (needle) list = list.filter((s) => s.name.toLocaleLowerCase(locale).includes(needle));
    return list;
  }, [all, deliveringOnly, needle, locale]);

  return { stores, all, query };
}

/** The store a catalog screen defaults to: the nearest delivering grocery store. */
export function pickDefaultStore(stores: readonly Store[]): Store | null {
  const market = stores.find((s) => s.deliversHere && s.moduleType === 'market');
  return market ?? stores.find((s) => s.deliversHere) ?? stores[0] ?? null;
}
