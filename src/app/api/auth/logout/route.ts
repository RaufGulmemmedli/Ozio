/**
 * `POST /api/auth/logout` — end the session.
 *
 * `POST v1/auth/logout` is `unverified` and Flutter never calls it, so it is
 * best-effort here: failures are ignored. The local state is always cleared
 * (`ozio_at`, `ozio_rt`, `ozio_csrf`) and the guest marker is set, so this handler
 * always answers 200 — sign-out must never be able to fail.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { ensureDeviceToken } from '@/core/lib/device-token';
import {
  COOKIE_NAMES,
  callUpstream,
  clearAuthCookies,
  localeFromCookie,
  setDeviceTokenCookie,
  setGuestCookie,
  upstreamHeaders,
  upstreamUrl,
} from '@/core/lib/server-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAMES.accessToken)?.value ?? null;
  const device = ensureDeviceToken(req.cookies);
  const locale = localeFromCookie(req.cookies.get(COOKIE_NAMES.locale)?.value);

  if (token) {
    // Best effort: the result is deliberately ignored.
    await callUpstream(upstreamUrl('v1', 'auth/logout'), {
      method: 'POST',
      headers: upstreamHeaders({ token, deviceToken: device.token, locale, json: true }),
      body: JSON.stringify({ device_token: device.token }),
      timeoutMs: 5_000,
    });
  }

  const res = NextResponse.json({ status: 'guest' as const, ok: true });
  clearAuthCookies(res);
  setGuestCookie(res);
  if (device.created) setDeviceTokenCookie(res, device.token);
  return res;
}
