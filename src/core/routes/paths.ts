/**
 * The single route registry for the whole app (architecture/02-routing.md).
 *
 * One entry per row of 02-routing.md. Static strings for fixed routes, builder functions for
 * dynamic ones. `<Link href={paths.store(7)}>` everywhere — never a literal route string.
 * Paths are written WITHOUT the locale prefix (az has none; `/ru/...`, `/en/...` are added by
 * next-intl `Link` / `redirect`).
 *
 * This file is an append-only registry: keys never change meaning, never get renamed.
 * `core/routes/guards.ts` carries the guard for each of these paths.
 */

export const paths = {
  // ---- marketing (public, landing layout) -------------------------------------------------
  landing: '/',
  cashback: '/cashback',
  /** Marketing partners page. The in-app partner directory is `marketPartners`. */
  partners: '/partners',
  delivery: '/delivery',
  ten: '/ten',
  contact: '/contact',
  terms: '/terms',
  privacy: '/privacy',
  sitemap: '/sitemap.xml',
  robots: '/robots.txt',

  // ---- auth / onboarding ------------------------------------------------------------------
  splash: '/splash',
  onboarding: '/onboarding',
  /** `/onboarding?step=1..3` (RG2–4). */
  onboardingStep: (step: 1 | 2 | 3) => `/onboarding?step=${step}`,
  login: '/login',
  /** `/login?next=<encoded path>` — use `safeNext()` on the way back out. */
  loginNext: (next: string) => `/login?next=${encodeURIComponent(next)}`,
  otp: '/otp',
  register: '/register',
  citySelect: '/city-select',
  welcome: '/welcome',
  permissionNotifications: '/permission/notifications',
  permissionLocation: '/permission/location',

  // ---- app core ---------------------------------------------------------------------------
  home: '/home',
  market: '/market',
  offers: '/offers',
  search: '/search',
  /** `/search?q=…` (AX1–3). */
  searchQuery: (q: string) => `/search?q=${encodeURIComponent(q)}`,
  notifications: '/notifications',
  favorites: '/favorites',
  cart: '/cart',
  /** OD3 promo-code sheet, a URL state of `/cart`. */
  cartPromo: '/cart?sheet=promo',
  /** OD4 delivery-time sheet, a URL state of `/cart`. */
  cartDeliveryTime: '/cart?sheet=time',
  store: (id: string | number) => `/market/store/${id}`,
  product: (id: string | number) => `/market/product/${id}`,
  category: (id: string | number) => `/market/category/${id}`,
  /** Demo restaurants — `@/modules/restaurants`, no backend behind it. */
  restaurants: '/market/restaurants',
  restaurant: (id: string | number) => `/market/restaurants/${id}`,
  tens: '/market/tens',
  discounts: '/offers/discounts',
  /** L7/PR6–8 discounts filtered by category: `/offers/discounts?category=…`. */
  discountsCategory: (categoryId: string | number) => `/offers/discounts?category=${categoryId}`,

  // ---- card & loyalty ---------------------------------------------------------------------
  card: '/card',
  cardOffline: '/card/offline',
  cardTransactions: '/card/transactions',
  cardTransaction: (id: string | number) => `/card/transactions/${id}`,
  /** Flag `loyaltyTiers`. */
  cardLevels: '/card/levels',
  coupons: '/coupons',
  coupon: (id: string | number) => `/coupons/${id}`,
  lottery: '/lottery',
  lotteryTickets: '/lottery/tickets',
  lotteryTicket: (id: string | number) => `/lottery/tickets/${id}`,
  lotteryRules: '/lottery/rules',
  lotteryResults: '/lottery/results',
  lotteryPrizes: '/lottery/prizes',

  // ---- checkout & orders ------------------------------------------------------------------
  checkoutPayment: '/checkout/payment',
  checkoutAddCard: '/checkout/add-card',
  orders: '/orders',
  order: (id: string | number) => `/orders/${id}`,
  orderTrack: (id: string | number) => `/orders/${id}/track`,
  /** N5 digital receipt. Flag `rewards`. */
  orderReceipt: (id: string | number) => `/orders/${id}/receipt`,
  orderSuccess: (id: string | number) => `/orders/success?order=${id}`,
  orderFailed: (id: string | number) => `/orders/failed?order=${id}`,

  // ---- partners (in-app) ------------------------------------------------------------------
  marketPartners: '/market/partners',
  marketPartner: (id: string | number) => `/market/partners/${id}`,
  marketPartnerBranches: (id: string | number) => `/market/partners/${id}/branches`,
  marketPartnersMap: '/market/partners/map',
  /** "Become a partner" demo screen (auth, no flag). */
  workPartner: '/work/partner',

  // ---- addresses --------------------------------------------------------------------------
  addresses: '/addresses',
  addressNew: '/addresses/new',
  addressPick: '/addresses/pick',
  addressSearch: '/addresses/search',

  // ---- profile / settings / help ----------------------------------------------------------
  profile: '/profile',
  profileEdit: '/profile/edit',
  settings: '/settings',
  settingsLanguage: '/settings/language',
  settingsAppearance: '/settings/appearance',
  settingsNotifications: '/settings/notifications',
  /** Chat behind flag `supportChat`; falls back to `/help` + contact when off. */
  support: '/support',
  /** Flag `referral`. */
  invite: '/invite',
  accountDelete: '/account/delete',
  help: '/help',
  history: '/history',

  // ---- rewards (flag `rewards`, placeholder data) -----------------------------------------
  rewardsWheel: '/rewards/wheel',
  rewardsMissions: '/rewards/missions',
  rewardsFamilyCard: '/rewards/family-card',
  rewardsSmartList: '/rewards/smart-list',
  rewardsPriceAlerts: '/rewards/price-alerts',

  // ---- mock module: image_search (flag `imageSearch`) -------------------------------------
  searchImage: '/search/image',

  // ---- mock module: topup (flag `topup`) --------------------------------------------------
  topup: '/topup',
  topupCard: '/topup/card',
  topupCashier: '/topup/cashier',
  topupResult: '/topup/result',

  // ---- mock module: courier (flag `courier`) ----------------------------------------------
  courierApply: '/courier/apply',
  courierApplyStatus: '/courier/apply/status',
  courier: '/courier',
  courierOrder: (id: string | number) => `/courier/orders/${id}`,
  courierDelivery: (id: string | number) => `/courier/delivery/${id}`,
  courierEarnings: '/courier/earnings',
  courierHistory: '/courier/history',

  // ---- mock module: parcel (flag `parcel`) ------------------------------------------------
  parcel: '/parcel',
  parcelNew: '/parcel/new',
  parcelDetail: (id: string | number) => `/parcel/${id}`,

  // ---- idea module: courier_plus (flag `courierPlus`) -------------------------------------
  courierPlus: '/courier-plus',
  courierPlusRoute: '/courier-plus/route',
  courierPlusMatches: '/courier-plus/matches',
  courierPlusTrack: (id: string | number) => `/courier-plus/track/${id}`,
  courierPlusEarnings: '/courier-plus/earnings',
  courierPlusHubRegister: '/courier-plus/hub/register',
  courierPlusHub: '/courier-plus/hub',

  // ---- idea module: courier_shop (flag `courierShop`) -------------------------------------
  courierServices: '/courier-services',
  courierBag: '/courier-bag',
  courierFit: '/courier-fit',
  courierFitDoorstep: '/courier-fit/doorstep',
  courierExpert: '/courier-expert',
  courierExpertBooking: '/courier-expert/booking',

  // ---- idea module: family_limits (flag `familyLimits`) -----------------------------------
  familyLimits: '/family-limits',
  familyLimit: (id: string | number) => `/family-limits/${id}`,
  familyLimitEdit: (id: string | number) => `/family-limits/${id}/edit`,

  // ---- idea module: ask_to_buy (flag `askToBuy`) ------------------------------------------
  askToBuy: '/ask-to-buy',
  askToBuySend: '/ask-to-buy/send',
  askToBuyRequest: (id: string | number) => `/ask-to-buy/${id}`,

  // ---- idea module: senior (flag `senior`) ------------------------------------------------
  seniorMode: '/senior/mode',
  seniorPension: '/senior/pension',
  seniorNeighbor: '/senior/neighbor',
  seniorNeighborNew: '/senior/neighbor/new',

  // ---- idea module: price_lock (flag `priceLock`) -----------------------------------------
  priceGuarantee: '/price-guarantee',
  priceLocks: '/price-locks',

  // ---- idea module: group_buy (flag `groupBuy`) -------------------------------------------
  groupBuy: '/group-buy',
  groupBuyCreate: '/group-buy/create',
  groupBuyDeal: (id: string | number) => `/group-buy/deal/${id}`,

  // ---- idea module: savings_jar (flag `savingsJar`) ---------------------------------------
  savingsJar: '/savings-jar',
  savingsJarSettings: '/savings-jar/settings',

  // ---- idea module: school (flag `school`) ------------------------------------------------
  school: '/school',
  schoolGrades: '/school/grades',
  schoolClassList: '/school/class-list',
  schoolStudentCard: '/school/student-card',

  // ---- idea module: viral (flag `viral`) --------------------------------------------------
  viral: '/viral',
  viralWishlists: '/viral/wishlists',
  viralWishlistNew: '/viral/wishlists/new',
  viralWishlist: (id: string | number) => `/viral/wishlists/${id}`,
  viralAuctions: '/viral/auctions',
  viralAuction: (id: string | number) => `/viral/auctions/${id}`,
  viralReceiptScan: '/viral/receipt-scan',
} as const;

