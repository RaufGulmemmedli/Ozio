/**
 * The response shapes MSW handlers reply with.
 *
 * Mock modules must be indistinguishable from the real API at the repository boundary, so handlers
 * answer with the real envelope (`{ success, message, data, statusCode }`) and real error bodies
 * (no `data`, except 422 which carries `data: [{ path, message }]`).
 *
 * All mock traffic lives under `/api/mock/<module>/…` — never the real host.
 */
import { HttpResponse } from 'msw';
import type { Envelope, ErrorEnvelope, ValidationIssue } from '@/core/api/contracts/types';

/** The base path every mock handler is registered under. */
export const MOCK_BASE = '/api/mock';

/** `mockPath('parcel', 'quote')` → `*​/api/mock/parcel/quote` (host-agnostic, matches any origin). */
export const mockPath = (module: string, path = ''): string =>
  `*${MOCK_BASE}/${module}${path ? `/${path.replace(/^\/+/, '')}` : ''}`;

/** The real API's success shape. */
export function mockEnvelope<T>(data: T, message = 'Success'): Envelope<T> {
  return { success: true, message, data, statusCode: 200 };
}

/** The real API's error shape — no `data` key, exactly like the gateway. */
export function mockErrorEnvelope(status: number, message: string): ErrorEnvelope {
  return { success: false, message, statusCode: status };
}

/** `HttpResponse.json(mockEnvelope(data))` — the usual handler reply. */
export function mockJson<T>(data: T, message?: string) {
  return HttpResponse.json(mockEnvelope(data, message));
}

/** An error reply: HTTP status + the envelope the real gateway would send. */
export function mockError(status: number, message: string) {
  return HttpResponse.json(mockErrorEnvelope(status, message), { status });
}

/** 422: the only error that carries `data`. */
export function mockValidationError(issues: ValidationIssue[], message = 'Validation failed') {
  return HttpResponse.json(
    { success: false, message, statusCode: 422, data: issues },
    { status: 422 },
  );
}

/** 429, the gateway's answer to two concurrent requests on one path. */
export const mockRateLimited = () => mockError(429, 'too many requests');

/** Realistic latency so skeletons are actually visible. */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** `offset`/`limit` slice of a fixture array, in the list shape the real API returns. */
export function mockPage<T>(
  rows: readonly T[],
  url: URL | string,
  key = 'items',
): Record<string, unknown> {
  const params = typeof url === 'string' ? new URL(url).searchParams : url.searchParams;
  const offset = Math.max(0, Number(params.get('offset') ?? 0) || 0);
  const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? 20) || 20));
  return { total: rows.length, limit, offset, [key]: rows.slice(offset, offset + limit) };
}

/** Deterministic ids for fixtures — no `nanoid` dependency, no `Math.random()` in snapshots. */
let seq = 0;
export const mockId = (prefix = 'id'): string => `${prefix}_${(++seq).toString(36)}${Date.now().toString(36)}`;
