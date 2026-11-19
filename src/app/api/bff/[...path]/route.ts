/**
 * BFF proxy — the only way the browser reaches the Ozio API.
 *
 * `/api/bff/<version>/<upstream path>` → `https://api.ozio10.az/<prefix>/<path>` with
 * `v1 → /customer/api/v1`, `v2 → /customer/api/v2`, `notifications → /notification/api/v1`.
 *
 * Why it exists: CORS on `api.ozio10.az` is unverified (api/README.md), and the access
 * token lives in an httpOnly cookie, so the token never reaches JS. This handler
 * attaches `Authorization`, `Accept`, `Accept-Language` and `Device-Token`, injects
 * `device_token` into `v1/auth/*` bodies (the API answers 400 without it), runs the
 * single-flight refresh-on-401 from architecture/03-auth-session.md, and otherwise
 * passes the upstream status and body through untouched — including the non-JSON ones
 * (429 is plain text `too many requests`, unknown routes answer Express HTML).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { CSRF_HEADER, verifyCsrf } from '@/core/lib/csrf';
import { ensureDeviceToken } from '@/core/lib/device-token';
import {
  COOKIE_NAMES,
  UPSTREAM_TIMEOUT_MS,
  bffError,
  clearAuthCookies,
  isApiVersion,
  localeFromCookie,
  parseAuthBundle,
  setAuthCookies,
  setDeviceTokenCookie,
  upstreamUrl,
  type AuthBundle,
} from '@/core/lib/server-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Serverless wall-clock budget, in seconds (Vercel reads this per route).
 *
 * `UPSTREAM_TIMEOUT_MS` is 25 s because the catalogue genuinely needs it: measured against
 * `api.ozio10.az`, `stores/{id}/products` without a `category_id` answers in 15 s at `limit=4` and
 * times out the gateway at `limit=20`. A Vercel function defaults to 10 s (Hobby) / 15 s (Pro), so
 * without this the platform would kill the request BEFORE the proxy's own timeout and the browser
 * would see a 504 with nothing to retry on.
 *
 * 30 leaves a margin over the 25 s abort, so a slow upstream still comes back as this proxy's own
 * `gatewayTimeout` Failure — which the screens know how to render — instead of a platform error.
 * Hobby caps `maxDuration` at 60, so this is within every plan.
 */
export const maxDuration = 30;

/** Paths where a 401 is a legitimate answer (wrong OTP, unknown phone) — never refresh. */
const REFRESH_EXEMPT = ['auth/login', 'auth/otp_verify', 'auth/refresh'];

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Hop-by-hop and identity headers that must not be forwarded or echoed back. */
const DROP_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-encoding',
  'content-length',
  'set-cookie',
  'access-control-allow-origin',
  'access-control-allow-credentials',
]);

// ---------------------------------------------------------------------------
// Logging — structured, never any token / phone / OTP / cookie / Authorization
// ---------------------------------------------------------------------------

function log(level: 'info' | 'warn' | 'error', method: string, route: string, status: number, upstreamMs: number) {
  if (process.env.DEBUG_API_LOG !== '1') return;
  // Only the method, the upstream route (no query string: it can carry user data),
  // the status and the duration. Bodies and headers are never logged.
  console.info(JSON.stringify({ level, method, route, status, upstream_ms: upstreamMs }));
}

function levelFor(status: number): 'info' | 'warn' | 'error' {
  if (status >= 500 || status === 0) return 'error';
  if (status >= 400) return 'warn';
  return 'info';
}

// ---------------------------------------------------------------------------
// Single-flight refresh (mirrors the Flutter dio `_refreshing` flag)
// ---------------------------------------------------------------------------

type RefreshOutcome =
  | { ok: true; bundle: AuthBundle }
  | { ok: false; reason: 'no-refresh-token' | 'rejected' | 'transport' };

/** Module-level so concurrent 401s join the same refresh instead of stampeding. */
let refreshInFlight: Promise<RefreshOutcome> | null = null;

