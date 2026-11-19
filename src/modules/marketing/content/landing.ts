/**
 * Static landing content — ids + non-translatable numbers only; every visible
 * string lives in `messages/parts/marketing.json`.
 *
 * Why static: `screens/api/screen-api-matrix.md` is explicit that the marketing
 * pages are static, and the three endpoints that would feed them
 * (`PartnersPartners`, `PartnersPlusCampaigns`, `PartnersTenCarts`) all require a
 * bearer token. A logged-out landing page must not fire an authenticated request,
 * so the figures and examples from the design export ARE the content.
 */

import type { LucideIcon } from '@/shared/lucide';
import {
  Baby,
  Beef,
  Croissant,
  CupSoda,
  Gift,
  Milk,
  Percent,
  ShoppingBasket,
  Snowflake,
  SprayCan,
  Wallet,
} from '@/shared/lucide';
import { paths } from '@/core/routes';

export interface StatItem {
  id: string;
  /** `home.stats.<id>.value` / `.label` / `.short` */
  highlight?: boolean;
}

/** Stats block `mGwhL` — 600 000+ / 750 000+ / 100+ / 800 000+, the 3rd in `yellow`. */
export const homeStats: StatItem[] = [
  { id: 'users' },
  { id: 'monthly' },
  { id: 'partners', highlight: true },
  { id: 'downloads' },
];

export type BentoTone = 'brand' | 'yellow' | 'block' | 'surface';

export interface BentoItem {
  id: 'cashback' | 'market' | 'ten' | 'discounts';
  tone: BentoTone;
  icon: LucideIcon;
  href: string;
  /** `true` → the 640-wide cell of its row at 1440 (`qO9eC` / `TPdPO`). */
  wide: boolean;
}

/** Ecosystem bento `n0vTGQ`: row 1 = Keşbek(640) + Market, row 2 = 10-lar + Endirimlər(640). */
export const homeBento: BentoItem[] = [
  { id: 'cashback', tone: 'brand', icon: Wallet, href: paths.cashback, wide: true },
  { id: 'market', tone: 'yellow', icon: ShoppingBasket, href: paths.delivery, wide: false },
  { id: 'ten', tone: 'block', icon: Gift, href: paths.ten, wide: false },
  { id: 'discounts', tone: 'surface', icon: Percent, href: paths.discounts, wide: true },
];

/** How `CopsG` — 01 / 02 / 03. */
export const homeSteps = ['step1', 'step2', 'step3'] as const;

/** Market chips `YEPSp`; the export draws the labels as "Kateqoriya", the node names carry them. */
export const homeMarketChips = [
  { id: 'all', href: paths.market },
  { id: 'fruit', href: paths.market },
  { id: 'dairy', href: paths.market },
  { id: 'bread', href: paths.market },
  { id: 'drinks', href: paths.market },
] as const;

export interface ProductSample {
  id: string;
  /** `categoryIcon()` slug for the `<ProductImage>` fallback tile — no photo ships. */
  category: string;
  discount?: boolean;
}

/** The four product cards of `YEPSp` (prices are the export's sample values). */
export const homeProducts: ProductSample[] = [
  { id: 'apple', category: 'fruit', discount: true },
  { id: 'croissant', category: 'bakery' },
  { id: 'bread', category: 'bread', discount: true },
  { id: 'tomato', category: 'fruit', discount: true },
];

/** FAQ `e52M7m` — 4 questions; only a1 is drawn in the export, a2–a4 are authored copy. */
export const homeFaq = ['1', '2', '3', '4'] as const;

/** Trust row `BLAz5` — 4 overlapping 36 px avatars, decorative. */
export const trustAvatarTones = ['brand', 'yellow', 'violet', 'sky'] as const;

/** `/delivery` category tiles `l69lqE` (counts are the export's sample numbers). */
export const deliveryCategories = [
  { id: 'fruit', count: 1240, icon: ShoppingBasket },
  { id: 'dairy', count: 680, icon: Milk },
  { id: 'meat', count: 420, icon: Beef },
  { id: 'bakery', count: 510, icon: Croissant },
  { id: 'drinks', count: 760, icon: CupSoda },
  { id: 'frozen', count: 340, icon: Snowflake },
  { id: 'cleaning', count: 590, icon: SprayCan },
  { id: 'baby', count: 380, icon: Baby },
] as const;

