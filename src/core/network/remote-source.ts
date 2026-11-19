/**
 * `remote` — the thin verb helper every module's `data/<group>.remote.ts` uses, so a remote source
 * stays a declarative list of paths:
 *
 * ```ts
 * export const storeRemote = {
 *   search: (q: { lat: number; lng: number }, signal?: AbortSignal) =>
 *     remote.get<StoreSearchData>('stores/search', q, { signal }),
 *   detail: (id: number) => remote.get<StoreDetailData>(`stores/${id}`),
 *   cart:   () => remote.v2.get<CartListData>('carts'),
 *   feed:   () => remote.notifications.get<NotificationsListData>('notifications', { limit: 10 }),
 *   parcel: () => remote.mock('parcel').get<ParcelQuote>('quote'),
 * };
 * ```
 *
 * `endpoint(name)` resolves an operation from `core/api/contracts/endpoints.ts` so paths and
 * versions are never retyped, and refuses the endpoints that are dead on live.
 */
import {
  buildPath,
  endpoints,
  PREFIX,
  type EndpointName,
  type LiveStatus,
} from '@/core/api/contracts/endpoints';
import { api, type ApiOptions, type ApiVersion, type HttpMethod } from './api-client';
import type { ApiEnvelope } from './envelope';
import type { Result } from './result';

export type RemoteQuery = Record<string, unknown>;
export type RemoteResult<T> = Promise<Result<ApiEnvelope<T>>>;

export interface RemoteCallOptions {
  signal?: AbortSignal;
}
export interface RemoteWriteOptions extends RemoteCallOptions {
  query?: RemoteQuery;
}

export interface RemoteVerbs {
  get<T = unknown>(path: string, query?: RemoteQuery, opts?: RemoteCallOptions): RemoteResult<T>;
  post<T = unknown>(path: string, body?: unknown, opts?: RemoteWriteOptions): RemoteResult<T>;
  put<T = unknown>(path: string, body?: unknown, opts?: RemoteWriteOptions): RemoteResult<T>;
  patch<T = unknown>(path: string, body?: unknown, opts?: RemoteWriteOptions): RemoteResult<T>;
  del<T = unknown>(path: string, body?: unknown, opts?: RemoteWriteOptions): RemoteResult<T>;
  /** Escape hatch for an operation resolved through `endpoint()`. */
  call<T = unknown>(method: HttpMethod, path: string, opts?: ApiOptions): RemoteResult<T>;
}

function verbs(version: ApiVersion, moduleName?: string): RemoteVerbs {
  const base = (extra: Omit<ApiOptions, 'version' | 'module'>): ApiOptions => ({
    ...extra,
    version,
    module: moduleName,
  });
  const write =
    (method: HttpMethod) =>
    <T = unknown>(path: string, body?: unknown, opts?: RemoteWriteOptions): RemoteResult<T> =>
      api<T>(method, path, base({ body, query: opts?.query, signal: opts?.signal }));

  return {
    get: <T = unknown>(path: string, query?: RemoteQuery, opts?: RemoteCallOptions): RemoteResult<T> =>
      api<T>('GET', path, base({ query, signal: opts?.signal })),
    post: write('POST'),
    put: write('PUT'),
    patch: write('PATCH'),
    del: write('DELETE'),
    call: <T = unknown>(method: HttpMethod, path: string, opts?: ApiOptions): RemoteResult<T> =>
      api<T>(method, path, { ...opts, version, module: moduleName }),
  };
}

const v1 = verbs('v1');

export const remote = {
  ...v1,
  v1,
  v2: verbs('v2'),
  notifications: verbs('notifications'),
  /** Mock modules live under their own namespace `/api/mock/<module>/…` — never the real host. */
  mock: (moduleName: string): RemoteVerbs => verbs('mock', moduleName),
} as const;

export type EndpointVersion = Exclude<ApiVersion, 'mock'>;

export interface EndpointCall {
  version: EndpointVersion;
  /** Path with the version prefix stripped and `{params}` filled — ready for `api()` / `remote`. */
  path: string;
  method: HttpMethod;
}

const PREFIXES: ReadonlyArray<readonly [EndpointVersion, string]> = [
  ['v2', PREFIX.v2],
  ['notifications', PREFIX.notifications],
  ['v1', PREFIX.v1],
];

/** `live` values that must never be called (set, not a literal check, so a new one still trips it). */
const DEAD_ON_LIVE: ReadonlySet<LiveStatus> = new Set<LiveStatus>(['not-found', 'server-error']);

/**
 * Looks an operation up by name, fills its `{params}` and strips the version prefix.
 * Throws for the endpoints that must never be called (`live: 'not-found' | 'server-error'`) —
 * those screens render the documented "not available" state instead.
 */
export function endpoint(name: EndpointName, params?: Record<string, string | number>): EndpointCall {
  const def = endpoints[name];
  const live: LiveStatus = def.live;
  if (DEAD_ON_LIVE.has(live)) {
    throw new Error(
      `endpoint('${name}') is '${live}' on live (${def.method} ${def.path}) — do not call it; render the documented unavailable state.`,
    );
  }
  const full = buildPath(def.path, params);
  for (const [version, prefix] of PREFIXES) {
    if (full === prefix) return { version, path: '', method: def.method };
    if (full.startsWith(`${prefix}/`)) {
      return { version, path: full.slice(prefix.length + 1), method: def.method };
    }
  }
  // Not behind a known prefix (only /customer/socket): keep the path, let the BFF route it.
  return { version: 'v1', path: full.replace(/^\/+/, ''), method: def.method };
}

/** `callEndpoint('StoreSearch', { query: { lat, lng } })` — one call, no path literals. */
export function callEndpoint<T = unknown>(
  name: EndpointName,
  args: {
    params?: Record<string, string | number>;
    query?: RemoteQuery;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): RemoteResult<T> {
  const { version, path, method } = endpoint(name, args.params);
  return api<T>(method, path, { version, query: args.query, body: args.body, signal: args.signal });
}
