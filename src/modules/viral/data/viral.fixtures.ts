/**
 * The viral demo's seed data (`api/mock-modules.md` §18 + `mock-contracts.ts` `VIRAL_SAMPLE`).
 *
 * Every user-visible string is a `*_translations: [{ locale, name }]` array — the real API's shape
 * — so the handler can answer in az / ru / en and the parsers use the ordinary `pickTranslation()`
 * reader. Products, prices, contributor names and the receipt are all the ones the design export
 * draws.
 */

export type Translations = readonly { locale: string; name: string }[];

const tr = (az: string, ru: string, en: string): Translations => [
  { locale: 'az', name: az },
  { locale: 'ru', name: ru },
  { locale: 'en', name: en },
];

/** 600 ms for reads, 1500 ms for the receipt scan (`MOCK_LATENCY_MS.viral` / `.viralScan`). */
export const VIRAL_DELAY_MS = 600;
export const VIRAL_SCAN_DELAY_MS = 1500;

/** The share-link host the mock issues (`mock-modules.md` §18). */
export const SHARE_LINK_BASE = 'https://ozio10.az/g';

/* ------------------------------------------------------------------ gift products */

export interface GiftProductSeed {
  id: string;
  name: Translations;
  price: number;
  /** Category slug → the fallback glyph (`bike`, `smartphone`, `headphones`, `bot`, `coffee`). */
  icon: 'bike' | 'smartphone' | 'headphones' | 'bot' | 'coffee';
}

export const GIFT_PRODUCT_SEED: readonly GiftProductSeed[] = [
  {
    id: 'p1',
    name: tr('Velosiped Trek 26"', 'Велосипед Trek 26"', 'Trek 26" bicycle'),
    price: 480,
    icon: 'bike',
  },
  {
    id: 'p2',
    name: tr('Smartfon Galaxy A55', 'Смартфон Galaxy A55', 'Galaxy A55 smartphone'),
    price: 620,
    icon: 'smartphone',
  },
  {
    id: 'p3',
    name: tr('Qulaqlıq AirPods', 'Наушники AirPods', 'AirPods headphones'),
    price: 260,
    icon: 'headphones',
  },
  {
    id: 'p4',
    name: tr('Robot tozsoran', 'Робот-пылесос', 'Robot vacuum'),
    price: 340,
    icon: 'bot',
  },
  {
    id: 'p5',
    name: tr('Qəhvə maşını', 'Кофемашина', 'Coffee machine'),
    price: 190,
    icon: 'coffee',
  },
] as const;

/* --------------------------------------------------------------------- wishlists */

export const OCCASIONS = ['birthday', 'wedding', 'graduation'] as const;
export type OccasionKey = (typeof OCCASIONS)[number];

export interface WishlistSeed {
  id: string;
  productId: string;
  occasion: OccasionKey;
  /** Days from the demo's first run to the target date. */
  inDays: number;
  message: Translations;
  /** `[name, amount, hoursAgo]`, newest first. */
  contributions: readonly [string, number, number][];
}

export const WISHLIST_SEED: readonly WishlistSeed[] = [
  {
    id: 'c1',
    productId: 'p1',
    occasion: 'birthday',
    inDays: 12,
    message: tr(
      'Ad günümə velosiped istəyirəm!',
      'Хочу велосипед на день рождения!',
      'I would love a bicycle for my birthday!',
    ),
    contributions: [
      ['Leyla', 20, 3],
      ['Rəşad', 10, 24],
      ['Nigar', 50, 48],
    ],
  },
  {
    id: 'c2',
    productId: 'p5',
    occasion: 'wedding',
    inDays: 40,
    message: tr('Toyumuza qəhvə maşını!', 'Кофемашину на нашу свадьбу!', 'A coffee machine for our wedding!'),
    contributions: [
      ['Elnur', 100, 120],
      ['Aysel', 90, 144],
    ],
  },
] as const;

/** The contribution chips the dialog offers, plus the "Digər" free amount. */
export const CONTRIBUTION_CHIPS = [5, 10, 20] as const;

/** The name a contribution the user makes is filed under ("Мən" / "Я" / "Me"). */
export const SELF_CONTRIBUTOR = tr('Mən', 'Я', 'Me');

/* ---------------------------------------------------------------------- auctions */

