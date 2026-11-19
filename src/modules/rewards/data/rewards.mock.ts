/**
 * MSW handlers + in-memory db for the `rewards` mock module.
 *
 * Registered at module scope, so `loadMockModules()` only has to import this file. All traffic sits
 * under `/api/mock/rewards/…` (`mockPath`) and is wrapped in `flagged(...)`, so a build with
 * `NEXT_PUBLIC_FEATURE_REWARDS=0` serves nothing and the screens fall back to `<ErrorState>`.
 *
 * Fixtures carry az/ru/en text; the repository resolves one locale per query (`?lang=`). Realistic
 * numbers only, and every amount the UI shows comes from here — never from a component.
 *
 * Deterministic demo hooks, so every state is screenshot-able without touching the UI:
 *   `?preview=loading|empty|error`            — handled by `useScreenQuery`, no request is sent
 *   `GET  wheel?state=limit`                  — answers with 2/2 spins used
 *   `GET  wheel?state=empty`                  — answers with no segments
 *   `POST wheel/spin` beyond the daily limit   — 409 `rewards/wheel-limit-reached`
 *   `POST smart-list/items` with title "xəta" — 500, so the add-failed toast is reachable
 *   `POST price-alerts` with target <= 0      — 422 with a field error on `target_price`
 *
 * The prize is drawn **here**, never in the browser: see `spinSeed` / `weightedPick` below.
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockId,
  mockJson,
  mockPath,
  mockValidationError,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

import { REWARDS_FLAG, REWARDS_MOCK_MODULE } from '../rewards.flags';
import { weightedPick } from './models/wheel';

/* ------------------------------------------------------------------ fixtures */

type Text = { az: string; ru: string; en: string };

interface WheelSegmentRow {
  id: string;
  label: Text;
  type: string;
  value: number;
  weight: number;
  tone: string;
}

/** 8 slices, in the order the design paints them clockwise from the pointer. */
const WHEEL_SEGMENTS: WheelSegmentRow[] = [
  { id: 'w1', label: { az: '0,50 ₼', ru: '0,50 ₼', en: '0.50 ₼' }, type: 'bonus', value: 0.5, weight: 3, tone: 'brand' },
  { id: 'w2', label: { az: '+1 bilet', ru: '+1 билет', en: '+1 ticket' }, type: 'ticket', value: 1, weight: 1, tone: 'yellow' },
  { id: 'w3', label: { az: '5% kupon', ru: 'Купон 5%', en: '5% coupon' }, type: 'coupon', value: 5, weight: 2, tone: 'sky' },
  { id: 'w4', label: { az: '1 ₼', ru: '1 ₼', en: '1 ₼' }, type: 'bonus', value: 1, weight: 1, tone: 'violet' },
  { id: 'w5', label: { az: '2x bonus', ru: '2x бонус', en: '2x bonus' }, type: 'cashback', value: 2, weight: 2, tone: 'brand' },
  { id: 'w6', label: { az: '0,20 ₼', ru: '0,20 ₼', en: '0.20 ₼' }, type: 'bonus', value: 0.2, weight: 3, tone: 'yellow' },
  {
    id: 'w7',
    label: { az: 'Pulsuz çatdırılma', ru: 'Бесплатная доставка', en: 'Free delivery' },
    type: 'free_delivery',
    value: 0,
    weight: 2,
    tone: 'success',
  },
  { id: 'w8', label: { az: 'Yenə fırlat', ru: 'Крути ещё', en: 'Spin again' }, type: 'nothing', value: 0, weight: 2, tone: 'sky' },
];

interface MissionRow {
  id: string;
  title: Text;
  description: Text;
  progress: number;
  target: number;
  reward: number;
  rewardLabel: Text;
  icon: string;
  claimed: boolean;
}

