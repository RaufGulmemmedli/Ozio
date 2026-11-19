'use client';

/**
 * `GET v1/stores/{id}` [verified]. Times are TRUE UTC here (the parser converts them to Baku),
 * the opposite convention from `stores/search`.
 *
 * Any unknown sub-path under `/stores/` is routed to this operation and answers
 * 404 "store not found" — a `notFound` failure therefore means "no such store".
 */
import { useLocale } from 'next-intl';
import { unwrap, type Failure } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';
import type { UseQueryResult } from '@tanstack/react-query';

import { storeRepository } from '../data/store.repository';
import { isOpenNow, type StoreDetail } from '../data/models/store';
import { previewStoreDetail } from '../data/store.preview';
import { storeKeys } from '../store.query-keys';

export interface UseStoreDetailResult {
  store: StoreDetail | undefined;
  /** Derived from `open_time`/`close_time` (converted to Baku) and `storeHolidays`. */
  isOpen: boolean;
  query: UseQueryResult<StoreDetail, Failure>;
}

export function useStoreDetail(
  id: number,
  opts: { enabled?: boolean } = {},
): UseStoreDetailResult {
  const locale = useLocale();

  const query = useScreenQuery<StoreDetail>(
    {
      queryKey: scoped(storeKeys.detail(id), locale),
      queryFn: ({ signal }) => unwrap(storeRepository.detail(id, { locale, signal })),
      enabled: (opts.enabled ?? true) && Number.isFinite(id) && id > 0,
      ...CACHE.catalog,
    },
    // `?preview=empty` keeps the header real and lets the product grid show ITS empty state;
    // `?preview=closed` is seedless on purpose (real store, forced closed state).
    { empty: previewStoreDetail() },
  );

  const store = query.data;
  return {
    store,
    isOpen: store ? isOpenNow(store.hours, store.holidays) : true,
    query,
  };
}
