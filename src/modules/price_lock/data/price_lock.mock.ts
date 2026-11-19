/**
 * The price_lock demo "server": MSW handlers under `/api/mock/price_lock/…`.
 *
 * As in group_buy, this is the only file that knows the demo is a demo. It answers with the real
 * envelope, snake_case wire fields and `translations: [{locale, name}]`, and it owns **all**
 * derivation:
 *
 * - the guarantee's `days_left`, `elapsed_days`, `progress` and `platform_pays`, and each staple's
 *   `difference`, are recomputed against the clock on every request;
 * - a lock's `days_left` and `savings` likewise, and **a lock whose window has elapsed is flipped
 *   to `expired` and persisted** — so a `/price-locks` tab left open across a deadline learns the
 *   truth from a refetch instead of guessing;
 * - `started_at` / `ends_at` / `expires_at` are absolute instants written **once** (at seed, or
 *   when the card is linked / a lock is created) and persisted to `localStorage` under
 *   `ozio.mock.price_lock`, so a reload never restarts a window.
 *
 * Nothing is charged: the 1 ₼ deposit is demo state, `useLock` only marks the row used, and the
 * card number never leaves this handler — only `**** <last4>` is stored.
 */
import { http } from 'msw';

import {
  createMockDb,
  delay,
  flagged,
  mockError,
  mockJson,
  mockPath,
  mockValidationError,
  registerMockHandlers,
} from '@/core/mocks';

import {
  GUARANTEE_MONTHS,
  GUARANTEE_STARTED_DAYS_AGO,
  PRICE_LOCKS,
  PRICE_LOCK_DAYS,
  PRICE_LOCK_DEPOSIT,
  PRICE_LOCK_STAPLES,
  type FixtureName,
  type LockStatusFixture,
} from './price_lock.fixtures';
import { PRICE_LOCK_FLAG, PRICE_LOCK_MOCK_MODULE } from '../price_lock.flags';

/* ------------------------------------------------------------------ latency (mock-modules.md: 700 ms) */

const READ_MS = 700;
const WRITE_MS = 700;

const DAY = 86_400_000;

/* ------------------------------------------------------------------ the stored rows */

type Lang = 'az' | 'ru' | 'en';

interface LockRow {
  id: string;
  /** Absolute ISO instant, written once. */
  expiresAt: string;
  lockedPrice: number;
  currentPrice: number;
  deposit: number;
  status: LockStatusFixture;
  /** Seeded rows carry the az/ru/en catalog copy; a row created from the freeze dialog carries
   *  the product name it was given, in whatever locale the user was using. */
  translations: FixtureName[];
}

interface PriceLockState {
  /** `null` until the card is linked. */
  card: { maskedCard: string; startedAt: string; endsAt: string } | null;
  locks: LockRow[];
}

const seed = (): PriceLockState => {
  const now = Date.now();
  return {
    card: null,
    locks: PRICE_LOCKS.map((l) => ({
      id: l.id,
      expiresAt: new Date(now + l.expiresInDays * DAY).toISOString(),
      lockedPrice: l.lockedPrice,
      currentPrice: l.currentPrice,
      deposit: PRICE_LOCK_DEPOSIT,
      status: l.status,
      translations: [...l.translations],
    })),
  };
};

const db = createMockDb<PriceLockState>(PRICE_LOCK_MOCK_MODULE, seed);

/* ------------------------------------------------------------------ derivation */

const round2 = (v: number): number => Math.round(v * 100) / 100;
const difference = (locked: number, market: number): number =>
  market > locked ? round2(market - locked) : 0;

const localeOf = (url: URL): Lang => {
  const raw = (url.searchParams.get('lang') ?? 'az').toLowerCase();
  return raw === 'ru' || raw === 'en' ? raw : 'az';
};

/** Whole days from now to an instant, floored at 0. */
const daysTo = (iso: string): number =>
  Math.max(0, Math.floor((Date.parse(iso) - Date.now()) / DAY));

const serializeStaples = () =>
  PRICE_LOCK_STAPLES.map((s) => ({
    id: s.id,
    translations: s.translations,
    locked_price: s.lockedPrice.toFixed(2),
    market_price: s.marketPrice.toFixed(2),
    difference: difference(s.lockedPrice, s.marketPrice),
  }));