const MISSIONS: MissionRow[] = [
  {
    id: 'm1',
    title: { az: 'Dostunu dəvət et', ru: 'Пригласи друга', en: 'Invite a friend' },
    description: {
      az: '1 dost dəvət et və qoşulsun',
      ru: 'Пригласи 1 друга, чтобы он присоединился',
      en: 'Invite 1 friend and have them join',
    },
    progress: 1,
    target: 1,
    reward: 3,
    rewardLabel: { az: '+3 ₼', ru: '+3 ₼', en: '+3 ₼' },
    icon: 'user-plus',
    claimed: false,
  },
  {
    id: 'm2',
    title: {
      az: '3 fərqli partnyordan alış',
      ru: 'Покупка у 3 разных партнёров',
      en: 'Buy from 3 different partners',
    },
    description: {
      az: 'Bu həftə 3 fərqli partnyordan alış et',
      ru: 'Сделай покупки у 3 разных партнёров на этой неделе',
      en: 'Shop at 3 different partners this week',
    },
    progress: 2,
    target: 3,
    reward: 2,
    rewardLabel: { az: '+2 ₼', ru: '+2 ₼', en: '+2 ₼' },
    icon: 'store',
    claimed: false,
  },
  {
    id: 'm3',
    title: {
      az: 'Ozio Market-dən çatdırılma sifarişi',
      ru: 'Заказ с доставкой из Ozio Market',
      en: 'A delivery order from Ozio Market',
    },
    description: {
      az: 'Ozio Market-dən 1 çatdırılma sifarişi ver',
      ru: 'Оформи 1 заказ с доставкой из Ozio Market',
      en: 'Place 1 delivery order from Ozio Market',
    },
    progress: 0,
    target: 1,
    reward: 1,
    rewardLabel: { az: '+1 ₼', ru: '+1 ₼', en: '+1 ₼' },
    icon: 'bike',
    claimed: false,
  },
  {
    id: 'm4',
    title: {
      az: 'Novas Home-da 30 ₼+ alış',
      ru: 'Покупка 30 ₼+ в Novas Home',
      en: 'Spend 30 ₼+ at Novas Home',
    },
    description: {
      az: 'Novas Home-da 30 ₼ və daha çox alış et',
      ru: 'Купи в Novas Home на 30 ₼ и больше',
      en: 'Spend 30 ₼ or more at Novas Home',
    },
    progress: 0,
    target: 1,
    reward: 1,
    rewardLabel: { az: '+1 bilet', ru: '+1 билет', en: '+1 ticket' },
    icon: 'sofa',
    claimed: false,
  },
  {
    id: 'm5',
    title: {
      az: '5 gün ardıcıl çarxı fırlat',
      ru: 'Крути колесо 5 дней подряд',
      en: 'Spin the wheel 5 days in a row',
    },
    description: {
      az: 'Gündəlik çarxı 5 gün ardıcıl fırlat',
      ru: 'Крути ежедневное колесо 5 дней подряд',
      en: 'Spin the daily wheel 5 days in a row',
    },
    progress: 4,
    target: 5,
    reward: 0,
    rewardLabel: { az: '2x kupon', ru: '2x купон', en: '2x coupon' },
    icon: 'rotate-cw',
    claimed: false,
  },
];

interface MemberRow {
  id: string;
  name: Text;
  role: string;
  owner: boolean;
  contributed: number;
  monthly_limit: number | null;
  phone: string | null;
}

/** `phone: null` on purpose: a demo repository never hands out a dialable number. */
const FAMILY_MEMBERS: MemberRow[] = [
  { id: 'f1', name: { az: 'Nurlan', ru: 'Нурлан', en: 'Nurlan' }, role: 'admin', owner: true, contributed: 18.65, monthly_limit: null, phone: null },
  { id: 'f2', name: { az: 'Leyla', ru: 'Лейла', en: 'Leyla' }, role: 'member', owner: false, contributed: 12.3, monthly_limit: null, phone: null },
  { id: 'f3', name: { az: 'Anam', ru: 'Мама', en: 'Mum' }, role: 'member', owner: false, contributed: 5.2, monthly_limit: null, phone: null },
  {
    id: 'f4',
    name: { az: 'Kamran · 14 yaş', ru: 'Камран · 14 лет', en: 'Kamran · 14 y/o' },
    role: 'member',
    owner: false,
    contributed: 2.45,
    monthly_limit: 5,
    phone: null,
  },
];

interface SmartRow {
  id: string;
  title: Text;
  quantity: number;
  checked: boolean;
  price: number | null;
  old_price: number | null;
  store_name: Text | '';
  store_color: string | null;
}

const MEGASTORE: Text = { az: 'Megastore', ru: 'Megastore', en: 'Megastore' };
const BOLMART: Text = { az: 'Bolmart', ru: 'Bolmart', en: 'Bolmart' };
const GRANDMART: Text = { az: 'Grandmart', ru: 'Grandmart', en: 'Grandmart' };

