/**
 * The feature flag that gates this module (08-feature-flags-mocks.md).
 *
 * `courier_shop` is a mock module: there is no backend, every screen renders `<DemoBanner>` and
 * `NEXT_PUBLIC_FEATURE_COURIER_SHOP=0` makes the six routes 404 (the middleware redirects to
 * `/home` from `flagRoutePatterns`, and each page also calls `notFound()` as defence in depth).
 */
import { FeatureFlags, useFlag, type FeatureName } from '@/core/config';

/** The flag name, as `@/core/config` and `@/core/mocks` both spell it. */
export const COURIER_SHOP_FLAG = 'courierShop' satisfies FeatureName;

/** Non-hook read — route pages, server components, the MSW module. */
export const courierShopEnabled = (): boolean => FeatureFlags.courierShop;

/** Hook read, for entry points rendered by other modules. */
export const useCourierShopEnabled = (): boolean => useFlag(COURIER_SHOP_FLAG);
