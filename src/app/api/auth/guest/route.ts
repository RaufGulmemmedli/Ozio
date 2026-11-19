/**
 * `POST /api/auth/guest` — "Davam et (qonaq)" (AU8).
 *
 * There is no guest endpoint: "guest" simply means no token (api/README.md "Guest
 * mode"). So this handler makes no upstream call at all — it only sets the readable
 * `ozio_g=1` marker and a CSRF token, so a guest can still make state-changing BFF
 * calls that the API accepts without a bearer.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { issueCsrf } from '@/core/lib/csrf';
import { ensureDeviceToken } from '@/core/lib/device-token';
import { setCsrfCookie, setDeviceTokenCookie, setGuestCookie } from '@/core/lib/server-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const device = ensureDeviceToken(req.cookies);
  const csrf = issueCsrf();

  const res = NextResponse.json({ status: 'guest' as const, csrf });
  setGuestCookie(res);
  setCsrfCookie(res, csrf);
  if (device.created) setDeviceTokenCookie(res, device.token);
  return res;
}
