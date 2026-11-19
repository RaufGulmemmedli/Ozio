# BFF + auth route handlers

Everything the browser sends to the Ozio API goes through same-origin Next.js route
handlers. The browser never calls `api.ozio10.az` directly (CORS there is unverified)
and **never holds a token**: the access token lives in an httpOnly cookie that only the
server reads.

Source of truth for the behaviour described here:
`web-handoff/architecture/03-auth-session.md`, `web-handoff/api/README.md`,
`web-handoff/api/auth.md`.

Owned files:

| file | role |
| --- | --- |
| `src/app/api/bff/[...path]/route.ts` | the proxy (`GET POST PUT PATCH DELETE`) |
| `src/app/api/auth/{login,otp,register,logout,guest,session}/route.ts` | session lifecycle |
| `src/app/api/health/route.ts` | liveness + upstream probe |
| `src/core/lib/server-cookies.ts` | cookie names / lifetimes / flags + upstream helpers |
| `src/core/lib/device-token.ts` | `ozio-<32 hex>` device token (server-only) |
| `src/core/lib/csrf.ts` | `issueCsrf` / `verifyCsrf` / `isValidCsrf` (server-only) |
| `src/core/lib/phone.ts` | E.164 normalisation + masks (isomorphic) |

---

## 1. Cookie table

All cookies are `SameSite=Lax`, and `Secure` only when `SESSION_COOKIE_SECURE=1` (so
`http://localhost` works in dev). `COOKIE_DOMAIN`, when set, is applied to all of them.
Defined in exactly one place: `COOKIE_NAMES` / `COOKIE_MAX_AGE` in
`src/core/lib/server-cookies.ts`. No handler hardcodes a name.

| cookie | contents | httpOnly | path | max-age | written by |
| --- | --- | --- | --- | --- | --- |
| `ozio_at` | access token | yes | `/` | from the bundle's `expires_at`, clamped to [5 min, 30 d]; 7 d when absent | `/api/auth/otp`, `/api/auth/register`, BFF after a refresh |
| `ozio_rt` | refresh token | yes | `/api/auth` | 30 d | same — **only when the bundle actually carries one** |
| `ozio_dt` | device token `ozio-<32 hex>` | yes | `/` | 5 y | any handler, on first request |
| `ozio_g` | guest marker `1` | no (readable) | `/` | 1 y | `/api/auth/guest`, `/api/auth/logout`; cleared on sign-in |
| `ozio_csrf` | CSRF token | no (readable) | `/` | 7 d | `/api/auth/{otp,guest,session}` |
| `NEXT_LOCALE` | locale (next-intl) | — | — | — | read only — becomes `Accept-Language` upstream |

`clearAuthCookies()` drops `ozio_at`, `ozio_rt` and `ozio_csrf` and leaves `ozio_dt`
alone — the device token is an install id, not session state.

---

## 2. The proxy

```
/api/bff/<version>/<upstream path>?<query>   →   ${API_BASE_URL}/<prefix>/<path>?<query>
```

| `<version>` | prefix |
| --- | --- |
| `v1` | `/customer/api/v1` |
| `v2` | `/customer/api/v2` (carts, orders, bonus/transactions only) |
| `notifications` | `/notification/api/v1` |

Anything else → `400` with `kind: 'validation'`. `API_BASE_URL` defaults to
`https://api.ozio10.az`.

Attached to every upstream request:

- `Authorization: Bearer <ozio_at>` — only when the cookie exists (guests send none)
- `Accept: application/json`
- `Accept-Language` — from `NEXT_LOCALE`, falling back to `az`
- `Device-Token: <ozio_dt>`
- `Content-Type` — echoed from the incoming request when there is a body

For `v1/auth/*` with a body, `device_token` is injected into the JSON (the API answers
400 "device token" without it). A non-JSON body on those paths is replaced with
`{ device_token }` rather than forwarded broken.

**Passthrough.** The upstream status and bytes are returned unchanged, with the
upstream `content-type`. That is deliberate: `429` is plain text `too many requests`,
unknown routes answer Express HTML, and `GET v1/wallet/google` has no envelope at all.
Nothing here parses the body, so a non-JSON answer can never crash the proxy.
`set-cookie`, `content-encoding`/`content-length` and the CORS headers are stripped.

**Timeout** 25 s (api/README.md receive timeout). A transport failure answers `502`
with `kind: 'network'`, a timeout `504` with `kind: 'timeout'` — never a fake 200.

