/**
 * Demo fixtures for the referral slice — everything drawn in `referral.html` except the code
 * itself, which prefers the real `ref_code` when the profile has one.
 *
 * The sample code is the one in the design export (`OZIO-NQ4821`) rather than
 * `mock-contracts.ts`'s `OZIO-DEMO`: the export is the pixel truth for this screen and the hero
 * renders at 56/800, where the two strings sit differently. Both are samples either way.
 *
 * The three friends, their statuses and the 3 ₼ reward are also straight from the export. az/ru/en
 * per BUILD-CONTRACT "Mock modules"; only the name initials and the street words differ.
 */

/**
 * The MSW namespace: every mock call goes to `/api/mock/profile_referral/…`.
 *
 * It lives here, not in `profile_referral.flags.ts`, because the flags module imports
 * `next/navigation` for `notFound()`. The handler file must stay free of Next client imports so
 * the same handlers can also run under `msw/node` (the BFF in dev, scripts, Playwright);
 * `profile_referral.flags.ts` re-exports this constant so callers still have one name for it.
 */
export const REFERRAL_MOCK_MODULE = 'profile_referral';

export type FixtureLocale = 'az' | 'ru' | 'en';

const LOCALES: readonly FixtureLocale[] = ['az', 'ru', 'en'];

export const asFixtureLocale = (raw: string | null | undefined): FixtureLocale => {
  const value = (raw ?? '').slice(0, 2).toLowerCase();
  return LOCALES.includes(value as FixtureLocale) ? (value as FixtureLocale) : 'az';
};

/** The code shown when `GET v1/profile/me.ref_code` is null — as it is on live. */
export const SAMPLE_REF_CODE = 'OZIO-NQ4821';

/** AZN per successful invite, drawn on the third step card. */
export const REWARD_PER_INVITE = 3;

const INVITED: Record<
  FixtureLocale,
  ReadonlyArray<{ id: string; name: string; status: 'rewarded' | 'pending'; reward: number }>
> = {
  az: [
    { id: 'aysel', name: 'Aysel M.', status: 'rewarded', reward: 3 },
    { id: 'rauf', name: 'Rauf H.', status: 'rewarded', reward: 3 },
    { id: 'leyla', name: 'Leyla Ə.', status: 'pending', reward: 0 },
  ],
  ru: [
    { id: 'aysel', name: 'Айсель М.', status: 'rewarded', reward: 3 },
    { id: 'rauf', name: 'Рауф Г.', status: 'rewarded', reward: 3 },
    { id: 'leyla', name: 'Лейла А.', status: 'pending', reward: 0 },
  ],
  en: [
    { id: 'aysel', name: 'Aysel M.', status: 'rewarded', reward: 3 },
    { id: 'rauf', name: 'Rauf H.', status: 'rewarded', reward: 3 },
    { id: 'leyla', name: 'Leyla A.', status: 'pending', reward: 0 },
  ],
};

/** The wire shape of `GET /api/mock/profile_referral/programme?locale=`. */
export const programmeFixture = (locale: FixtureLocale) => ({
  sample_code: SAMPLE_REF_CODE,
  reward_per_invite: REWARD_PER_INVITE,
  invited: INVITED[locale],
});

export const REFERRAL_READ_DELAY_MS = 600;
