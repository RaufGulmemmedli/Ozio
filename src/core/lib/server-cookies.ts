/**
 * Session cookies and upstream plumbing — SERVER ONLY.
 *
 * This is the single place where cookie names, lifetimes and flags are defined
 * (architecture/03-auth-session.md "Decision" + "Security checklist"); no route handler
 * hardcodes them. It also carries the few upstream helpers the `/api/auth/*` handlers
 * share (URL building, a tolerant JSON call, envelope/failure mapping) so those four
 * handlers cannot drift apart.
 *
 * Cookie table (also in docs/BFF.md):
 *   ozio_at    access token   httpOnly, Secure*, SameSite=Lax, Path=/            TTL from `expires_at`
 *   ozio_rt    refresh token  httpOnly, Secure*, SameSite=Lax, Path=/api/auth    30 d
 *   ozio_dt    device token   httpOnly, Secure*, SameSite=Lax, Path=/             5 y
 *   ozio_g     guest marker   readable, SameSite=Lax, Path=/                      1 y
 *   ozio_csrf  CSRF token     readable, SameSite=Lax, Path=/                      = access TTL
 *   (*) Secure only when SESSION_COOKIE_SECURE=1, so http://localhost works in dev.
 */
import type { NextResponse } from 'next/server';
import { CSRF_COOKIE } from './csrf';
import { DEVICE_TOKEN_COOKIE } from './device-token';

export const COOKIE_NAMES = {
  accessToken: 'ozio_at',
  refreshToken: 'ozio_rt',
  deviceToken: DEVICE_TOKEN_COOKIE,
  guest: 'ozio_g',
  csrf: CSRF_COOKIE,
  /** next-intl's locale cookie — read (never written) here, for `Accept-Language`. */
  locale: 'NEXT_LOCALE',
} as const;

const DAY = 60 * 60 * 24;

export const COOKIE_MAX_AGE = {
  /** Fallback access-token lifetime: the API documents no TTL, `expires_at` is used when present. */
  accessToken: 7 * DAY,
  refreshToken: 30 * DAY,
  deviceToken: 5 * 365 * DAY,
  guest: 365 * DAY,
  csrf: 7 * DAY,
} as const;

/** `ozio_rt` never leaves the auth handlers; the BFF reads it from the request only. */
export const REFRESH_COOKIE_PATH = '/api/auth';

export const DEFAULT_LOCALE = 'az';
export const SUPPORTED_LOCALES = ['az', 'ru', 'en'] as const;

/** `https://api.ozio10.az` unless `API_BASE_URL` overrides it. */
export function apiBaseUrl(): string {
  return (process.env.API_BASE_URL || 'https://api.ozio10.az').replace(/\/+$/, '');
}

export const API_VERSIONS = {
  v1: '/customer/api/v1',
  v2: '/customer/api/v2',
  notifications: '/notification/api/v1',
} as const;

export type ApiVersion = keyof typeof API_VERSIONS;

export function isApiVersion(value: string | undefined): value is ApiVersion {
  return value === 'v1' || value === 'v2' || value === 'notifications';
}

/** `upstreamUrl('v1', 'auth/login')` → `https://api.ozio10.az/customer/api/v1/auth/login`. */
export function upstreamUrl(version: ApiVersion, path: string, search = ''): string {
  const tail = path.replace(/^\/+/, '');
  return `${apiBaseUrl()}${API_VERSIONS[version]}${tail ? `/${tail}` : ''}${search}`;
}

function secureCookies(): boolean {
  const raw = process.env.SESSION_COOKIE_SECURE;
  return raw === '1' || raw === 'true';
}

function cookieDomain(): string | undefined {
  const raw = process.env.COOKIE_DOMAIN?.trim();
  return raw ? raw : undefined;
}

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge?: number;
  domain?: string;
}

