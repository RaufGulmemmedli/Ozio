# Ozio Web — build contract (READ THIS FIRST, FULLY)

You are one of ~30 agents building **ozio.az** (public landing + logged-in web app) 1:1 from a design
handoff. This file is the shared protocol. Breaking it breaks other agents' work.

## Where things are

| What | Path |
| --- | --- |
| This project (write here) | `C:\Users\rauf.gulmammadli\Desktop\ozio\newproject` |
| Handoff (READ-ONLY, never write) | `C:\Users\rauf.gulmammadli\Desktop\web-handoff` |
| Architecture docs | `web-handoff/architecture/01…10-*.md` |
| Design system | `web-handoff/design-system/{tokens.css,tailwind-theme.css,typography.md,layout.md,components.md,motion.md,skeletons.md,states-catalog.md,assets.md}` |
| API docs (one per module) | `web-handoff/api/<module>.md` + `api/README.md` + `api/screen-api-matrix.md` |
| Screen specs | `web-handoff/screens/<group>.md` — node ids, routes, regions, API calls, states |
| **Design export HTML (pixel source of truth)** | `web-handoff/html/<group>/<slug>.html` |

Already copied into this project, **do not duplicate or rewrite**:

- `src/core/api/contracts/types.ts` — all request/response types + coercion helpers
- `src/core/api/contracts/endpoints.ts` — all 63 endpoints with `method`, `path`, `auth`, `live`, `buildPath()`
- `src/core/api/contracts/mock-contracts.ts` — interfaces + sample data for the mock modules
- `src/app/globals.css` — **all** design tokens + the Tailwind v4 theme + skeleton CSS
- `src/core/lib/cn.ts` — `cn()`
- `src/shared/lucide.ts` — the only place `lucide-react` may be imported
- `public/logo.svg`, `public/fonts/Geologica.ttf`, `public/lottie/ozio_logo.json`

## Stack (do not add dependencies without need; they are already installed)

Next.js 16.4.6 App Router · React 19.3 · TypeScript strict · Tailwind CSS v4 · TanStack Query v5 ·
Zustand · next-intl 4 · MSW 3 · react-hook-form + zod · lucide-react · lottie-react · Radix UI primitives.

## Hard rules (every one of these is checked)

1. **No raw hex, no magic numbers.** Colors only via Tailwind token classes (`bg-surface`, `text-ink2`,
   `border-line`, `bg-brand`, `text-on-cta`, …) or `var(--oz-*)`. The default Tailwind palette is
   **deleted** (`--color-*: initial`) — `bg-gray-100` does not exist and will not compile.
   Radii: `rounded-card` (24) `rounded-xl` (28) `rounded-modal` (32) `rounded-bento` (36)
   `rounded-2xl` (48) `rounded-pill` `rounded-lg` (20) `rounded-md` (14) `rounded-sm` (10) `rounded-xs` (6).
   Type: `text-nano micro caption label body-sm body body-l h4 h3 h2 h1-app h1 hero-lg hero display`.
   Spacing base is **4px**, so `p-5` = 20px, `gap-14` does not exist → use `gap-[14px]` (14 is the
   card-internal default in this design) or the nearest token.
   **Small text on a light fill uses the `*-text` colours**, not the plain accents: `text-brand-text`,
   `text-success-text`, `text-sky-text`, `text-violet-text`, `text-warn-text`, `text-danger-text`.
   The accents are fills and large-text colours — measured on their own soft tints they fail WCAG AA
   for body-sized text (`text-success` on `bg-success-soft` is 2.99:1, `text-sky` on `bg-sky-soft`
   2.81:1, brand on white 3.90:1). The `*-text` variants clear 4.5:1 in **both** themes and keep the
   hue. Threshold: anything below 18.66px bold or 24px regular. Fills, icons, borders and large
   display text keep the plain token.
