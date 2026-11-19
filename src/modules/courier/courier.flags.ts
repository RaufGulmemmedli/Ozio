/**
 * Which feature flag gates this mock module (08-feature-flags-mocks.md).
 *
 * `NEXT_PUBLIC_FEATURE_COURIER`, default ON. The documented demo hook lives in
 * `data/courier.mock.ts`: the application is stored locally and **auto-approves after ~4 s**.
 */
import { FeatureFlags, type FeatureName } from '@/core/config';

export const COURIER_FLAG = 'courier' satisfies FeatureName;

/** The mock namespace all handlers live under: `/api/mock/courier/…`. */
export const COURIER_MOCK_MODULE = 'courier';

/** The documented review delay of the mock (`COURIER_REVIEW_DELAY_MS`). */
export const COURIER_REVIEW_DELAY_MS = 4000;

export const courierEnabled = (): boolean => FeatureFlags[COURIER_FLAG];
