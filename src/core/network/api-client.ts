/**
 * Browser API client. It talks ONLY to the same-origin BFF — never to api.ozio10.az directly
 * (CORS there is unverified and the bearer token lives in an httpOnly cookie the browser cannot read).
 *
 *   `/api/bff/<v1|v2|notifications>/<path>`   real API, token attached by the BFF route handler
 *   `/api/mock/<module>/<path>`               MSW-backed mock modules (never the real host)
 *
 * Behaviours ported from lib/core/network/dio_client.dart + api/api-client.ts:
 *  - Identical in-flight GETs share one promise; any write clears the in-flight map.
 *  - Same-path concurrency is serialised: the gateway answers 429 `too many requests` when two
 *    calls hit one path at once. On a GET 429 we retry **once** after >= 1200 ms, spaced per path.
 *    Writes are **never** auto-retried.
 *  - 25 s timeout via AbortController, composed with the caller's signal (TanStack Query).
 *  - 4xx/5xx do not throw: they become `Failure`. A 200 with `success: false` is a failure too.
 *  - `401 + x-ozio-session: expired` -> the handler registered by core/session (no import cycle).
 *  - An AbortError is rethrown, so cancellation stays cancellation.
 */
import { parseEnvelope, isEnvelopeFailure, type ApiEnvelope } from './envelope';
import { Failure } from './failure';
import { fail, ok, type Result } from './result';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiVersion = 'v1' | 'v2' | 'notifications' | 'mock';

export interface ApiOptions {
  query?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
  /** Default `'v1'`. `'mock'` requires `module` and routes to `/api/mock/<module>/<path>`. */
  version?: ApiVersion;
  /** Mock module namespace, e.g. `'parcel'`. Only used when `version: 'mock'`. */
  module?: string;
}

/** fetch has no connect timeout; 25 s total matches the Flutter receive/send timeout. */
export const API_TIMEOUT_MS = 25_000;
/** Minimum spacing between two calls to one path after a 429. */
export const RATE_LIMIT_GAP_MS = 1_200;

export const CSRF_COOKIE = 'ozio_csrf';
export const CSRF_HEADER = 'x-ozio-csrf';
export const SESSION_HEADER = 'x-ozio-session';

const WRITE_METHODS: ReadonlySet<HttpMethod> = new Set<HttpMethod>(['POST', 'PUT', 'PATCH', 'DELETE']);

/* ------------------------------------------------------------------ query */

/**
 * Query serialisation: `undefined` / `null` / `''` are skipped, booleans are sent as
 * `true` / `false` (not 1/0), arrays repeat the key. Keys are sorted so the de-dupe key of two
 * identical GETs is identical.
 */