/** `sum(difference)` over the staples — "Platforma bu dövrdə ödəyib". */
const platformPays = (): number =>
  round2(
    PRICE_LOCK_STAPLES.reduce((sum, s) => sum + difference(s.lockedPrice, s.marketPrice), 0),
  );

function serializeGuarantee(state: PriceLockState) {
  const staples = serializeStaples();
  if (!state.card) {
    return {
      status: 'notLinked',
      masked_card: null,
      started_at: null,
      ends_at: null,
      items: staples,
      days_left: 0,
      elapsed_days: 0,
      total_days: 0,
      months: GUARANTEE_MONTHS,
      progress: 0,
      platform_pays: platformPays(),
      expired: false,
    };
  }

  const started = Date.parse(state.card.startedAt);
  const ends = Date.parse(state.card.endsAt);
  const now = Date.now();
  const totalDays = Math.max(1, Math.round((ends - started) / DAY));
  const elapsedDays = Math.max(0, Math.floor((now - started) / DAY));

  return {
    status: 'active',
    masked_card: state.card.maskedCard,
    started_at: state.card.startedAt,
    ends_at: state.card.endsAt,
    items: staples,
    days_left: daysTo(state.card.endsAt),
    elapsed_days: elapsedDays,
    total_days: totalDays,
    months: GUARANTEE_MONTHS,
    progress: Math.min(1, Math.max(0, elapsedDays / totalDays)),
    platform_pays: platformPays(),
    expired: now >= ends,
  };
}

/**
 * Settles every lock against the clock and persists the transitions, then serializes.
 * This is what makes an elapsed window honest: the state changes on the "server", once.
 */
function settleAndSerializeLocks() {
  const now = Date.now();
  const needsSettling = db
    .get()
    .locks.some((l) => l.status === 'active' && Date.parse(l.expiresAt) <= now);

  if (needsSettling) {
    db.set((state) => ({
      ...state,
      locks: state.locks.map((l) =>
        l.status === 'active' && Date.parse(l.expiresAt) <= now
          ? { ...l, status: 'expired' as LockStatusFixture }
          : l,
      ),
    }));
  }

  return db.get().locks.map((l) => ({
    id: l.id,
    translations: l.translations,
    locked_price: l.lockedPrice.toFixed(2),
    current_price: l.currentPrice.toFixed(2),
    deposit: l.deposit.toFixed(2),
    expires_at: l.expiresAt,
    status: l.status,
    days_left: l.status === 'active' ? daysTo(l.expiresAt) : 0,
    savings: difference(l.lockedPrice, l.currentPrice),
  }));
}

/** Six calendar months from today, less the 38 days the demo pretends have already passed. */
function linkWindow(now: Date): { startedAt: string; endsAt: string } {
  const start = new Date(now.getTime() - GUARANTEE_STARTED_DAYS_AGO * DAY);
  const end = new Date(now.getTime());
  end.setMonth(end.getMonth() + GUARANTEE_MONTHS);
  return {
    startedAt: start.toISOString(),
    endsAt: new Date(end.getTime() - GUARANTEE_STARTED_DAYS_AGO * DAY).toISOString(),
  };
}

/* ------------------------------------------------------------------ handlers */

