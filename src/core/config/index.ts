/** Public surface of `@/core/config`. */
export {
  FeatureFlags,
  featureNames,
  useFlag,
  flagOn,
  flagForPath,
  pathEnabled,
  flagRoutePatterns,
} from './feature-flags';
export type { FeatureName } from './feature-flags';
export {
  publicEnv,
  serverEnv,
  getServerEnv,
  previewEnabled,
  mswMode,
  siteUrl,
  appVersion,
  isProd,
  isDev,
} from './env';
export type { PublicEnv, ServerEnv } from './env';
export {
  API_BASE,
  PREFIX,
  API_PREFIX,
  BFF_BASE,
  MOCK_BASE,
  DEFAULT_COUNTRY_ID,
  DEFAULT_PAGE_SIZE,
  REQUEST_TIMEOUT_MS,
  APP_TIME_ZONE,
  CURRENCY,
  bffUrl,
} from './api-config';
export type { ApiVersion } from './api-config';
