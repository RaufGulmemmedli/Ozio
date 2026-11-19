// SERVER ONLY — never import from a client component.
/**
 * `serverApi` — same signature as `api()`, for server components, `generateMetadata` and route
 * handlers (marketing ISR + metadata, per architecture/04-data-layer.md).
 *
 * Unlike the browser client this calls the upstream **directly**:
 *   `${API_BASE_URL}${PREFIX[version]}/${path}` with the incoming request's `ozio_at` cookie as
 *   `Authorization: Bearer`, plus `Accept-Language` from the active locale.
 *
 * It does NOT de-dupe or serialise: a server render is one request burst, and the same-path 429
 * rule is honoured by calling each path once per render. There is no `'mock'` support — mock
 * modules are MSW handlers that only exist in the browser.
 */
import { API_BASE, PREFIX } from '@/core/api/contracts/endpoints';
import { parseEnvelope, isEnvelopeFailure, type ApiEnvelope } from './envelope';
import { Failure } from './failure';
import { fail, ok, type Result } from './result';
import { toQuery, type ApiVersion, type HttpMethod, API_TIMEOUT_MS } from './api-client';

export const AT_COOKIE = 'ozio_at';
export const DEVICE_COOKIE = 'ozio_dt';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export interface ServerApiOptions {
  query?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
  version?: ApiVersion;
  /** Only meaningful for the browser client; `'mock'` is rejected here. */
  module?: string;
  /** Overrides the locale sent as `Accept-Language`. */
  locale?: string;
  /** ISR: seconds, or `false` for no cache (the default). */
  revalidate?: number | false;
  tags?: string[];
}

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'az';

const upstreamBase = (): string => (process.env.API_BASE_URL ?? API_BASE).replace(/\/+$/, '');

async function requestCookies(): Promise<{ get(name: string): { value: string } | undefined } | null> {
  try {
    const { cookies } = await import('next/headers');
    return await cookies();
  } catch {
    // Outside a request scope (build-time prerender without dynamic access) there are no cookies.
    return null;
  }
}

async function activeLocale(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  try {
    const { getLocale } = await import('next-intl/server');
    const locale = await getLocale();
    if (locale) return locale;
  } catch {
    // next-intl request config not available (e.g. a plain route handler) -> fall through.
  }
  const jar = await requestCookies();
  return jar?.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE;
}

export async function serverApi<T = unknown>(
  method: HttpMethod,
  path: string,
  opts: ServerApiOptions = {},
): Promise<Result<ApiEnvelope<T>>> {
  const version = opts.version ?? 'v1';
  if (version === 'mock') {
    return fail(
      new Failure('unknown', `serverApi('${method}', '${path}'): mock modules run in the browser (MSW) only`),
    );
  }

  const prefix = PREFIX[version];
  const url = `${upstreamBase()}${prefix}/${path.replace(/^\/+/, '')}${toQuery(opts.query)}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': await activeLocale(opts.locale),
  };

  const jar = await requestCookies();
  const token = jar?.get(AT_COOKIE)?.value;
  if (token) headers.Authorization = `Bearer ${token}`;
  const device = jar?.get(DEVICE_COOKIE)?.value;
  if (device) headers['Device-Token'] = device;

  let body: string | undefined;
  if (opts.body !== undefined && opts.body !== null) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_TIMEOUT_MS);
  const onCallerAbort = (): void => controller.abort();
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener('abort', onCallerAbort, { once: true });
  }

  const cache =
    typeof opts.revalidate === 'number'
      ? { next: { revalidate: opts.revalidate, ...(opts.tags ? { tags: opts.tags } : {}) } }
      : { cache: 'no-store' as const };

  try {
    const res = await fetch(url, { method, headers, body, signal: controller.signal, ...cache });
    const text = await res.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = text; // plain-text 429 / Express HTML 404
      }
    }
    if (res.status >= 400) return fail(Failure.fromStatus(res.status, parsed));
    const env = parseEnvelope<T>(parsed);
    if (isEnvelopeFailure(env)) return fail(Failure.fromEnvelope(env));
    return ok(env);
  } catch (e) {
    if (timedOut) return fail(new Failure('timeout'));
    return fail(Failure.fromError(e)); // rethrows AbortError
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onCallerAbort);
  }
}
