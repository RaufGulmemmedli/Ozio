/**
 * API shape constants (architecture/README + api/README.md).
 *
 * The real values live in `src/core/api/contracts/endpoints.ts` (generated from the swagger) and
 * are RE-EXPORTED here, never retyped, so there is exactly one copy in the repo.
 *
 * The browser never talks to `API_BASE` directly: it calls the same-origin BFF
 * `/api/bff/<version>/<path>`, which attaches the bearer token from the httpOnly cookie.
 */
export { API_BASE, PREFIX, DEFAULT_COUNTRY_ID } from '@/core/api/contracts/endpoints';
export type { LiveStatus, AuthMode, EndpointDef } from '@/core/api/contracts/endpoints';

import { PREFIX } from '@/core/api/contracts/endpoints';

/** Which prefix an endpoint lives under. `mock` is the MSW namespace, never the real host. */
export type ApiVersion = 'v1' | 'v2' | 'notifications' | 'mock';

/** Same-origin BFF mount point. */
export const BFF_BASE = '/api/bff';

/** MSW namespace for the mock modules: `/api/mock/<module>/…`. */
export const MOCK_BASE = '/api/mock';

/** Upstream path prefix per version (`mock` has no upstream). */
export const API_PREFIX: Record<ApiVersion, string> = {
  v1: PREFIX.v1,
  v2: PREFIX.v2,
  notifications: PREFIX.notifications,
  mock: MOCK_BASE,
};

/** Default page size for `offset` + `limit` lists (`page` is ignored by every endpoint). */
export const DEFAULT_PAGE_SIZE = 20;

/** Request timeout used by `core/network` (ms). */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Baku wall-clock time zone, fixed for order times and delivery slots. */
export const APP_TIME_ZONE = 'Asia/Baku';

/** Currency of every amount in the app. */
export const CURRENCY = 'AZN';

/** `/api/bff/<version>/<path>` for a browser call. */
export function bffUrl(version: ApiVersion, path: string): string {
  const clean = path.replace(/^\/+/, '');
  return `${BFF_BASE}/${version}/${clean}`;
}
