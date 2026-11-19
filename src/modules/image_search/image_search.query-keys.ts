/**
 * Query keys for the photo-search module.
 *
 * `recognize` is a **mutation**, so it has no cache key; the only cached thing here is the real
 * catalog search a recognised query drives — and that one lives under the `store` module's own
 * keys (`storeKeys.products`), because it is literally the same request as the catalog grid.
 * These keys cover the module's own mock state only.
 */
import { moduleKeys } from '@/core/query';

export const imageSearchKeys = {
  ...moduleKeys('image_search'),
  /** `POST /api/mock/image_search/recognize` — a mutation key, for `isMutating` checks. */
  recognize: () => ['image_search', 'recognize'] as const,
  /** `GET /api/mock/image_search/recent` — the demo's "last recognised queries". */
  recent: () => ['image_search', 'recent'] as const,
} as const;
