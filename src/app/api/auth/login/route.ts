/**
 * `POST /api/auth/login` — start login, server sends the OTP SMS.
 *
 * Body: `{ phone }` in any shape the UI mask produces. The phone is normalised to
 * E.164 `+994XXXXXXXXX` **server-side** (the API answers 422 "The number format is
 * incorrect. (+994XXXXXXXXX)" otherwise) and `device_token` is injected — upstream is
 * `POST v1/auth/login {phone, device_token}` (verified).
 *
 * Answers `{ ok: true }` or the failure body; it never returns a token.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { normalizeToE164 } from '@/core/lib/phone';
import { ensureDeviceToken } from '@/core/lib/device-token';
import {
  COOKIE_NAMES,
  bffError,
  callUpstream,
  failureFromUpstream,
  localeFromCookie,
  setDeviceTokenCookie,
  upstreamHeaders,
  upstreamUrl,
} from '@/core/lib/server-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const rawPhone =
    typeof payload === 'object' && payload !== null && 'phone' in payload
      ? (payload as { phone?: unknown }).phone
      : null;

  const phone = normalizeToE164(typeof rawPhone === 'string' ? rawPhone : null);
  if (!phone) {
    return NextResponse.json(
      bffError('validation', 422, 'The number format is incorrect. (+994XXXXXXXXX)', {
        fieldErrors: [{ path: 'phone', message: 'The number format is incorrect. (+994XXXXXXXXX)' }],
      }),
      { status: 422 },
    );
  }

  const device = ensureDeviceToken(req.cookies);
  const locale = localeFromCookie(req.cookies.get(COOKIE_NAMES.locale)?.value);

  const result = await callUpstream(upstreamUrl('v1', 'auth/login'), {
    method: 'POST',
    headers: upstreamHeaders({ deviceToken: device.token, locale, json: true }),
    body: JSON.stringify({ phone, device_token: device.token }),
  });

  const res = result.ok
    ? NextResponse.json({ ok: true })
    : (() => {
        const failure = failureFromUpstream(result);
        return NextResponse.json(failure.body, { status: failure.status });
      })();

  if (device.created) setDeviceTokenCookie(res, device.token);
  return res;
}