const SMART_LIST: SmartRow[] = [
  { id: 's1', title: { az: 'Toyuq filesi 1 kq', ru: 'Куриная грудка 1 кг', en: 'Chicken fillet 1 kg' }, quantity: 1, checked: false, price: 5.59, old_price: 6.19, store_name: MEGASTORE, store_color: '#E21F26' },
  { id: 's2', title: { az: 'Ayran Milla 1 L', ru: 'Айран Milla 1 л', en: 'Ayran Milla 1 L' }, quantity: 1, checked: false, price: 2.25, old_price: 2.59, store_name: BOLMART, store_color: '#16A34A' },
  { id: 's3', title: { az: 'Kərə yağı 200 q', ru: 'Масло сливочное 200 г', en: 'Butter 200 g' }, quantity: 1, checked: false, price: 3.79, old_price: 4.49, store_name: MEGASTORE, store_color: '#E21F26' },
  { id: 's4', title: { az: 'Pendir Lori', ru: 'Сыр Лори', en: 'Lori cheese' }, quantity: 1, checked: false, price: 4.19, old_price: 5.29, store_name: GRANDMART, store_color: '#1AA0DC' },
  { id: 's5', title: { az: 'Çörək', ru: 'Хлеб', en: 'Bread' }, quantity: 1, checked: false, price: 0.6, old_price: null, store_name: '', store_color: null },
  { id: 's6', title: { az: 'Yumurta 10 əd', ru: 'Яйца 10 шт', en: 'Eggs, 10' }, quantity: 1, checked: true, price: 2.4, old_price: null, store_name: '', store_color: null },
];

interface AlertRow {
  id: string;
  product_name: Text;
  emoji: string;
  store_name: Text;
  current_price: number;
  tracked_price: number;
  target_price: number | null;
  active: boolean;
}

const PRICE_ALERTS: AlertRow[] = [
  {
    id: 'p1',
    product_name: { az: 'Kərə yağı 82%', ru: 'Масло сливочное 82%', en: 'Butter 82%' },
    emoji: '🧈',
    store_name: MEGASTORE,
    current_price: 3.79,
    tracked_price: 4.57,
    target_price: 4,
    active: true,
  },
  {
    id: 'p2',
    product_name: { az: 'Jacobs Monarch 190 q', ru: 'Jacobs Monarch 190 г', en: 'Jacobs Monarch 190 g' },
    emoji: '☕',
    store_name: BOLMART,
    current_price: 7.49,
    tracked_price: 7.49,
    target_price: 6,
    active: true,
  },
];

interface FeedRow {
  id: string;
  kind: string;
  title: Text;
  body: Text;
  time: Text;
  unread: boolean;
  period: string;
}

const FEED: FeedRow[] = [
  {
    id: 'n1',
    kind: 'price_drop',
    title: { az: 'Kərə yağı endirimə düşdü', ru: 'Масло подешевело', en: 'Butter dropped in price' },
    body: {
      az: 'Megastore-da 3,79 ₼ — hədəfindən ucuz',
      ru: 'В Megastore 3,79 ₼ — ниже вашей цели',
      en: '3.79 ₼ at Megastore — below your target',
    },
    time: { az: '10:05', ru: '10:05', en: '10:05' },
    unread: true,
    period: 'today',
  },
  {
    id: 'n2',
    kind: 'lottery',
    title: { az: 'Tiraja 2 gün qaldı', ru: 'До тиража 2 дня', en: '2 days to the draw' },
    body: { az: 'Biletlərini yoxla', ru: 'Проверьте свои билеты', en: 'Check your tickets' },
    time: { az: '09:12', ru: '09:12', en: '09:12' },
    unread: true,
    period: 'today',
  },
  {
    id: 'n3',
    kind: 'bonus',
    title: { az: 'Bonus hesaba keçdi', ru: 'Бонус зачислен', en: 'Bonus credited' },
    body: {
      az: '+0,62 ₼ sifariş #48210',
      ru: '+0,62 ₼ за заказ #48210',
      en: '+0.62 ₼ for order #48210',
    },
    time: { az: 'Dünən', ru: 'Вчера', en: 'Yesterday' },
    unread: false,
    period: 'week',
  },
  {
    id: 'n4',
    kind: 'birthday',
    title: { az: 'Ad günün mübarək!', ru: 'С днём рождения!', en: 'Happy birthday!' },
    body: {
      az: 'Sənə hədiyyə kupon göndərdik',
      ru: 'Мы отправили вам подарочный купон',
      en: 'We sent you a gift coupon',
    },
    time: { az: 'B.e', ru: 'Пн', en: 'Mon' },
    unread: false,
    period: 'week',
  },
];