2. **No hardcoded user-facing strings.** Every string goes through next-intl:
   `useTranslations('<group>')` in client components, `getTranslations` in server components.
   Add your keys to **`messages/parts/<your-group>.json` only** (format below). Never edit another
   group's part file, and never edit `messages/{az,ru,en}.json` (generated).
3. **Loading = shimmer skeleton mirroring the loaded layout.** A spinner, a blank area or a bare
   title as a page/section loading state means the screen is NOT done. Spinners are allowed **only**
   inside buttons, pull-to-refresh and pagination footers. One `<Shimmer>` per skeleton root; static
   chrome (page title, nav, section headings) is **not** shimmered; tinted block fills stay outside
   the shimmer and only the bones on top sweep. The skeleton must not shift layout — same container
   sizes, gaps and grid columns as the loaded view.
4. **Every data screen ships loading + empty + error**, plus `?preview=` support via `useScreenQuery`.
5. **Light and dark both correct**, and **az / ru / en** all present (az is the primary; ru is the
   longest — it must not overflow).
6. **Data flows one way only:** `view/ → hooks/ → data/<group>.repository.ts → data/<group>.remote.ts → core/network`.
   A component never calls `fetch` or `api()` directly. Parsers never throw.
7. **Money, fees, bonuses, delivery zones and discounts are server data.** Never compute or hardcode
   them (line × qty for display is the only exception).
8. **Stay inside your own folders.** You own `src/modules/<group>/**` (+ the route files listed in your
   brief) and `messages/parts/<group>.json`. Do not modify `src/core/**`, `src/shared/**` or another
   module. If you need something from `core`/`shared` that does not exist, write a tiny local
   fallback inside your module and leave a `// TODO(core):` comment — do not edit shared code.
9. **Icons only from `@/shared/lucide`.** Import `lucide-react` nowhere else.
10. **The logo is never text.** Use `<OzioLogo/>` from `@/shared/brand`.
11. Accessibility is part of done: landmarks, one `h1`, `aria-label` on icon-only buttons,
    `aria-current` on active nav, focus-visible rings (already global), 44×44 touch targets on mobile,
    `aria-busy` on skeleton roots, `role="alert"` on errors.

## Import alias

`@/*` → `src/*`. Example: `import { cn } from '@/core/lib/cn'`.

## Module anatomy (identical for every module)

```
src/modules/<group>/
├─ <group>.routes.ts        # { id, path, guard, layout }[] this module owns
├─ <group>.query-keys.ts    # key factory: <group>Keys.all / .list(f) / .detail(id)
├─ <group>.flags.ts         # mock modules only: which feature flag gates it
├─ data/
│  ├─ models/*.ts           # domain types + tolerant parseX(json): X  (NEVER throws)
│  ├─ <group>.remote.ts     # paths + params -> Result<ApiEnvelope>
│  ├─ <group>.repository.ts # -> Result<DomainModel>; the ONLY thing hooks import
│  └─ <group>.mock.ts       # mock modules only: MSW handlers + in-memory db
├─ hooks/use-*.ts           # useQuery / useInfiniteQuery / useMutation wrappers
├─ view/<Screen>View.tsx    # route-level component
│  └─ <Screen>Skeleton.tsx  # the mirror skeleton, next to its view
├─ components/              # module-private widgets
└─ index.ts                 # public surface; other modules import ONLY from here
```

`src/app/**/page.tsx` stays thin: `export default function Page(){ return <MarketView/> }`.

## core/shared API you may rely on (built by the foundation agents)

