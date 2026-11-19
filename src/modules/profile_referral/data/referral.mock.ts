/**
 * MSW handlers for the referral slice.
 *
 *   GET /api/mock/profile_referral/programme?locale=   sample code + reward + invited friends
 *
 * The real `ref_code` is read separately from `GET v1/profile/me` and always wins; this handler
 * only supplies what has no backend at all.
 *
 * **Loading:** `src/core/mocks/modules.ts` lazy-imports `src/modules/<name>/data/<name>.mock` for a
 * fixed list of folder names, and `profile_referral` is not on it (`profile` is, but it belongs to
 * another agent). So these handlers are pulled in by a side-effect import from
 * `src/modules/topup/data/topup.mock.ts`, which *is* on the list. `registerMockHandlers` takes any
 * string, so the namespace is still `profile_referral` and `unregisterMockHandlers` /
 * `registeredMockModules` behave normally.
 */
import { http } from 'msw';

import { delay, flagged, mockJson, mockPath, registerMockHandlers } from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

// Deliberately NOT from `../profile_referral.flags`: that module imports `next/navigation`, and
// these handlers must also be loadable under `msw/node` (dev BFF, scripts, Playwright).
import {
  asFixtureLocale,
  programmeFixture,
  REFERRAL_MOCK_MODULE,
  REFERRAL_READ_DELAY_MS,
} from './referral.fixtures';

/**
 * The demo db. Nothing mutates the invite list today (there is no "invite a friend" action beyond
 * sharing the code), but the store exists so the slice follows the mock-module pattern and so a
 * later "accepted invite" demo survives a reload under `ozio.mock.profile_referral`.
 */
const db = createMockDb<{ acceptedAt: string | null }>(REFERRAL_MOCK_MODULE, {
  acceptedAt: null,
});

export const referralHandlers = [
  http.get(mockPath(REFERRAL_MOCK_MODULE, 'programme'), async ({ request }) => {
    const locale = asFixtureLocale(new URL(request.url).searchParams.get('locale'));
    await delay(REFERRAL_READ_DELAY_MS);
    return mockJson({ ...programmeFixture(locale), accepted_at: db.get().acceptedAt });
  }),
];

registerMockHandlers(REFERRAL_MOCK_MODULE, flagged(referralHandlers, 'referral'));
