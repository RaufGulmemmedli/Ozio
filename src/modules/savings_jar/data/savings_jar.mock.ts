/**
 * MSW handlers + in-memory db for the `savings_jar` mock module.
 *
 * Registered at module scope; all traffic lives under `/api/mock/savings_jar/…` and is wrapped in
 * `flagged(...)`. The db is persisted to `localStorage` (`ozio.mock.savings_jar`), so the jar keeps
 * its balance across a reload and a claim stays claimed.
 *
 * Member names are the only text here, so they are plain strings (they are proper nouns in all
 * three languages); every amount is a realistic ₼ figure taken from the design export.
 *
 * Deterministic demo hooks:
 *   `?preview=loading|empty|error`        — handled by `useScreenQuery`, no request is sent
 *   `GET  jar?state=claim`                — month ended: 50,00 ₼ in the jar, +5,00 ₼ to claim
 *   `GET  jar?state=empty`                — a jar that has never been used
 *   `PUT  settings` with `monthly_cap: 13` — 500, the documented magic value behind
 *                                            `/savings-jar/settings?preview=save-error`
 *   `POST claim` on an unclaimable jar     — 409 `savings_jar/not-claimable`
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockJson,
  mockPath,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

import { SAVINGS_JAR_FLAG, SAVINGS_JAR_MOCK_MODULE } from '../savings_jar.flags';
import { JAR_BONUS_RATE, type RoundStepCents } from './models/savings-jar';

/* ------------------------------------------------------------------ fixtures */

interface ContributionRow {
  order_no: string;
  member_name: string;
  amount: number;
  /** Seeded as "n days ago" so the history always reads as recent. */
  days_ago: number;
}

/** From `savings-jar.html`: 31,40 ₼ over five round-ups and four members. */
const CONTRIBUTIONS: ContributionRow[] = [
  { order_no: '48210', member_name: 'Nurlan', amount: 0.6, days_ago: 4 },
  { order_no: '48117', member_name: 'Leyla', amount: 0.35, days_ago: 6 },
  { order_no: '48044', member_name: 'Anam', amount: 0.8, days_ago: 8 },
  { order_no: '47962', member_name: 'Nurlan', amount: 0.45, days_ago: 11 },
  { order_no: '47890', member_name: 'Kamran', amount: 0.2, days_ago: 13 },
];

const MEMBERS = [
  { name: 'Nurlan', contributed: 12.1 },
  { name: 'Leyla', contributed: 9.8 },
  { name: 'Anam', contributed: 6.2 },
  { name: 'Kamran', contributed: 3.3 },
];

const SEED_BALANCE = 31.4;

/* ------------------------------------------------------------------------ db */

interface JarDb {
  balance: number;
  bonusCredited: number;
  contributions: ContributionRow[];
  members: { name: string; contributed: number }[];
  settings: { enabled: boolean; stepCents: RoundStepCents; monthlyCap: number };
  /** Set by a claim so the reset jar does not look claimable again. */
  claimedForMonth: string | null;
}

const seed = (): JarDb => ({
  balance: SEED_BALANCE,
  bonusCredited: 0,
  contributions: CONTRIBUTIONS.map((c) => ({ ...c })),
  members: MEMBERS.map((m) => ({ ...m })),
  settings: { enabled: true, stepCents: 100, monthlyCap: 50 },
  claimedForMonth: null,
});

const db = createMockDb<JarDb>(SAVINGS_JAR_MOCK_MODULE, seed);

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Days to the end of the current month, as the contract defines `daysLeft`. */
function daysToMonthEnd(): number {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
  return Math.max(0, diff);
}

const monthKey = (): string => new Date().toISOString().slice(0, 7);

const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString();

const contributionsOut = (rows: ContributionRow[]) =>
  rows.map((row) => ({
    order_no: row.order_no,
    member_name: row.member_name,
    amount: row.amount,
    at: isoDaysAgo(row.days_ago),
  }));

/** The payload a real `GET /savings-jar` would answer with — bonus included, never computed client-side. */
function jarPayload(overrides: Partial<{ balance: number; days_left: number }> = {}) {
  const state = db.get();
  const balance = overrides.balance ?? state.balance;
  const daysLeft = overrides.days_left ?? daysToMonthEnd();
  return {
    balance,
    days_left: daysLeft,
    bonus_credited: state.bonusCredited,
    projected_bonus: round2(balance * JAR_BONUS_RATE),
    contributions: contributionsOut(state.contributions),
    members: state.members,
    settings: {
      enabled: state.settings.enabled,
      step_cents: state.settings.stepCents,
      monthly_cap: state.settings.monthlyCap,
    },
  };
}

const emptyPayload = () => ({
  ...jarPayload({ balance: 0 }),
  contributions: [],
  members: [],
  projected_bonus: 0,
});

const body = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const json = (await request.json()) as unknown;
    return json !== null && typeof json === 'object' ? (json as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const asStep = (v: unknown): RoundStepCents => {
  const n = Number(v);
  return n === 50 || n === 500 ? n : 100;
};

/* ------------------------------------------------------------------ handlers */

/** The magic cap that forces a save failure (`?preview=save-error`). */
const FORCE_SAVE_FAILURE_CAP = 13;

export const savingsJarHandlers = [
  http.get(mockPath(SAVINGS_JAR_MOCK_MODULE, 'jar'), async ({ request }) => {
    await delay(600);
    const state = new URL(request.url).searchParams.get('state');
    if (state === 'empty') return mockJson(emptyPayload());
    if (state === 'claim') {
      // `savings-jar-claim-ready.html`: the month is over, 50,00 ₼ in the jar → +5,00 ₼.
      return mockJson(jarPayload({ balance: 50, days_left: 0 }));
    }
    if (db.get().balance <= 0 && db.get().contributions.length === 0) {
      return mockJson(emptyPayload());
    }
    return mockJson(jarPayload());
  }),

  http.put(mockPath(SAVINGS_JAR_MOCK_MODULE, 'settings'), async ({ request }) => {
    await delay(250);
    const input = await body(request);
    const cap = Math.max(0, Number(input.monthly_cap ?? 0) || 0);
    if (cap === FORCE_SAVE_FAILURE_CAP) {
      return mockError(500, 'savings_jar/settings-not-saved');
    }
    db.set((prev) => ({
      ...prev,
      settings: {
        enabled: Boolean(input.enabled),
        stepCents: asStep(input.step_cents),
        monthlyCap: cap,
      },
    }));
    return mockJson(jarPayload());
  }),

  http.post(mockPath(SAVINGS_JAR_MOCK_MODULE, 'claim'), async () => {
    await delay(900);
    const state = db.get();
    // The month-ended state the UI claims from is the `?state=claim` payload, so accept a claim
    // whenever there is a balance; a real server would check its own period.
    if (state.balance <= 0) return mockError(409, 'savings_jar/not-claimable');
    if (state.claimedForMonth === monthKey()) {
      return mockError(409, 'savings_jar/already-claimed');
    }

    const bonus = round2(state.balance * JAR_BONUS_RATE);
    db.set((prev) => ({
      ...prev,
      balance: 0,
      bonusCredited: round2(prev.bonusCredited + bonus),
      contributions: [],
      members: [],
      claimedForMonth: monthKey(),
    }));

    return mockJson({ bonus, jar: emptyPayload() });
  }),
];

registerMockHandlers(SAVINGS_JAR_MOCK_MODULE, flagged(savingsJarHandlers, SAVINGS_JAR_FLAG));
