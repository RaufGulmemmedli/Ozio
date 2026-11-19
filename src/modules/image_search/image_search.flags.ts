/**
 * Which feature flag gates this mock module (08-feature-flags-mocks.md).
 *
 * `imageSearch` = `NEXT_PUBLIC_FEATURE_IMAGE_SEARCH`, default ON. Flag off:
 *  - the middleware redirects `/search/image` to `/home` (`flagRoutePatterns`),
 *  - the page still calls `notFound()` as defence in depth,
 *  - `<CameraSearchButton>` renders nothing, so the search field loses its camera entry point.
 *
 * Only the **recognition** step is a mock. The products the screen shows come from the real
 * catalog (`stores/search` + `stores/{storeId}/products?keyword=`), so a flag-off build loses the
 * photo entry point, never the catalog.
 */
import { FeatureFlags, type FeatureName } from '@/core/config';

export const IMAGE_SEARCH_FLAG: FeatureName = 'imageSearch';

/** The MSW namespace: every mock call is `/api/mock/image_search/…`, never the real host. */
export const IMAGE_SEARCH_MOCK_MODULE = 'image_search';

export const imageSearchEnabled = (): boolean => FeatureFlags.imageSearch;
