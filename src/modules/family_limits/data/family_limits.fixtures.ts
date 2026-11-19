/**
 * Demo fixtures for "Üzv limitləri".
 *
 * az copy is verbatim from `html/mock-family-senior/limits-*.html`; ru / en are faithful
 * translations. The mock handler resolves one language per request (`?locale=`), the way a
 * localized API would.
 *
 * The numbers add up on purpose, so the summary strip the export draws (53,50 ₼ family spend,
 * 2 active limits, 1 exhausted) is a real consequence of the rows rather than a second fixture.
 */
import type { LimitCategory, LimitPeriod } from './models/limit-member';

export type Locale = 'az' | 'ru' | 'en';

export type Localized = Readonly<Record<Locale, string>>;

export const pick = (value: Localized, locale: Locale): string => value[locale] ?? value.az;

/** Chip labels (`Dəftərxana, Kitab, Qida, Oyuncaq, Qəlyanaltı, Gigiyena`). */
export const CATEGORY_LABEL: Readonly<Record<LimitCategory, Localized>> = {
  stationery: { az: 'Dəftərxana', ru: 'Канцелярия', en: 'Stationery' },
  books: { az: 'Kitab', ru: 'Книги', en: 'Books' },
  food: { az: 'Qida', ru: 'Продукты', en: 'Food' },
  toys: { az: 'Oyuncaq', ru: 'Игрушки', en: 'Toys' },
  snacks: { az: 'Qəlyanaltı', ru: 'Снеки', en: 'Snacks' },
  hygiene: { az: 'Gigiyena', ru: 'Гигиена', en: 'Hygiene' },
};

export interface SeedPurchase {
  id: string;
  title: Localized;
  category: LimitCategory;
  amount: number;
  /** Days before today — keeps `16 Noy` style dates plausible however long the demo runs. */
  daysAgo: number;
}

export interface SeedMember {
  id: string;
  name: Localized;
  role: Localized;
  age?: number;
  enabled: boolean;
  period: LimitPeriod;
  limit: number;
  spent: number;
  categories: LimitCategory[];
  purchases: SeedPurchase[];
}

export const SEED_MEMBERS: readonly SeedMember[] = [
  {
    id: 'aysel',
    name: { az: 'Aysel', ru: 'Айсель', en: 'Aysel' },
    role: { az: 'Qız', ru: 'Дочь', en: 'Daughter' },
    age: 12,
    enabled: true,
    period: 'monthly',
    limit: 40,
    spent: 28.5,
    categories: ['books', 'toys', 'stationery'],
    purchases: [
      {
        id: 'aysel-1',
        title: { az: 'Rəsm albomu', ru: 'Альбом для рисования', en: 'Sketch pad' },
        category: 'stationery',
        amount: 4.5,
        daysAgo: 1,
      },
      {
        id: 'aysel-2',
        title: { az: 'Konstruktor dəsti', ru: 'Набор конструктора', en: 'Building set' },
        category: 'toys',
        amount: 18,
        daysAgo: 4,
      },
      {
        id: 'aysel-3',
        title: { az: 'Nağıllar kitabı', ru: 'Книга сказок', en: 'Book of fairy tales' },
        category: 'books',
        amount: 6,
        daysAgo: 9,
      },
    ],
  },
  {
    id: 'elvin',
    name: { az: 'Elvin', ru: 'Эльвин', en: 'Elvin' },
    role: { az: 'Oğul', ru: 'Сын', en: 'Son' },
    age: 15,
    enabled: true,
    period: 'weekly',
    limit: 25,
    spent: 25,
    categories: ['stationery', 'books', 'food'],
    purchases: [
      {
        id: 'elvin-1',
        title: { az: 'Dəftər 48 vərəq', ru: 'Тетрадь 48 листов', en: 'Notebook, 48 pages' },
        category: 'stationery',
        amount: 1.8,
        daysAgo: 2,
      },
      {
        id: 'elvin-2',
        title: { az: 'Su 0,5 L', ru: 'Вода 0,5 л', en: 'Water 0.5 L' },
        category: 'food',
        amount: 0.8,
        daysAgo: 3,
      },
      {
        id: 'elvin-3',
        title: { az: 'Qəlyanaltı barı', ru: 'Батончик', en: 'Snack bar' },
        category: 'snacks',
        amount: 2.4,
        daysAgo: 4,
      },
      {
        id: 'elvin-4',
        title: { az: 'Roman, “Əli və Nino”', ru: 'Роман «Али и Нино»', en: 'Novel, “Ali and Nino”' },
        category: 'books',
        amount: 12,
        daysAgo: 6,
      },
      {
        id: 'elvin-5',
        title: { az: 'Qələm dəsti', ru: 'Набор ручек', en: 'Pen set' },
        category: 'stationery',
        amount: 8,
        daysAgo: 7,
      },
    ],
  },
  {
    id: 'sevda',
    name: { az: 'Sevda', ru: 'Севда', en: 'Sevda' },
    role: { az: 'Nənə', ru: 'Бабушка', en: 'Grandmother' },
    enabled: false,
    period: 'monthly',
    limit: 0,
    spent: 0,
    categories: [],
    purchases: [],
  },
] as const;
