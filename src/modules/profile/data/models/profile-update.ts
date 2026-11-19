/**
 * THE one place that knows the `PUT v1/profile/me` request body.
 *
 * ──────────────────────────────────────────────────────────────────────────────────────────────
 *  `PUT v1/profile/me` is **UNVERIFIED** (api/profile.md, checked 2026-11-11). It has never been
 *  called, and the APK-era swagger body (`ProfileUpdate`) uses keys that do **not** match what the
 *  verified GET returns:
 *
 *     swagger guess : person_name, display_name, email, gender, birth_date, phone_number, image_url
 *     verified GET  : id, name, phone, bonus_cards[], birth_date, ref_code, gender, is_registered,
 *                     cities, active_orders
 *
 *  Unknown: which keys the server accepts, which fields are editable at all (phone? birth_date
 *  once set?), the `birth_date` wire format, the accepted `gender` values, whether a partial body
 *  is allowed, and the response.
 *
 *  THE GUESS BUILT BELOW — derived from the verified GET shape, not from the APK:
 *
 *     { "name": "Nurlan Əliyev", "birth_date": "1994-03-14", "gender": "male" }
 *
 *  plus, only because the swagger asks for them and a server that ignores unknown keys costs us
 *  nothing, the APK aliases for the same three values (`person_name`, `display_name`). `email`,
 *  `phone_number` and `image_url` are NOT sent: the profile has no home for an email or an avatar,
 *  and the phone is immutable (the design marks it read-only, "contact support to change it").
 *
 *  When the real contract is confirmed, this file is the only edit.
 * ──────────────────────────────────────────────────────────────────────────────────────────────
 */
import type { Gender } from './profile';

export interface ProfileEditValues {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  gender: Gender;
}

/** Wire values for `gender`. Live GET returned `"male"`; `""` clears it (also a guess). */
const GENDER_WIRE: Record<Gender, string> = {
  male: 'male',
  female: 'female',
  unspecified: '',
};

export const genderToWire = (gender: Gender): string => GENDER_WIRE[gender];

/**
 * `birth_date` wire format guess: `YYYY-MM-DD` (what Flutter sends). The GET answers an ISO
 * datetime at `00:00:00.000Z`, so a server that wants the full datetime would also accept this
 * date — but that is unproven.
 */
export function birthDateToWire(isoDate: string | null): string | undefined {
  if (!isoDate) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}

/** The body as this client sends it. `Record<string, unknown>` — the schema is a guess. */
export function buildProfileUpdateBody(values: ProfileEditValues): Record<string, unknown> {
  const name = [values.firstName.trim(), values.lastName.trim()].filter(Boolean).join(' ');
  const birthDate = birthDateToWire(values.birthDate);

  const body: Record<string, unknown> = {
    // Primary keys: exactly what the verified GET returns.
    name,
    gender: genderToWire(values.gender),
    // APK aliases for the same name, in case the writer still reads the old keys.
    person_name: name,
    display_name: name,
  };
  if (birthDate !== undefined) body.birth_date = birthDate;
  return body;
}

/**
 * Maps a 422 `fieldErrors` path onto a form field name. The server's paths are unknown, so every
 * plausible alias for the three values we send is accepted.
 */
export function mapFieldErrorPath(path: string): keyof ProfileEditValues | null {
  const key = path.split('.').pop()?.toLowerCase() ?? '';
  switch (key) {
    case 'name':
    case 'person_name':
    case 'personname':
    case 'display_name':
    case 'displayname':
    case 'full_name':
    case 'first_name':
      return 'firstName';
    case 'last_name':
    case 'lastname':
    case 'surname':
      return 'lastName';
    case 'birth_date':
    case 'birthdate':
      return 'birthDate';
    case 'gender':
      return 'gender';
    default:
      return null;
  }
}
