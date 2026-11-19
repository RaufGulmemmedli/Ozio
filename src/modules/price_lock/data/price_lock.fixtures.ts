/**
 * The price_lock demo fixtures — the only place prices, product copy and the window lengths live.
 *
 * Shapes and numbers match `src/core/api/contracts/mock-contracts.ts` §14 and
 * `web-handoff/api/mock-modules.md` §14. All copy is az/ru/en.
 */

/** A `translations: [{locale, name}]` row, exactly like the real catalog endpoints send. */
export interface FixtureName {
  locale: 'az' | 'ru' | 'en';
  name: string;
}

export interface StapleFixture {
  id: string;
  lockedPrice: number;
  marketPrice: number;
  translations: FixtureName[];
}

/** `PriceLockRepository.lockDays` / `lockDeposit` (mock-modules.md §14 "Constants"). */
export const PRICE_LOCK_DAYS = 15;
export const PRICE_LOCK_DEPOSIT = 1;

/** The guarantee window: 6 calendar months, started 38 days ago once the card is linked. */
export const GUARANTEE_MONTHS = 6;
export const GUARANTEE_STARTED_DAYS_AGO = 38;

/** The eight staples the guarantee covers. */
export const PRICE_LOCK_STAPLES: readonly StapleFixture[] = [
  {
    id: 's1',
    lockedPrice: 3.2,
    marketPrice: 3.6,
    translations: [
      { locale: 'az', name: 'Günəbaxan yağı 1 L' },
      { locale: 'ru', name: 'Подсолнечное масло 1 л' },
      { locale: 'en', name: 'Sunflower oil 1 L' },
    ],
  },
  {
    id: 's2',
    lockedPrice: 2.8,
    marketPrice: 2.8,
    translations: [
      { locale: 'az', name: 'Buğda unu 2 kq' },
      { locale: 'ru', name: 'Пшеничная мука 2 кг' },
      { locale: 'en', name: 'Wheat flour 2 kg' },
    ],
  },
  {
    id: 's3',
    lockedPrice: 2.1,
    marketPrice: 2.35,
    translations: [
      { locale: 'az', name: 'Qara çay 100 q' },
      { locale: 'ru', name: 'Чёрный чай 100 г' },
      { locale: 'en', name: 'Black tea 100 g' },
    ],
  },
  {
    id: 's4',
    lockedPrice: 1.6,
    marketPrice: 1.9,
    translations: [
      { locale: 'az', name: 'Şəkər tozu 1 kq' },
      { locale: 'ru', name: 'Сахарный песок 1 кг' },
      { locale: 'en', name: 'Granulated sugar 1 kg' },
    ],
  },
  {
    id: 's5',
    lockedPrice: 2.4,
    marketPrice: 2.4,
    translations: [
      { locale: 'az', name: 'Ağ düyü 1 kq' },
      { locale: 'ru', name: 'Белый рис 1 кг' },
      { locale: 'en', name: 'White rice 1 kg' },
    ],
  },
  {
    id: 's6',
    lockedPrice: 1.1,
    marketPrice: 1.1,
    translations: [
      { locale: 'az', name: 'Makaron 500 q' },
      { locale: 'ru', name: 'Макароны 500 г' },
      { locale: 'en', name: 'Pasta 500 g' },
    ],
  },
  {
    id: 's7',
    lockedPrice: 0.9,
    marketPrice: 1.05,
    translations: [
      { locale: 'az', name: 'Tualet sabunu' },
      { locale: 'ru', name: 'Туалетное мыло' },
      { locale: 'en', name: 'Toilet soap' },
    ],
  },
  {
    id: 's8',
    lockedPrice: 2.5,
    marketPrice: 2.5,
    translations: [
      { locale: 'az', name: 'Diş pastası' },
      { locale: 'ru', name: 'Зубная паста' },
      { locale: 'en', name: 'Toothpaste' },
    ],
  },
] as const;

export type LockStatusFixture = 'active' | 'used' | 'expired';

export interface LockFixture {
  id: string;
  lockedPrice: number;
  currentPrice: number;
  /** Days from the moment the db is seeded; negative = already past. */
  expiresInDays: number;
  status: LockStatusFixture;
  translations: FixtureName[];
}

/** PL2's two active locks and the two history rows from the combined PL2/PL3 frame. */
export const PRICE_LOCKS: readonly LockFixture[] = [
  {
    id: 'l1',
    lockedPrice: 3.2,
    currentPrice: 3.65,
    expiresInDays: 11.125,
    status: 'active',
    translations: [
      { locale: 'az', name: 'Günəbaxan yağı 1 L' },
      { locale: 'ru', name: 'Подсолнечное масло 1 л' },
      { locale: 'en', name: 'Sunflower oil 1 L' },
    ],
  },
  {
    id: 'l2',
    lockedPrice: 2.4,
    currentPrice: 2.4,
    expiresInDays: 4.125,
    status: 'active',
    translations: [
      { locale: 'az', name: 'Ağ düyü 1 kq' },
      { locale: 'ru', name: 'Белый рис 1 кг' },
      { locale: 'en', name: 'White rice 1 kg' },
    ],
  },
  {
    id: 'l3',
    lockedPrice: 5.9,
    currentPrice: 6.3,
    expiresInDays: -20,
    status: 'used',
    translations: [
      { locale: 'az', name: 'Tam südlü pendir 400 q' },
      { locale: 'ru', name: 'Сыр из цельного молока 400 г' },
      { locale: 'en', name: 'Whole-milk cheese 400 g' },
    ],
  },
  {
    id: 'l4',
    lockedPrice: 1.1,
    currentPrice: 1.05,
    expiresInDays: -40,
    status: 'expired',
    translations: [
      { locale: 'az', name: 'Makaron 500 q' },
      { locale: 'ru', name: 'Макароны 500 г' },
      { locale: 'en', name: 'Pasta 500 g' },
    ],
  },
] as const;
