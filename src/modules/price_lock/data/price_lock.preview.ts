/**
 * `?preview=` seeds for the price_lock screens.
 *
 * `useScreenQuery` hands `seed.empty` to `?preview=empty` and `seed.data` to any other value, so
 * `?preview=expired` renders the history tab's `Tag · Bitib` card and an elapsed guarantee without
 * waiting six months.
 *
 * These are already-parsed domain models standing in for a source response, so they carry the
 * derived numbers rather than inviting a component to compute them.
 */
import type { Guarantee } from './models/guarantee';
import type { PriceLockList } from './models/price-lock-item';

const DAY = 86_400_000;

/** The eight staples as the source sends them, with their per-unit differences. */
const STAPLES = [
  { id: 's1', name: 'Günəbaxan yağı 1 L', lockedPrice: 3.2, marketPrice: 3.6, difference: 0.4 },
  { id: 's2', name: 'Buğda unu 2 kq', lockedPrice: 2.8, marketPrice: 2.8, difference: 0 },
  { id: 's3', name: 'Qara çay 100 q', lockedPrice: 2.1, marketPrice: 2.35, difference: 0.25 },
  { id: 's4', name: 'Şəkər tozu 1 kq', lockedPrice: 1.6, marketPrice: 1.9, difference: 0.3 },
  { id: 's5', name: 'Ağ düyü 1 kq', lockedPrice: 2.4, marketPrice: 2.4, difference: 0 },
  { id: 's6', name: 'Makaron 500 q', lockedPrice: 1.1, marketPrice: 1.1, difference: 0 },
  { id: 's7', name: 'Tualet sabunu', lockedPrice: 0.9, marketPrice: 1.05, difference: 0.15 },
  { id: 's8', name: 'Diş pastası', lockedPrice: 2.5, marketPrice: 2.5, difference: 0 },
];

/** `?preview=empty` on `/price-guarantee` — the `notLinked` card-input screen. */
export const PREVIEW_NOT_LINKED: Guarantee = {
  status: 'notLinked',
  maskedCard: null,
  startedAt: null,
  endsAt: null,
  items: STAPLES,
  daysLeft: 0,
  elapsedDays: 0,
  totalDays: 0,
  months: 6,
  progress: 0,
  platformPays: 1.1,
  expired: false,
};

/** `?preview=expired` on `/price-guarantee` — the window ran out yesterday. */
export const PREVIEW_GUARANTEE_EXPIRED: Guarantee = {
  status: 'active',
  maskedCard: '**** 4821',
  startedAt: new Date(Date.now() - 183 * DAY).toISOString(),
  endsAt: new Date(Date.now() - DAY).toISOString(),
  items: STAPLES,
  daysLeft: 0,
  elapsedDays: 182,
  totalDays: 182,
  months: 6,
  progress: 1,
  platformPays: 1.1,
  expired: true,
};

/** `?preview=expired` on `/price-locks` — nothing active, two history rows. */
export const PREVIEW_LOCKS_EXPIRED: PriceLockList = {
  active: [],
  history: [
    {
      id: 'l3',
      productName: 'Tam südlü pendir 400 q',
      lockedPrice: 5.9,
      currentPrice: 6.3,
      deposit: 1,
      expiresAt: new Date(Date.now() - 20 * DAY).toISOString(),
      status: 'used',
      daysLeft: 0,
      savings: 0.4,
    },
    {
      id: 'l4',
      productName: 'Makaron 500 q',
      lockedPrice: 1.1,
      currentPrice: 1.05,
      deposit: 1,
      expiresAt: new Date(Date.now() - 40 * DAY).toISOString(),
      status: 'expired',
      daysLeft: 0,
      savings: 0,
    },
  ],
  lockDays: 15,
  deposit: 1,
};
