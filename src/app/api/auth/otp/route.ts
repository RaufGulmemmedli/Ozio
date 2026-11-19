/**
 * `POST /api/auth/otp` — verify the SMS code and open the session.
 *
 * Body: `{ phone, code }`. Upstream is `POST v1/auth/otp_verify {phone, otp,
 * device_token}` — the wire key is **`otp`**, not `code` (api/auth.md).
 *
 * On success the tokens are written to httpOnly cookies and the client gets
 * `{ status: 'authenticated', needsRegistration }` and nothing else: no token ever
 * reaches the browser (architecture/03-auth-session.md).
 *
 * Error mapping (Flutter parity): 429 → `rateLimited` ("attempt limit"),
 * 400/401/422 → `wrongCode` with the server's own message.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { issueCsrf } from '@/core/lib/csrf';
import { ensureDeviceToken } from '@/core/lib/device-token';
import { normalizeToE164 } from '@/core/lib/phone';
import {
  COOKIE_NAMES,
  bffError,
  callUpstream,
  envelopeData,
  failureFromUpstream,
  localeFromCookie,
  parseAuthBundle,
  setAuthCookies,
  setCsrfCookie,
  setDeviceTokenCookie,
  upstreamHeaders,
  upstreamUrl,
} from '@/core/lib/server-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * `is_registered` when the bundle omits the flag: read it from `GET v1/profile/me`
 * (live-verified), exactly like the Flutter `auth_repository`. If that call fails we
 * fall back to Flutter's default of `true` — i.e. do not push an existing user through
 * registration because of a transport hiccup.
 */
async function isRegisteredFromProfile(token: string, deviceToken: string, locale: string): Promise<boolean> {
  const result = await callUpstream(upstreamUrl('v1', 'profile/me'), {
    method: 'GET',
    headers: upstreamHeaders({ token, deviceToken, locale }),
    timeoutMs: 10_000,
  });
  if (!result.ok) return true;
  const data = envelopeData(result.json);
  if (typeof data === 'object' && data !== null && 'is_registered' in data) {
    const flag = (data as { is_registered?: unknown }).is_registered;
    if (typeof flag === 'boolean') return flag;
  }
  return true;
}

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown> = {};
  try {
    const parsed = (await req.json()) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    payload = {};
  }

  const phone = normalizeToE164(typeof payload.phone === 'string' ? payload.phone : null);
  const rawCode = payload.code ?? payload.otp;
  const code = typeof rawCode === 'string' ? rawCode.trim() : typeof rawCode === 'number' ? String(rawCode) : '';

  const fieldErrors = [
    ...(phone ? [] : [{ path: 'phone', message: 'The number format is incorrect. (+994XXXXXXXXX)' }]),
    ...(code ? [] : [{ path: 'code', message: 'Code is required' }]),
  ];
  if (fieldErrors.length > 0) {
    return NextResponse.json(bffError('validation', 422, 'Validation failed', { fieldErrors }), { status: 422 });
  }

  const device = ensureDeviceToken(req.cookies);
  const locale = localeFromCookie(req.cookies.get(COOKIE_NAMES.locale)?.value);

  const result = await callUpstream(upstreamUrl('v1', 'auth/otp_verify'), {
    method: 'POST',
    headers: upstreamHeaders({ deviceToken: device.token, locale, json: true }),
    body: JSON.stringify({ phone, otp: code, device_token: device.token }),
  });

  if (!result.ok) {
    const failure = failureFromUpstream(result, {
      kind:
        result.status === 429
          ? 'rateLimited'
          : result.status === 400 || result.status === 401 || result.status === 422
            ? 'wrongCode'
            : undefined,
    });
    const res = NextResponse.json(failure.body, { status: failure.status });
    if (device.created) setDeviceTokenCookie(res, device.token);
    return res;
  }

  const bundle = parseAuthBundle(result.json);
  if (!bundle) {
    // A 2xx without an access token is NOT a login (api/auth.md "Bundle location tolerance").
    const res = NextResponse.json(bffError('parse', 502, 'Login response did not contain a token'), { status: 502 });
    if (device.created) setDeviceTokenCookie(res, device.token);
    return res;
  }

  const needsRegistration =
    bundle.isRegistered === null
      ? !(await isRegisteredFromProfile(bundle.accessToken, bundle.deviceToken ?? device.token, locale))
      : !bundle.isRegistered;

  const res = NextResponse.json({ status: 'authenticated' as const, needsRegistration });
  setAuthCookies(res, bundle); // ozio_at (+ ozio_rt when present), ozio_dt, clears ozio_g
  if (!bundle.deviceToken) setDeviceTokenCookie(res, device.token);
  setCsrfCookie(res, issueCsrf());
  return res;
}
