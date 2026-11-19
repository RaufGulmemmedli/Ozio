/**
 * ============================================================================================
 *  THE `complete_registration` WIRE SHAPE — the ONE place to correct it.
 * ============================================================================================
 *
 * `POST v1/auth/complete_registration` is **unverified** (`api/auth.md`: never called, because it
 * is state-changing). Unknown on live: the exact body keys (`first_name`/`last_name` vs a single
 * `name`), the `birth_date` wire format, the accepted `gender` values, and the 422 field paths.
 *
 * The BFF (`POST /api/auth/register`) passes the body through **untouched**, so this function is
 * the whole contract. A live capture that contradicts it is a one-line fix here — no view, hook
 * or BFF change.
 *
 * ## The guess, and why
 *
 * `GET v1/profile/me` is live-verified and returns **one `name` string** (no first/last split) and
 * `birth_date` as an ISO datetime at `00:00:00.000Z`. The write side almost certainly mirrors the
 * read side, so:
 *
 *   { name: "Aysel Məmmədova", email: "aysel.m@mail.az", birth_date: "1996-03-14" }
 *
 *  - `name`        — "Ad" + "Soyad" joined with a single space (the form still collects them
 *                    separately, because `qeydiyyat.html` shows two fields).
 *  - `birth_date`  — ISO **date only** (`YYYY-MM-DD`). The profile returns a datetime, but a
 *                    date-only value is the subset every ISO-8601 parser accepts; if live wants
 *                    the full datetime, flip `BIRTH_DATE_WIRE` below to `'iso-datetime'`.
 *  - `email`       — omitted entirely when blank (the design treats it as validated-when-filled).
 *  - `gender`      — **not sent**: the design collects no gender field, and the accepted values
 *                    are unknown (the profile shows `"male"`). `ALTERNATE_BODY` documents it.
 *
 * ## If live rejects this shape
 *
 * Switch `NAME_WIRE` to `'split'` to send `first_name` / `last_name` (what the swagger declares)
 * instead of `name`. Both branches are implemented below, so the correction is one constant.
 */

/** `'single'` → `{ name }` (matches `GET /profile/me`) · `'split'` → `{ first_name, last_name }`. */
const NAME_WIRE: 'single' | 'split' = 'single';

/** `'iso-date'` → `1996-03-14` · `'iso-datetime'` → `1996-03-14T00:00:00.000Z`. */
const BIRTH_DATE_WIRE: 'iso-date' | 'iso-datetime' = 'iso-date';

/**
 * The swagger's declared shape, kept for reference. Not sent today — see the note above.
 *
 * ```json
 * { "first_name": "Aysel", "last_name": "Məmmədova", "email": "…",
 *   "birth_date": "1996-03-14T00:00:00.000Z", "gender": "female" }
 * ```
 */
export const ALTERNATE_BODY_DOC =
  'first_name, last_name, email, birth_date (ISO datetime), gender ("male" | "female")';

/** What the form collects (`qeydiyyat.html`): Ad, Soyad, E-poçt, Doğum tarixi. */
export interface RegistrationDraft {
  firstName: string;
  lastName: string;
  /** Empty string = not provided. */
  email: string;
  /** `GG.AA.İİİİ` exactly as typed, e.g. `14.03.1996`. */
  birthDate: string;
}

/** `14.03.1996` → `1996-03-14`, or `null` when the date is not a real calendar date. */
export function parseBirthDate(input: string): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects 31.02.1996 the way the design's error state does ("Belə tarix mövcud deyil").
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** The body actually sent to `POST /api/auth/register`. */
export function toCompleteRegistrationBody(draft: RegistrationDraft): Record<string, unknown> {
  const first = draft.firstName.trim();
  const last = draft.lastName.trim();
  const email = draft.email.trim();
  const isoDate = parseBirthDate(draft.birthDate);

  const body: Record<string, unknown> = {};

  if (NAME_WIRE === 'single') {
    body.name = [first, last].filter(Boolean).join(' ');
  } else {
    body.first_name = first;
    body.last_name = last;
  }

  if (email) body.email = email;
  if (isoDate) {
    body.birth_date = BIRTH_DATE_WIRE === 'iso-date' ? isoDate : `${isoDate}T00:00:00.000Z`;
  }

  return body;
}

/**
 * Maps the 422 `path` values the server might use back onto the form's own field names, so
 * `applyFieldErrors` can place them. The real paths are unknown, so every plausible spelling is
 * listed; an unknown path falls through and the view shows it in the form-level banner.
 */
export const REGISTRATION_FIELD_PATHS: Record<string, keyof RegistrationDraft> = {
  name: 'firstName',
  first_name: 'firstName',
  firstName: 'firstName',
  last_name: 'lastName',
  lastName: 'lastName',
  email: 'email',
  birth_date: 'birthDate',
  birthDate: 'birthDate',
};
