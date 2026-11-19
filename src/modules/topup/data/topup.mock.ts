/**
 * MSW handlers for the top-up module — the **mock half** of a hybrid module.
 *
 * What is mocked here (there is no backend for any of it: swagger has no balance/wallet top-up
 * operation, only the unverified `POST v1/payment/save-card` hand-off):
 *
 *   GET  /api/mock/topup/limits              min / max / fee_percent / quick_amounts
 *   POST /api/mock/topup/quote               { amount } -> { amount, fee, total, new_balance }
 *   POST /api/mock/topup/pay                 { amount, card_id } -> outcome, **never a charge**
 *   GET  /api/mock/topup/receipts/{ref}      the stored outcome, so /topup/result survives a reload
 *   GET  /api/mock/topup/cashier?locale=     the 4 till steps + nearby markets (az/ru/en)
 *
 * What is **not** mocked, and must never be: the bonus balance, the Ozio card number and the saved
 * cards. Those are real reads in `topup.remote.ts` (`GET v1/profile/me`,
 * `GET v1/profile/me/cards`).
 *
 * **Nothing is ever charged.** `pay` stores a `simulated: true` outcome in the demo db and returns
 * it; it never touches the real host, and the result screen says so.
 *
 * Demo hooks (08-feature-flags-mocks.md): amount `13` is always declined; an expired `card_id` is
 * declined with its own code; `?preview=loading|empty|error` is handled by `useScreenQuery`, not
 * here.
 *
 * Registration: `topup` is listed in `src/core/mocks/modules.ts`, so `loadMockModules()` imports
 * this file and the `registerMockHandlers` call below wires it up. The side-effect import on the
 * next line is how the **referral** slice gets loaded: its module name (`profile_referral`) is not
 * in that list, and `src/modules/profile/` belongs to another agent, so the handlers register
 * themselves from here — the one module of mine that the loader does import.
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockJson,
  mockPath,
  mockValidationError,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';
// Straight from `json`, not the `@/core/network` barrel: these handlers also run under `msw/node`,
// and the barrel would drag the browser-side api client into that graph for three pure readers.
import { asObj, num, str } from '@/core/network/json';

import {
  asFixtureLocale,
  cashierFixture,
  DECLINE_ERROR_CODE,
  EXPIRED_CARD_ERROR_CODE,
  MAGIC_FAILURE_AMOUNT,
  TOPUP_CHARGE_DELAY_MS,
  TOPUP_LIMITS_FIXTURE,
  TOPUP_READ_DELAY_MS,
  topupReference,
} from './topup.fixtures';

// Loads the referral slice's handlers (see the note above). Side-effect import on purpose.
import '@/modules/profile_referral/data/referral.mock';

/* ------------------------------------------------------------------ demo state */

interface StoredOutcome {
  reference: string;
  status: 'success' | 'failed';
  amount: number;
  fee: number | null;
  total: number;
  new_balance: number | null;
  created_at: string;
  card_label: string;
  error_code?: string;
  message?: string;
  simulated: true;
}

interface TopupDb {
  /** Newest first. Persisted to `localStorage` under `ozio.mock.topup`, so a reload keeps it. */
  history: StoredOutcome[];
  /** Feeds the `TP-YYYYMMDD-NNNNN` counter. */
  seq: number;
}

const db = createMockDb<TopupDb>('topup', { history: [], seq: 4820 });

const feeFor = (amount: number): number =>
  Math.round(amount * (TOPUP_LIMITS_FIXTURE.fee_percent / 100) * 100) / 100;

const round2 = (v: number): number => Math.round(v * 100) / 100;

/* ------------------------------------------------------------------ handlers */

