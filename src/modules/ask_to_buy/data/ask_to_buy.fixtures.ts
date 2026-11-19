/**
 * Demo fixtures for "Al deyim".
 *
 * Copy is verbatim from the design export (`html/mock-family-senior/ask-*.html`) for az, with
 * faithful ru / en translations beside it — the mock handler resolves one language per request,
 * exactly as a localized API would (`?locale=`).
 *
 * Nothing here is ever charged: the amounts are fixture data and the "Pay" action only moves a
 * row's `status` in `localStorage`.
 */
import type { AskStatus, ParentRelation } from './models/ask-request';

export type Locale = 'az' | 'ru' | 'en';

export type Localized = Readonly<Record<Locale, string>>;

export const pick = (value: Localized, locale: Locale): string => value[locale] ?? value.az;

export interface SeedItem {
  id: string;
  name: Localized;
  unit?: Localized;
  qty: number;
  unitPrice: number;
}

export interface SeedRequest {
  id: string;
  reference: string;
  /** `incoming` rows sit in the parent's inbox, `outgoing` rows in the child's "sent" tab. */
  direction: 'incoming' | 'outgoing';
  childName: Localized;
  parentId: string;
  items: SeedItem[];
  note: Localized;
  /** Minutes before "now" — keeps the relative times alive however long the demo runs. */
  minutesAgo: number;
  status: AskStatus;
  paidCardId?: string;
  orderId?: string;
}

/* ------------------------------------------------------------------ people & cards */

export interface SeedParent {
  id: string;
  name: Localized;
  relation: ParentRelation;
}

export const RELATION_LABEL: Readonly<Record<ParentRelation, Localized>> = {
  father: { az: 'Ata', ru: 'Отец', en: 'Father' },
  mother: { az: 'Ana', ru: 'Мать', en: 'Mother' },
};

export const SEED_PARENTS: readonly SeedParent[] = [
  { id: 'p1', name: { az: 'Anar', ru: 'Анар', en: 'Anar' }, relation: 'father' },
  { id: 'p2', name: { az: 'Gülnarə', ru: 'Гюльнара', en: 'Gulnara' }, relation: 'mother' },
] as const;

export const SEED_CARDS: readonly { id: string; brand: string; last4: string }[] = [
  { id: 'c1', brand: 'Visa', last4: '4242' },
  { id: 'c2', brand: 'Mastercard', last4: '8810' },
] as const;

/** `"Visa •••• 4242"` — the one place the masked-card glyphs are built. */
export const cardLabel = (brand: string, last4: string): string => `${brand} •••• ${last4}`;

/** Who the signed-in person is, per side of the demo. */
export const SELF_NAME: Localized = { az: 'Mən', ru: 'Я', en: 'Me' };

/* ------------------------------------------------------------------ the basket */

const MILK: SeedItem = {
  id: 'milk-1l',
  name: { az: 'Süd 1 L', ru: 'Молоко 1 л', en: 'Milk 1 L' },
  qty: 2,
  unitPrice: 1.89,
};
const APPLES: SeedItem = {
  id: 'apple-red',
  name: { az: 'Alma, qırmızı', ru: 'Яблоки красные', en: 'Red apples' },
  unit: { az: 'kq', ru: 'кг', en: 'kg' },
  qty: 1,
  unitPrice: 2.4,
};
const WAFFLE: SeedItem = {
  id: 'waffle-choco',
  name: { az: 'Şokoladlı vafli', ru: 'Шоколадная вафля', en: 'Chocolate waffle' },
  qty: 1,
  unitPrice: 0.99,
};

/** The child's current basket — `v2/carts` in a real build. Total 7,17 ₼ in the export. */
export const SEED_DRAFT_ITEMS: readonly SeedItem[] = [MILK, APPLES, WAFFLE] as const;

/* ------------------------------------------------------------------ seeded requests */