export const priceLockHandlers = [
  /** `GET guarantee?lang=` — PL1's `notLinked` / `active` payload. */
  http.get(mockPath(PRICE_LOCK_MOCK_MODULE, 'guarantee'), async () => {
    await delay(READ_MS);
    return mockJson(serializeGuarantee(db.get()));
  }),

  /**
   * `POST guarantee/link` — `{ card_number }`.
   *
   * A number with fewer than 12 digits is refused with 422 and the drawn copy
   * ("Kart nömrəsi yanlışdır. Yenidən yoxla."), which is the `State · Kart bağlanmadı` panel.
   * Only `**** <last4>` is ever stored.
   */
  http.post(mockPath(PRICE_LOCK_MOCK_MODULE, 'guarantee/link'), async ({ request }) => {
    await delay(WRITE_MS);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const digits = String(body?.card_number ?? '').replace(/\D/g, '');

    if (digits.length < 12) {
      return mockValidationError(
        [{ path: 'card_number', message: 'Kart nömrəsi yanlışdır. Yenidən yoxla.' }],
        'Kart bağlanmadı',
      );
    }

    const window = linkWindow(new Date());
    db.patch({
      card: {
        maskedCard: `**** ${digits.slice(-4)}`,
        startedAt: window.startedAt,
        endsAt: window.endsAt,
      },
    });
    return mockJson(serializeGuarantee(db.get()));
  }),

  /** `DELETE guarantee/link` — back to `notLinked`; the staples stay listed. */
  http.delete(mockPath(PRICE_LOCK_MOCK_MODULE, 'guarantee/link'), async () => {
    await delay(WRITE_MS);
    db.patch({ card: null });
    return mockJson(serializeGuarantee(db.get()));
  }),

  /** `GET locks?lang=` — both tabs, after settling elapsed windows. */
  http.get(mockPath(PRICE_LOCK_MOCK_MODULE, 'locks'), async () => {
    await delay(READ_MS);
    const items = settleAndSerializeLocks();
    return mockJson({
      items,
      total: items.length,
      lock_days: PRICE_LOCK_DAYS,
      deposit: PRICE_LOCK_DEPOSIT,
    });
  }),

  /**
   * `POST locks` — `{ product_name, price }`, the PL3 freeze dialog.
   *
   * `expires_at = now + 15 d + 1 h`, so the card reads "15 gün qalıb" rather than flooring to 14.
   * The 1 ₼ deposit is recorded on the row and **not charged**.
   */
  http.post(mockPath(PRICE_LOCK_MOCK_MODULE, 'locks'), async ({ request }) => {
    await delay(WRITE_MS);
    const url = new URL(request.url);
    const lang = localeOf(url);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    const name = String(body?.product_name ?? '').trim();
    const price = Number(body?.price ?? Number.NaN);
    if (!name || !Number.isFinite(price) || price <= 0) {
      return mockValidationError(
        [{ path: 'product_name', message: 'Məhsul və qiymət tələb olunur' }],
        'Dondurmaq alınmadı',
      );
    }

    const row: LockRow = {
      id: `l${Date.now().toString(36)}`,
      expiresAt: new Date(Date.now() + PRICE_LOCK_DAYS * DAY + 3_600_000).toISOString(),
      lockedPrice: round2(price),
      currentPrice: round2(price),
      deposit: PRICE_LOCK_DEPOSIT,
      status: 'active',
      // The dialog is opened from a product, so only the active locale's name is known.
      translations: [{ locale: lang, name }],
    };
    db.set((state) => ({ ...state, locks: [row, ...state.locks] }));

    return mockJson({
      id: row.id,
      translations: row.translations,
      locked_price: row.lockedPrice.toFixed(2),
      current_price: row.currentPrice.toFixed(2),
      deposit: row.deposit.toFixed(2),
      expires_at: row.expiresAt,
      status: row.status,
      days_left: daysTo(row.expiresAt),
      savings: 0,
    });
  }),

  /** `POST locks/{id}/use` — marks the lock used. Demo state only; no cart row, no charge. */
  http.post(mockPath(PRICE_LOCK_MOCK_MODULE, 'locks/:id/use'), async ({ params }) => {
    await delay(WRITE_MS);
    const id = String(params.id);
    const row = db.get().locks.find((l) => l.id === id);
    if (!row) return mockError(404, 'Kilid tapılmadı');
    if (row.status !== 'active') return mockError(409, 'Kilid artıq istifadə olunub');
    if (Date.parse(row.expiresAt) <= Date.now()) return mockError(409, 'Kilidin vaxtı bitib');

    db.set((state) => ({
      ...state,
      locks: state.locks.map((l) => (l.id === id ? { ...l, status: 'used' as LockStatusFixture } : l)),
    }));
    return mockJson({ id, status: 'used' });
  }),
];

registerMockHandlers(PRICE_LOCK_MOCK_MODULE, flagged(priceLockHandlers, PRICE_LOCK_FLAG));
