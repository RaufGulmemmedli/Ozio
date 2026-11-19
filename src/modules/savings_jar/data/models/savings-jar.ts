/**
 * The family savings jar (`design/ideas/savings_jar.md`, `mock-modules.md` §17).
 *
 * Checkout totals round up to the next step; the remainder goes into a shared jar and the platform
 * adds 10% at the end of the month. **Every amount here is a server value** — `projectedBonus` and
 * `capProgress` are the documented derivations of those values (the bonus rate is a server rule
 * mirrored here only so the preview card can show it), and `roundUp()` is integer-qəpik math on a
 * total the cart already got from the API.
 *
 * Parsers never throw.
 */
import { asList, asObj, bool, dateIso, int, money, str } from '@/core/network';

/** 50 qəpik · 1 ₼ · 5 ₼ — the three chips on the settings screen. */
export type RoundStepCents = 50 | 100 | 500;

export const ROUND_STEPS: readonly RoundStepCents[] = [50, 100, 500];

/** The cap chips: 20 / 50 / 100 ₼ and "Limitsiz" (0 = no cap). */
export const CAP_CHOICES: readonly number[] = [20, 50, 100, 0];

export interface JarSettings {
  enabled: boolean;
  stepCents: RoundStepCents;
  /** AZN. 0 means no cap. */
  monthlyCap: number;
}

export interface JarContribution {
  orderNo: string;
  memberName: string;
  amount: number;
  /** ISO instant. */
  at: string | null;
}

export interface JarMember {
  name: string;
  contributed: number;
}

export interface SavingsJar {
  balance: number;
  daysLeft: number;
  /** AZN already paid out in previous months. */
  bonusCredited: number;
  /** The bonus the server says this jar will earn — never recomputed in a component. */
  projectedBonus: number;
  contributions: JarContribution[];
  members: JarMember[];
  settings: JarSettings;
}

export const JAR_BONUS_RATE = 0.1;

export const DEFAULT_JAR_SETTINGS: JarSettings = { enabled: true, stepCents: 100, monthlyCap: 50 };

const asStep = (v: unknown): RoundStepCents => {
  const n = int(v, 100);
  return n === 50 || n === 500 ? n : 100;
};

export function parseJarSettings(json: unknown): JarSettings {
  const o = asObj(json);
  return {
    enabled: bool(o.enabled, true),
    stepCents: asStep(o.step_cents ?? o.stepCents ?? o.step),
    monthlyCap: money(o.monthly_cap ?? o.monthlyCap),
  };
}

function parseContribution(json: unknown): JarContribution {
  const o = asObj(json);
  return {
    orderNo: str(o.order_no ?? o.orderNo ?? o.order_id),
    memberName: str(o.member_name ?? o.memberName ?? o.member),
    amount: money(o.amount),
    at: dateIso(o.at ?? o.created_at),
  };
}

function parseMember(json: unknown): JarMember {
  const o = asObj(json);
  return {
    name: str(o.name ?? o.member_name),
    contributed: money(o.contributed ?? o.amount),
  };
}

export function parseSavingsJar(json: unknown): SavingsJar {
  const o = asObj(json);
  const balance = money(o.balance);
  const projected = o.projected_bonus ?? o.projectedBonus;
  return {
    balance,
    daysLeft: Math.max(0, int(o.days_left ?? o.daysLeft, 0)),
    bonusCredited: money(o.bonus_credited ?? o.bonusCredited),
    // Fall back to the documented rule only when the server did not send it.
    projectedBonus:
      projected === undefined || projected === null
        ? Math.round(balance * JAR_BONUS_RATE * 100) / 100
        : money(projected),
    contributions: asList(o.contributions).map(parseContribution),
    members: asList(o.members).map(parseMember),
    settings: parseJarSettings(o.settings),
  };
}

/** Claimable only once the month is over and there is something in the jar. */
export const jarClaimable = (j: SavingsJar): boolean => j.daysLeft <= 0 && j.balance > 0;

/** `null` when there is no cap, otherwise 0…1. */
export const jarCapProgress = (j: SavingsJar): number | null =>
  j.settings.monthlyCap > 0
    ? Math.min(1, Math.max(0, j.balance / j.settings.monthlyCap))
    : null;

export const jarIsEmpty = (j: SavingsJar): boolean =>
  j.balance <= 0 && j.contributions.length === 0;

export const jarCapFull = (j: SavingsJar): boolean => {
  const progress = jarCapProgress(j);
  return progress !== null && progress >= 1;
};

export interface RoundUpResult {
  total: number;
  rounded: number;
  /** What goes into the jar. */
  extra: number;
}

/**
 * Integer-qəpik round-up, exactly as `RoundUp.compute` in Flutter: 18,40 with step 1 ₼ →
 * 19,00 and +0,60. `total` is the payable the cart got from the API; nothing is invented.
 */
export function roundUp(total: number, stepCents: RoundStepCents): RoundUpResult {
  const cents = Math.round(total * 100);
  const remainder = ((cents % stepCents) + stepCents) % stepCents;
  const extra = remainder === 0 ? 0 : stepCents - remainder;
  return { total: cents / 100, rounded: (cents + extra) / 100, extra: extra / 100 };
}

/** Step as an amount, for the chip labels: 50 → 0,50 ₼. */
export const stepAmount = (step: RoundStepCents): number => step / 100;
