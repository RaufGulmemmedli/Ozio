/**
 * Which feature flag gates this mock module (08-feature-flags-mocks.md).
 *
 * `NEXT_PUBLIC_FEATURE_PARCEL`, default ON: the screens are shown and labelled
 * "Demo rejim" rather than hidden. When the flag is off the middleware redirects
 * `/parcel*` to `/home` and every page here also calls `notFound()`.
 */
import { FeatureFlags, type FeatureName } from '@/core/config';

export const PARCEL_FLAG = 'parcel' satisfies FeatureName;

/** The mock namespace all handlers live under: `/api/mock/parcel/…`. */
export const PARCEL_MOCK_MODULE = 'parcel';

/** Non-hook read, usable from a server component / page. */
export const parcelEnabled = (): boolean => FeatureFlags[PARCEL_FLAG];