export interface AuctionSeed {
  id: string;
  title: Translations;
  startPrice: number;
  floorPrice: number;
  totalStock: number;
  /** AZN per drop. */
  step: number;
  icon: 'tv' | 'watch' | 'pot';
  /**
   * How far into its run this auction already is when the demo is first seeded, in seconds.
   *
   * The staggering is deliberate:
   *  - `a1` lands on exactly the state V6 draws (812 ₼, 63 / 100 left);
   *  - `a3` is seconds from its floor, so the "Qaçırdın" / ended state is reachable in the demo
   *    without waiting out a whole run.
   */
  headStartSec: number;
}

/**
 * The V6 subtitle in the export reads "Qiymət hər 5 saniyədə 1 ₼ düşür", so the web uses 5 s per
 * drop (`mock-contracts.ts` pins 3 s for the Flutter build). The handler sends this number, so the
 * copy is parameterized rather than hardcoded.
 */
export const SECONDS_PER_DROP = 5;

/**
 * One unit of stock leaves every this many seconds, deterministically (no `Math.random()`, so a
 * reload never teleports the counter).
 *
 * 12 s is not arbitrary: together with `a1`'s head start it reproduces the exact state V6 draws —
 * **812 ₼** and **63 / 100 qalıb** — on the first load of the demo.
 */
export const SECONDS_PER_STOCK_UNIT = 12;

/** A bid must beat (or match) the live price — the handler's rule, never the client's. */
export const MIN_BID_INCREMENT = 0;

export const AUCTION_SEED: readonly AuctionSeed[] = [
  {
    id: 'a1',
    title: tr('Televizor 55" 4K', 'Телевизор 55" 4K', '55" 4K television'),
    startPrice: 900,
    floorPrice: 700,
    totalStock: 100,
    step: 1,
    icon: 'tv',
    // 444 s → 88 drops → 812 ₼, and 37 units sold → 63 / 100 left: the drawn V6 state.
    headStartSec: 444,
  },
  {
    id: 'a2',
    title: tr('Smart saat', 'Умные часы', 'Smart watch'),
    startPrice: 250,
    floorPrice: 150,
    totalStock: 60,
    step: 1,
    icon: 'watch',
    headStartSec: 120,
  },
  {
    id: 'a3',
    title: tr('Blender dəsti', 'Набор блендера', 'Blender set'),
    startPrice: 120,
    floorPrice: 70,
    totalStock: 40,
    step: 1,
    icon: 'pot',
    headStartSec: 232,
  },
];

/** The synthetic bidders the handler cycles through as time passes. */
export const BIDDER_NAMES = [
  'Aysel',
  'Rəşad',
  'Leyla',
  'Elvin',
  'Nigar',
  'Tural',
  'Günel',
  'Orxan',
  'Fidan',
  'Samir',
] as const;

/* ----------------------------------------------------------------------- receipt */

export interface ReceiptItemSeed {
  name: Translations;
  qty: number;
  storePrice: number;
  /** 90 % of the store price (`mock-modules.md` §18). */
  ozioPrice: number;
}

export const RECEIPT_STORE = tr('Bravo Supermarket', 'Bravo Supermarket', 'Bravo Supermarket');

export const RECEIPT_ITEM_SEED: readonly ReceiptItemSeed[] = [
  { name: tr('Süd 1L', 'Молоко 1 л', 'Milk 1 L'), qty: 2, storePrice: 2.1, ozioPrice: 1.89 },
  { name: tr('Çörək', 'Хлеб', 'Bread'), qty: 3, storePrice: 0.8, ozioPrice: 0.72 },
  {
    name: tr('Yumurta 10 ədəd', 'Яйца 10 шт.', 'Eggs, 10 pcs'),
    qty: 1,
    storePrice: 4.5,
    ozioPrice: 4.05,
  },
  { name: tr('Pendir 400q', 'Сыр 400 г', 'Cheese 400 g'), qty: 1, storePrice: 7.9, ozioPrice: 7.11 },
  { name: tr('Alma 1kq', 'Яблоки 1 кг', 'Apples 1 kg'), qty: 2, storePrice: 2.6, ozioPrice: 2.34 },
] as const;

/** How much cheaper the same basket is at Ozio — the headline on the comparison card. */
export const RECEIPT_DISCOUNT_PERCENT = 10;

/**
 * A documented demo hook: an image narrower than this is answered with "çek tanınmadı", so the
 * not-recognized state is reachable on purpose rather than by accident.
 */
export const MIN_RECOGNIZABLE_WIDTH = 200;
