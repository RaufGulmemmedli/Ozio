/**
 * The demo catalogue, written in the **wire** shape (snake_case, per-locale name objects) so the
 * MSW handlers hand the repository exactly what a real `/customer/api/v1/courier-shop` would.
 *
 * Numbers and names are transcribed from the design exports
 * (`kuryerin-cantasi-esas.html`, `geyin-sec-qaytar-olculer.html`,
 * `kuryer-ekspert-xidmet-secimi.html`), which are the pixel source of truth — they differ from the
 * earlier sample block in `mock-contracts.ts`, and the drawn discount tags (-25 / -27 / -31 / -25 /
 * -25 / -30 %) only add up with these prices.
 *
 * Nothing here is ever charged: every money value is sample data.
 */

export interface BagItemWire {
  id: string;
  kind: string;
  name: { az: string; ru: string; en: string };
  price: number;
  old_price: number;
  stock: number;
  discount_pct: number;
}

export const BAG_ITEMS: readonly BagItemWire[] = [
  {
    id: 'b1',
    kind: 'battery',
    name: {
      az: 'AA batareyalar (4 ədəd)',
      ru: 'Батарейки AA (4 шт.)',
      en: 'AA batteries (4 pcs)',
    },
    price: 2.4,
    old_price: 3.2,
    stock: 12,
    discount_pct: 25,
  },
  {
    id: 'b2',
    kind: 'chocolate',
    name: { az: 'Süd şokoladı', ru: 'Молочный шоколад', en: 'Milk chocolate' },
    price: 1.1,
    old_price: 1.5,
    stock: 20,
    discount_pct: 27,
  },
  {
    id: 'b3',
    kind: 'coffee',
    name: { az: 'Hazır qəhvə stikləri', ru: 'Растворимый кофе в стиках', en: 'Instant coffee sticks' },
    price: 0.9,
    old_price: 1.3,
    stock: 8,
    discount_pct: 31,
  },
  {
    id: 'b4',
    kind: 'cable',
    name: { az: 'Telefon kabeli USB-C', ru: 'Кабель для телефона USB-C', en: 'USB-C phone cable' },
    price: 4.5,
    old_price: 6,
    stock: 5,
    discount_pct: 25,
  },
  {
    id: 'b5',
    kind: 'water',
    name: { az: 'Mineral su 0.5 l', ru: 'Минеральная вода 0,5 л', en: 'Mineral water 0.5 l' },
    price: 0.6,
    old_price: 0.8,
    stock: 30,
    discount_pct: 25,
  },
  {
    id: 'b6',
    kind: 'gum',
    name: { az: 'Saqqız paketi', ru: 'Упаковка жевательной резинки', en: 'Pack of chewing gum' },
    price: 0.7,
    old_price: 1,
    stock: 15,
    discount_pct: 30,
  },
];

/** Free, as the drawn "Çatdırılma 0 ₼" / "Pulsuz" rows say. */
export const BAG_DELIVERY_FEE = 0;

export const FIT_PRODUCT = {
  id: 'fp1',
  brand: 'NIKE',
  name: {
    az: 'Nike Revolution 6 qaçış ayaqqabısı',
    ru: 'Кроссовки Nike Revolution 6',
    en: 'Nike Revolution 6 running shoes',
  },
  short_name: {
    az: 'Nike Revolution 6',
    ru: 'Nike Revolution 6',
    en: 'Nike Revolution 6',
  },
  price: 129,
  charge_now: 0,
  sizes: ['40', '41', '42', '43', '44', '45'],
  required_sizes: 2,
  wait_minutes: 10,
} as const;

/** 10 minutes at the door (`FitSession.durationSec` in mock-modules.md). */
export const FIT_DURATION_SEC = 600;

export const EXPERT_PRODUCTS = [
  { kind: 'bike', name: { az: 'Uşaq velosipedi', ru: 'Детский велосипед', en: "Kids' bicycle" } },
  { kind: 'tv', name: { az: 'Televizor 50"', ru: 'Телевизор 50"', en: '50" TV' } },
  { kind: 'hood', name: { az: 'Mətbəx davlumbazı', ru: 'Кухонная вытяжка', en: 'Kitchen hood' } },
] as const;

const SERVICE_INSTALL = {
  kind: 'install',
  name: { az: 'Quraşdırma', ru: 'Установка', en: 'Installation' },
  description: {
    az: 'Qoşulma və ilk işə salma',
    ru: 'Подключение и первый запуск',
    en: 'Hook-up and first start',
  },
} as const;

const SERVICE_WALL = {
  kind: 'wall',
  name: { az: 'Divara asma', ru: 'Монтаж на стену', en: 'Wall mounting' },
  description: {
    az: 'Mötəbər dayaq və bərkitmə',
    ru: 'Надёжный кронштейн и крепление',
    en: 'Solid bracket and fixing',
  },
} as const;

const SERVICE_ASSEMBLE = {
  kind: 'assemble',
  name: { az: 'Yığma', ru: 'Сборка', en: 'Assembly' },
  description: {
    az: 'Hissələri birləşdirib hazır vəziyyətə gətirir',
    ru: 'Собирает детали и доводит до готовности',
    en: 'Puts the parts together, ready to use',
  },
} as const;

/**
 * Per-product service lists. The bike row carries all three because the export's default render
 * (`kuryer-ekspert-xidmet-secimi.html`, bike selected) shows Quraşdırma 45 dəq / 15 ₼,
 * Divara asma 60 dəq / 25 ₼ and Yığma 50 dəq / 20 ₼ together.
 */
export const EXPERT_SERVICES: Readonly<
  Record<string, ReadonlyArray<{ kind: string; name: unknown; description: unknown; price: number; minutes: number }>>
> = {
  bike: [
    { ...SERVICE_INSTALL, price: 15, minutes: 45 },
    { ...SERVICE_WALL, price: 25, minutes: 60 },
    { ...SERVICE_ASSEMBLE, price: 20, minutes: 50 },
  ],
  tv: [
    { ...SERVICE_INSTALL, price: 20, minutes: 30 },
    { ...SERVICE_WALL, price: 35, minutes: 60 },
  ],
  hood: [
    { ...SERVICE_INSTALL, price: 30, minutes: 60 },
    { ...SERVICE_WALL, price: 40, minutes: 75 },
  ],
};

export const EXPERT_SLOTS = [
  { id: 's1', day: 'today', time: '18:00' },
  { id: 's2', day: 'today', time: '20:00' },
  { id: 's3', day: 'tomorrow', time: '10:00' },
  { id: 's4', day: 'tomorrow', time: '12:00' },
  { id: 's5', day: 'tomorrow', time: '16:00' },
] as const;

export const EXPERT_NAME = 'Fərid Q.';

/** `EX-4821` in the export; later bookings keep counting up. */
export const EXPERT_REF_BASE = 4821;