async function doRefresh(refreshToken: string, deviceToken: string): Promise<RefreshOutcome> {
  try {
    const response = await fetch(upstreamUrl('v1', 'auth/refresh'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Device-Token': deviceToken,
      },
      body: JSON.stringify({ refresh_token: refreshToken, device_token: deviceToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false, reason: 'rejected' };
    const text = await response.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, reason: 'rejected' };
    }
    const bundle = parseAuthBundle(json);
    // A 2xx without an access token is not a refresh.
    return bundle ? { ok: true, bundle } : { ok: false, reason: 'rejected' };
  } catch {
    return { ok: false, reason: 'transport' };
  }
}

/**
 * At most one refresh at a time. With no refresh cookie this resolves immediately with
 * `no-refresh-token` — the common live case, since the login bundle has never carried a
 * `refresh_token` (api/auth.md). That is a clean "sign out", not an error cascade: no
 * upstream call is made and the caller answers 401 + `x-ozio-session: expired`.
 */
function refreshOnce(refreshToken: string | null, deviceToken: string): Promise<RefreshOutcome> {
  if (!refreshToken) return Promise.resolve({ ok: false, reason: 'no-refresh-token' });
  if (refreshInFlight) return refreshInFlight;

  const pending = doRefresh(refreshToken, deviceToken).finally(() => {
    if (refreshInFlight === pending) refreshInFlight = null;
  });
  refreshInFlight = pending;
  return pending;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

function jsonError(status: number, body: ReturnType<typeof bffError>): NextResponse {
  return NextResponse.json(body, { status });
}

/** Session is gone: drop the cookies and let the client open <SessionExpiredDialog>. */
function expiredResponse(): NextResponse {
  const res = jsonError(401, bffError('unauthorized', 401, 'Unauthorized access'));
  res.headers.set('x-ozio-session', 'expired');
  clearAuthCookies(res);
  return res;
}

interface UpstreamCall {
  status: number;
  body: ArrayBuffer | null;
  headers: Headers | null;
  transport: 'network' | 'timeout' | null;
  ms: number;
}

async function send(url: string, method: string, headers: Record<string, string>, body?: string): Promise<UpstreamCall> {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const buffer = response.status === 204 || response.status === 304 ? null : await response.arrayBuffer();
    return { status: response.status, body: buffer, headers: response.headers, transport: null, ms: Date.now() - startedAt };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return {
      status: 0,
      body: null,
      headers: null,
      transport: timedOut ? 'timeout' : 'network',
      ms: Date.now() - startedAt,
    };
  }
}

/** Pass the upstream answer through verbatim: same status, same bytes, same content type. */
function passthrough(call: UpstreamCall): NextResponse {
  const headers = new Headers();
  if (call.headers) {
    for (const [name, value] of call.headers.entries()) {
      if (!DROP_RESPONSE_HEADERS.has(name.toLowerCase())) headers.set(name, value);
    }
  }
  if (!headers.has('content-type')) headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new NextResponse(call.body, { status: call.status, headers });
}

