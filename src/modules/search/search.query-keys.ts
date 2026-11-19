/** Query keys for the search module. */
import { moduleKeys } from '@/core/query';

export const searchKeys = {
  ...moduleKeys('search'),
  /** Stores serving a point — the fan-out legs are derived from this. */
  stores: (lat: number, lng: number) => ['search', 'stores', lat, lng] as const,
  /** The fan-out itself: the keyword plus the exact store ids it was run against. */
  results: (keyword: string, storeIds: readonly number[], categoryId: number | null) =>
    ['search', 'results', keyword, storeIds.join(','), categoryId] as const,
  categories: (storeId: number) => ['search', 'categories', storeId] as const,
  favorites: () => ['search', 'favorites'] as const,
} as const;
