/**
 * Demo fixtures for the top-up module.
 *
 * Only the **mock** half of the module is in here: limits, the fee, the quick amounts and the
 * cashier copy. The balance, the Ozio card number and the saved cards are real reads and are never
 * faked (see `topup.remote.ts`).
 *
 * Numbers are taken from the design export (`topup-method.html`: "minimum 5,00 ₼, maksimum
 * 200,00 ₼"; `topup-card.html`: chips 5 / 10 / 20 / 50 / 100 and a "Pulsuz" fee), so the mock
 * reproduces the drawn screen exactly. Strings carry az/ru/en, per BUILD-CONTRACT "Mock modules".
 */

export type FixtureLocale = 'az' | 'ru' | 'en';

const LOCALES: readonly FixtureLocale[] = ['az', 'ru', 'en'];

export const asFixtureLocale = (raw: string | null | undefined): FixtureLocale => {
  const value = (raw ?? '').slice(0, 2).toLowerCase();
  return LOCALES.includes(value as FixtureLocale) ? (value as FixtureLocale) : 'az';
};

/* ------------------------------------------------------------------ limits + fee */

/**
 * `GET /api/mock/topup/limits`. Wire shape (snake_case, like the real API) so the parser and the
 * repository are unchanged on the day a real `GET v1/topup/config` ships.
 */
export const TOPUP_LIMITS_FIXTURE = {
  min: 5,
  max: 200,
  fee_percent: 0,
  quick_amounts: [5, 10, 20, 50, 100],
  currency: 'AZN',
} as const;

/* ------------------------------------------------------------------ cashier copy */

const CASHIER_STEPS: Record<FixtureLocale, readonly string[]> = {
  az: [
    'Kassirə balansı artırmaq istədiyini və məbləği de',
    'Kassir bu barkodu skan edir',
    'Nağd və ya bank kartı ilə ödə',
    'Ödənişdən sonra balans yenilənir',
  ],
  ru: [
    'Скажи кассиру, что хочешь пополнить баланс, и назови сумму',
    'Кассир сканирует этот штрихкод',
    'Оплати наличными или банковской картой',
    'После оплаты баланс обновится',
  ],
  en: [
    'Tell the cashier you want to top up and name the amount',
    'The cashier scans this barcode',
    'Pay with cash or a bank card',
    'Your balance updates after the payment',
  ],
};

/** The branch names stay as they are drawn; only the street words are translated. */
const NEARBY_MARKETS: Record<FixtureLocale, ReadonlyArray<{ id: string; name: string; distance_meters: number }>> = {
  az: [
    { id: 'bolmart-28may', name: 'Bolmart · 28 May', distance_meters: 350 },
    { id: 'bravo-nizami14', name: 'Bravo · Nizami küç. 14', distance_meters: 1200 },
    { id: 'araz-yasamal', name: 'Araz Market · Yasamal', distance_meters: 2400 },
  ],
  ru: [
    { id: 'bolmart-28may', name: 'Bolmart · 28 Мая', distance_meters: 350 },
    { id: 'bravo-nizami14', name: 'Bravo · ул. Низами 14', distance_meters: 1200 },
    { id: 'araz-yasamal', name: 'Araz Market · Ясамал', distance_meters: 2400 },
  ],
  en: [
    { id: 'bolmart-28may', name: 'Bolmart · 28 May', distance_meters: 350 },
    { id: 'bravo-nizami14', name: 'Bravo · Nizami str. 14', distance_meters: 1200 },
    { id: 'araz-yasamal', name: 'Araz Market · Yasamal', distance_meters: 2400 },
  ],
};

export const cashierFixture = (locale: FixtureLocale) => ({
  steps: CASHIER_STEPS[locale].map((text, i) => ({ index: i + 1, text })),
  nearby: NEARBY_MARKETS[locale],
});

/* ------------------------------------------------------------------ demo hooks */

/**
 * **The documented demo hook:** an amount of exactly **13 ₼** is always declined, so the
 * `topup-failed.html` state is reachable without `?preview=`.
 * (08-feature-flags-mocks.md "Deterministic demo hooks: magic inputs documented per module".)
 */
export const MAGIC_FAILURE_AMOUNT = 13;

/** The error code the magic amount produces — printed verbatim on `topup-failed.html`. */
export const DECLINE_ERROR_CODE = 'CARD_DECLINED';

/** An expired card is not selectable; charging one anyway is the second documented decline. */
export const EXPIRED_CARD_ERROR_CODE = 'CARD_EXPIRED';

/** api/mock-contracts.ts `MOCK_DELAYS.topupCharge` — long enough to see the button spinner. */
export const TOPUP_CHARGE_DELAY_MS = 1800;
export const TOPUP_READ_DELAY_MS = 500;

/** `TP-20261118-04821`, the reference drawn on `topup-success.html`. */
export function topupReference(at: Date, seq: number): string {
  const y = at.getUTCFullYear();
  const m = String(at.getUTCMonth() + 1).padStart(2, '0');
  const d = String(at.getUTCDate()).padStart(2, '0');
  return `TP-${y}${m}${d}-${String(seq % 100000).padStart(5, '0')}`;
}