```ts
// @/core/network
type Result<T> = { ok: true; value: T } | { ok: false; failure: Failure };
ok(v), fail(f), mapResult(r, fn), unwrap(result)            // unwrap throws the Failure (for Query)
class Failure { kind: FailureKind; message: string; statusCode?: number; fieldErrors: FieldError[]; hasServerMessage: boolean }
type FailureKind = 'network'|'timeout'|'unauthorized'|'notFound'|'server'|'parse'|'unknown'|'rateLimited';
api<T>(method, path, { query?, body?, signal?, version?: 'v1'|'v2'|'notifications'|'mock' }): Promise<Result<ApiEnvelope<T>>>
// @/core/network/json  — tolerant readers, never throw
asObj, asList, str, num, bool, money, parsePage
// @/core/session
useSession()            // { status: 'unknown'|'guest'|'authenticated', user, expired, signOut, markExpired }
requireAuth(action)     // runs action when authenticated, else opens <GuestPrompt>
// @/core/routes
paths                   // typed path builders: paths.store(7), paths.product(3), paths.order(9)
// @/core/config
FeatureFlags, useFlag('topup')
// @/core/query
useScreenQuery(opts, seed?)   // wraps useQuery + ?preview=loading|empty|error|offline
queryKeys                     // cross-module keys: session, cart, profile
// @/core/i18n
useFormat()             // { money, number, kg, date, relative }  — money renders "12,50 ₼"
// @/shared/ui
Button IconButton Input PhoneInput OtpInput Select Checkbox Switch Tabs SegmentedControl Chip Badge
Avatar Card Sheet Modal Dialog Drawer Popover Tooltip Toaster toast Progress Stepper QuantityStepper
Price InfiniteList Grid Accordion DatePicker Table Pagination Banner Snackbar
// @/shared/skeleton
Shimmer Bone BoneCard BoneText BoneList BoneRow
// @/shared/states
EmptyState ErrorState OfflineBanner SessionExpiredDialog GuestPrompt GuestGate DemoBanner
// @/shared/layout
AppShell Sidebar IconRail BottomPill TopBar PageHeader Container Section
// @/shared/brand
OzioLogo LottieLoader Lottie404
// @/shared/media
ProductImage Barcode QrCodeView MapPlaceholder
// @/shared/lucide
every icon used in the design
```

If one of these is missing when you build, **do not create it in `shared/`** — inline a minimal
local version in your module with a `// TODO(core):` note and keep going.

## Messages file format (`messages/parts/<group>.json`)

Per-key triplets so a missing translation is obvious:

```json
{
  "title": { "az": "Səbətim", "ru": "Моя корзина", "en": "My cart" },
  "empty.title": { "az": "Səbət boşdur", "ru": "Корзина пуста", "en": "Your cart is empty" },
  "items": {
    "az": "{count, plural, one {# məhsul} other {# məhsul}}",
    "ru": "{count, plural, one {# товар} few {# товара} many {# товаров} other {# товара}}",
    "en": "{count, plural, one {# item} other {# items}}"
  }
}
```

The az copy must be **the exact string from the design export / screen spec**. ru and en are faithful
translations. Azerbaijani uses `ə Ə ı İ ş ç ğ ö ü` and the manat sign `₼` — all present in Geologica.

## API reality (read `web-handoff/api/README.md` before wiring anything)

- Base `https://api.ozio10.az`; prefixes `v1 = /customer/api/v1`, `v2 = /customer/api/v2`,
  `notifications = /notification/api/v1`. v2 is only carts, orders, bonus/transactions.
- The browser **never** talks to the API directly: it calls the same-origin BFF
  `/api/bff/<version>/<path>`, which attaches the bearer token from an httpOnly cookie. CORS on the
  real host is unverified, so the BFF is mandatory.
- Envelope: `{ success, message, data, statusCode }`. **A 200 with `success: false` is a failure.**
  Error bodies have no `data` — except 422, which carries `data: [{path, message}]`.
  One exception with no envelope at all: `GET v1/wallet/google` returns a bare `{url}`.
- Pagination is **`offset` + `limit`**. `page` is ignored by every endpoint. Lists return `total`.
- **Never fire two concurrent requests to the same path** — the gateway answers 429
  `too many requests`. Identical in-flight GETs are de-duplicated by `api()`; serialise anything else.
- Money arrives as decimal **strings** on catalog rows and numbers on cart/bonus rows → `num()`/`money()`.
- Weight products: catalog `stock`/`min_order_quantity` are in **grams**; cart `quantity` is in the
  product unit (**1 = 1 kg**). Convert **only** in `cart.repository`.
