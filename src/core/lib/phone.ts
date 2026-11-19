/**
 * Azerbaijani phone helpers.
 *
 * Isomorphic and dependency-free on purpose: the BFF route handlers (server) and the
 * login form (client) both import this file, so it must not touch `node:*`, `next/*`
 * or the DOM.
 *
 * Wire format for the API is E.164 `+994XXXXXXXXX` (api/auth.md: a bad phone gives
 * 422 "The number format is incorrect. (+994XXXXXXXXX)").
 */

/** Azerbaijan dialling code, the only one the API accepts today. */
export const AZ_DIAL_CODE = '+994';
/** Digits of the dialling code, without the `+`. */
export const AZ_DIAL_DIGITS = '994';
/** Significant digits of an AZ mobile number, country code excluded (`50 123 45 67`). */
export const AZ_NATIONAL_LENGTH = 9;

/** Everything that is not 0-9, removed. Safe on `undefined`/`null` input. */
export function digitsOnly(input: string | null | undefined): string {
  return (input ?? '').replace(/\D+/g, '');
}

/**
 * Reduce any user input to the 9 national digits of an AZ number, or `null`.
 *
 * Accepts `50 123 45 67`, `0501234567`, `994501234567`, `+994 50 123 45 67`,
 * `00994501234567`, `(050) 123-45-67`.
 */
export function toNationalDigits(input: string | null | undefined): string | null {
  let digits = digitsOnly(input);
  if (!digits) return null;

  // International prefixes: 00994… / 994…
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length > AZ_NATIONAL_LENGTH && digits.startsWith(AZ_DIAL_DIGITS)) {
    digits = digits.slice(AZ_DIAL_DIGITS.length);
  }
  // National trunk prefix: 050…
  if (digits.length === AZ_NATIONAL_LENGTH + 1 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.length === AZ_NATIONAL_LENGTH ? digits : null;
}

/** True when `input` reduces to exactly 9 national digits that do not start with 0. */
export function isValidAzMobile(input: string | null | undefined): boolean {
  const national = toNationalDigits(input);
  return national !== null && !national.startsWith('0');
}

/**
 * Normalise anything the UI can produce to `+994XXXXXXXXX`, or `null` when the input
 * is not a usable AZ number. Never throws — callers answer 422 on `null`.
 */
export function normalizeToE164(input: string | null | undefined): string | null {
  const national = toNationalDigits(input);
  if (national === null || national.startsWith('0')) return null;
  return `${AZ_DIAL_CODE}${national}`;
}

/**
 * Group national digits the way the design mask does: `50 123 45 67`.
 * Works on partial input too, so it can drive a live input mask.
 */
export function formatAzNational(input: string | null | undefined): string {
  const digits = digitsOnly(input).slice(0, AZ_NATIONAL_LENGTH);
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return parts.filter(Boolean).join(' ');
}

/** Display form of a stored number: `+994 50 123 45 67`. Falls back to the raw input. */
export function formatAzDisplay(input: string | null | undefined): string {
  const national = toNationalDigits(input);
  if (national === null) return (input ?? '').trim();
  return `${AZ_DIAL_CODE} ${formatAzNational(national)}`;
}

/**
 * Privacy mask for anything that may be shown next to a phone number
 * (`+994 50 *** ** 67`). Logs must not contain phone numbers at all — this is for
 * the UI ("code sent to …"), not for logging.
 */
export function maskPhone(input: string | null | undefined): string {
  const national = toNationalDigits(input);
  if (national === null) {
    const digits = digitsOnly(input);
    if (!digits) return '';
    return `${'*'.repeat(Math.max(0, digits.length - 2))}${digits.slice(-2)}`;
  }
  return `${AZ_DIAL_CODE} ${national.slice(0, 2)} *** ** ${national.slice(7, 9)}`;
}
