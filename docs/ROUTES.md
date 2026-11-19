# Routes — key → path → guard → layout → owning module

Generated from `src/core/routes/paths.ts` + `src/core/routes/guards.ts` (the runtime source of
truth) and transcribed from `web-handoff/architecture/02-routing.md`.

**Use the key, never the literal string:** `import { paths } from '@/core/routes'` →
`<Link href={paths.store(7)}>`. Paths are written without the locale prefix (`az` has none,
`/ru/...`, `/en/...` are added by next-intl navigation).

Guards: `public` (anyone, SSR/SSG) · `guest` (guest or user) · `auth` (token required, guest →
`/login?next=`) · `flow` (login-flow page, authed user → `/home`). A `flag` column entry means the
route redirects to `/home` when that flag is off, and the page must also call
`if (!FeatureFlags.x) notFound()`.

Layouts: `landing` · `auth-split` · `app-shell` · `modal` · `drawer` · `full`.

`paths.ts` and `guards.ts` are **append-only registries**. Add a row, never rename a key.

## Marketing — `(marketing)`, layout `landing`

| Key | Path | Guard | Layout | Module |
| --- | --- | --- | --- | --- |
| `landing` | `/` | public | landing | marketing |
| `cashback` | `/cashback` | public | landing | marketing |
| `partners` | `/partners` | public | landing | marketing |
| `delivery` | `/delivery` | public | landing | marketing |
| `ten` | `/ten` | public | landing | marketing |
| `contact` | `/contact` | public | landing | marketing |
| `terms` | `/terms` | public | landing | marketing |
| `privacy` | `/privacy` | public | landing | marketing |
| `sitemap` | `/sitemap.xml` | public | — | marketing |
| `robots` | `/robots.txt` | public | — | marketing |

404 (`not-found.tsx`) and 500 (`error.tsx` / `global-error.tsx`) are files, not routes.

## Auth & onboarding — `(auth)` / `(onboarding)`

| Key | Path | Guard | Layout | Module |
| --- | --- | --- | --- | --- |
| `splash` | `/splash` | public | full | onboarding |
| `onboarding` | `/onboarding` | public | full | onboarding |
| `onboardingStep(step)` | `/onboarding?step=1..3` | public | full | onboarding |
| `login` | `/login` | flow | auth-split | auth |
| `loginNext(next)` | `/login?next=<encoded>` | flow | auth-split | auth |
| `otp` | `/otp` | flow | auth-split | auth |
| `register` | `/register` | auth¹ | auth-split | auth |
| `citySelect` | `/city-select` | guest | auth-split | auth |
| `welcome` | `/welcome` | auth | auth-split | auth |
| `permissionNotifications` | `/permission/notifications` | auth | modal | onboarding |
| `permissionLocation` | `/permission/location` | guest | modal | onboarding |

¹ 02-routing.md calls it `auth-partial` (token present, profile incomplete). The edge can only see
"token present", so the rule is `auth`; the page handles the incomplete-profile state.
The country-code sheet (AU6) and the RG8 merge-card step are states, not routes.

## App core — `(app)`, layout `app-shell`

| Key | Path | Guard | Layout | Module |
| --- | --- | --- | --- | --- |
| `home` | `/home` | guest | app-shell | home |
| `market` | `/market` | guest | app-shell | store |
| `store(id)` | `/market/store/[id]` | guest | app-shell | store |
| `product(id)` | `/market/product/[id]` | guest | modal ≥768 / full | product |
| `category(id)` | `/market/category/[id]` | guest | app-shell | store |
| `tens` | `/market/tens` | guest² | app-shell | partners |
| `offers` | `/offers` | guest | app-shell | home |
| `discounts` | `/offers/discounts` | guest | app-shell | partners |
| `discountsCategory(id)` | `/offers/discounts?category=` | guest | app-shell | partners |
| `search` | `/search` | guest | app-shell | search |
| `searchQuery(q)` | `/search?q=` | guest | app-shell | search |
| `notifications` | `/notifications` | auth | app-shell / drawer ≥768 | profile |
| `favorites` | `/favorites` | auth | app-shell | store |
| `cart` | `/cart` | auth³ | drawer + full | cart |
| `cartPromo` | `/cart?sheet=promo` | auth | modal | cart |
| `cartDeliveryTime` | `/cart?sheet=time` | auth | modal | cart |

