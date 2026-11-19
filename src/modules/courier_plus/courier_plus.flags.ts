/**
 * Which feature flag gates this module (08-feature-flags-mocks.md).
 *
 * `courierPlus` defaults **ON** (owner decision 2026-11-12): the idea modules are shown and
 * labelled "Demo rejim" rather than hidden. Flag off ⇒ the middleware redirects `/courier-plus/*`
 * to `/home` (`flagRoutePatterns` in `core/config/feature-flags.ts` already carries the pattern),
 * every page also calls `notFound()`, the MSW handlers are dropped by `flagged()` and
 * `<CourierPlusEntry>` renders nothing.
 */
import { FeatureFlags, type FeatureName } from '@/core/config';

/** The flag name, as `FeatureFlags` and `flagged()` spell it. */
export const COURIER_PLUS_FLAG = 'courierPlus' satisfies FeatureName;

/** Non-hook read, for pages (`if (!courierPlusEnabled()) notFound()`) and entry points. */
export const courierPlusEnabled = (): boolean => FeatureFlags[COURIER_PLUS_FLAG];

/** Every screen in this module renders `<DemoBanner module="courier_plus" />`. */
export const COURIER_PLUS_MODULE = 'courier_plus';
