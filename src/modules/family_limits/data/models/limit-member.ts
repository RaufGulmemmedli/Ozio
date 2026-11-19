/**
 * Domain models for "Üzv limitləri" (family_limits) — a parent caps what each family member may
 * spend, per week or per month.
 *
 * Shapes follow `src/core/api/contracts/mock-contracts.ts` §12 and `api/mock-modules.md` §12.
 * Parsers are tolerant and **never throw**.
 *
 * `remaining`, `progress` and `exhausted` are *derived* in the contract, but they are derived
 * **from money**, so this module takes them from the API rather than recomputing them in a
 * component (BUILD-CONTRACT rule 7). The parsers fall back to the documented formulas only when
 * a response omits them.
 */
import { asList, asObj, bool, money, num, str } from '@/core/network';

export type LimitPeriod = 'weekly' | 'monthly';

export type LimitCategory = 'stationery' | 'books' | 'food' | 'toys' | 'snacks' | 'hygiene';

/** Chip order on the member page and in the editor drawer, straight from the export. */
export const LIMIT_CATEGORIES: readonly LimitCategory[] = [
  'stationery',
  'books',
  'food',
  'toys',
  'snacks',
  'hygiene',
];

/** The −/+ stepper moves in 5 ₼ steps (`LIMIT_STEP_AZN` in mock-contracts). */
export const LIMIT_STEP_AZN = 5;

export interface LimitPurchase {
  id: string;
  title: string;
  category: LimitCategory;
  amount: number;
  /** ISO date; rendered `16 Noy`. */
  date: string;
}

export interface LimitMember {
  id: string;
  name: string;
  /** Relationship, resolved by the API in the requested language ("Oğul", "Nənə"). */
  role: string;
  age: number | null;
  enabled: boolean;
  period: LimitPeriod;
  limit: number;
  spent: number;
  remaining: number;
  /** 0…1. The progress bar reads this, never a division in the view. */
  progress: number;
  exhausted: boolean;
  categories: LimitCategory[];
  purchases: LimitPurchase[];
}

/** The `block` strip above the member cards. */
export interface LimitSummary {
  /** This month's family spend. */
  spend: number;
  activeLimits: number;
  exhausted: number;
}

export interface LimitMembers {
  members: LimitMember[];
  summary: LimitSummary;
}

/** The four fields the editor may change (`save` touches nothing else). */
export interface LimitDraft {
  enabled: boolean;
  period: LimitPeriod;
  limit: number;
  categories: LimitCategory[];
}

export const limitPeriod = (raw: unknown): LimitPeriod =>
  str(raw).toLowerCase() === 'weekly' ? 'weekly' : 'monthly';

export function limitCategory(raw: unknown): LimitCategory | null {
  const value = str(raw).toLowerCase();
  return (LIMIT_CATEGORIES as readonly string[]).includes(value) ? (value as LimitCategory) : null;
}

const categories = (raw: unknown): LimitCategory[] => {
  const out: LimitCategory[] = [];
  for (const entry of asList(raw)) {
    const category = limitCategory(entry);
    if (category !== null && !out.includes(category)) out.push(category);
  }
  return out;
};

export function parseLimitPurchase(raw: unknown): LimitPurchase {
  const o = asObj(raw);
  return {
    id: str(o.id),
    title: str(o.title),
    category: limitCategory(o.category) ?? 'food',
    amount: money(o.amount),
    date: str(o.date),
  };
}

export function parseLimitMember(raw: unknown): LimitMember {
  const o = asObj(raw);
  const limit = money(o.limit);
  const spent = money(o.spent);
  const enabled = bool(o.enabled);

  const remainingRaw = o.remaining;
  const remaining =
    remainingRaw === undefined || remainingRaw === null
      ? money(Math.max(0, limit - spent))
      : money(remainingRaw);

  const progressRaw = o.progress;
  const progress =
    progressRaw === undefined || progressRaw === null
      ? limit <= 0
        ? 0
        : Math.min(1, Math.max(0, spent / limit))
      : Math.min(1, Math.max(0, num(progressRaw)));

  const age = o.age === undefined || o.age === null ? null : num(o.age);

  return {
    id: str(o.id),
    name: str(o.name),
    role: str(o.role),
    age: age !== null && age > 0 ? age : null,
    enabled,
    period: limitPeriod(o.period),
    limit,
    spent,
    remaining,
    progress,
    exhausted: bool(o.exhausted, enabled && limit > 0 && spent >= limit),
    categories: categories(o.categories),
    purchases: asList(o.purchases).map(parseLimitPurchase),
  };
}

export function parseLimitSummary(raw: unknown): LimitSummary {
  const o = asObj(raw);
  return {
    spend: money(o.spend),
    activeLimits: num(o.active_limits ?? o.activeLimits),
    exhausted: num(o.exhausted),
  };
}

export function parseLimitMembers(raw: unknown): LimitMembers {
  const o = asObj(raw);
  return {
    members: asList(o.items ?? o.members).map(parseLimitMember),
    summary: parseLimitSummary(o.summary),
  };
}

/** `true` when the member has no cap at all — the card then shows "Limit yoxdur". */
export const hasNoLimit = (m: LimitMember): boolean => !m.enabled || m.limit <= 0;

/** The editor's starting values for a member. */
export const draftFrom = (m: LimitMember): LimitDraft => ({
  enabled: m.enabled,
  period: m.period,
  limit: m.limit,
  categories: [...m.categories],
});