**Logging.** With `DEBUG_API_LOG=1` each call emits one JSON line
`{ level, method, route, status, upstream_ms }`, where `route` is `<version>/<path>`
**without the query string**. Tokens, phone numbers, OTP codes, `Authorization` and
cookies are never logged, in any branch.

---

## 3. Refresh on 401

Mirrors the Flutter `dio _on401` handler.

1. Forward the request with `ozio_at`.
2. Refresh is attempted **only** when all of these hold: the answer is `401`, the
   request carried a token, and the path is not `auth/login`, `auth/otp_verify` or
   `auth/refresh` (a 401 there is a real answer — wrong OTP — not an expired session).
   A guest 401 is passed straight through.
3. `refreshOnce()` is a **module-level shared promise**, so concurrent 401s join one
   refresh instead of stampeding the gateway (which would answer 429 for the same path
   anyway). It is cleared when it settles.
4. Refresh OK → the new bundle is written to the cookies on the response and the
   original request is replayed **exactly once**. The replay has no refresh branch of
   its own, so a loop is structurally impossible.
5. Replay 401 again, refresh rejected, refresh offline, or **no refresh cookie** →
   `clearAuthCookies()` + `401` + header `x-ozio-session: expired`.
6. Offline/timeout during the replay surfaces as `502`/`504` — never as the stale 401.

> **The common path is "no refresh token → sign out".** The live login bundle has never
> been observed to contain a `refresh_token`, and `POST v1/auth/refresh` is `unverified`
> (api/auth.md). With no `ozio_rt` cookie, `refreshOnce()` resolves immediately with
> `no-refresh-token` — **no upstream call is made** — and the client gets one clean
> `401 + x-ozio-session: expired`. No retries, no cascade. The only verified recovery is
> a new OTP login.

The client contract: `401` with `x-ozio-session: expired` means *session over* →
`useSession.markExpired()` → `<SessionExpiredDialog>` → `signOut()` →
`/login?next=<current>`.

---

## 4. CSRF

Double submit. Every state-changing BFF call (`POST`/`PUT`/`PATCH`/`DELETE` under
`/api/bff/**`) must send header `x-ozio-csrf` equal to the readable `ozio_csrf` cookie,
or it is rejected with `403` and `kind: 'forbidden'` before any upstream call.

The token is 32 random bytes base64url, HMAC-signed as `<nonce>.<hmac>` when
`CSRF_SECRET` is set. Comparison is timing-safe. A cookie issued before the secret
existed (unsigned) is still accepted on equality, so adding the secret does not 403
live sessions.

The `/api/auth/*` handlers are **exempt** — they are the handlers that *issue* the
cookie (`/api/auth/otp`, `/api/auth/guest`, `/api/auth/session`), so requiring it there
would be a chicken-and-egg. They are same-origin, `SameSite=Lax` cookies and carry no
cross-site capability beyond starting a login the user must complete by SMS.

Client rule: read `document.cookie`'s `ozio_csrf` and send it as `x-ozio-csrf` on every
non-GET BFF call. `/api/auth/session` also returns the token as `csrf` in its body, so
the client can take it from there at hydrate.

---

## 5. Handler contracts

The browser can rely on exactly these shapes.

### Error body (every handler in this package)

```ts
{
  ok: false;
  success: false;          // so the envelope-based client treats it as a failure
  kind: FailureKind;
  message: string;         // the server's own text when it sent one, else an English fallback
  statusCode: number;
  fieldErrors: { path: string; message: string }[];   // 422 only, else []
  data?: unknown;          // 422 only: the upstream `data` array, unchanged
}
```

`kind` is `core/network`'s `FailureKind` plus three BFF-specific values:

`network` · `timeout` · `unauthorized` · `notFound` · `server` · `parse` · `unknown` ·
`rateLimited` · **`validation`** (400/422) · **`wrongCode`** (OTP only) ·
**`forbidden`** (CSRF).

Show the server's own `message` for `validation` / `wrongCode` only (api/README.md);
localize a fallback for everything else.

### `POST /api/auth/login`

Request `{ phone }` — any shape the mask produces (`50 123 45 67`, `0501234567`,
`+994 50 …`); it is normalised to `+994XXXXXXXXX` server-side.

| outcome | status | body |
| --- | --- | --- |
| SMS sent | 200 | `{ ok: true }` |
| phone not an AZ number | 422 | error body, `kind: 'validation'`, `fieldErrors: [{ path: 'phone', … }]` |
| upstream failure | upstream status | error body |

Sets `ozio_dt` when missing. Never returns a token.

### `POST /api/auth/otp`

