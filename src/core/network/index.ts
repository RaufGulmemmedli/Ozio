/**
 * `@/core/network` — the only layer that talks to the network.
 *
 * Flow (architecture/04-data-layer.md):
 *   view/ -> hooks/ -> data/<group>.repository.ts -> data/<group>.remote.ts -> core/network
 * A component never calls `fetch` or `api()` directly, and parsers never throw: `unwrap()` is the
 * single throw, feeding TanStack Query's error channel.
 *
 * `serverApi` is intentionally NOT re-exported here — it is server-only and must be imported from
 * `@/core/network/server-api` so it can never be pulled into a client bundle through this barrel.
 */

export {
  type Result,
  ok,
  fail,
  isOk,
  isFail,
  mapResult,
  flatMapResult,
  mapFailure,
  valueOr,
  unwrap,
} from './result';

export {
  Failure,
  type FailureKind,
  type FieldError,
  type FailureEnvelopeLike,
  FAILURE_FALLBACK,
  isValidation,
  isAuthFailure,
} from './failure';

export {
  type ApiEnvelope,
  parseEnvelope,
  parseBare,
  isEnvelopeFailure,
} from './envelope';

export {
  asObj,
  asList,
  str,
  num,
  bool,
  money,
  int,
  dateIso,
  nullableStr,
  nullableNum,
  pickTranslation,
  bakuWallClock,
  parsePage,
  type Page,
  type ParsePageOptions,
  type WallClock,
} from './json';

export {
  api,
  toQuery,
  setSessionExpiredHandler,
  clearInFlight,
  type ApiOptions,
  type ApiVersion,
  type HttpMethod,
  API_TIMEOUT_MS,
  RATE_LIMIT_GAP_MS,
  CSRF_COOKIE,
  CSRF_HEADER,
  SESSION_HEADER,
} from './api-client';

export {
  remote,
  endpoint,
  callEndpoint,
  type RemoteVerbs,
  type RemoteQuery,
  type RemoteResult,
  type RemoteCallOptions,
  type RemoteWriteOptions,
  type EndpointCall,
  type EndpointVersion,
} from './remote-source';