export type PathKey = keyof typeof paths;

/** Every static path in the registry (builders excluded) — used by sitemap/tests/debug tools. */
export const staticPaths: readonly string[] = (Object.values(paths) as unknown[]).filter(
  (v): v is string => typeof v === 'string',
);

/** The marketing paths that belong in `sitemap.xml` (× 3 locales). */
export const marketingPaths: readonly string[] = [
  paths.landing,
  paths.cashback,
  paths.partners,
  paths.delivery,
  paths.ten,
  paths.contact,
  paths.terms,
  paths.privacy,
];

/**
 * Is `next` a safe same-origin return path?
 * Must start with a single `/`, must not be protocol-relative (`//host`), must carry no scheme and
 * no backslash tricks (`/\evil.com`), and must not contain a newline or control character.
 * (03-auth-session.md: "`next` param allow-list (same-origin path only)".)
 */
export function isSamePathTarget(next: string): boolean {
  if (typeof next !== 'string' || next.length === 0 || next.length > 2048) return false;
  if (next[0] !== '/') return false;
  if (next[1] === '/' || next[1] === '\\') return false;
  if (next.includes('\\')) return false;
  if (/[\u0000-\u001f\u007f]/.test(next)) return false; // newline / control-character smuggling
  if (/^\/[^/?#]*:/.test(next)) return false; // "/javascript:…" style
  if (/^\s*[a-z][a-z0-9+.-]*:/i.test(next)) return false; // any scheme
  return true;
}

/** `next` when it is a safe same-origin path, otherwise `fallback` (default `/home`). */
export function safeNext(next: string | null | undefined, fallback: string = paths.home): string {
  if (!next) return fallback;
  let candidate = next;
  try {
    candidate = decodeURIComponent(next);
  } catch {
    // keep the raw value; it is validated below either way
  }
  return isSamePathTarget(candidate) ? candidate : fallback;
}