function transportResponse(call: UpstreamCall): NextResponse {
  const timeout = call.transport === 'timeout';
  return jsonError(
    timeout ? 504 : 502,
    bffError(timeout ? 'timeout' : 'network', timeout ? 504 : 502),
  );
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
  method: string,
): Promise<NextResponse> {
  const { path } = await ctx.params; // `params` is a Promise in Next 15+
  const segments = path ?? [];
  const [version, ...rest] = segments;

  if (!isApiVersion(version)) {
    return jsonError(
      400,
      bffError('validation', 400, `Unknown API version "${version ?? ''}". Use v1, v2 or notifications.`),
    );
  }

  const upstreamPath = rest.map((segment) => encodeURIComponent(segment)).join('/');
  const route = `${version}/${upstreamPath}`;

  // --- CSRF: double submit on every state-changing call (03-auth-session.md) -------
  if (STATE_CHANGING.has(method)) {
    const header = req.headers.get(CSRF_HEADER);
    const cookie = req.cookies.get(COOKIE_NAMES.csrf)?.value;
    if (!verifyCsrf(header, cookie)) {
      log('warn', method, route, 403, 0);
      return jsonError(403, bffError('forbidden', 403, 'CSRF token missing or invalid'));
    }
  }

  const token = req.cookies.get(COOKIE_NAMES.accessToken)?.value ?? null;
  const refreshToken = req.cookies.get(COOKIE_NAMES.refreshToken)?.value ?? null;
  const locale = localeFromCookie(req.cookies.get(COOKIE_NAMES.locale)?.value);
  const device = ensureDeviceToken(req.cookies);

  // --- body: read once, so the replay can reuse it ---------------------------------
  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const raw = await req.text();
    body = raw.length > 0 ? raw : undefined;
  }

  // `device_token` is mandatory in every v1/auth/* body (400 "device token" otherwise).
  let rewroteBodyAsJson = false;
  const isAuthPath = version === 'v1' && rest[0] === 'auth';
  if (isAuthPath && method !== 'GET') {
    let parsed: Record<string, unknown> = {};
    if (body) {
      try {
        const candidate = JSON.parse(body) as unknown;
        if (typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate)) {
          parsed = candidate as Record<string, unknown>;
        }
      } catch {
        parsed = {}; // not JSON: replace with a body that at least carries the device token
      }
    }
    body = JSON.stringify({ ...parsed, device_token: device.token });
    rewroteBodyAsJson = true;
  }

  const headers = (bearer: string | null): Record<string, string> => {
    const out: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Language': locale,
      'Device-Token': device.token,
    };
    if (bearer) out.Authorization = `Bearer ${bearer}`;
    if (body !== undefined) {
      // A rewritten auth body is always JSON, whatever the client declared.
      out['Content-Type'] = rewroteBodyAsJson ? 'application/json' : (req.headers.get('content-type') ?? 'application/json');
    }
    return out;
  };

  const url = upstreamUrl(version, upstreamPath, req.nextUrl.search);

  const finish = (res: NextResponse, status: number, ms: number): NextResponse => {
    if (device.created) setDeviceTokenCookie(res, device.token);
    log(levelFor(status), method, route, status, ms);
    return res;
  };

  // --- first attempt ---------------------------------------------------------------
  const first = await send(url, method, headers(token), body);
  if (first.transport) {
    const res = transportResponse(first);
    return finish(res, res.status, first.ms);
  }

  const refreshable = first.status === 401 && token !== null && !REFRESH_EXEMPT.includes(upstreamPath);
  if (!refreshable) return finish(passthrough(first), first.status, first.ms);

  // --- refresh on 401 --------------------------------------------------------------
  const outcome = await refreshOnce(refreshToken, device.token);
  if (!outcome.ok) {
    // No refresh token (the live case), refresh rejected, or refresh offline:
    // one clean sign-out, no retry loop.
    return finish(expiredResponse(), 401, first.ms);
  }

  // --- replay exactly once (never marked replayable again) -------------------------
  const replay = await send(url, method, headers(outcome.bundle.accessToken), body);
  if (replay.transport) {
    // Offline/timeout during the replay surfaces as itself, not as the stale 401.
    const res = transportResponse(replay);
    setAuthCookies(res, outcome.bundle);
    return finish(res, res.status, first.ms + replay.ms);
  }
  if (replay.status === 401) {
    return finish(expiredResponse(), 401, first.ms + replay.ms);
  }

  const res = passthrough(replay);
  setAuthCookies(res, outcome.bundle);
  return finish(res, replay.status, first.ms + replay.ms);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx, 'GET');
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx, 'POST');
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx, 'PUT');
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx, 'PATCH');
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx, 'DELETE');
}