² 02-routing.md's table says `auth` for L4 10-lar, but its own `routeGuards` sample (and the shell
rule "all of `/market/*` is guest") makes everything under `/market` guest. The registry follows
`/market/* = guest`; the 10-lar screen must therefore wrap its account-bound parts in
`<GuestGate>` / `requireAuth`.

³ 02-routing.md notes "auth for mutation, guest may view empty". The edge rule is `auth` (a guest
hitting `/cart` lands on `/login?next=/cart`); the header mini-cart drawer is not route-guarded, so
guest add-to-cart still goes through `requireAuth` and the guest prompt.

## Card & loyalty

| Key | Path | Guard | Flag | Layout | Module |
| --- | --- | --- | --- | --- | --- |
| `card` | `/card` | auth | — | app-shell | loyalty_card |
| `cardOffline` | `/card/offline` | auth | — | full | loyalty_card |
| `cardTransactions` | `/card/transactions` | auth | — | app-shell | loyalty_card |
| `cardTransaction(id)` | `/card/transactions/[id]` | auth | — | modal | loyalty_card |
| `cardLevels` | `/card/levels` | auth | `loyaltyTiers` | app-shell | loyalty_card |
| `coupons` | `/coupons` | auth | — | app-shell | coupons |
| `coupon(id)` | `/coupons/[id]` | auth | — | modal ≥768 / full | coupons |
| `lottery` | `/lottery` | auth | — | app-shell | lottery |
| `lotteryTickets` | `/lottery/tickets` | auth | — | app-shell | lottery |
| `lotteryTicket(id)` | `/lottery/tickets/[id]` | auth | — | modal / full | lottery |
| `lotteryRules` | `/lottery/rules` | guest | — | app-shell | lottery |
| `lotteryResults` | `/lottery/results` | guest | — | app-shell | lottery |
| `lotteryPrizes` | `/lottery/prizes` | guest | — | app-shell | lottery |

## Checkout & orders

| Key | Path | Guard | Flag | Layout | Module |
| --- | --- | --- | --- | --- | --- |
| `checkoutPayment` | `/checkout/payment` | auth | — | app-shell (right panel ≥1440) | cart |
| `checkoutAddCard` | `/checkout/add-card` | auth | — | modal | cart |
| `orders` | `/orders` | auth | — | app-shell | orders |
| `order(id)` | `/orders/[id]` | auth | — | app-shell | orders |
| `orderTrack(id)` | `/orders/[id]/track` | auth | — | app-shell | orders |
| `orderReceipt(id)` | `/orders/[id]/receipt` | auth | `rewards` | app-shell | rewards |
| `orderSuccess(id)` | `/orders/success?order=[id]` | auth | — | app-shell | orders |
| `orderFailed(id)` | `/orders/failed?order=[id]` | auth | — | app-shell | orders |

Legacy singular `/order/...` links are 308-redirected to `/orders/...` by the middleware.

## Partners

| Key | Path | Guard | Layout | Module |
| --- | --- | --- | --- | --- |
| `marketPartners` | `/market/partners` | guest | app-shell | partners |
| `marketPartner(id)` | `/market/partners/[id]` | guest | app-shell | partners |
| `marketPartnerBranches(id)` | `/market/partners/[id]/branches` | guest | app-shell | partners |
| `marketPartnersMap` | `/market/partners/map` | guest | app-shell | partners |
| `workPartner` | `/work/partner` | auth | app-shell | partners |

## Addresses

| Key | Path | Guard | Layout | Module |
| --- | --- | --- | --- | --- |
| `addresses` | `/addresses` | auth | app-shell | address |
| `addressNew` | `/addresses/new` | auth | modal (form) | address |
| `addressPick` | `/addresses/pick` | auth | full (map placeholder) | address |
| `addressSearch` | `/addresses/search` | auth | modal | address |

## Profile / settings / help

