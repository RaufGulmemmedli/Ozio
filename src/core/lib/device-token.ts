/**
 * Device token — SERVER ONLY (imports `node:crypto`).
 *
 * The API answers 400 "device token" for any `/auth/*` call whose body lacks
 * `device_token`, and the Flutter app sends a stable per-install id as the
 * `Device-Token` header on every request (api/README.md "Headers sent on every
 * request"). Flutter's format is `'ozio-' + 16 random bytes as 32 hex chars`; the web
 * generates the same shape once, server-side, and keeps it in the `ozio_dt` cookie
 * (5 years) so it survives reloads exactly like an install id.
 */
import { randomBytes } from 'node:crypto';

/** Shape shared by `await cookies()` and `NextRequest.cookies` — keeps this file Next-agnostic. */
export interface CookieReader {
  get(name: string): { value: string } | undefined;
}

export const DEVICE_TOKEN_COOKIE = 'ozio_dt';
const DEVICE_TOKEN_RE = /^ozio-[0-9a-f]{32}$/;

/** `ozio-<32 hex>` — identical to the Flutter per-install id. */
export function newDeviceToken(): string {
  return `ozio-${randomBytes(16).toString('hex')}`;
}

/** The stored device token, or `null` when absent/malformed. */
export function readDeviceToken(cookieStore: CookieReader): string | null {
  const value = cookieStore.get(DEVICE_TOKEN_COOKIE)?.value;
  return value && DEVICE_TOKEN_RE.test(value) ? value : null;
}

/**
 * Read the device token, generating one only when there is none (or the stored value
 * is not the expected shape).
 *
 * `created: true` means the caller must persist it on the response —
 * `setDeviceTokenCookie(res, token)` from `server-cookies.ts`. The cookie store is
 * only read here so that one request can never emit two different tokens.
 */
export function ensureDeviceToken(cookieStore: CookieReader): { token: string; created: boolean } {
  const existing = readDeviceToken(cookieStore);
  if (existing) return { token: existing, created: false };
  return { token: newDeviceToken(), created: true };
}
