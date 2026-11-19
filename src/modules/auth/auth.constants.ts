/**
 * Constants for the phone + OTP flow (`screens/auth.md` A1-A5 / AU1-8, `api/auth.md`).
 *
 * Nothing here is server data: every value is either a UI constant taken from the design export
 * or a documented client-side rule. Server-side OTP limits (expiry, attempts, block duration)
 * are **not documented** (api/auth.md: "server limits on resend/attempts are NOT documented"),
 * so no copy in this module claims a specific limit.
 */

/** Cells rendered by `<OtpInput>`. The design export (`otp-kod.html`) shows 6. */
export const OTP_LENGTH = 6;

/**
 * Resend cooldown, client-side only — Flutter `AuthCubit.resendCooldown` (api/auth.md).
 * A `Retry-After` header from the server always wins over this value.
 */
export const RESEND_COOLDOWN_SECONDS = 59;

/** `GET v1/location/cities?country_id=1` — Azerbaijan. The parameter is REQUIRED (400 without). */
export const AZ_COUNTRY_ID = 1;

/** Legacy-card merge (RG8): the card number is 16 digits, masked `#### #### #### ####`. */
export const LEGACY_CARD_LENGTH = 16;

export interface CountryOption {
  /** ISO 3166-1 alpha-2, shown in the flag tag. */
  iso: string;
  dialCode: string;
  /** National significant digits, used for the mask + validation. */
  nationalLength: number;
}

/**
 * Static country list from `giris-olke-kodu-secimi.html` (AU6). The API only accepts
 * `+994XXXXXXXXX` today (422 otherwise), so AZ is the only one that can complete a login —
 * the others are kept because the design shows them, and the form surfaces the server's 422.
 */
export const COUNTRIES: readonly CountryOption[] = [
  { iso: 'AZ', dialCode: '+994', nationalLength: 9 },
  { iso: 'TR', dialCode: '+90', nationalLength: 10 },
  { iso: 'GE', dialCode: '+995', nationalLength: 9 },
  { iso: 'RU', dialCode: '+7', nationalLength: 10 },
  { iso: 'UA', dialCode: '+380', nationalLength: 9 },
] as const;

export const DEFAULT_COUNTRY: CountryOption = COUNTRIES[0]!;

export function countryByIso(iso: string): CountryOption {
  return COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_COUNTRY;
}
