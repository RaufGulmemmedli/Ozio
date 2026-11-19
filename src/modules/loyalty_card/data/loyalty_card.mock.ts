/**
 * MSW handlers for the parts of this module the API has **no data for**.
 *
 * `GET v1/profile/me` sends `id, name, phone, bonus_cards[], birth_date,
 * ref_code, gender, is_registered, cities, active_orders` and nothing else
 * (api/profile.md, re-verified 2026-11-12): no tier, no level, no cashback
 * percentage, no `bonus_percent`, no bonus-expiry data. There is no
 * `loyalty/tiers` operation either. So the tier ladder, the level progress on
 * `/card`, "Səviyyə yüksəldi" (KT6) and "Bonus yanır" (KT7) all run on these
 * fixtures, under `/api/mock/loyalty_card/…` — never the real host.
 *
 * The payload shape is the one `api/mock-modules.md` §10 proposes for a future
 * `GET /customer/api/v1/loyalty/tiers`, so swapping in a real endpoint is a
 * change in `loyalty_card.remote.ts` only.
 *
 * Numbers and tier names come from the design export `app-seviyyeler.html`
 * (Plus 0 ₼ / 1%, Silver 500 ₼ / 2%, Gold 1 500 ₼ / 3%, Platinum 3 000 ₼ / 5%,
 * spend 1 380 ₼ = 92%), which is the pixel truth for KT5. Every string ships
 * az / ru / en.
 */
import { http } from 'msw';

import { delay, flagged, mockJson, mockPath, registerMockHandlers } from '@/core/mocks';

import { LOYALTY_MOCK_MODULE } from '../loyalty_card.flags';

type Translated = ReadonlyArray<{ locale: 'az' | 'ru' | 'en'; name: string }>;

const t = (az: string, ru: string, en: string): Translated => [
  { locale: 'az', name: az },
  { locale: 'ru', name: ru },
  { locale: 'en', name: en },
];

/** The design ladder from `app-seviyyeler.html` (node `ojCxQ`). */
export const TIER_LADDER_FIXTURE = {
  is_demo: true,
  window_months: 12,
  /** Spend inside the window, AZN — "1 380 / 1 500 ₼" on the export. */
  spend: 1380,
  current_tier: 'silver',
  tiers: [
    {
      id: 'plus',
      threshold: 0,
      cashback_percentage: 1,
      icon: 'plus',
      accent: 'neutral',
      name_translations: t('Plus', 'Plus', 'Plus'),
      perks: [
        t('Ozio kartı və bonus balansı', 'Карта Ozio и бонусный баланс', 'Ozio card and bonus balance'),
        t('Ad günü kuponu', 'Купон на день рождения', 'Birthday coupon'),
        t('Lotereyada iştirak', 'Участие в лотерее', 'Lottery entry'),
      ],
    },
    {
      id: 'silver',
      threshold: 500,
      cashback_percentage: 2,
      icon: 'star',
      accent: 'sky',
      name_translations: t('Silver', 'Silver', 'Silver'),
      perks: [
        t('Plus-un bütün üstünlükləri', 'Все преимущества Plus', 'Everything in Plus'),
        t('30 ₼-dən pulsuz çatdırılma', 'Бесплатная доставка от 30 ₼', 'Free delivery from 30 ₼'),
        t('Aylıq şəxsi kupon', 'Персональный купон каждый месяц', 'A personal coupon every month'),
      ],
    },
    {
      id: 'gold',
      threshold: 1500,
      cashback_percentage: 3,
      icon: 'trophy',
      accent: 'yellow',
      name_translations: t('Gold', 'Gold', 'Gold'),
      perks: [
        t('Silver-in bütün üstünlükləri', 'Все преимущества Silver', 'Everything in Silver'),
        t('Prioritet dəstək xətti', 'Приоритетная линия поддержки', 'Priority support line'),
        t('2x lotereya bileti', '2x лотерейных билета', '2x lottery tickets'),
        t('Partnyorlarda +1% bonus', '+1% бонусов у партнёров', '+1% bonus at partners'),
      ],
    },
    {
      id: 'platinum',
      threshold: 3000,
      cashback_percentage: 5,
      icon: 'crown',
      accent: 'violet',
      name_translations: t('Platinum', 'Platinum', 'Platinum'),
      perks: [
        t('Gold-un bütün üstünlükləri', 'Все преимущества Gold', 'Everything in Gold'),
        t('Bütün çatdırılmalar pulsuz', 'Все доставки бесплатно', 'Every delivery free'),
        t('Eksklüziv erkən təkliflər', 'Эксклюзивный ранний доступ к акциям', 'Exclusive early offers'),
        t('Şəxsi menecer', 'Личный менеджер', 'A personal manager'),
      ],
    },
  ],
} as const;

const DAY_MS = 86_400_000;

/**
 * The three batches from `app-bonus-yanir.html` (12,40 ₼ in 3 days, 6,10 ₼ in
 * 16, 6,30 ₼ in 30). The dates are built relative to "now" so the fixture never
 * goes stale and the days-left tones (<=3 danger, <=16 warning, else neutral)
 * stay demonstrable.
 */
export function expiringBonusFixture(now = Date.now()) {
  const inDays = (days: number) => new Date(now + days * DAY_MS).toISOString();
  return {
    is_demo: true,
    validity_days: 30,
    total_amount: 24.8,
    lottery_ticket_price: 2,
    batches: [
      { id: 'batch-1', amount: 12.4, expires_at: inDays(3), window_days: 30 },
      { id: 'batch-2', amount: 6.1, expires_at: inDays(16), window_days: 30 },
      { id: 'batch-3', amount: 6.3, expires_at: inDays(30), window_days: 30 },
    ],
  };
}

const handlers = [
  http.get(mockPath(LOYALTY_MOCK_MODULE, 'tiers'), async () => {
    await delay(420);
    return mockJson(TIER_LADDER_FIXTURE);
  }),
  http.get(mockPath(LOYALTY_MOCK_MODULE, 'expiring-bonus'), async () => {
    await delay(380);
    return mockJson(expiringBonusFixture());
  }),
];

registerMockHandlers(LOYALTY_MOCK_MODULE, flagged(handlers, 'loyaltyTiers'));

export const loyaltyCardHandlers = handlers;