/* ------------------------------------------------------------------------ db */

interface WheelDaily {
  /** `YYYY-MM-DD` — a new calendar day resets the counters (`WheelDaily` in Flutter). */
  date: string;
  spinsUsed: number;
  charged: number;
}

interface RewardsDb {
  wheel: WheelDaily;
  missions: MissionRow[];
  family: {
    card_number: string;
    settings: { spend_alerts: boolean; child_limit: boolean; shared_bonus: boolean };
    members: MemberRow[];
  };
  smartList: SmartRow[];
  sharedWith: Text;
  alerts: AlertRow[];
  feed: FeedRow[];
}

const today = (): string => new Date().toISOString().slice(0, 10);

const seed = (): RewardsDb => ({
  wheel: { date: today(), spinsUsed: 1, charged: 0 },
  missions: MISSIONS.map((m) => ({ ...m })),
  family: {
    card_number: '9940000000123',
    settings: { spend_alerts: true, child_limit: true, shared_bonus: false },
    members: FAMILY_MEMBERS.map((m) => ({ ...m })),
  },
  smartList: SMART_LIST.map((i) => ({ ...i })),
  sharedWith: { az: 'Leyla', ru: 'Лейла', en: 'Leyla' },
  alerts: PRICE_ALERTS.map((a) => ({ ...a })),
  feed: FEED.map((f) => ({ ...f })),
});

/** `localStorage` key `ozio.mock.rewards`; SSR-safe (plain memory with no `window`). */
const db = createMockDb<RewardsDb>(REWARDS_MOCK_MODULE, seed);

const WHEEL_RULES = { maxSpinsPerDay: 2, paidSpinCost: 1 } as const;

/** Reads today's counters, rolling them over when the calendar day changed. */
function wheelDaily(): WheelDaily {
  const current = db.get().wheel;
  if (current.date === today()) return current;
  const rolled: WheelDaily = { date: today(), spinsUsed: 0, charged: 0 };
  db.patch({ wheel: rolled });
  return rolled;
}

/**
 * The 7-day strip: every weekday before today is done, today carries the streak length, the rest
 * are pending. 1 = Monday … 7 = Sunday, matching `wheel.day.<n>` in `messages/parts/rewards.json`.
 */
function streakStrip(): Array<{ weekday: number; state: string; streak: number }> {
  const js = new Date().getDay();
  const todayIndex = js === 0 ? 7 : js;
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    state: weekday < todayIndex ? 'done' : weekday === todayIndex ? 'today' : 'pending',
    streak: weekday === todayIndex ? todayIndex : 0,
  }));
}

/**
 * The seeded PRNG the draw runs on. The seed is the calendar day plus the spin number, so the
 * sequence is reproducible in review and in screenshots while still varying between spins.
 * (A real backend would use its own RNG; only the weighting rule has to match.)
 */
