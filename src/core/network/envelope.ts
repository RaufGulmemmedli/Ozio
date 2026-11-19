/**
 * The response envelope (api/README.md "Envelope").
 *
 * Success:  `{ success: true, message, data, statusCode, is_cache, cache_ttl }`
 * Error:    `{ success: false, message, statusCode }` — **no `data`** except 422, which carries
 *           `data: [{ path, message }]`.
 * Tolerated older shapes: `{ status: boolean, message, data }` and `{ data, message, status_code }`.
 * A bare list / object is accepted too, and `GET v1/wallet/google` has **no envelope at all**
 * (bare `{ url }`) — use `parseBare` for it.
 *
 * **A 200 with `success: false` is a failure** — `api()` turns that into `Failure.fromEnvelope`.
 */

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode?: number;
  isCache?: boolean;
}

const asRecord = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const text = (v: unknown): string => (typeof v === 'string' ? v : '');

function numberOrUndefined(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function firstDefined(o: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

/** True when the object looks like one of the documented envelope shapes (not a bare payload). */
function looksEnveloped(o: Record<string, unknown>): boolean {
  if ('success' in o) return true;
  if ('status' in o && typeof o.status === 'boolean') return true;
  return (
    'data' in o &&
    ('status' in o || 'statusCode' in o || 'status_code' in o || 'message' in o || 'is_cache' in o)
  );
}

export function parseEnvelope<T = unknown>(json: unknown): ApiEnvelope<T> {
  if (json === null || json === undefined) {
    return { success: true, message: '', data: null };
  }
  if (Array.isArray(json) || typeof json !== 'object') {
    // Bare list / primitive body.
    return { success: true, message: '', data: json as T };
  }

  const o = asRecord(json);
  if (!looksEnveloped(o)) {
    // Envelope-less payload, e.g. GET v1/wallet/google -> { url }.
    return { success: true, message: '', data: o as T };
  }

  const statusCode = numberOrUndefined(firstDefined(o, ['statusCode', 'status_code', 'code']));
  const success =
    'success' in o
      ? o.success !== false
      : typeof o.status === 'boolean'
        ? o.status !== false
        : statusCode === undefined || (statusCode >= 200 && statusCode < 400);

  const isCache = firstDefined(o, ['is_cache', 'isCache']);

  return {
    success,
    message: text(o.message),
    // 422 keeps its `data: [{path,message}]` here so Failure.fromEnvelope can read the field errors.
    data: (o.data ?? null) as T | null,
    statusCode,
    isCache: typeof isCache === 'boolean' ? isCache : undefined,
  };
}

/**
 * The one endpoint with no envelope (`GET v1/wallet/google` -> bare `{ url }`). Wraps whatever the
 * body was as `data` without looking for envelope keys.
 */
export function parseBare<T = unknown>(json: unknown): ApiEnvelope<T> {
  return {
    success: json !== null && json !== undefined,
    message: '',
    data: (json ?? null) as T | null,
  };
}

/** A 200 that is really a failure: `success: false`, or a 4xx/5xx `statusCode` inside the body. */
export const isEnvelopeFailure = (env: ApiEnvelope<unknown>): boolean =>
  !env.success || (env.statusCode !== undefined && env.statusCode >= 400);
