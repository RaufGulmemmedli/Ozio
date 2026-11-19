/**
 * Demo fixtures for `courier_plus`. **Only `courier_plus.mock.ts` imports this file** — a view or
 * a hook never does, so nothing in the UI depends on sample data (BUILD-CONTRACT rule 7).
 *
 * Numbers come from the design exports (`yolustu-kuryer-*.html`) and the seed documented in
 * `api/mock-modules.md` §3; every label carries az / ru / en.
 *
 * The three parcels the matches screen draws (`c9F0G2`) are `o1`–`o3`; `o4`–`o6` exist so the
 * handler's matching actually filters something (too long a detour, too heavy for the metro, off
 * the corridor).
 */

/** A label the "API" sends as `<field>` (az) + `<field>_translations: [{ locale, name }]`. */
export interface L10nText {
  az: string;
  ru: string;
  en: string;
}

export interface ParcelSeed {
  id: string;
  pickup: L10nText;
  dropoff: L10nText;
  /** Lower-cased address tokens this parcel sits next to — the corridor test. */
  areas: readonly string[];
  /** Minutes the detour costs on the metro; the handler scales it per transport. */
  baseDetourMinutes: number;
  /** Extra kilometres the detour adds (server-side, used for the map alternative). */
  detourKm: number;
  /** The merchant's own handling fee, in AZN — the floor of the courier's pay. */
  baseFee: number;
  weightKg: number;
  distanceKm: number;
}

export interface HubParcelSeed {
  id: string;
  recipient: string;
  /** 4 digits. Never logged, never rendered — only compared inside the handler. */
  code: string;
  waitingMinutes: number;
  commission: number;
}

export interface NearbyHubSeed {
  id: string;
  name: L10nText;
  address: L10nText;
  distanceMeters: number;
  openMinutes: number;
  closeMinutes: number;
}

export interface EarningSeed {
  id: string;
  title: L10nText;
  amount: number;
  /** Days ago; the handler turns it into an ISO timestamp so the view can format it. */
  dayOffset: number;
}

const hhmm = (h: number, m = 0): number => h * 60 + m;

/* ------------------------------------------------------------------ the route */

/** `I6kivj` / `uVeqa`: Nizami küç. 12 → Xətai prospekti 48, 08:30, metro. */
export const CP_ROUTE_SEED = {
  from: 'Nizami küç. 12',
  to: 'Xətai prospekti 48',
  departMinutes: hhmm(8, 30),
  transport: 'metro' as const,
  active: true,
};

/** The chips on `I6kivj`, in drawn order. */
export const CP_DEPART_PRESETS: readonly number[] = [
  hhmm(8),
  hhmm(8, 30),
  hhmm(9),
  hhmm(9, 30),
];

/* ------------------------------------------------------------------ pricing & matching */

/**
 * The fee the "server" quotes for a match: `baseFee + km × perKm + (kg − 1) × perKg`, rounded to
 * a qəpik. With the seed below this reproduces the drawn 2,40 / 3,10 / 1,80 ₼ exactly.
 */
export const CP_PRICING = { perKm: 0.4, perKgOverOne: 0.3 } as const;

/** Detour cost and carrying limit per transport. */
export const CP_TRANSPORT_RULES = {
  walk: { detourFactor: 1.8, maxDetourMinutes: 4, maxWeightKg: 3 },
  bike: { detourFactor: 1.3, maxDetourMinutes: 6, maxWeightKg: 8 },
  metro: { detourFactor: 1, maxDetourMinutes: 5, maxWeightKg: 10 },
  bus: { detourFactor: 1.2, maxDetourMinutes: 6, maxWeightKg: 10 },
  car: { detourFactor: 0.8, maxDetourMinutes: 8, maxWeightKg: 25 },
} as const;

/** Added to the detour when the parcel is not on the declared corridor. */
export const CP_OFF_CORRIDOR_PENALTY_MINUTES = 3;

/** The limit the "Necə işləyir" panel quotes (`I6kivj`). */
export const CP_ADVERTISED_MAX_DETOUR = CP_TRANSPORT_RULES.metro.maxDetourMinutes;

