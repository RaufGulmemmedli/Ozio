/**
 * `POST /api/auth/register` — finish registration for a new account.
 *
 * Body passthrough to `POST v1/auth/complete_registration` (bearer), with
 * `device_token` injected like every other `/auth/*` call. The upstream body keys are
 * **unverified** (api/auth.md: first_name/last_name vs a single `name`, the
 * `birth_date` wire format and the accepted `gender` values are all unknown), so this
 * handler does not reshape the body: whatever the form sends is forwarded, and the
 * upstream 422 `data: [{path, message}]` comes back unchanged so the form can map
 * field errors. Success is only claimed on a 2xx with `success !== false`.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { ensureDeviceToken } from '@/core/lib/device-token';
import {
  COOKIE_NAMES,
  bffError,
  callUpstream,
  failureFromUpstream,
  localeFromCookie,
  parseAuthBundle,
  setAuthCookies,
  setDeviceTokenCookie,
  upstreamHeaders,
  upstreamUrl,
} from '@/core/lib/server-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAMES.accessToken)?.value ?? null;
  if (!token) {
    const res = NextResponse.json(bffError('unauthorized', 401, 'Unauthorized access'), { status: 401 });
    res.headers.set('x-ozio-session', 'expired');
    return res;
  }

  let payload: Record<string, unknown> = {};
  try {
    const parsed = (await req.json()) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    payload = {};
  }

  const device = ensureDeviceToken(req.cookies);
  const locale = localeFromCookie(req.cookies.get(COOKIE_NAMES.locale)?.value);

  const result = await callUpstream(upstreamUrl('v1', 'auth/complete_registration'), {
    method: 'POST',
    headers: upstreamHeaders({ token, deviceToken: device.token, locale, json: true }),
    body: JSON.stringify({ ...payload, device_token: device.token }),
  });

  if (!result.ok) {
    const failure = failureFromUpstream(result);
    const res = NextResponse.json(failure.body, { status: failure.status });
    if (result.status === 401) res.headers.set('x-ozio-session', 'expired');
    if (device.created) setDeviceTokenCookie(res, device.token);
    return res;
  }

  // The operation is `unverified`: a 2xx may still carry a refreshed bundle, so rotate
  // the cookies when it does, but never require one.
  const res = NextResponse.json({ ok: true, status: 'authenticated' as const, needsRegistration: false });
  const bundle = parseAuthBundle(result.json);
  if (bundle) setAuthCookies(res, bundle);
  if (device.created) setDeviceTokenCookie(res, device.token);
  return res;
}