export function toQuery(query?: Record<string, unknown>): string {
  if (!query) return '';
  const params = new URLSearchParams();
  const skip = (v: unknown): boolean => v === undefined || v === null || v === '';
  for (const key of Object.keys(query).sort()) {
    const value = query[key];
    if (skip(value)) continue;
    if (Array.isArray(value)) {
      for (const item of value) if (!skip(item)) params.append(key, String(item));
      continue;
    }
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/* ------------------------------------------------------- session expiry hook */

let sessionExpiredHandler: (() => void) | null = null;

/**
 * Registered by `core/session` at hydrate time. Keeping it a callback is what lets the client stay
 * free of a `core/session` import (which would be a cycle).
 */
export function setSessionExpiredHandler(fn: (() => void) | null): void {
  sessionExpiredHandler = fn;
}

function notifySessionExpired(): void {
  try {
    sessionExpiredHandler?.();
  } catch {
    // A broken handler must not turn into a request failure.
  }
}

/* ------------------------------------------------------------------- csrf */

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`).exec(document.cookie);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/* --------------------------------------------------------------- url + keys */

const normalizePath = (path: string): string => path.replace(/^\/+/, '');

function buildUrl(version: ApiVersion, path: string, moduleName: string | undefined, query?: Record<string, unknown>): string {
  const qs = toQuery(query);
  if (version === 'mock') {
    const mod = (moduleName ?? '').replace(/^\/+|\/+$/g, '');
    return `/api/mock/${mod}/${path}${qs}`;
  }
  return `/api/bff/${version}/${path}${qs}`;
}

/** Serialisation key: the path without its query string (the gateway rate-limits per path). */
function pathKeyOf(version: ApiVersion, path: string, moduleName?: string): string {
  return version === 'mock' ? `mock:${moduleName ?? ''}/${path}` : `${version}:${path}`;
}

/* ------------------------------------------------- per-path serialisation */

const pathChains = new Map<string, Promise<unknown>>();

/** Two different queries on the same path run one after the other, never at the same time. */
function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = pathChains.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail: Promise<unknown> = run.then(
    () => undefined,
    () => undefined,
  );
  pathChains.set(key, tail);
  void tail.then(() => {
    if (pathChains.get(key) === tail) pathChains.delete(key);
  });
  return run;
}

const rateGaps = new Map<string, Promise<void>>();
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** >= 1200 ms before the single retry, and replays of one path never collide. */
function rateLimitGap(key: string): Promise<void> {
  const previous = rateGaps.get(key) ?? Promise.resolve();
  const turn = previous.then(() => delay(RATE_LIMIT_GAP_MS));
  rateGaps.set(key, turn);
  void turn.then(() => {
    if (rateGaps.get(key) === turn) rateGaps.delete(key);
  });
  return turn;
}

/* ----------------------------------------------------------- GET de-dupe */

interface InFlightEntry {
  promise: Promise<Result<ApiEnvelope<never>>>;
  controller: AbortController;
  /** Number of callers still waiting; the fetch is aborted only when every one of them left. */
  refs: number;
}

const inFlight = new Map<string, InFlightEntry>();

function abortErrorOf(signal: AbortSignal): unknown {
  const reason = (signal as { reason?: unknown }).reason;
  if (reason !== undefined && reason !== null) return reason;
  if (typeof DOMException === 'function') return new DOMException('The operation was aborted.', 'AbortError');
  const e = new Error('The operation was aborted.');
  e.name = 'AbortError';
  return e;
}

const isAbort = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && String((e as { name?: unknown }).name ?? '') === 'AbortError';

function release(entry: InFlightEntry): void {
  entry.refs -= 1;
  if (entry.refs <= 0) entry.controller.abort();
}

/** Awaits the shared promise but rejects as soon as *this* caller's own signal aborts. */
async function subscribe<T>(
  entry: InFlightEntry,
  signal: AbortSignal | undefined,
): Promise<Result<ApiEnvelope<T>>> {
  // `never` -> `T` bridge: the shared promise is created once and typed by its first caller.
  const shared = entry.promise as unknown as Promise<Result<ApiEnvelope<T>>>;
  if (!signal) return shared;
  if (signal.aborted) {
    release(entry);
    throw abortErrorOf(signal);
  }
  let rejectCancelled!: (e: unknown) => void;
  const cancelled = new Promise<never>((_, rej) => {
    rejectCancelled = rej;
  });
  const listener = (): void => rejectCancelled(abortErrorOf(signal));
  signal.addEventListener('abort', listener, { once: true });
  try {
    return await Promise.race([shared, cancelled]);
  } catch (e) {
    if (signal.aborted && isAbort(e)) release(entry);
    throw e;
  } finally {
    signal.removeEventListener('abort', listener);
  }
}

/* ------------------------------------------------------------- one attempt */

interface RawResponse {
  status: number;
  body: unknown;
  sessionExpired: boolean;
}

async function raw(
  method: HttpMethod,
  url: string,
  opts: ApiOptions,
  controller: AbortController,
): Promise<RawResponse> {
  const isWrite = WRITE_METHODS.has(method);
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;

  let body: BodyInit | undefined;
  if (opts.body !== undefined && opts.body !== null) {
    if (isForm) {
      body = opts.body as FormData; // Content-Type is set by the browser (multipart boundary).
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }
  } else if (isWrite) {
    headers['Content-Type'] = 'application/json';
  }

  if (isWrite) {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) headers[CSRF_HEADER] = csrf;
  }

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    });
    const text = await res.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        // Not JSON: 429 "too many requests", Express "Cannot GET <path>" HTML, "Backend service does not exist".
        parsed = text;
      }
    }
    return { status: res.status, body: parsed, sessionExpired: res.headers.get(SESSION_HEADER) === 'expired' };
  } catch (e) {
    if (timedOut) throw new Failure('timeout');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function send<T>(
  method: HttpMethod,
  url: string,
  key: string,
  opts: ApiOptions,
  controller: AbortController,
): Promise<Result<ApiEnvelope<T>>> {
  let res: RawResponse;
  try {
    res = await raw(method, url, opts, controller);
  } catch (e) {
    return fail(Failure.fromError(e)); // rethrows AbortError
  }

  // 429 is the gateway's same-path concurrency answer: one spaced retry, GET only.
  if (res.status === 429 && method === 'GET') {
    await rateLimitGap(key);
    try {
      res = await raw(method, url, opts, controller);
    } catch (e) {
      return fail(Failure.fromError(e));
    }
  }

  if (res.status === 401 && res.sessionExpired) notifySessionExpired();
  if (res.status >= 400) return fail(Failure.fromStatus(res.status, res.body));

  const env = parseEnvelope<T>(res.body);
  if (isEnvelopeFailure(env)) return fail(Failure.fromEnvelope(env));
  return ok(env);
}

/* --------------------------------------------------------------- public api */

/**
 * One request to the BFF.
 *
 * @param path path without a leading slash and without the version prefix, e.g. `'stores/search'`.
 */
export async function api<T = unknown>(
  method: HttpMethod,
  path: string,
  opts: ApiOptions = {},
): Promise<Result<ApiEnvelope<T>>> {
  const version = opts.version ?? 'v1';
  const clean = normalizePath(path);

  if (version === 'mock' && !opts.module) {
    return fail(
      new Failure('unknown', `api('${method}', '${path}'): version 'mock' requires opts.module`),
    );
  }

  const url = buildUrl(version, clean, opts.module, opts.query);
  const key = pathKeyOf(version, clean, opts.module);

  if (WRITE_METHODS.has(method)) {
    inFlight.clear(); // a write changes what every read returns
    const controller = new AbortController();
    const entry: InFlightEntry = {
      refs: 1,
      controller,
      promise: enqueue(key, () => send<never>(method, url, key, opts, controller)),
    };
    void entry.promise.catch(() => undefined);
    try {
      return await subscribe<T>(entry, opts.signal);
    } finally {
      inFlight.clear();
    }
  }

  const running = inFlight.get(url);
  if (running) {
    running.refs += 1;
    return subscribe<T>(running, opts.signal);
  }

  const controller = new AbortController();
  const entry: InFlightEntry = {
    refs: 1,
    controller,
    promise: undefined as unknown as Promise<Result<ApiEnvelope<never>>>,
  };
  entry.promise = enqueue(key, () => send<never>(method, url, key, { ...opts, signal: undefined }, controller));
  inFlight.set(url, entry);
  void entry.promise
    .catch(() => undefined)
    .then(() => {
      if (inFlight.get(url) === entry) inFlight.delete(url);
    });

  return subscribe<T>(entry, opts.signal);
}

/** Drops the GET de-dupe map. Call after sign-in / sign-out so nothing is shared across sessions. */
export function clearInFlight(): void {
  inFlight.clear();
}
