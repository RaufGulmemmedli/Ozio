/**
 * `@/modules/profile_referral` — the referral / "Dostunu gətir" slice. Other modules import
 * **only** from here.
 *
 * It owns one route, `/invite`, gated by `NEXT_PUBLIC_FEATURE_REFERRAL`.
 *
 * ### Why it is not in `src/modules/profile/`
 *
 * `02-routing.md` files `/invite` under the `profile` module, but that folder belongs to another
 * agent, so this slice lives on its own. The only consequence is how its MSW handlers load — see
 * `profile_referral.flags.ts` and `data/referral.mock.ts`: the loader in `src/core/mocks/modules.ts`
 * does not know the name `profile_referral`, so the handlers are pulled in by a side-effect import
 * from `src/modules/topup/data/topup.mock.ts`, which it does know. The MSW namespace is still
 * `/api/mock/profile_referral/…`.
 *
 * ### What is real and what is not
 *
 * | part | source |
 * | --- | --- |
 * | the invite code | **REAL** `GET v1/profile/me.ref_code` — **null on live**, so the mock's sample code is used and labelled |
 * | invite list, progress, reward amount | **MOCK** `/api/mock/profile_referral/programme` — there is no referral API at all |
 *
 * `referral-unavailable.html` is therefore a first-class state, not an edge case.
 *
 * Two icons in the design (`send`, `user-plus` on the step cards, and `rotate-cw` on the retry
 * button) are not exported by `@/shared/lucide`; the nearest exported glyphs stand in, and the
 * retry button ships without one.
 */

/* ------------------------------------------------------------------ entry point */
export { ReferralEntryTile, type ReferralEntryTileProps } from './components/referral-entry-tile';

/* ------------------------------------------------------------------ route view */
export { InviteView } from './view/invite-view';
export { InviteSkeleton } from './view/invite-skeleton';
export { ReferralUnavailable, type ReferralUnavailableProps } from './view/referral-unavailable';

/* ------------------------------------------------------------------ flags + routes */
export {
  REFERRAL_FLAG,
  REFERRAL_MOCK_MODULE,
  assertReferralEnabled,
  referralEnabled,
} from './profile_referral.flags';
export { referralRoutes, type ReferralRoute } from './profile_referral.routes';
export { referralKeys } from './profile_referral.query-keys';

/* ------------------------------------------------------------------ domain types */
export {
  type CodeSource,
  type InvitedFriend,
  type InvitedStatus,
  type Referral,
  type ReferralProgramme,
} from './data/models/referral';
export { SAMPLE_REF_CODE } from './data/referral.fixtures';
