/**
 * The flag that gates the savings jar (08-feature-flags-mocks.md).
 *
 * `savingsJar` has no counterpart in Flutter's `feature_flags.dart` — it is a web-side gate that
 * defaults ON, like every other idea module. Both pages also call
 * `if (!FeatureFlags.savingsJar) notFound()`, and the MSW handlers are wrapped in `flagged(...)`.
 */
import { FeatureFlags, type FeatureName } from '@/core/config';

export const SAVINGS_JAR_FLAG: FeatureName = 'savingsJar';

export const savingsJarEnabled = (): boolean => FeatureFlags[SAVINGS_JAR_FLAG];

/**
 * The MSW namespace: `/api/mock/savings_jar/…`.
 *
 * It must stay `savings_jar` (not `savingsJar`) — `core/mocks/modules.ts` lists it under that name
 * and loads `src/modules/savings_jar/data/savings_jar.mock.ts` by it.
 */
export const SAVINGS_JAR_MOCK_MODULE = 'savings_jar';
