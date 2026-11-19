/**
 * MSW stub for the **one** capability the Ozio API does not have: geocoding.
 *
 * It answers `/api/mock/address/geocode/search?q&locale` and
 * `/api/mock/address/geocode/reverse?lat&lng&locale` with the real envelope, so the repository
 * cannot tell a stub from a server.
 *
 * What it covers:
 *  - 12 real Baku / Sumqayıt / Xırdalan streets with their true approximate coordinates;
 *  - az / ru / en labels for every row (the design is az-first, ru is the longest);
 *  - substring matching over the label, the street and the district, accent-insensitive for the
 *    Azerbaijani letters, so "recebli", "Rəcəbli" and "Реджабли" all find the same row;
 *  - reverse lookup = the nearest fixture within ~1.2 km, otherwise `null` ("nothing is mapped
 *    here"), which is what drives the picker's "no address" state;
 *  - 220–320 ms of latency so the search skeleton is actually visible.
 *
 * Everything else about addresses is the **real** API — only this file is fake.
 */
import { http, type HttpHandler } from 'msw';

import { delay, mockJson, mockPath, registerMockHandlers } from '@/core/mocks';

interface Fixture {
  id: string;
  lat: number;
  lng: number;
  street: Record<'az' | 'ru' | 'en', string>;
  district: Record<'az' | 'ru' | 'en', string>;
  city: Record<'az' | 'ru' | 'en', string>;
}