function options(httpOnly: boolean, path: string, maxAge?: number): CookieOptions {
  return { httpOnly, secure: secureCookies(), sameSite: 'lax', path, maxAge, domain: cookieDomain() };
}

/** Anything with the `cookies.set/delete` surface of `NextResponse`. */
type CookieWriter = Pick<NextResponse, 'cookies'>;

// ---------------------------------------------------------------------------
// Auth bundle (api/auth.md "Bundle location tolerance")
// ---------------------------------------------------------------------------

export interface AuthBundle {
  accessToken: string;
  /** Live logins have never carried one — see docs/BFF.md "Refresh". */
  refreshToken: string | null;
  deviceToken: string | null;
  /** `null` when the bundle omits the flag; callers then read `profile/me.is_registered`. */
  isRegistered: boolean | null;
  isLoggedIn: boolean | null;
  expiresAt: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

function pickBool(source: Record<string, unknown>, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return null;
}

/**
 * Read the auth bundle out of an envelope. Tolerates `data`, `data.data` and a bare
 * map, plus the alternate key spellings the Flutter parser accepts. Returns `null`
 * when there is no access token — a 2xx without one is NOT a login (parse failure).
 */
export function parseAuthBundle(payload: unknown): AuthBundle | null {
  const root = asRecord(payload);
  if (!root) return null;

  const candidates: Record<string, unknown>[] = [];
  const data = asRecord(root.data);
  const nested = data ? asRecord(data.data) : null;
  if (nested) candidates.push(nested);
  if (data) candidates.push(data);
  candidates.push(root);

  for (const candidate of candidates) {
    const accessToken = pickString(candidate, ['access_token', 'accessToken', 'token']);
    if (!accessToken) continue;
    return {
      accessToken,
      refreshToken: pickString(candidate, ['refresh_token', 'refreshToken']),
      deviceToken: pickString(candidate, ['device_token', 'deviceToken']),
      isRegistered: pickBool(candidate, ['is_registered', 'isRegistered', 'registered']),
      isLoggedIn: pickBool(candidate, ['is_logged_in', 'isLoggedIn']),
      expiresAt: pickString(candidate, ['expires_at', 'expiresAt']),
    };
  }
  return null;
}

/** Seconds until `expires_at`, clamped to [5 min, 30 d]; the fallback TTL when unusable. */
function accessMaxAge(expiresAt: string | null): number {
  if (!expiresAt) return COOKIE_MAX_AGE.accessToken;
  const at = Date.parse(expiresAt);
  if (Number.isNaN(at)) return COOKIE_MAX_AGE.accessToken;
  const seconds = Math.floor((at - Date.now()) / 1000);
  if (seconds <= 0) return COOKIE_MAX_AGE.accessToken;
  return Math.min(Math.max(seconds, 300), 30 * DAY);
}

// ---------------------------------------------------------------------------
// Cookie writers
// ---------------------------------------------------------------------------

/**
 * Persist a fresh auth bundle: access token, refresh token (only when the bundle
 * actually carries one), device token, and clear the guest marker.
 */
export function setAuthCookies(res: CookieWriter, bundle: AuthBundle): void {
  res.cookies.set(COOKIE_NAMES.accessToken, bundle.accessToken, options(true, '/', accessMaxAge(bundle.expiresAt)));

  if (bundle.refreshToken) {
    res.cookies.set(
      COOKIE_NAMES.refreshToken,
      bundle.refreshToken,
      options(true, REFRESH_COOKIE_PATH, COOKIE_MAX_AGE.refreshToken),
    );
  }
  if (bundle.deviceToken) setDeviceTokenCookie(res, bundle.deviceToken);

  clearGuestCookie(res);
}

/** Drop the session: access + refresh + CSRF. Does not touch the device token. */
export function clearAuthCookies(res: CookieWriter): void {
  res.cookies.set(COOKIE_NAMES.accessToken, '', options(true, '/', 0));
  res.cookies.set(COOKIE_NAMES.refreshToken, '', options(true, REFRESH_COOKIE_PATH, 0));
  res.cookies.set(COOKIE_NAMES.csrf, '', options(false, '/', 0));
}

export function setDeviceTokenCookie(res: CookieWriter, token: string): void {
  res.cookies.set(COOKIE_NAMES.deviceToken, token, options(true, '/', COOKIE_MAX_AGE.deviceToken));
}

/** Readable marker so the landing page and middleware can tell "guest" from "unknown". */
export function setGuestCookie(res: CookieWriter): void {
  res.cookies.set(COOKIE_NAMES.guest, '1', options(false, '/', COOKIE_MAX_AGE.guest));
}

export function clearGuestCookie(res: CookieWriter): void {
  res.cookies.set(COOKIE_NAMES.guest, '', options(false, '/', 0));
}

/** Readable by design — the client echoes it in `x-ozio-csrf`. */
export function setCsrfCookie(res: CookieWriter, token: string): void {
  res.cookies.set(COOKIE_NAMES.csrf, token, options(false, '/', COOKIE_MAX_AGE.csrf));
}

/** `Accept-Language` for upstream, from the next-intl cookie. */
export function localeFromCookie(value: string | undefined): string {
  return value && (SUPPORTED_LOCALES as readonly string[]).includes(value) ? value : DEFAULT_LOCALE;
}

// ---------------------------------------------------------------------------
// Upstream calls + failure mapping
// ---------------------------------------------------------------------------

/** Kinds the client can switch on. Superset of core/network's `FailureKind`. */
export type FailureKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'notFound'
  | 'server'
  | 'parse'
  | 'unknown'
  | 'rateLimited'
  | 'validation'
  | 'wrongCode'
  | 'forbidden';

export interface FieldError {
  path: string;
  message: string;
}

/** The error body every handler in this package answers with. */
export interface BffError {
  ok: false;
  success: false;
  kind: FailureKind;
  message: string;
  statusCode: number;
  fieldErrors: FieldError[];
  /** 422 only: the upstream `data` array, unchanged. */
  data?: unknown;
}

export interface UpstreamResult {
  /** `0` when the request never reached the gateway (offline/DNS/timeout). */
  status: number;
  /** Parsed JSON when the body was JSON, else `null` (429 is plain text, 404 is HTML). */
  json: unknown;
  text: string;
  headers: Headers | null;
  /** Set when `fetch` itself failed. */
  transport: 'network' | 'timeout' | null;
  /** `true` for 2xx with `success !== false` (a 200 with `success:false` is a failure). */
  ok: boolean;
}

/** Receive timeout from api/README.md ("connect 20 s, receive/send 25 s"). */
export const UPSTREAM_TIMEOUT_MS = 25_000;

function envelopeSaysFailure(json: unknown): boolean {
  const record = asRecord(json);
  return record !== null && record.success === false;
}

/** One upstream call that never throws; non-JSON bodies are kept as text. */
export async function callUpstream(
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; timeoutMs?: number },
): Promise<UpstreamResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method,
      headers: init.headers,
      body: init.body,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(init.timeoutMs ?? UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return {
      status: 0,
      json: null,
      text: '',
      headers: null,
      transport: timedOut ? 'timeout' : 'network',
      ok: false,
    };
  }

  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null; // 429 `too many requests`, Express HTML for unknown routes, …
    }
  }

  return {
    status: response.status,
    json,
    text,
    headers: response.headers,
    transport: null,
    ok: response.ok && !envelopeSaysFailure(json),
  };
}

