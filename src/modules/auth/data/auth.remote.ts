/**
 * Remote source for the auth module.
 *
 * Two destinations, and the distinction matters:
 *
 *  1. **Session lifecycle** — `POST /api/auth/{login,otp,register,guest}`. These are the Next.js
 *     route handlers that own the httpOnly cookies (`docs/BFF.md` §5). They are *not* under
 *     `/api/bff/**`, so `api()` cannot reach them and they get the small `callAuthHandler`
 *     wrapper below. No token is ever in a request or a response here.
 *  2. **Everything else** — `GET v1/location/cities` goes through `api()` / `remote`, i.e. the
 *     `/api/bff/v1/...` proxy, exactly like every other read in the app.
 *
 * Nothing in this file logs: phone numbers and OTP codes never reach a console in any branch.
 */
import { AZ_COUNTRY_ID } from '../auth.constants';
import { fail, ok, remote, type FieldError, type Result } from '@/core/network';

/* -------------------------------------------------------------------- failures */

/**
 * The `kind` values `/api/auth/*` can answer with: `core/network`'s `FailureKind` plus the three
 * BFF-specific ones (`docs/BFF.md` §5). `wrongCode` and `rateLimited` are what drive the AU3 and
 * AU5 screens.
 */
export type AuthFailureKind =
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

export interface AuthFailure {
  kind: AuthFailureKind;
  /** The server's own text when it sent one, else an English fallback from the handler. */
  message: string;
  statusCode: number;
  /** 422 only — feed into `applyFieldErrors`. */
  fieldErrors: FieldError[];
  hasServerMessage: boolean;
  /** `Retry-After`, in seconds, when the server sent one. It wins over the client cooldown. */
  retryAfterSeconds: number | null;
}

const AUTH_KINDS: ReadonlySet<string> = new Set<AuthFailureKind>([
  'network',
  'timeout',
  'unauthorized',
  'notFound',
  'server',
  'parse',
  'unknown',
  'rateLimited',
  'validation',
  'wrongCode',
  'forbidden',
]);

function kindFromStatus(status: number): AuthFailureKind {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'notFound';
  if (status === 422 || status === 400) return 'validation';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  return 'unknown';
}

const asRecord = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function readFieldErrors(body: Record<string, unknown>): FieldError[] {
  const rows = Array.isArray(body.fieldErrors)
    ? body.fieldErrors
    : Array.isArray(body.data)
      ? body.data
      : [];
  const out: FieldError[] = [];
  for (const row of rows) {
    const r = asRecord(row);
    const message = typeof r.message === 'string' ? r.message.trim() : '';
    if (!message) continue;
    const rawPath = r.path ?? r.field ?? r.key;
    const path = Array.isArray(rawPath)
      ? rawPath.map(String).join('.')
      : rawPath === undefined || rawPath === null
        ? ''
        : String(rawPath);
    out.push({ path, message });
  }
  return out;
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header.trim());
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  // HTTP-date form.
  const at = Date.parse(header);
  if (!Number.isFinite(at)) return null;
  return Math.max(0, Math.ceil((at - Date.now()) / 1000));
}

/** The timeout mirrors `api()`'s 25 s (api/README.md receive timeout). */
const AUTH_TIMEOUT_MS = 25_000;

/* ------------------------------------------------------------------ transport */

async function callAuthHandler<T>(
  path: string,
  body: unknown,
): Promise<Result<T, AuthFailure>> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, AUTH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`/api/auth/${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch {
    return fail<AuthFailure>({
      kind: timedOut ? 'timeout' : 'network',
      message: timedOut ? 'The connection timed out' : 'No internet connection',
      statusCode: 0,
      fieldErrors: [],
      hasServerMessage: false,
      retryAfterSeconds: null,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text().catch(() => '');
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = text; // 429 answers plain text `too many requests`.
    }
  }
  const payload = asRecord(parsed);
  const retryAfterSeconds = parseRetryAfter(res.headers.get('retry-after'));

  if (!res.ok || payload.ok === false || payload.success === false) {
    const rawKind = typeof payload.kind === 'string' ? payload.kind : '';
    const kind: AuthFailureKind = AUTH_KINDS.has(rawKind)
      ? (rawKind as AuthFailureKind)
      : kindFromStatus(res.status);
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    return fail<AuthFailure>({
      kind,
      message,
      statusCode: res.status,
      fieldErrors: readFieldErrors(payload),
      hasServerMessage: message.length > 0,
      retryAfterSeconds,
    });
  }

  return ok(parsed as T);
}

/* ------------------------------------------------------------------ responses */

export interface OtpVerifyResponse {
  status: 'authenticated';
  needsRegistration: boolean;
}

export interface GuestResponse {
  status: 'guest';
  csrf?: string;
}

export const authRemote = {
  /** `POST /api/auth/login` → upstream `v1/auth/login`; the BFF normalises the phone to E.164. */
  login: (phone: string) => callAuthHandler<{ ok: true }>('login', { phone }),

  /**
   * `POST /api/auth/otp` → upstream `v1/auth/otp_verify` (the wire key is `otp`; the handler
   * renames `code` for us). Cookies are set by the handler; no token is in the answer.
   */
  verifyOtp: (phone: string, code: string) =>
    callAuthHandler<OtpVerifyResponse>('otp', { phone, code }),

  /** `POST /api/auth/register` → `v1/auth/complete_registration`, body passed through untouched. */
  register: (body: Record<string, unknown>) =>
    callAuthHandler<{ ok: true; status: 'authenticated' }>('register', body),

  /** `POST /api/auth/guest` — no upstream call; "guest" just means no token (AU8). */
  guest: () => callAuthHandler<GuestResponse>('guest', {}),

  /** `GET v1/location/cities?country_id=1`. `country_id` is REQUIRED (400 "Bad request" without). */
  cities: (countryId: number = AZ_COUNTRY_ID, signal?: AbortSignal) =>
    remote.get<unknown>('location/cities', { country_id: countryId }, { signal }),
};
