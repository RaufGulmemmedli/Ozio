/**
 * Demo fixtures for the senior module.
 *
 * az copy is verbatim from `html/mock-family-senior/senior-*.html`; ru / en are faithful
 * translations. The mock handler resolves one language per request (`?locale=`).
 *
 * The basket adds up to the 20,47 ₼ the export draws, so the total is a consequence of the rows
 * rather than a second fixture. Addresses and names are Baku-realistic.
 */
import type { HelpKind, HelpStatus } from './models/help-request';

export type Locale = 'az' | 'ru' | 'en';

export type Localized = Readonly<Record<Locale, string>>;

export const pick = (value: Localized, locale: Locale): string => value[locale] ?? value.az;

const PIECE: Localized = { az: 'ədəd', ru: 'шт', en: 'pcs' };
const KG: Localized = { az: 'kq', ru: 'кг', en: 'kg' };

export interface SeedBasketItem {
  id: string;
  name: Localized;
  qty: number;
  unit: Localized;
  unitPrice: number;
}

/* ------------------------------------------------------------------ pension plan */

/** `Əsas ərzaq səbəti`: 2,40 + 5,67 + 2,90 + 4,20 + 3,50 + 1,80 = 20,47 ₼. */
export const SEED_BASKET: readonly SeedBasketItem[] = [
  {
    id: 'bread',
    name: { az: 'Çörək', ru: 'Хлеб', en: 'Bread' },
    qty: 4,
    unit: PIECE,
    unitPrice: 0.6,
  },
  {
    id: 'milk',
    name: { az: 'Süd 1 L', ru: 'Молоко 1 л', en: 'Milk 1 L' },
    qty: 3,
    unit: PIECE,
    unitPrice: 1.89,
  },
  {
    id: 'rice',
    name: { az: 'Düyü', ru: 'Рис', en: 'Rice' },
    qty: 1,
    unit: KG,
    unitPrice: 2.9,
  },
  {
    id: 'oil',
    name: { az: 'Günəbaxan yağı 1 L', ru: 'Подсолнечное масло 1 л', en: 'Sunflower oil 1 L' },
    qty: 1,
    unit: PIECE,
    unitPrice: 4.2,
  },
  {
    id: 'eggs',
    name: { az: 'Yumurta', ru: 'Яйца', en: 'Eggs' },
    qty: 10,
    unit: PIECE,
    unitPrice: 0.35,
  },
  {
    id: 'sugar',
    name: { az: 'Şəkər', ru: 'Сахар', en: 'Sugar' },
    qty: 1,
    unit: KG,
    unitPrice: 1.8,
  },
] as const;

/** The monthly pension figure in the banner. */
export const SEED_PENSION = 340;

/** Payday is the 25th of each month — the banner counts down to the next one. */
export const PAYDAY_DAY_OF_MONTH = 25;

/** The demo order number the result banner shows, and its order id. */
export const SEED_ORDER_NUMBER = 'P-2291';
export const SEED_ORDER_ID = '48291';

/* ------------------------------------------------------------------ neighbour board */

export interface SeedHelpRequest {
  id: string;
  kind: HelpKind;
  requester: Localized;
  note: Localized;
  helper?: Localized;
  distanceKm: number;
  bonus: number;
  status: HelpStatus;
  mine: boolean;
}

export const SELF_NAME: Localized = { az: 'Mən', ru: 'Я', en: 'Me' };

/** The bonus a helper earns per errand, unless a row overrides it. */
export const DEFAULT_BONUS = 2;

export const SEED_HELP_REQUESTS: readonly SeedHelpRequest[] = [
  // ── "Kömək istə": the person's own requests
  {
    id: 'm1',
    kind: 'medicine',
    requester: SELF_NAME,
    note: {
      az: 'Metformin 500 mg, aptekdən',
      ru: 'Метформин 500 мг, из аптеки',
      en: 'Metformin 500 mg, from the pharmacy',
    },
    distanceKm: 0,
    bonus: DEFAULT_BONUS,
    status: 'open',
    mine: true,
  },
  {
    id: 'm2',
    kind: 'groceries',
    requester: SELF_NAME,
    note: { az: 'Çörək, süd və yumurta', ru: 'Хлеб, молоко и яйца', en: 'Bread, milk and eggs' },
    helper: { az: 'Günel xanım', ru: 'Гюнель ханым', en: 'Gunel' },
    distanceKm: 0,
    bonus: DEFAULT_BONUS,
    status: 'accepted',
    mine: true,
  },
  {
    id: 'm3',
    kind: 'trash',
    requester: SELF_NAME,
    note: { az: 'Zibil kisəsi həyətə', ru: 'Мусорный пакет во двор', en: 'Rubbish bag to the yard' },
    helper: { az: 'Rəşad', ru: 'Рашад', en: 'Rashad' },
    distanceKm: 0,
    bonus: DEFAULT_BONUS,
    status: 'completed',
    mine: true,
  },

  // ── "Köməyə get": nearby neighbours, all within walking distance in Nərimanov
  {
    id: 'n1',
    kind: 'medicine',
    requester: { az: 'Fatma xala', ru: 'Тётя Фатма', en: 'Fatma khala' },
    note: { az: 'Qan təzyiqi dərmanı', ru: 'Лекарство от давления', en: 'Blood-pressure medicine' },
    distanceKm: 0.35,
    bonus: DEFAULT_BONUS,
    status: 'open',
    mine: false,
  },
  {
    id: 'n2',
    kind: 'groceries',
    requester: { az: 'Tofiq kişi', ru: 'Дядя Тофиг', en: 'Tofig' },
    note: {
      az: '2 kq kartof, 1 çörək',
      ru: '2 кг картофеля, 1 хлеб',
      en: '2 kg potatoes, 1 loaf of bread',
    },
    distanceKm: 0.6,
    bonus: DEFAULT_BONUS,
    status: 'open',
    mine: false,
  },
  {
    id: 'n3',
    kind: 'trash',
    requester: { az: 'Zöhrə xanım', ru: 'Зохра ханым', en: 'Zohra' },
    note: { az: 'Zibil kisəsi', ru: 'Мусорный пакет', en: 'Rubbish bag' },
    helper: SELF_NAME,
    distanceKm: 1.1,
    bonus: DEFAULT_BONUS,
    status: 'completed',
    mine: false,
  },
] as const;

/** The dialog's note field cap. */
export const HELP_NOTE_MAX_LENGTH = 140;
