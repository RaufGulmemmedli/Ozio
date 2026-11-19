/**
 * Which feature flag gates the support chat (08-feature-flags-mocks.md, `supportChat` row).
 *
 * Flag off is a **documented product state**, not an error: the entry point falls back to `/help`
 * plus the contact details (`api/mock-modules.md` §9 — `supportUnavailable` + the "Qaydalar və
 * gizlilik" row), and the route redirects to `/home`.
 *
 * Mocks off (`NEXT_PUBLIC_MSW=off`) is different: the flag is on, so the screen exists, but the
 * scripted agent cannot answer — that is the `<ErrorState>` case.
 */
import { FeatureFlags, type FeatureName } from '@/core/config';

export const SUPPORT_FLAG: FeatureName = 'supportChat';

/**
 * The MSW namespace: `/api/mock/support/…`.
 *
 * `support` is **not** one of the names in `src/core/mocks/modules.ts`, so the registry never loads
 * a mock file for it. This module therefore has no `*.mock.ts` at all: `data/support.handlers.ts`
 * exports its handler array as a plain value, and
 * `src/modules/image_search/data/image_search.mock.ts` — whose module name **is** listed —
 * registers it under the key below. Nothing statically imports a `*.mock.ts`, which is what keeps
 * the root layout (and so every route) compiling.
 */
export const SUPPORT_MOCK_MODULE = 'support';

export const supportChatEnabled = (): boolean => FeatureFlags.supportChat;