/* ------------------------------------------------------------------ parcels */

export const CP_PARCEL_SEEDS: readonly ParcelSeed[] = [
  {
    id: 'o1',
    pickup: {
      az: 'Ozio market, 28 May',
      ru: 'Ozio маркет, 28 Мая',
      en: 'Ozio market, 28 May',
    },
    dropoff: {
      az: 'Nərimanov, Əhməd Rəcəbli 7',
      ru: 'Нариманов, Ахмед Раджабли 7',
      en: 'Narimanov, Ahmad Rajabli 7',
    },
    areas: ['28 may', 'nərimanov', 'nizami'],
    baseDetourMinutes: 3,
    detourKm: 0.6,
    baseFee: 1.5,
    weightKg: 1.2,
    distanceKm: 2.1,
  },
  {
    id: 'o2',
    pickup: { az: 'Ozio market, Nizami', ru: 'Ozio маркет, Низами', en: 'Ozio market, Nizami' },
    dropoff: {
      az: 'Xətai, Əliyar Əliyev 15',
      ru: 'Хатаи, Алияр Алиев 15',
      en: 'Xatai, Aliyar Aliyev 15',
    },
    areas: ['nizami', 'xətai'],
    baseDetourMinutes: 4,
    detourKm: 0.9,
    baseFee: 1.48,
    weightKg: 2.4,
    distanceKm: 3,
  },
  {
    id: 'o3',
    pickup: { az: 'Gənclik metrosu', ru: 'Метро «Гянджлик»', en: 'Gənclik metro station' },
    dropoff: { az: 'Azadlıq pr. 90', ru: 'пр. Азадлыг 90', en: 'Azadlıq ave. 90' },
    areas: ['gənclik', 'nizami', 'azadlıq'],
    baseDetourMinutes: 2,
    detourKm: 0.4,
    baseFee: 1.2,
    weightKg: 0.6,
    distanceKm: 1.5,
  },
  {
    id: 'o4',
    pickup: {
      az: 'Bolmart Təzə bazar, Yasamal',
      ru: 'Bolmart Тязя базар, Ясамал',
      en: 'Bolmart Təzə bazar, Yasamal',
    },
    dropoff: {
      az: 'Yasamal, Ş. Mehdiyev 22',
      ru: 'Ясамал, Ш. Мехтиев 22',
      en: 'Yasamal, S. Mehdiyev 22',
    },
    areas: ['yasamal'],
    baseDetourMinutes: 14,
    detourKm: 4.2,
    baseFee: 2.1,
    weightKg: 3.1,
    distanceKm: 7.8,
  },
  {
    id: 'o5',
    pickup: { az: 'Megastore, Xətai', ru: 'Megastore, Хатаи', en: 'Megastore, Xatai' },
    dropoff: {
      az: 'Əhmədli, Xocalı pr. 55',
      ru: 'Ахмедли, пр. Ходжалы 55',
      en: 'Ahmadli, Xocalı ave. 55',
    },
    areas: ['xətai', 'əhmədli'],
    baseDetourMinutes: 3,
    detourKm: 0.8,
    baseFee: 2.6,
    weightKg: 14,
    distanceKm: 5.2,
  },
  {
    id: 'o6',
    pickup: {
      az: 'Ozio market, Nərimanov',
      ru: 'Ozio маркет, Нариманов',
      en: 'Ozio market, Narimanov',
    },
    dropoff: {
      az: 'Xalqlar dostluğu, Təbriz küç. 9',
      ru: 'Халглар достлугу, ул. Тебриз 9',
      en: 'Xalqlar dostluğu, Təbriz str. 9',
    },
    areas: ['nərimanov', 'xalqlar'],
    baseDetourMinutes: 5,
    detourKm: 1.4,
    baseFee: 1.6,
    weightKg: 0.9,
    distanceKm: 2.8,
  },
];

/* ------------------------------------------------------------------ earnings */

/** `Z1KKa` / `uVeqa`: balance 14,80 ₼ · today 2,40 ₼ · month 28,40 ₼ · 11 deliveries. */
export const CP_EARNINGS_SEED = { balance: 14.8, today: 2.4, month: 28.4, deliveries: 11 };