Request `{ phone, code }` (`otp` is accepted as an alias). Upstream receives
`{ phone, otp, device_token }` — the wire key is `otp`.

| outcome | status | body |
| --- | --- | --- |
| verified | 200 | `{ status: 'authenticated', needsRegistration: boolean }` |
| wrong code | 400/401/422 | error body, `kind: 'wrongCode'`, server message |
| attempt limit | 429 | error body, `kind: 'rateLimited'` |
| 2xx without an access token | 502 | error body, `kind: 'parse'` |

Cookies set on success: `ozio_at`, `ozio_rt` (only if the bundle carries one),
`ozio_dt`, `ozio_csrf`; `ozio_g` cleared. **No token is in the response body.**

`needsRegistration` is derived from `is_registered`. When the bundle omits the flag the
handler reads `GET v1/profile/me.is_registered`; if *that* call fails it assumes
registered (Flutter's default), so a gateway hiccup cannot push an existing user into
the registration form.

### `POST /api/auth/register`

Body passthrough → `POST v1/auth/complete_registration` (bearer + injected
`device_token`). The upstream keys are **unverified**, so nothing is reshaped here.

| outcome | status | body |
| --- | --- | --- |
| 2xx with `success !== false` | 200 | `{ ok: true, status: 'authenticated', needsRegistration: false }` |
| validation | 422 | error body with `fieldErrors` **and** the upstream `data: [{path, message}]` unchanged |
| no/!dead session | 401 | error body + header `x-ozio-session: expired` |

If the answer happens to carry a fresh bundle, the cookies are rotated; it is never
required. Success is not claimed on anything else — the operation is `unverified`.

### `POST /api/auth/logout`

Best-effort `POST v1/auth/logout` (failures ignored, 5 s timeout), then
`clearAuthCookies()` and `ozio_g=1`. **Always** `200 { status: 'guest', ok: true }`.

### `POST /api/auth/guest`

No upstream call — there is no guest endpoint; "guest" means no token. Sets `ozio_g=1`
and `ozio_csrf`. Answers `200 { status: 'guest', csrf }`.

### `GET /api/auth/session`

`cache-control: no-store`. Always sets/refreshes `ozio_csrf` and returns it as `csrf`.

| cookie state | body |
| --- | --- |
| no `ozio_at` | `{ status: 'guest', csrf }` |
| valid | `{ status: 'authenticated', user: UserSummary, csrf }` |
| `profile/me` 401/403 | `{ status: 'guest', csrf }`, cookies cleared, `ozio_g=1`, header `x-ozio-session: expired` |
| `profile/me` 5xx / offline | `{ status: 'authenticated', user: null, csrf }` — a gateway hiccup must not sign anyone out |

```ts
interface UserSummary {
  id: number | null;
  name: string | null;          // one string; live has no first/last split
  phone: string | null;         // E.164
  isRegistered: boolean;
  gender: string | null;
  birthDate: string | null;     // YYYY-MM-DD (date part of the ISO datetime)
  refCode: string | null;
  bonus: number | null;         // spendable balance, first bonus card
  bonusTotal: number | null;    // lifetime earned, first bonus card
  cardNumber: string | null;    // digits only
  activeOrderCount: number;
}
```

`GET v1/profile/me` returns exactly `id, name, phone, bonus_cards[], birth_date,
ref_code, gender, is_registered, cities, active_orders`. There is **no** email, avatar
or loyalty tier on live, so none are invented. Money on `bonus_cards` arrives as a
decimal string and is coerced with a comma-tolerant `toNumber`.

### `GET /api/health`

`200 { ok: true, version: NEXT_PUBLIC_APP_VERSION, upstream: 'up' | 'down' }`. The
probe is a single `HEAD` on `v1/location/cities?country_id=1` with a 3 s timeout; any
HTTP answer (400/404 included) counts as `up`, only a transport failure or timeout as
`down`. `HEAD` is used so the probe cannot collide with a real GET on the same path —
the gateway answers 429 for concurrent calls to one path.

---

## 6. Security invariants

- No token, in any form, appears in any response body.
- Nothing logs a token, phone number, OTP code, `Authorization` header or cookie, in
  any branch, at any log level.
- `ozio_rt` is scoped to `/api/auth`, so the proxy sees it only on the auth handlers'
  own paths and page requests never carry it.
- Refresh never loops: the replay is a separate code path with no refresh branch.
- `/api/auth/register` and the BFF both require a token to be present before they will
  attach one; a missing cookie is a `401`, never a silent anonymous call.
- Phones are normalised server-side, so a client bug cannot send a malformed number.