- Each endpoint carries `live: 'verified' | 'unverified' | 'server-error' | 'not-found'`.
  `verified` → build against the documented shape. `unverified` → keep it behind the repository so a
  wrong guess is a one-line fix, and never claim success on a 2xx that lacks the expected id.
  `not-found` / `server-error` → **do not call it**; render the documented "not available" state.
  Known dead paths: `GET /stores` `/products` `/products/{id}` `/latest-products`
  `/similar-products/{id}` `/search` `/popup` `GET /stores/favorites` `PATCH /profile/address/{id}`.
  Use the replacements: `stores/search` (lat+lng required), `stores/{storeId}/products`,
  `stores/{storeId}/products/{variantId}`, `stores/{storeId}/similar-products/{variantId}`.
- Timestamps come in three conventions (true UTC / Baku wall-clock with a fake `Z` / zone-less UTC) —
  `api/README.md` says which per field. Read Baku wall-clock `HH:mm` literally, do not convert.

## Mock modules

Parcel, courier, courier_plus, courier_shop, topup, image_search, family_limits, ask_to_buy, senior,
price_lock, group_buy, savings_jar, school, viral, rewards, referral, support chat, loyalty tiers have
**no backend**. They run on MSW handlers under their own namespace `/api/mock/<module>/…` — never the
real host — with contracts in `web-handoff/api/mock-modules.md` + `src/core/api/contracts/mock-contracts.ts`.
Every mock screen renders `<DemoBanner/>` at the top. Fixtures carry az/ru/en strings and realistic
numbers. Each is gated by `NEXT_PUBLIC_FEATURE_<NAME>` (all default ON) and each page also calls
`if (!FeatureFlags.x) notFound()`.

## Using the design export HTML

`web-handoff/html/<group>/<slug>.html` is the **pixel source of truth** — read it for exact sizes,
paddings, gaps, radii, colors, type and copy. It is **not** production code:

- Absolutely-positioned flat `div`s and fixed frame heights → rebuild with real flex/grid layout and
  let height be content-driven. Ignore the frame's `height: 1340px`.
- Hard-coded hex everywhere (dark frames too) → map every value to the matching token. The token
  values are in `src/app/globals.css`; `#F4F1EC` is `bg`, `#FFFFFF` is `surface`, `#111111` is
  `ink`/`cta`/`block`, `#EE3768` is `brand`, `#5C5852` is `ink2`, `#9C978F` is `ink3`, `#E2DDD5` is
  `line`, `#EAE5DE` is `surface2`, `#FFD43B` is `yellow`.
- Remote Unsplash images and a Google Fonts `<link>` → neither ships. Images come from the API CDN
  via `<ProductImage>`; the font is self-hosted from `public/fonts`.
- Blocks named "Spec Note", "Motion Spec", and "Demo rejim" strips on non-mock screens are design
  annotations, **not UI** — do not build them.
- The logo in the export is 11 absolutely-positioned bars/paths — use `<OzioLogo/>` instead.
- `data-pencil-name` tells you what a node is; `data-pencil-id` matches the ids in `screens/*.md`.

Grep a file for the measurements you need rather than reading all of it — these files are 90–130 KB:

```bash
grep -o 'data-pencil-name="[^"]*"' web-handoff/html/app-core/app-home.html | sort -u
```

## Definition of done for your package

- Every screen in your brief exists at its route, renders light + dark, az/ru/en, and matches the
  export's spacing/type/radii/colors.
- Loading (mirror skeleton), empty and error states for every data screen; `?preview=` works.
- Responsive at 390 / 768 / 1440 per the shell rules; no horizontal scroll at 320.
- `npx tsc --noEmit` reports **no errors in your files**.
- No `console.log` left behind; no `any` without a comment explaining why.
- Report back: files created, routes added, endpoints wired, what you had to assume, what is missing.
