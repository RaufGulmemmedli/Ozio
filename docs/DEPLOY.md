# Vercel deployment

The backend is **the same API this app already talks to in development**: `https://api.ozio10.az`.
Nothing is bundled or mocked for it — the browser never calls that host directly. Every request
goes to this app's own BFF (`/api/bff/<version>/<path>`), which attaches the httpOnly access token
server-side and forwards it. On Vercel that proxy becomes a serverless function; the upstream host
does not change.

```
browser ──▶ /api/bff/v1/...   (same origin, httpOnly cookies, CSRF)
                │  Node runtime, Frankfurt
                ▼
          https://api.ozio10.az
```

## 1. Import the project

Vercel detects Next.js on its own. Root directory: `newproject`. Build command, output directory
and install command are the defaults — do not override them.

`vercel.json` pins two things that matter:

- **`regions: ["fra1"]`** — Frankfurt is the closest Vercel region to Baku. Every BFF call is a
  round trip to `api.ozio10.az`, so the function should not sit in the US.
- **`maxDuration`** — see §4.

## 2. Environment variables

Set these in **Project → Settings → Environment Variables**. The left column is what you must
change from `.env.example`; everything not listed can stay at its default.

| Variable | Production value | Why |
| --- | --- | --- |
| `API_BASE_URL` | `https://api.ozio10.az` | The backend. Same as dev. |
| `CSRF_SECRET` | **a fresh 32+ byte random string** | Without it the code falls back to a placeholder that is in this repo, so CSRF tokens would be signed with a publicly known key. Generate with `openssl rand -base64 48`. |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` | Canonical URLs, OG tags and `sitemap.xml`. Leaving it on localhost puts `http://localhost:3000` in the page metadata. |
| `NEXT_PUBLIC_ENABLE_PREVIEW` | `0` | Turns off the `?preview=loading|empty|error` debug states. It also stops `usePreview()` calling `useSearchParams()`, which otherwise opts every screen that uses it out of static rendering. |
| `NEXT_PUBLIC_APP_VERSION` | the commit sha, or a release number | Printed in the settings screen and in error reports. |

Safe to leave unset — the code already defaults them correctly **in production**:

- `SESSION_COOKIE_SECURE` → defaults to on when `NODE_ENV=production`, so session cookies get
  `Secure` automatically on Vercel. Only set it (to `0`) for a plain-HTTP environment.
- `DEBUG_API_LOG` → defaults to off in production.
- `COOKIE_DOMAIN` → leave empty for a `*.vercel.app` domain. Set it (e.g. `.ozio.az`) only when the
  app and the API share a parent domain and the cookie has to span subdomains.
- `NEXT_PUBLIC_IMAGE_HOSTS` → already `api.ozio10.az,cdn.ozio10.az`, which is what
  `next.config.ts` turns into `images.remotePatterns`. Add a host here if the CDN changes;
  `next/image` refuses any host that is not on the list.

`NEXT_PUBLIC_MSW` controls the demo modules (parcel, courier, topup, …), which have no backend and
are served by a service worker in the browser. `mock-modules` keeps them working; `off` hides their
data. The restaurants module does **not** depend on it — it carries its own local fixtures.

The 18 `NEXT_PUBLIC_FEATURE_*` flags are all `1` by the owner's decision of 2026-11-12. Copy them as
they are, or omit them: every flag defaults to on.

## 3. What the backend has to allow

Nothing. The browser never sends a cross-origin request to `api.ozio10.az`, so no CORS entry and no
origin allow-list is needed for the Vercel domain — the BFF is same-origin with the page and talks
to the API server-to-server.

## 4. The one platform limit to know about

`UPSTREAM_TIMEOUT_MS` is 25 s, and it is not arbitrary: measured against the live gateway,
`stores/{id}/products` **without** a `category_id` answers in 15 s at `limit=4` and times out
entirely at `limit=20`. A Vercel function defaults to 10 s on Hobby and 15 s on Pro, which is
shorter — so without a `maxDuration` the platform would kill those requests before the proxy's own
timeout and the browser would get a platform 504 with nothing to retry.

`vercel.json` and the route itself therefore set `maxDuration = 30`: a margin over the 25 s abort,
inside the 60 s Hobby ceiling, so a slow upstream still surfaces as this app's own
"gateway timeout" state, which the screens render properly.

## 5. After the first deploy

1. Open `/az` — the landing page is static; it should render with no API call.
2. Sign in. A successful login sets `ozio_at` / `ozio_rt` / `ozio_csrf` as httpOnly cookies on the
   Vercel domain. If sign-in works but every later call 401s, `COOKIE_DOMAIN` is set to a domain
   the app is not served from.
3. Open `/market`. It opens on "Hamısı", which is assembled from several category calls — the
   clearest check that the BFF reaches the upstream.
4. Check `/api/health`.

## Demo data, deployed

These ship as demo data and say so on screen (`<DemoBanner>`); they are not backend gaps to chase:

- **Restaurants** (`/market/restaurants`) — local fixtures, no endpoint exists.
- **The restaurant basket** — held in `localStorage`, never posted.
- **`/orders/success`** — renders from its query string instead of re-reading the order.
- **The mock modules** — parcel, courier, topup, image search and the ten idea modules.