export const SEED_REQUESTS: readonly SeedRequest[] = [
  {
    id: 'a1042',
    reference: 'A-1042',
    direction: 'incoming',
    childName: { az: 'Aysel', ru: 'Айсель', en: 'Aysel' },
    parentId: 'p1',
    items: [MILK, APPLES, WAFFLE],
    note: {
      az: 'Dərsdən sonra lazım olacaq',
      ru: 'Понадобится после уроков',
      en: 'Needed after school',
    },
    minutesAgo: 12,
    status: 'pending',
  },
  {
    id: 'a1039',
    reference: 'A-1039',
    direction: 'incoming',
    childName: { az: 'Elvin', ru: 'Эльвин', en: 'Elvin' },
    parentId: 'p2',
    items: [
      {
        id: 'water-5l',
        name: { az: 'Su 5 L', ru: 'Вода 5 л', en: 'Water 5 L' },
        qty: 2,
        unitPrice: 1.6,
      },
    ],
    note: {
      az: 'Futbol məşqi üçün su',
      ru: 'Вода на футбольную тренировку',
      en: 'Water for football practice',
    },
    minutesAgo: 1_100,
    status: 'approved',
    paidCardId: 'c1',
    orderId: '48213',
  },
  {
    id: 'a1031',
    reference: 'A-1031',
    direction: 'incoming',
    childName: { az: 'Leyla', ru: 'Лейла', en: 'Leyla' },
    parentId: 'p1',
    items: [
      {
        id: 'notebook-math',
        name: { az: 'Riyaziyyat dəftəri', ru: 'Тетрадь по математике', en: 'Maths notebook' },
        qty: 1,
        unitPrice: 1.8,
      },
    ],
    note: { az: 'Riyaziyyat dəftəri', ru: 'Тетрадь по математике', en: 'Maths notebook' },
    minutesAgo: 4_400,
    status: 'declined',
  },
  {
    id: 'a1024',
    reference: 'A-1024',
    direction: 'incoming',
    childName: { az: 'Aysel', ru: 'Айсель', en: 'Aysel' },
    parentId: 'p2',
    items: [
      {
        id: 'juice-1l',
        name: { az: 'Alma şirəsi 1 L', ru: 'Яблочный сок 1 л', en: 'Apple juice 1 L' },
        qty: 2,
        unitPrice: 1.9,
      },
      {
        id: 'cookies',
        name: { az: 'Peçenye', ru: 'Печенье', en: 'Biscuits' },
        qty: 1,
        unitPrice: 1.8,
      },
    ],
    note: { az: 'Həftə sonu üçün', ru: 'На выходные', en: 'For the weekend' },
    minutesAgo: 11_600,
    status: 'expired',
  },
  {
    id: 'a1045',
    reference: 'A-1045',
    direction: 'outgoing',
    childName: SELF_NAME,
    parentId: 'p1',
    items: [MILK, APPLES, WAFFLE],
    note: {
      az: 'Dərsdən sonra lazım olacaq',
      ru: 'Понадобится после уроков',
      en: 'Needed after school',
    },
    minutesAgo: 12,
    status: 'pending',
  },
  {
    id: 'a1037',
    reference: 'A-1037',
    direction: 'outgoing',
    childName: SELF_NAME,
    parentId: 'p1',
    items: [
      {
        id: 'bread',
        name: { az: 'Çörək', ru: 'Хлеб', en: 'Bread' },
        qty: 2,
        unitPrice: 0.6,
      },
      {
        id: 'cheese',
        name: { az: 'Pendir 300 q', ru: 'Сыр 300 г', en: 'Cheese 300 g' },
        qty: 1,
        unitPrice: 6.4,
      },
    ],
    note: { az: 'Səhər yeməyi üçün', ru: 'На завтрак', en: 'For breakfast' },
    minutesAgo: 1_460,
    status: 'approved',
    paidCardId: 'c1',
    orderId: '48207',
  },
] as const;

/** The reference counter the next sent request takes (`A-1046`, `A-1047`, …). */
export const FIRST_NEW_REFERENCE = 1_046;

/** Delivery is free on every demo request, so the summary row reads "Pulsuz". */
export const DEMO_DELIVERY_FEE = 0;

/** A request is dead 24 h after it was sent (`api/mock-modules.md` §11). */
export const ASK_EXPIRY_HOURS = 24;

/** The note field's hard cap, mirrored by the zod schema on the send form. */
export const NOTE_MAX_LENGTH = 140;