| Key | Path | Guard | Flag | Layout | Module |
| --- | --- | --- | --- | --- | --- |
| `profile` | `/profile` | auth | — | app-shell | profile |
| `profileEdit` | `/profile/edit` | auth | — | app-shell | profile |
| `settings` | `/settings` | auth | — | modal (sheet on mobile) | profile |
| `settingsLanguage` | `/settings/language` | guest | — | app-shell | profile |
| `settingsAppearance` | `/settings/appearance` | guest | — | app-shell | profile |
| `settingsNotifications` | `/settings/notifications` | auth | — | app-shell | profile |
| `support` | `/support` | auth | `supportChat` | app-shell | profile |
| `invite` | `/invite` | auth | `referral` | app-shell | profile |
| `accountDelete` | `/account/delete` | auth | — | app-shell | profile |
| `help` | `/help` | guest | — | app-shell | profile |
| `history` | `/history` | auth | — | app-shell | profile |

## Rewards (flag `rewards`, placeholder data)

| Key | Path | Guard | Flag | Layout | Module |
| --- | --- | --- | --- | --- | --- |
| `rewardsWheel` | `/rewards/wheel` | auth | `rewards` | app-shell | rewards |
| `rewardsMissions` | `/rewards/missions` | auth | `rewards` | app-shell | rewards |
| `rewardsFamilyCard` | `/rewards/family-card` | auth | `rewards` | app-shell | rewards |
| `rewardsSmartList` | `/rewards/smart-list` | auth | `rewards` | app-shell | rewards |
| `rewardsPriceAlerts` | `/rewards/price-alerts` | auth | `rewards` | app-shell | rewards |

## Mock modules (all `auth` + flag, `<DemoBanner>` on every screen, layout `app-shell`)

| Key | Path | Flag | Module |
| --- | --- | --- | --- |
| `searchImage` | `/search/image` | `imageSearch` | image_search |
| `topup` | `/topup` | `topup` | topup |
| `topupCard` | `/topup/card` | `topup` | topup |
| `topupCashier` | `/topup/cashier` | `topup` | topup |
| `topupResult` | `/topup/result` | `topup` | topup |
| `courierApply` | `/courier/apply` | `courier` | courier |
| `courierApplyStatus` | `/courier/apply/status` | `courier` | courier |
| `courier` | `/courier` | `courier` | courier |
| `courierOrder(id)` | `/courier/orders/[id]` | `courier` | courier |
| `courierDelivery(id)` | `/courier/delivery/[id]` | `courier` | courier |
| `courierEarnings` | `/courier/earnings` | `courier` | courier |
| `courierHistory` | `/courier/history` | `courier` | courier |
| `parcel` | `/parcel` | `parcel` | parcel |
| `parcelNew` | `/parcel/new` | `parcel` | parcel |
| `parcelDetail(id)` | `/parcel/[id]` | `parcel` | parcel |

## Idea modules (all `auth` + flag, `<DemoBanner>`, layout `app-shell`)

