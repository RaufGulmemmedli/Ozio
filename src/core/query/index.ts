/**
 * `@/core/query` — the data-layer surface every module hook uses.
 *
 * `<Providers>` is intentionally **not** re-exported here: it is imported from
 * `@/core/query/providers` by the root layout only, so importing a query key never drags the whole
 * provider tree (theme, MSW) into a bundle.
 */
export {
  QUERY_DEFAULT_GC_TIME,
  QUERY_DEFAULT_STALE_TIME,
  clearQueryCache,
  getQueryClient,
  makeQueryClient,
} from './query-client';

export {
  CACHE,
  moduleKeys,
  queryKeys,
  scoped,
  useLocaleKey,
  type CacheBucket,
  type CachePolicy,
  type CrossModuleKey,
} from './keys';

export {
  PREVIEW_ENABLED,
  PREVIEW_PARAM,
  PREVIEW_STATES,
  isPreviewState,
  useIsPreview,
  usePreview,
  type Preview,
  type PreviewState,
} from './use-preview';

export {
  useScreenInfiniteQuery,
  useScreenQuery,
  type ScreenQuerySeed,
} from './use-screen-query';

export {
  emptyPage,
  useOffsetInfinite,
  type Page,
  type UseOffsetInfiniteArgs,
  type UseOffsetInfiniteResult,
} from './use-paged';