const FIXTURES: readonly Fixture[] = [
  {
    id: 'ahmad-racabli',
    lat: 40.41034,
    lng: 49.87462,
    street: { az: 'Əhməd Rəcəbli küç.', ru: 'ул. Ахмеда Раджабли', en: 'Ahmad Rajabli str.' },
    district: { az: 'Nərimanov', ru: 'Нариманов', en: 'Narimanov' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'ataturk-pr',
    lat: 40.40186,
    lng: 49.8702,
    street: { az: 'Atatürk pr.', ru: 'пр. Ататюрка', en: 'Ataturk ave.' },
    district: { az: 'Nərimanov', ru: 'Нариманов', en: 'Narimanov' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'rashid-behbudov',
    lat: 40.38207,
    lng: 49.8511,
    street: { az: 'Rəşid Behbudov küç.', ru: 'ул. Рашида Бейбутова', en: 'Rashid Behbudov str.' },
    district: { az: 'Nizami', ru: 'Низами', en: 'Nizami' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'husein-javid',
    lat: 40.37554,
    lng: 49.81346,
    street: { az: 'H. Cavid pr.', ru: 'пр. Гусейна Джавида', en: 'H. Javid ave.' },
    district: { az: 'Yasamal', ru: 'Ясамал', en: 'Yasamal' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'azadliq-pr',
    lat: 40.40631,
    lng: 49.84105,
    street: { az: 'Azadlıq pr.', ru: 'пр. Азадлыг', en: 'Azadliq ave.' },
    district: { az: 'Nəsimi', ru: 'Насими', en: 'Nasimi' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'tabriz',
    lat: 40.4112,
    lng: 49.8652,
    street: { az: 'Təbriz küç.', ru: 'ул. Тебриз', en: 'Tabriz str.' },
    district: { az: 'Nərimanov', ru: 'Нариманов', en: 'Narimanov' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'hasan-bey-zardabi',
    lat: 40.4042,
    lng: 49.8321,
    street: { az: 'Həsən bəy Zərdabi pr.', ru: 'пр. Гасан бека Зардаби', en: 'Hasan bey Zardabi ave.' },
    district: { az: 'Yasamal', ru: 'Ясамал', en: 'Yasamal' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'nizami-kuc',
    lat: 40.3714,
    lng: 49.8371,
    street: { az: 'Nizami küç.', ru: 'ул. Низами', en: 'Nizami str.' },
    district: { az: 'Səbail', ru: 'Сабаил', en: 'Sabail' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'neftchilar',
    lat: 40.36786,
    lng: 49.84454,
    street: { az: 'Neftçilər pr.', ru: 'пр. Нефтяников', en: 'Neftchilar ave.' },
    district: { az: 'Səbail', ru: 'Сабаил', en: 'Sabail' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'koroglu',
    lat: 40.4201,
    lng: 49.9369,
    street: { az: 'Koroğlu Rəhimov küç.', ru: 'ул. Кероглу Рагимова', en: 'Koroghlu Rahimov str.' },
    district: { az: 'Xətai', ru: 'Хатаи', en: 'Khatai' },
    city: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  },
  {
    id: 'sumqayit-9',
    lat: 40.5897,
    lng: 49.6686,
    street: { az: '9-cu mikrorayon', ru: '9-й микрорайон', en: '9th microdistrict' },
    district: { az: 'Sumqayıt', ru: 'Сумгаит', en: 'Sumgayit' },
    city: { az: 'Sumqayıt', ru: 'Сумгаит', en: 'Sumgayit' },
  },
  {
    id: 'xirdalan-heydar-aliyev',
    lat: 40.4495,
    lng: 49.7549,
    street: { az: 'Heydər Əliyev pr.', ru: 'пр. Гейдара Алиева', en: 'Heydar Aliyev ave.' },
    district: { az: 'Xırdalan', ru: 'Хырдалан', en: 'Khirdalan' },
    city: { az: 'Xırdalan', ru: 'Хырдалан', en: 'Khirdalan' },
  },
];

type Loc = 'az' | 'ru' | 'en';

const asLocale = (raw: string | null): Loc =>
  raw === 'ru' || raw === 'en' ? raw : 'az';

/** Accent-insensitive fold so "recebli" matches "Rəcəbli". */
function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function labelOf(row: Fixture, locale: Loc, houseNumber?: string): string {
  const head = `${row.district[locale]}, ${row.street[locale]}`;
  return houseNumber ? `${head} ${houseNumber}` : head;
}

function toPlace(row: Fixture, locale: Loc, houseNumber?: string) {
  return {
    id: houseNumber ? `${row.id}-${houseNumber}` : row.id,
    label: labelOf(row, locale, houseNumber),
    street: houseNumber ? `${row.street[locale]} ${houseNumber}` : row.street[locale],
    district: row.district[locale],
    city: row.city[locale],
    lat: row.lat,
    lng: row.lng,
  };
}

const EARTH_R = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;
function meters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Nothing is "mapped" further than this from a fixture — that is the picker's empty state. */
const REVERSE_RADIUS_M = 1_200;

export const addressGeocodeHandlers: HttpHandler[] = [
  http.get(mockPath('address', 'geocode/search'), async ({ request }) => {
    await delay(260);
    const url = new URL(request.url);
    const locale = asLocale(url.searchParams.get('locale'));
    const raw = (url.searchParams.get('q') ?? '').trim();
    if (raw.length < 2) return mockJson([]);

    // A trailing number is treated as the house number, so "Rəcəbli 12" keeps the 12.
    const houseMatch = /(\d{1,4}[a-zA-Z]?)\s*$/.exec(raw);
    const house = houseMatch?.[1];
    const needle = fold(house ? raw.slice(0, houseMatch!.index) : raw);

    const matches = FIXTURES.filter((row) => {
      const haystack = fold(
        `${row.street[locale]} ${row.district[locale]} ${row.city[locale]} ${row.street.az} ${row.street.en} ${row.district.az}`,
      );
      return needle.length === 0 || haystack.includes(needle);
    });

    return mockJson(matches.slice(0, 8).map((row) => toPlace(row, locale, house)));
  }),

  http.get(mockPath('address', 'geocode/reverse'), async ({ request }) => {
    await delay(320);
    const url = new URL(request.url);
    const locale = asLocale(url.searchParams.get('locale'));
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return mockJson(null);

    let best: { row: Fixture; distance: number } | null = null;
    for (const row of FIXTURES) {
      const distance = meters(lat, lng, row.lat, row.lng);
      if (!best || distance < best.distance) best = { row, distance };
    }
    if (!best || best.distance > REVERSE_RADIUS_M) return mockJson(null);
    return mockJson(toPlace(best.row, locale));
  }),
];

registerMockHandlers('address', addressGeocodeHandlers);