export const topupHandlers = [
  /** The amount form's zod schema and the limits note are both built from this. */
  http.get(mockPath('topup', 'limits'), async () => {
    await delay(TOPUP_READ_DELAY_MS);
    return mockJson(TOPUP_LIMITS_FIXTURE);
  }),

  /** The summary card's numbers. The UI never computes a fee or a total itself. */
  http.post(mockPath('topup', 'quote'), async ({ request }) => {
    const body = asObj(await request.json().catch(() => null));
    const amount = round2(num(body.amount));
    const balance = num(body.balance);

    if (amount <= 0) {
      return mockValidationError([{ path: 'amount', message: 'Amount must be greater than zero' }]);
    }
    const { min, max } = TOPUP_LIMITS_FIXTURE;
    if (amount < min || amount > max) {
      return mockValidationError([
        { path: 'amount', message: `Amount must be between ${min} and ${max}` },
      ]);
    }

    await delay(250);
    const fee = feeFor(amount);
    return mockJson({
      amount,
      fee,
      total: round2(amount + fee),
      // The caller passes the REAL balance it already holds, so the "new balance" line is the
      // server's arithmetic rather than a component's.
      new_balance: balance > 0 ? round2(balance + amount) : null,
    });
  }),

  /**
   * The "payment". **Nothing is charged** — this writes a `simulated: true` row and returns it.
   *
   * A decline is returned as a 200 business outcome (`status: 'failed'`), the way a card gateway
   * answers; the repository turns it into `TopupOutcome`, so a transport error stays a transport
   * error and still renders `<ErrorState>`.
   */
  http.post(mockPath('topup', 'pay'), async ({ request }) => {
    const body = asObj(await request.json().catch(() => null));
    const amount = round2(num(body.amount));
    const cardId = num(body.card_id);
    const cardLabel = str(body.card_label);
    const balance = num(body.balance);
    const cardExpired = body.card_expired === true;

    if (amount <= 0 || cardId <= 0) {
      return mockValidationError([
        ...(amount <= 0 ? [{ path: 'amount', message: 'Amount must be greater than zero' }] : []),
        ...(cardId <= 0 ? [{ path: 'card_id', message: 'A saved card is required' }] : []),
      ]);
    }

    await delay(TOPUP_CHARGE_DELAY_MS);

    const now = new Date();
    const seq = db.set((prev) => ({ ...prev, seq: prev.seq + 1 })).seq;
    const reference = topupReference(now, seq);

    // Documented demo hooks: the magic amount, and an expired card.
    const declined = amount === MAGIC_FAILURE_AMOUNT || cardExpired;

    const stored: StoredOutcome = declined
      ? {
          reference,
          status: 'failed',
          amount,
          fee: null,
          total: amount,
          new_balance: null,
          created_at: now.toISOString(),
          card_label: cardLabel,
          error_code: cardExpired ? EXPIRED_CARD_ERROR_CODE : DECLINE_ERROR_CODE,
          message: 'The card issuer declined this demo payment.',
          simulated: true,
        }
      : (() => {
          const fee = feeFor(amount);
          return {
            reference,
            status: 'success' as const,
            amount,
            fee,
            total: round2(amount + fee),
            new_balance: balance > 0 ? round2(balance + amount) : null,
            created_at: now.toISOString(),
            card_label: cardLabel,
            simulated: true as const,
          };
        })();

    // Keeps the last 20 demo operations; survives a reload via `localStorage`.
    db.set((prev) => ({ ...prev, history: [stored, ...prev.history].slice(0, 20) }));
    return mockJson(stored);
  }),

  /** `/topup/result?ref=` reads the stored outcome, which is what makes a reload work. */
  http.get(mockPath('topup', 'receipts/:reference'), async ({ params }) => {
    const reference = String(params.reference ?? '');
    await delay(200);
    const found = db.get().history.find((row) => row.reference === reference);
    return found ? mockJson(found) : mockError(404, 'Top-up not found');
  }),

  /** The 4 till steps and the nearby markets, by locale. */
  http.get(mockPath('topup', 'cashier'), async ({ request }) => {
    const locale = asFixtureLocale(new URL(request.url).searchParams.get('locale'));
    await delay(TOPUP_READ_DELAY_MS);
    return mockJson(cashierFixture(locale));
  }),
];

registerMockHandlers('topup', flagged(topupHandlers, 'topup'));