| Key | Path | Flag | Module |
| --- | --- | --- | --- |
| `courierPlus` | `/courier-plus` | `courierPlus` | courier_plus |
| `courierPlusRoute` | `/courier-plus/route` | `courierPlus` | courier_plus |
| `courierPlusMatches` | `/courier-plus/matches` | `courierPlus` | courier_plus |
| `courierPlusTrack(id)` | `/courier-plus/track/[id]` | `courierPlus` | courier_plus |
| `courierPlusEarnings` | `/courier-plus/earnings` | `courierPlus` | courier_plus |
| `courierPlusHubRegister` | `/courier-plus/hub/register` | `courierPlus` | courier_plus |
| `courierPlusHub` | `/courier-plus/hub` | `courierPlus` | courier_plus |
| `courierServices` | `/courier-services` | `courierShop` | courier_shop |
| `courierBag` | `/courier-bag` | `courierShop` | courier_shop |
| `courierFit` | `/courier-fit` | `courierShop` | courier_shop |
| `courierFitDoorstep` | `/courier-fit/doorstep` | `courierShop` | courier_shop |
| `courierExpert` | `/courier-expert` | `courierShop` | courier_shop |
| `courierExpertBooking` | `/courier-expert/booking` | `courierShop` | courier_shop |
| `familyLimits` | `/family-limits` | `familyLimits` | family_limits |
| `familyLimit(id)` | `/family-limits/[id]` | `familyLimits` | family_limits |
| `familyLimitEdit(id)` | `/family-limits/[id]/edit` | `familyLimits` | family_limits |
| `askToBuy` | `/ask-to-buy` | `askToBuy` | ask_to_buy |
| `askToBuySend` | `/ask-to-buy/send` | `askToBuy` | ask_to_buy |
| `askToBuyRequest(id)` | `/ask-to-buy/[id]` | `askToBuy` | ask_to_buy |
| `seniorMode` | `/senior/mode` | `senior` | senior |
| `seniorPension` | `/senior/pension` | `senior` | senior |
| `seniorNeighbor` | `/senior/neighbor` | `senior` | senior |
| `seniorNeighborNew` | `/senior/neighbor/new` | `senior` | senior |
| `priceGuarantee` | `/price-guarantee` | `priceLock` | price_lock |
| `priceLocks` | `/price-locks` | `priceLock` | price_lock |
| `groupBuy` | `/group-buy` | `groupBuy` | group_buy |
| `groupBuyCreate` | `/group-buy/create` | `groupBuy` | group_buy |
| `groupBuyDeal(id)` | `/group-buy/deal/[id]` | `groupBuy` | group_buy |
| `savingsJar` | `/savings-jar` | `savingsJar` | savings_jar |
| `savingsJarSettings` | `/savings-jar/settings` | `savingsJar` | savings_jar |
| `school` | `/school` | `school` | school |
| `schoolGrades` | `/school/grades` | `school` | school |
| `schoolClassList` | `/school/class-list` | `school` | school |
| `schoolStudentCard` | `/school/student-card` | `school` | school |
| `viral` | `/viral` | `viral` | viral |
| `viralWishlists` | `/viral/wishlists` | `viral` | viral |
| `viralWishlistNew` | `/viral/wishlists/new` | `viral` | viral |
| `viralWishlist(id)` | `/viral/wishlists/[id]` | `viral` | viral |
| `viralAuctions` | `/viral/auctions` | `viral` | viral |
| `viralAuction(id)` | `/viral/auctions/[id]` | `viral` | viral |
| `viralReceiptScan` | `/viral/receipt-scan` | `viral` | viral |

## Not routes (states)

Skeleton / empty / error states, session-expired dialog, offline banner, guest prompt, toasts,
cookie banner (marketing only), city + address chip popovers, language / theme switchers, the
"Demo rejim" banner, the AU6 country-code sheet, the RG8 merge-card step, UN7/UN8 address states,
LT6/LT7 lottery congratulation states and the order-rating sheet.

## Where the guards run

1. `src/middleware.ts` — edge: next-intl locale handling, then `matchGuard()`. Cookie presence
   only (`ozio_at` / `ozio_rt`), never an upstream call. `?preview=` bypasses the `auth` rule when
   `NEXT_PUBLIC_ENABLE_PREVIEW=1`. It also 308-redirects legacy `/order/...` to `/orders/...`.
   (Next 16 renamed this convention to `proxy.ts`; the code is unchanged by that rename.)
2. `<AuthGate>` in `(app)/layout.tsx` — catches cookies that exist but are dead.
3. `requireSession()` in server components that SSR user data.

## Default rule

Anything that matches no pattern in `routeGuards` is `auth` — protected by default, inherited from
Flutter `RouteGuard`. Adding a new screen means adding its row to `paths.ts` **and** its guard to
`guards.ts`; a guest-visible screen must be listed explicitly.

## Navigation keys (`src/core/routes/nav.ts`)

| List | Items (ids) |
| --- | --- |
| `sidebarNav` (≥1440) | home, market, orders, card, coupons, lottery, partners, addresses, profile |
| `railNav` (768–1439) | same, with `QrCode` for card and `Users` for partners |
| `bottomNav` (<768) | home, market, card, orders, profile |
| `utilityNav` | search, cart, notifications, offers, history, settings, help, support (flag), invite (flag) |

Labels come from `messages/parts/nav.json` (`nav.home`, `nav.market`, …) — resolve `item.labelKey`
with `useTranslations()` at the root namespace. 02-routing.md's mobile pill lists Səbət instead of
Kart; the build brief specifies Kart (`QrCode`), which is what `bottomNav` ships — cart stays
reachable from the header icon and the mini-cart drawer.
