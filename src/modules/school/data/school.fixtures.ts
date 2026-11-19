/**
 * The school demo's seed data (`api/mock-modules.md` §16 + `mock-contracts.ts` `SCHOOL_SAMPLE`).
 *
 * Every piece of user-visible text is a `*_translations: [{ locale, name }]` array — exactly the
 * shape the real API uses — so the handler can answer in az / ru / en and the parsers use the
 * ordinary `pickTranslation()` reader. No string in this file is ever rendered without going
 * through a parser first.
 *
 * Names, schools, class numbers and prices are the ones from the design export
 * (`sc1`–`sc4` + `sc-states-dialogs`), not placeholders.
 */

/** The `{ locale, name }` rows the real API sends for a translatable field. */
export type Translations = readonly { locale: string; name: string }[];

const tr = (az: string, ru: string, en: string): Translations => [
  { locale: 'az', name: az },
  { locale: 'ru', name: ru },
  { locale: 'en', name: en },
];

/** 700 ms — the latency `mock-contracts.ts` pins for this module. */
export const SCHOOL_DELAY_MS = 700;
/** The fake-OCR upload is slower than a read, so the button spinner is visible. */
export const SCHOOL_UPLOAD_DELAY_MS = 1200;
/** `none -> pending -> linked`: the card verifies for this long (mock-modules.md §16). */
export const STUDENT_CARD_VERIFY_MS = 700;
/** A student number shorter than this is rejected by the handler. */
export const STUDENT_NUMBER_MIN_LENGTH = 6;

/** `NIGHT_DISCOUNT_PERCENT` + the 22:00–06:00 window, as the mock reports them. */
export const NIGHT_DISCOUNT = {
  percent: 15,
  startHour: 22,
  endHour: 6,
} as const;

/* ------------------------------------------------------------------ grades */

export const SUBJECT_NAMES = {
  math: tr('Riyaziyyat', 'Математика', 'Mathematics'),
  az: tr('Azərbaycan dili', 'Азербайджанский язык', 'Azerbaijani'),
  en: tr('İngilis dili', 'Английский язык', 'English'),
  science: tr('Təbiət', 'Природоведение', 'Science'),
  history: tr('Tarix', 'История', 'History'),
} as const;

export type SubjectKey = keyof typeof SUBJECT_NAMES;

export interface GradeSeed {
  id: string;
  subject: SubjectKey;
  score: number;
  /** ISO date, no time — the export renders "10 Noy". */
  date: string;
  points: number;
}

/** g1 math 5 +20 · g2 az 4 +12 · g3 science 5 +20, balance 52 (mock-modules.md §16). */
export const GRADE_SEED: readonly GradeSeed[] = [
  { id: 'g1', subject: 'math', score: 5, date: '2026-11-10', points: 20 },
  { id: 'g2', subject: 'az', score: 4, date: '2026-11-08', points: 12 },
  { id: 'g3', subject: 'science', score: 5, date: '2026-11-05', points: 20 },
] as const;

export const GRADE_BALANCE_SEED = 52;

/** `uploadSample()`: a 5 and a 4, dated now, +32 points in total. */
export const UPLOAD_SAMPLE_GRADES: readonly { subject: SubjectKey; score: number; points: number }[] =
  [
    { subject: 'en', score: 5, points: 20 },
    { subject: 'history', score: 4, points: 12 },
  ] as const;

/** 5 -> +20, 4 -> +12; anything else earns nothing. */
export const POINTS_FOR_SCORE: Readonly<Record<number, number>> = { 5: 20, 4: 12 };

export interface RewardSeed {
  id: string;
  category: 'books' | 'sports' | 'accessories';
  percent: number;
  cost: number;
  title: Translations;
  /** The coupon the redeem handler hands back, so `/coupons` has something to show. */
  couponCode: string;
}