export const CP_HISTORY_SEEDS: readonly EarningSeed[] = [
  {
    id: 'h-1',
    title: { az: 'Nizami → Nərimanov', ru: 'Низами → Нариманов', en: 'Nizami → Narimanov' },
    amount: 2.6,
    dayOffset: 1,
  },
  {
    id: 'h-2',
    title: { az: 'Gənclik → Xətai', ru: 'Гянджлик → Хатаи', en: 'Gənclik → Xatai' },
    amount: 1.9,
    dayOffset: 1,
  },
  {
    id: 'h-3',
    title: { az: '28 May → Azadlıq pr.', ru: '28 Мая → пр. Азадлыг', en: '28 May → Azadlıq ave.' },
    amount: 3.1,
    dayOffset: 3,
  },
  {
    id: 'h-4',
    title: { az: 'Nizami → Yasamal', ru: 'Низами → Ясамал', en: 'Nizami → Yasamal' },
    amount: 2.2,
    dayOffset: 4,
  },
];

/* ------------------------------------------------------------------ hub */

/** `A2S51h` chips. */
export const CP_HUB_CAPACITIES: readonly number[] = [5, 10, 20, 30];

/** `bjCMr`: Nizami küç. 14, 2-ci mərtəbə · 09:00–21:00 · capacity 10. */
export const CP_HUB_PROFILE_SEED = {
  address: 'Nizami küç. 14, 2-ci mərtəbə',
  openMinutes: hhmm(9),
  closeMinutes: hhmm(21),
  capacity: 10,
};

/** 0,30 ₼ per hand-over (`A2S51h` info panel). */
export const CP_HUB_COMMISSION = 0.3;

/** `bjCMr`: 1,20 ₼ today · 14,70 ₼ this month · 4 handed over today. */
export const CP_HUB_STATS_SEED = { commissionToday: 1.2, commissionMonth: 14.7, handedToday: 4 };

export const CP_HUB_PARCEL_SEEDS: readonly HubParcelSeed[] = [
  { id: 'h1', recipient: 'Aygün M.', code: '4821', waitingMinutes: 120, commission: CP_HUB_COMMISSION },
  { id: 'h2', recipient: 'Rəşad Ə.', code: '1937', waitingMinutes: 300, commission: CP_HUB_COMMISSION },
  { id: 'h3', recipient: 'Leyla H.', code: '7203', waitingMinutes: 1440, commission: CP_HUB_COMMISSION },
  { id: 'h4', recipient: 'Kamran S.', code: '5560', waitingMinutes: 1440, commission: CP_HUB_COMMISSION },
];

/** `z57Lfl`: the consumer's neighbour-hub picker. */
export const CP_NEARBY_HUB_SEEDS: readonly NearbyHubSeed[] = [
  {
    id: 'n1',
    name: { az: 'Aygün xanım', ru: 'Айгюн ханым', en: 'Aygün xanım' },
    address: {
      az: 'Nizami küç. 14, 2-ci mərtəbə',
      ru: 'ул. Низами 14, 2-й этаж',
      en: 'Nizami str. 14, 2nd floor',
    },
    distanceMeters: 120,
    openMinutes: hhmm(9),
    closeMinutes: hhmm(21),
  },
  {
    id: 'n2',
    name: { az: 'Rəşad bəy', ru: 'Рашад бей', en: 'Rəşad bəy' },
    address: { az: 'Ü. Hacıbəyov 6', ru: 'У. Гаджибеков 6', en: 'U. Hacıbəyov 6' },
    distanceMeters: 340,
    openMinutes: hhmm(10),
    closeMinutes: hhmm(20),
  },
  {
    id: 'n3',
    name: { az: 'Leyla xanım', ru: 'Лейла ханым', en: 'Leyla xanım' },
    address: { az: 'Xaqani küç. 31', ru: 'ул. Хагани 31', en: 'Xaqani str. 31' },
    distanceMeters: 710,
    openMinutes: hhmm(8),
    closeMinutes: hhmm(22),
  },
];