/** `data` of a success envelope, tolerating `data.data` and a bare payload. */
export function envelopeData(json: unknown): unknown {
  const root = asRecord(json);
  if (!root) return json;
  if (!('data' in root)) return root;
  const data = root.data;
  const inner = asRecord(data);
  if (inner && 'data' in inner && 'success' in root) return inner.data;
  return data;
}

/** The server's own message, when it sent one. */
export function upstreamMessage(result: UpstreamResult): string | null {
  const record = asRecord(result.json);
  const message = record ? record.message : null;
  if (typeof message === 'string' && message.trim()) return message.trim();
  // 429 is plain text; keep short non-HTML bodies as the message.
  const text = result.text.trim();
  if (text && text.length <= 200 && !text.startsWith('<')) return text;
  return null;
}

/** 422 `data: [{path, message}]` → flat field errors (`path` may be an array). */
export function fieldErrorsOf(json: unknown): FieldError[] {
  const record = asRecord(json);
  const rows = record && Array.isArray(record.data) ? record.data : Array.isArray(json) ? json : [];
  const out: FieldError[] = [];
  for (const row of rows) {
    const item = asRecord(row);
    if (!item) continue;
    const rawPath = item.path;
    const path = Array.isArray(rawPath)
      ? rawPath.map((part) => String(part)).join('.')
      : typeof rawPath === 'string'
        ? rawPath
        : '';
    const message = typeof item.message === 'string' ? item.message : '';
    if (message) out.push({ path, message });
  }
  return out;
}