/** r1 books 5 % / 100 · r2 sports 7 % / 150 · r3 accessories 10 % / 220. */
export const REWARD_SEED: readonly RewardSeed[] = [
  {
    id: 'r1',
    category: 'books',
    percent: 5,
    cost: 100,
    title: tr('5% kitab endirimi', 'Скидка 5% на книги', '5% off books'),
    couponCode: 'TEHSIL5',
  },
  {
    id: 'r2',
    category: 'sports',
    percent: 7,
    cost: 150,
    title: tr('7% idman malları endirimi', 'Скидка 7% на спорттовары', '7% off sports goods'),
    couponCode: 'TEHSIL7',
  },
  {
    id: 'r3',
    category: 'accessories',
    percent: 10,
    cost: 220,
    title: tr('10% aksesuar endirimi', 'Скидка 10% на аксессуары', '10% off accessories'),
    couponCode: 'TEHSIL10',
  },
] as const;

/* -------------------------------------------------------------- class list */

export const SELLER_NAMES = {
  book_world: tr('Kitab Dünyası', 'Китаб Дуньясы', 'Kitab Dunyasi'),
  ozio_market: tr('Ozio Market', 'Ozio Market', 'Ozio Market'),
} as const;

export type SellerKey = keyof typeof SELLER_NAMES;

export interface ClassListItemSeed {
  name: Translations;
  qty: number;
  seller: SellerKey;
  unitPrice: number;
  /** Category slug for `<ProductImage>`'s fallback glyph. */
  category: string;
}

export interface ClassListSeed {
  id: string;
  title: Translations;
  school: Translations;
  sharedBy: Translations;
  savings: number;
  items: readonly ClassListItemSeed[];
}

/** Seed list `l1` — "3-cü sinif A" / "Məktəb №132" / "Səbinə müəllimə", savings 4,35 ₼. */
export const CLASS_LIST_SEED: readonly ClassListSeed[] = [
  {
    id: 'l1',
    title: tr('3-cü sinif A', '3-й класс А', 'Grade 3A'),
    school: tr('Məktəb №132', 'Школа №132', 'School No. 132'),
    sharedBy: tr('Səbinə müəllimə', 'Учитель Сабина', 'Ms Səbinə'),
    savings: 4.35,
    items: [
      {
        name: tr('Dəftər 48 vərəq', 'Тетрадь 48 листов', 'Notebook, 48 sheets'),
        qty: 10,
        seller: 'book_world',
        unitPrice: 0.65,
        category: 'stationery',
      },
      {
        name: tr('Rəsm albomu A4', 'Альбом для рисования A4', 'A4 drawing pad'),
        qty: 2,
        seller: 'ozio_market',
        unitPrice: 2.4,
        category: 'stationery',
      },
      {
        name: tr('Rəngli karandaş (12)', 'Цветные карандаши (12)', 'Coloured pencils (12)'),
        qty: 1,
        seller: 'ozio_market',
        unitPrice: 3.9,
        category: 'stationery',
      },
      {
        name: tr('Riyaziyyat dərsliyi', 'Учебник математики', 'Mathematics textbook'),
        qty: 1,
        seller: 'book_world',
        unitPrice: 7.8,
        category: 'books',
      },
    ],
  },
] as const;

/**
 * `createList`: every line gets qty 1, the seller alternates Ozio Market (even) / Kitab Dünyası
 * (odd) and the unit price is `1.5 + index` (mock-modules.md §16). The price is the *handler's*
 * arithmetic, never a component's.
 */
export const createdLineSeller = (index: number): SellerKey =>
  index % 2 === 0 ? 'ozio_market' : 'book_world';
export const createdLineUnitPrice = (index: number): number => 1.5 + index;

/* ------------------------------------------------------------ student card */

/** The verified card number the export shows on SC4 ("Kart TB-204518"). */
export const STUDENT_CARD_NUMBER = 'TB-204518';

/** What the card is accepted for — the three categories drawn on SC4. */
export const NIGHT_CATEGORIES = [
  { id: 'snacks', name: tr('Qəlyanaltılar', 'Снеки', 'Snacks') },
  { id: 'coffee', name: tr('Qəhvə', 'Кофе', 'Coffee') },
  { id: 'digital', name: tr('Rəqəmsal məhsullar', 'Цифровые товары', 'Digital goods') },
] as const;