function spinSeed(daily: WheelDaily): () => number {
  const dayNumber = Math.floor(Date.parse(`${daily.date}T00:00:00Z`) / 86_400_000) || 0;
  let state = (dayNumber * 1_103_515_245 + (daily.spinsUsed + 1) * 12_345) % 2_147_483_647;
  if (state <= 0) state += 2_147_483_646;
  return () => {
    state = (state * 48_271) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

/* ------------------------------------------------------------------ payloads */

const wheelPayload = (daily: WheelDaily, segments: WheelSegmentRow[]) => ({
  segments,
  spins_used: daily.spinsUsed,
  max_spins: WHEEL_RULES.maxSpinsPerDay,
  paid_spin_cost: WHEEL_RULES.paidSpinCost,
  streak: streakStrip(),
});

/** Still-earnable AZN this week — a server-side sum, so the view never adds money up. */
const missionsPayload = (rows: MissionRow[]) => ({
  missions: rows,
  can_earn: Math.round(rows.filter((m) => !m.claimed).reduce((s, m) => s + m.reward, 0) * 100) / 100,
  days_left: 3,
});

const familyPayload = () => {
  const { card_number, settings, members } = db.get().family;
  return {
    card_number,
    settings,
    members,
    pool: Math.round(members.reduce((s, m) => s + m.contributed, 0) * 100) / 100,
  };
};

const smartListPayload = () => ({ items: db.get().smartList, shared_with: db.get().sharedWith });

const alertsPayload = () => ({ alerts: db.get().alerts, feed: db.get().feed });

/* ------------------------------------------------------------------ handlers */

const body = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const json = (await request.json()) as unknown;
    return json !== null && typeof json === 'object' ? (json as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const FORCE_FAIL_TITLES = new Set(['xəta', 'xeta', 'error', 'fail']);

export const rewardsHandlers = [
  /* ------------------------------------------------------------- N1 wheel */
  http.get(mockPath(REWARDS_MOCK_MODULE, 'wheel'), async ({ request }) => {
    await delay(400);
    const state = new URL(request.url).searchParams.get('state');
    const daily = wheelDaily();
    if (state === 'empty') return mockJson(wheelPayload(daily, []));
    if (state === 'limit') {
      return mockJson(
        wheelPayload({ ...daily, spinsUsed: WHEEL_RULES.maxSpinsPerDay }, WHEEL_SEGMENTS),
      );
    }
    return mockJson(wheelPayload(daily, WHEEL_SEGMENTS));
  }),

  http.post(mockPath(REWARDS_MOCK_MODULE, 'wheel/spin'), async () => {
    await delay(900);
    const daily = wheelDaily();
    if (daily.spinsUsed >= WHEEL_RULES.maxSpinsPerDay) {
      return mockError(409, 'rewards/wheel-limit-reached');
    }
    // The prize is decided here. The client posts, waits, then animates to `index`.
    const index = weightedPick(WHEEL_SEGMENTS, spinSeed(daily));
    const paid = daily.spinsUsed >= 1;
    const next: WheelDaily = {
      date: daily.date,
      spinsUsed: daily.spinsUsed + 1,
      charged: daily.charged + (paid ? 1 : 0),
    };
    db.patch({ wheel: next });
    return mockJson({
      index,
      segment_id: WHEEL_SEGMENTS[index]?.id ?? '',
      segment: WHEEL_SEGMENTS[index],
      spins_used: next.spinsUsed,
      max_spins: WHEEL_RULES.maxSpinsPerDay,
      charged: next.charged,
    });
  }),

  /* ---------------------------------------------------------- N2 missions */
  http.get(mockPath(REWARDS_MOCK_MODULE, 'missions'), async ({ request }) => {
    await delay(400);
    const state = new URL(request.url).searchParams.get('state');
    if (state === 'empty') return mockJson(missionsPayload([]));
    if (state === 'error') return mockError(500, 'rewards/missions-unavailable');
    return mockJson(missionsPayload(db.get().missions));
  }),

  http.post(mockPath(REWARDS_MOCK_MODULE, 'missions/:id/claim'), async ({ params }) => {
    await delay(500);
    const id = String(params.id ?? '');
    const row = db.get().missions.find((m) => m.id === id);
    if (!row) return mockError(404, 'rewards/mission-not-found');
    if (row.progress < row.target) return mockError(409, 'rewards/mission-not-completed');
    if (row.claimed) return mockError(409, 'rewards/mission-already-claimed');
    db.set((prev) => ({
      ...prev,
      missions: prev.missions.map((m) => (m.id === id ? { ...m, claimed: true } : m)),
    }));
    return mockJson(missionsPayload(db.get().missions));
  }),

  /* ------------------------------------------------------- N3 family card */
  http.get(mockPath(REWARDS_MOCK_MODULE, 'family'), async ({ request }) => {
    await delay(450);
    const state = new URL(request.url).searchParams.get('state');
    if (state === 'empty') {
      return mockJson({ ...familyPayload(), members: [], pool: 0 });
    }
    return mockJson(familyPayload());
  }),

  http.put(mockPath(REWARDS_MOCK_MODULE, 'family/settings'), async ({ request }) => {
    await delay(250);
    const input = await body(request);
    db.set((prev) => ({
      ...prev,
      family: {
        ...prev.family,
        settings: {
          spend_alerts: Boolean(input.spend_alerts),
          child_limit: Boolean(input.child_limit),
          shared_bonus: Boolean(input.shared_bonus),
        },
      },
    }));
    return mockJson(familyPayload());
  }),

  http.post(mockPath(REWARDS_MOCK_MODULE, 'family/members'), async ({ request }) => {
    await delay(600);
    const input = await body(request);
    const name = String(input.name ?? '').trim();
    if (!name) {
      return mockValidationError([{ path: 'name', message: 'rewards/member-name-required' }]);
    }
    const limitRaw = input.monthly_limit;
    const limit = typeof limitRaw === 'number' && limitRaw > 0 ? limitRaw : null;
    const row: MemberRow = {
      id: mockId('f'),
      name: { az: name, ru: name, en: name },
      role: 'member',
      owner: false,
      contributed: 0,
      monthly_limit: limit,
      phone: null,
    };
    db.set((prev) => ({
      ...prev,
      family: { ...prev.family, members: [...prev.family.members, row] },
    }));
    return mockJson(familyPayload());
  }),

  http.patch(mockPath(REWARDS_MOCK_MODULE, 'family/members/:id'), async ({ params, request }) => {
    await delay(300);
    const id = String(params.id ?? '');
    if (!db.get().family.members.some((m) => m.id === id)) {
      return mockError(404, 'rewards/member-not-found');
    }
    const input = await body(request);
    const raw = input.monthly_limit;
    const limit = typeof raw === 'number' && raw > 0 ? raw : null;
    db.set((prev) => ({
      ...prev,
      family: {
        ...prev.family,
        members: prev.family.members.map((m) => (m.id === id ? { ...m, monthly_limit: limit } : m)),
      },
    }));
    return mockJson(familyPayload());
  }),

  http.delete(mockPath(REWARDS_MOCK_MODULE, 'family/members/:id'), async ({ params }) => {
    await delay(400);
    const id = String(params.id ?? '');
    const member = db.get().family.members.find((m) => m.id === id);
    if (!member) return mockError(404, 'rewards/member-not-found');
    if (member.owner) return mockError(409, 'rewards/member-is-owner');
    db.set((prev) => ({
      ...prev,
      family: { ...prev.family, members: prev.family.members.filter((m) => m.id !== id) },
    }));
    return mockJson(familyPayload());
  }),

  /* -------------------------------------------------------- N4 smart list */
  http.get(mockPath(REWARDS_MOCK_MODULE, 'smart-list'), async ({ request }) => {
    await delay(400);
    const state = new URL(request.url).searchParams.get('state');
    if (state === 'empty') return mockJson({ items: [], shared_with: '' });
    return mockJson(smartListPayload());
  }),

  http.post(mockPath(REWARDS_MOCK_MODULE, 'smart-list/items'), async ({ request }) => {
    await delay(450);
    const input = await body(request);
    const title = String(input.title ?? '').trim();
    if (!title) {
      return mockValidationError([{ path: 'title', message: 'rewards/item-title-required' }]);
    }
    // Magic input so the "couldn't add" toast is reachable without breaking anything else.
    if (FORCE_FAIL_TITLES.has(title.toLocaleLowerCase('az-AZ'))) {
      return mockError(500, 'rewards/smart-list-add-failed');
    }
    const row: SmartRow = {
      id: mockId('s'),
      title: { az: title, ru: title, en: title },
      quantity: 1,
      checked: false,
      price: null,
      old_price: null,
      store_name: '',
      store_color: null,
    };
    db.set((prev) => ({ ...prev, smartList: [...prev.smartList, row] }));
    return mockJson(smartListPayload());
  }),

  http.patch(mockPath(REWARDS_MOCK_MODULE, 'smart-list/items/:id'), async ({ params, request }) => {
    await delay(250);
    const id = String(params.id ?? '');
    if (!db.get().smartList.some((i) => i.id === id)) {
      return mockError(404, 'rewards/item-not-found');
    }
    const input = await body(request);
    db.set((prev) => ({
      ...prev,
      smartList: prev.smartList.map((item) => {
        if (item.id !== id) return item;
        const quantity =
          typeof input.quantity === 'number' && input.quantity > 0
            ? Math.min(99, Math.trunc(input.quantity))
            : item.quantity;
        return {
          ...item,
          quantity,
          checked: typeof input.checked === 'boolean' ? input.checked : item.checked,
        };
      }),
    }));
    return mockJson(smartListPayload());
  }),

  http.delete(mockPath(REWARDS_MOCK_MODULE, 'smart-list/items/:id'), async ({ params }) => {
    await delay(300);
    const id = String(params.id ?? '');
    if (!db.get().smartList.some((i) => i.id === id)) {
      return mockError(404, 'rewards/item-not-found');
    }
    db.set((prev) => ({ ...prev, smartList: prev.smartList.filter((i) => i.id !== id) }));
    return mockJson(smartListPayload());
  }),

  /* ------------------------------------------------------ N6 price alerts */
  http.get(mockPath(REWARDS_MOCK_MODULE, 'price-alerts'), async ({ request }) => {
    await delay(450);
    const state = new URL(request.url).searchParams.get('state');
    if (state === 'empty') return mockJson({ alerts: [], feed: db.get().feed });
    return mockJson(alertsPayload());
  }),

  http.post(mockPath(REWARDS_MOCK_MODULE, 'price-alerts'), async ({ request }) => {
    await delay(600);
    const input = await body(request);
    const name = String(input.product_name ?? '').trim();
    const target = typeof input.target_price === 'number' ? input.target_price : 0;
    const issues: Array<{ path: string; message: string }> = [];
    if (!name) issues.push({ path: 'product_name', message: 'rewards/alert-name-required' });
    // Magic input: a non-positive target is the documented validation failure.
    if (!(target > 0)) issues.push({ path: 'target_price', message: 'rewards/alert-target-invalid' });
    if (issues.length > 0) return mockValidationError(issues);

    const store = String(input.store_name ?? '').trim();
    const storeText: Text = store
      ? { az: store, ru: store, en: store }
      : { az: 'Ozio Market', ru: 'Ozio Market', en: 'Ozio Market' };
    // A demo "current price" that is deterministic and always above the target the user asked for.
    const current = Math.round(target * 1.18 * 100) / 100;
    const row: AlertRow = {
      id: mockId('p'),
      product_name: { az: name, ru: name, en: name },
      emoji: '🛒',
      store_name: storeText,
      current_price: current,
      tracked_price: current,
      target_price: Math.round(target * 100) / 100,
      active: true,
    };
    db.set((prev) => ({ ...prev, alerts: [...prev.alerts, row] }));
    return mockJson(alertsPayload());
  }),

  http.patch(mockPath(REWARDS_MOCK_MODULE, 'price-alerts/:id'), async ({ params, request }) => {
    await delay(250);
    const id = String(params.id ?? '');
    if (!db.get().alerts.some((a) => a.id === id)) {
      return mockError(404, 'rewards/alert-not-found');
    }
    const input = await body(request);
    if (input.target_price !== undefined && !(Number(input.target_price) > 0)) {
      return mockValidationError([
        { path: 'target_price', message: 'rewards/alert-target-invalid' },
      ]);
    }
    db.set((prev) => ({
      ...prev,
      alerts: prev.alerts.map((alert) => {
        if (alert.id !== id) return alert;
        return {
          ...alert,
          active: typeof input.active === 'boolean' ? input.active : alert.active,
          target_price:
            input.target_price === undefined
              ? alert.target_price
              : Math.round(Number(input.target_price) * 100) / 100,
        };
      }),
    }));
    return mockJson(alertsPayload());
  }),

  http.delete(mockPath(REWARDS_MOCK_MODULE, 'price-alerts/:id'), async ({ params }) => {
    await delay(350);
    const id = String(params.id ?? '');
    if (!db.get().alerts.some((a) => a.id === id)) {
      return mockError(404, 'rewards/alert-not-found');
    }
    db.set((prev) => ({ ...prev, alerts: prev.alerts.filter((a) => a.id !== id) }));
    return mockJson(alertsPayload());
  }),

  /* ------------------------------------------------------- feed (shared) */
  http.get(mockPath(REWARDS_MOCK_MODULE, 'feed'), async ({ request }) => {
    await delay(350);
    const period = new URL(request.url).searchParams.get('period');
    const rows = db.get().feed;
    return mockJson(period ? rows.filter((r) => r.period === period) : rows);
  }),
];

registerMockHandlers(REWARDS_MOCK_MODULE, flagged(rewardsHandlers, REWARDS_FLAG));
