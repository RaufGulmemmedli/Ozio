/**
 * `GET /api/auth/session` — the one source of truth for the client session store.
 *
 * Never cached (`cache: 'no-store'` on both sides). With an `ozio_at` cookie it reads
 * `GET v1/profile/me` (live-verified) and maps it to a small `UserSummary`.
 *
 * `profile/me` returns **exactly** `id, name, phone, bonus_cards[], birth_date,
 * ref_code, gender, is_registered, cities, active_orders` — there is no email, no
 * avatar and no loyalty tier on live, so none are invented here.
 *
 * A 401 means the cookie is dead → cookies are cleared and the answer is
 * `{ status: 'guest' }`. Any other upstream failure keeps the session as
 * authenticated with `user: null` so a gateway hiccup does not sign the user out.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isValidCsrf, issueCsrf } from '@/core/lib/csrf';
import { ensureDeviceToken } from '@/core/lib/device-token';
import {
  COOKIE_NAMES,
  callUpstream,
  clearAuthCookies,
  envelopeData,
  localeFromCookie,
  setCsrfCookie,
  setDeviceTokenCookie,
  setGuestCookie,
  upstreamHeaders,
  upstreamUrl,
} from '@/core/lib/server-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Mirrored by `core/session` (F4). Only fields `GET v1/profile/me` really returns. */
export interface UserSummary {
  id: number | null;
  /** Full name as one string — live has no first/last split. */
  name: string | null;
  /** E.164. */
  phone: string | null;
  isRegistered: boolean;
  gender: string | null;
  /** Date part only (`YYYY-MM-DD`); live sends an ISO datetime at 00:00:00.000Z. */
  birthDate: string | null;
  refCode: string | null;
  /** Spendable bonus balance in AZN (the "Ozio balance"), from the first bonus card. */
  bonus: number | null;
  /** Lifetime bonus earned, from the first bonus card. */
  bonusTotal: number | null;
  /** Digits only. */
  cardNumber: string | null;
  activeOrderCount: number;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Money arrives as a decimal string on some rows and a number on others. */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toUserSummary(data: unknown): UserSummary | null {
  const row = record(data);
  if (!row) return null;

  const cards = Array.isArray(row.bonus_cards) ? row.bonus_cards : [];
  const card = record(cards[0]);
  const birthDate = toText(row.birth_date);

  return {
    id: typeof row.id === 'number' ? row.id : toNumber(row.id),
    name: toText(row.name),
    phone: toText(row.phone),
    isRegistered: row.is_registered === false ? false : true,
    gender: toText(row.gender),
    birthDate: birthDate ? birthDate.slice(0, 10) : null,
    refCode: toText(row.ref_code),
    bonus: card ? toNumber(card.bonus) : null,
    bonusTotal: card ? toNumber(card.total) : null,
    cardNumber: card ? toText(card.card_number) : null,
    activeOrderCount: Array.isArray(row.active_orders) ? row.active_orders.length : 0,
  };
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAMES.accessToken)?.value ?? null;
  const existingCsrf = req.cookies.get(COOKIE_NAMES.csrf)?.value ?? null;
  // Reuse a valid token so parallel hydrations do not rotate it under each other.
  const csrf = isValidCsrf(existingCsrf) ? (existingCsrf as string) : issueCsrf();
  const device = ensureDeviceToken(req.cookies);

  const answer = (body: Record<string, unknown>, init?: { clear?: boolean; guest?: boolean }) => {
    const res = NextResponse.json({ ...body, csrf }, { headers: { 'cache-control': 'no-store' } });
    if (init?.clear) clearAuthCookies(res);
    if (init?.guest) setGuestCookie(res);
    setCsrfCookie(res, csrf);
    if (device.created) setDeviceTokenCookie(res, device.token);
    return res;
  };

  if (!token) return answer({ status: 'guest' });

  const locale = localeFromCookie(req.cookies.get(COOKIE_NAMES.locale)?.value);
  const result = await callUpstream(upstreamUrl('v1', 'profile/me'), {
    method: 'GET',
    headers: upstreamHeaders({ token, deviceToken: device.token, locale }),
    timeoutMs: 10_000,
  });

  if (result.status === 401 || result.status === 403) {
    const res = answer({ status: 'guest' }, { clear: true, guest: true });
    res.headers.set('x-ozio-session', 'expired');
    return res;
  }

  if (!result.ok) {
    // Transport/5xx: the cookie may still be good — stay signed in without a profile.
    return answer({ status: 'authenticated', user: null });
  }

  return answer({ status: 'authenticated', user: toUserSummary(envelopeData(result.json)) });
}