/** `/delivery` featured products `Zapng` — 8 cards (4 reused from the home row). */
export const deliveryProducts: ProductSample[] = [
  { id: 'home.products.apple', category: 'fruit', discount: true },
  { id: 'home.products.tomato', category: 'fruit' },
  { id: 'home.products.bread', category: 'bread' },
  { id: 'home.products.croissant', category: 'bakery' },
  { id: 'delivery.products.strawberry', category: 'fruit' },
  { id: 'delivery.products.greenApple', category: 'fruit' },
  { id: 'delivery.products.cheeseCroissant', category: 'bakery' },
  { id: 'delivery.products.tandir', category: 'bread' },
];

export const deliveryDistricts = [
  'narimanov',
  'yasamal',
  'nasimi',
  'binagadi',
  'khatai',
] as const;

export const deliverySteps = ['step1', 'step2', 'step3', 'step4'] as const;

/** `/cashback` rate table `NPqtl` — percentages are sample data, see `cashback.rates.note`. */
export const cashbackRates = [
  'market',
  'fashion',
  'electronics',
  'cafe',
  'pharmacy',
  'special',
] as const;

/** `/cashback` campaign strip `I8aWr`. */
export const cashbackCampaigns = ['cafe', 'friday', 'double', 'pharmacy'] as const;

/** `/ten` monthly gift grid `ebKD1`. */
export const tenGifts = [
  'freeDelivery',
  'discount',
  'coffee',
  'coupon',
  'double',
  'lottery',
] as const;

export interface PartnerSample {
  id: string;
  /** `partners.categories.<category>` */
  category: 'market' | 'fashion' | 'electronics' | 'cafe' | 'pharmacy' | 'home';
  rate: string;
  branches: number;
  initial: string;
}

/**
 * `/partners` grid `jxh78` — the 12 example partners from the export.
 *
 * NOT fetched: `GET v1/ozio-partners` (`PartnersPartners`) is `auth: bearer`, so a
 * logged-out page cannot call it. The real directory lives behind the app at
 * `/market/partners`.
 */
export const partnerSamples: PartnerSample[] = [
  { id: 'bazarPlus', category: 'market', rate: '1,5%', branches: 14, initial: 'B' },
  { id: 'modaStudio', category: 'fashion', rate: '5%', branches: 14, initial: 'M' },
  { id: 'texnoHub', category: 'electronics', rate: '3%', branches: 14, initial: 'T' },
  { id: 'kafeShirin', category: 'cafe', rate: '7%', branches: 14, initial: 'K' },
  { id: 'aptekSaglam', category: 'pharmacy', rate: '4%', branches: 14, initial: 'A' },
  { id: 'yashilMarket', category: 'market', rate: '2%', branches: 14, initial: 'Y' },
  { id: 'sportZone', category: 'fashion', rate: '6%', branches: 14, initial: 'S' },
  { id: 'demirElektro', category: 'electronics', rate: '3,5%', branches: 14, initial: 'D' },
  { id: 'qehveEvi', category: 'cafe', rate: '8%', branches: 14, initial: 'Q' },
  { id: 'nurOptika', category: 'pharmacy', rate: '5%', branches: 14, initial: 'N' },
  { id: 'lalButik', category: 'fashion', rate: '10%', branches: 14, initial: 'L' },
  { id: 'evDunyasi', category: 'home', rate: '4%', branches: 14, initial: 'E' },
];

export const partnerCategories = [
  'all',
  'market',
  'fashion',
  'electronics',
  'cafe',
  'pharmacy',
  'beauty',
  'home',
] as const;

export const contactTopics = [
  'order',
  'cashback',
  'payment',
  'partnership',
  'other',
] as const;

export type ContactTopic = (typeof contactTopics)[number];