/** HTTP status (or transport error) → `FailureKind`, per api/README.md "Errors". */
export function kindForStatus(result: UpstreamResult): FailureKind {
  if (result.transport) return result.transport;
  const { status } = result;
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'notFound';
  if (status === 422) return 'validation';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  if (status === 400) return 'validation';
  if (status >= 200 && status < 300) return 'unknown'; // 200 with success:false
  return 'unknown';
}

const FALLBACK_MESSAGE: Record<FailureKind, string> = {
  network: 'Network error',
  timeout: 'Request timed out',
  unauthorized: 'Unauthorized access',
  notFound: 'Not found',
  server: 'Internal Server Error',
  parse: 'Unexpected response from the server',
  unknown: 'Request failed',
  rateLimited: 'too many requests',
  validation: 'Bad request',
  wrongCode: 'Invalid code',
  forbidden: 'Forbidden',
};

/** Build the `{ kind, message, fieldErrors }` body for a failed upstream call. */
export function bffError(
  kind: FailureKind,
  statusCode: number,
  message?: string | null,
  extra?: { fieldErrors?: FieldError[]; data?: unknown },
): BffError {
  return {
    ok: false,
    success: false,
    kind,
    message: message?.trim() || FALLBACK_MESSAGE[kind],
    statusCode,
    fieldErrors: extra?.fieldErrors ?? [],
    ...(extra?.data === undefined ? {} : { data: extra.data }),
  };
}

/** Map any failed `UpstreamResult` to the error body + the status to answer with. */
export function failureFromUpstream(
  result: UpstreamResult,
  override?: { kind?: FailureKind },
): { body: BffError; status: number } {
  const kind = override?.kind ?? kindForStatus(result);
  // Transport failures become 502/504 — the browser must not see a fake 200.
  const status = result.transport ? (result.transport === 'timeout' ? 504 : 502) : result.status || 502;
  const fieldErrors = result.status === 422 ? fieldErrorsOf(result.json) : [];
  const data = result.status === 422 ? (asRecord(result.json)?.data ?? undefined) : undefined;
  return {
    body: bffError(kind, status, upstreamMessage(result), { fieldErrors, data }),
    status,
  };
}

/** Headers for an upstream JSON call. `token`/`deviceToken`/`locale` are optional. */
export function upstreamHeaders(input: {
  token?: string | null;
  deviceToken?: string | null;
  locale?: string;
  json?: boolean;
}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': input.locale ?? DEFAULT_LOCALE,
  };
  if (input.json) headers['Content-Type'] = 'application/json';
  if (input.token) headers.Authorization = `Bearer ${input.token}`;
  if (input.deviceToken) headers['Device-Token'] = input.deviceToken;
  return headers;
}
