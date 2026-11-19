/**
 * The group_buy demo fixtures — the only place numbers and product copy live.
 *
 * Everything the screens show (retail prices, tier factors, neighbour names, addresses, targets,
 * deadlines) is here, in az/ru/en, and reaches the UI only through the MSW handlers in
 * `group_buy.mock.ts`. Shapes match `src/core/api/contracts/mock-contracts.ts` §15 and
 * `web-handoff/api/mock-modules.md` §15.
 *
 * `tierPeople = [3, 5, 10]`, `tierFactors = [0.88, 0.80, 0.72]`,
 * `tiersFor(product, target) = for i while tierPeople[i] <= target: round1(retail × factor[i])`.
 */

/** A `translations: [{locale, …}]` row, exactly like the real catalog endpoints send. */
export interface FixtureTranslation {
  locale: 'az' | 'ru' | 'en';
  title: string;
  pack: string;
}

export interface GroupProductFixture {
  id: string;
  iconKey: string;
  retailPrice: number;
  tierFactors: [number, number, number];
  translations: FixtureTranslation[];
}

/** `[3, 5, 10]` — the rungs every ladder is cut from. */
export const GROUP_TIER_PEOPLE: readonly number[] = [3, 5, 10];

/** The chips on `/group-buy/create` step 2. */
export const GROUP_TARGETS: readonly number[] = [3, 5, 10];

/** The chips on `/group-buy/create` step 3, in hours. */
export const GROUP_DEADLINE_HOURS: readonly number[] = [6, 12, 24, 48];

/** The user's own address, drawn read-only at step 5 and on the join card. */
export const GROUP_MY_ADDRESS = 'Nizami küç. 45, blok A';

/** A group order is one shared drop, so delivery never costs anything. */
export const GROUP_DELIVERY_FEE = 0;

const FACTORS: [number, number, number] = [0.88, 0.8, 0.72];

export const GROUP_PRODUCTS: readonly GroupProductFixture[] = [
  {
    id: 'p-sugar',
    iconKey: 'wheat',
    retailPrice: 18.9,
    tierFactors: FACTORS,
    translations: [
      { locale: 'az', title: 'Şəkər tozu', pack: '10 kq' },
      { locale: 'ru', title: 'Сахарный песок', pack: '10 кг' },
      { locale: 'en', title: 'Granulated sugar', pack: '10 kg' },
    ],
  },
  {
    id: 'p-diaper',
    iconKey: 'baby',
    retailPrice: 54,
    tierFactors: FACTORS,
    translations: [
      { locale: 'az', title: 'Uşaq bezi Pampers', pack: '96 ədəd' },
      { locale: 'ru', title: 'Подгузники Pampers', pack: '96 шт' },
      { locale: 'en', title: 'Pampers nappies', pack: '96 pcs' },
    ],
  },
  {
    id: 'p-oil',
    iconKey: 'droplet',
    retailPrice: 16.5,
    tierFactors: FACTORS,
    translations: [
      { locale: 'az', title: 'Günəbaxan yağı', pack: '5 litr' },
      { locale: 'ru', title: 'Подсолнечное масло', pack: '5 литров' },
      { locale: 'en', title: 'Sunflower oil', pack: '5 litres' },
    ],
  },
  {
    id: 'p-clean',
    iconKey: 'sparkles',
    retailPrice: 32,
    tierFactors: FACTORS,
    translations: [
      { locale: 'az', title: 'Təmizlik dəsti', pack: '12 ədəd' },
      { locale: 'ru', title: 'Набор для уборки', pack: '12 шт' },
      { locale: 'en', title: 'Cleaning set', pack: '12 pcs' },
    ],
  },
  {
    id: 'p-rice',
    iconKey: 'wheat',
    retailPrice: 24,
    tierFactors: FACTORS,
    translations: [
      { locale: 'az', title: 'Düyü', pack: '10 kq' },
      { locale: 'ru', title: 'Рис', pack: '10 кг' },
      { locale: 'en', title: 'Rice', pack: '10 kg' },
    ],
  },
  {
    id: 'p-powder',
    iconKey: 'sparkles',
    retailPrice: 21,
    tierFactors: FACTORS,
    translations: [
      { locale: 'az', title: 'Yuyucu toz', pack: '6 kq' },
      { locale: 'ru', title: 'Стиральный порошок', pack: '6 кг' },
      { locale: 'en', title: 'Laundry powder', pack: '6 kg' },
    ],
  },
] as const;

export interface GroupDealFixture {
  id: string;
  productId: string;
  target: number;
  /** Milliseconds from the moment the demo db is seeded. The absolute instant is stored once. */
  closesInMs: number;
  participants: string[];
  /** Omitted => {@link GROUP_MY_ADDRESS} and `sameBuilding: true`. */
  address?: string;
}

/** GB1's four open deals: d1 almost full, d2 one short, d3 small, d4 the neighbouring block. */
export const GROUP_DEALS: readonly GroupDealFixture[] = [
  {
    id: 'd1',
    productId: 'p-sugar',
    target: 10,
    closesInMs: (5 * 60 + 12) * 60_000,
    participants: ['Aysel', 'Rəşad', 'Leyla', 'Elvin', 'Nigar', 'Tural'],
  },
  {
    id: 'd2',
    productId: 'p-diaper',
    target: 5,
    closesInMs: (20 * 60 + 40) * 60_000,
    participants: ['Səbinə', 'Kamran', 'Günel', 'Orxan'],
  },
  {
    id: 'd3',
    productId: 'p-clean',
    target: 3,
    closesInMs: (24 + 6) * 3_600_000,
    participants: ['Fidan', 'Samir'],
  },
  {
    id: 'd4',
    productId: 'p-oil',
    target: 10,
    closesInMs: 48 * 3_600_000,
    participants: ['Zaur', 'Ülviyyə', 'Murad'],
    address: 'Nizami küç. 47',
  },
] as const;

/** The name the source gives the signed-in member, per locale. */
export const ME_NAME: Record<'az' | 'ru' | 'en', string> = {
  az: 'Mən',
  ru: 'Я',
  en: 'Me',
};

/** `https://ozio10.az/g/<id>` — the invite link the share dialog copies. */
export const inviteLinkFor = (id: string): string => `https://ozio10.az/g/${id}`;
